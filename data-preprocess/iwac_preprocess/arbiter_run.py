"""The shared lifecycle of a paid panel-arbiter run.

`arbiter-evaluation-v2.py` (the published Claude Opus 5 judge) and
`arbiter-evaluation-v2-second-judge.py` (a judge from another developer) differ
in what they select and which provider they call. Everything after that is the
same, and used to be copied between them until the copies drifted. It lives
here once:

* the session lock and `.env` loading;
* **which source revisions to read** (`plan_revisions`): a run resuming a
  populated file reads the revisions recorded in it unless another revision is
  explicitly requested, because the fingerprints hash them and upstream HEAD
  moves on. Reading HEAD by default made every "no-spend" republish match
  nothing and publish an empty file;
* the durable cache, blind permutation and reconciliation (`PanelRun`);
* the **shrink guard**: a publication never drops verdicts the public file
  already holds unless ``--allow-shrink`` is passed, and says how many would be
  lost and why (selection, source revision or prompt version);
* the paid loop: checkpoint-before-publish, a negative cache for deterministic
  failures, a consecutive-error breaker, and a public export that may fail
  mid-run without losing the durable checkpoint.

Nothing here calls a provider. Each script passes an ``evaluate`` callback and a
metadata builder.
"""

from __future__ import annotations

import argparse
import logging
import os
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from importlib import metadata as importlib_metadata
from pathlib import Path
from typing import Any

from tqdm import tqdm

from .arbiter_judges import ArbiterUsage
from .arbiter_lifecycle import (
    CacheUnreadableError,
    PanelCache,
    load_cached_evaluations,
    resolve_blind_permutation,
)
from .arbiter_prompt import DEFAULT_PROMPT_VERSION, PROMPT_VERSIONS
from .contract import SentimentContract
from .publication import publication_lock
from .source import (
    get_base_article_ids,
    load_iwac_dataset_source,
    load_iwac_full_text_source,
    restrict_to_base_articles,
    validate_columns,
)

# Why an article produced no verdict. `refused` is the model declining the
# task; every other non-ok outcome is a failure of the call or the response.
OUTCOME_OK = "ok"
OUTCOME_REFUSED = "refused"
OUTCOME_TRUNCATED = "truncated"
OUTCOME_INVALID = "invalid"
OUTCOME_ERROR = "error"
OUTCOME_NO_TEXT = "no_text"
# Deterministic outcomes of a billed call: re-asking the same input spends
# money without making a different answer likely, so they are remembered by
# fingerprint and skipped until `--retry-failed`. Transport errors are not.
NEGATIVE_OUTCOMES = frozenset({OUTCOME_REFUSED, OUTCOME_INVALID, OUTCOME_TRUNCATED})

EXIT_OK = 0
EXIT_INCOMPLETE = 1
EXIT_REFUSED = 2

DEFAULT_SAVE_INTERVAL = 10
DEFAULT_MAX_CONSECUTIVE_ERRORS = 5

# `--source-revision head` asks for upstream HEAD explicitly.
HEAD = "head"
HF_HEAD_REVISION = "main"
SCORES_REVISION_ENV = "IWAC_HF_REVISION"
TEXT_REVISION_ENV = "IWAC_HF_FULL_REVISION"

# Dataset columns the selection pass depends on.
REQUIRED_BASE_COLUMNS = ["o:id", "title", "newspaper", "country", "pub_date"]


class ArbiterRunError(RuntimeError):
    """A run the arbiter refuses to start; the scripts turn it into exit code 2."""


class RevisionError(ArbiterRunError):
    """A paid verdict cannot be fingerprinted against an unknown source revision."""


@dataclass(frozen=True)
class EvaluationResult:
    """One article's verdict, or the reason there is none."""

    outcome: str
    analysis: Any = None


# ============================================================================
# Session plumbing
# ============================================================================


def load_env(script_file: str | Path, logger: logging.Logger) -> None:
    """Load the repository's `.env` (API keys, HF token) if there is one."""
    env_path = Path(script_file).resolve().parent.parent / ".env"
    if env_path.exists():
        from dotenv import load_dotenv

        load_dotenv(env_path)
        logger.info("Loaded environment variables from %s", env_path)


def run_locked(staging: Path, label: str, run: Callable[[], int], logger: logging.Logger) -> int:
    """Run a whole arbiter session under its dedicated lock.

    Serializes sessions, not just public writes: two sessions must never price
    the same missing rows or overwrite each other's cache.
    """
    try:
        with publication_lock(staging):
            return run()
    except BlockingIOError as error:
        logger.error("Another %s run holds the cache lock: %s", label, error)
        return EXIT_REFUSED


def installed_version(package: str) -> str | None:
    try:
        return importlib_metadata.version(package)
    except importlib_metadata.PackageNotFoundError:
        return None


# ============================================================================
# Command line
# ============================================================================


def positive_limit(value: str) -> int:
    try:
        limit = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("--limit must be a positive integer") from error
    if limit <= 0:
        raise argparse.ArgumentTypeError("--limit must be a positive integer")
    return limit


def positive_int(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("expected a positive integer") from error
    if number <= 0:
        raise argparse.ArgumentTypeError("expected a positive integer")
    return number


def add_run_arguments(parser: argparse.ArgumentParser) -> None:
    """The lifecycle flags every panel-arbiter script shares."""
    parser.add_argument(
        "--prompt-version",
        choices=PROMPT_VERSIONS,
        default=DEFAULT_PROMPT_VERSION,
        help=f"Arbiter system instruction to send (default: {DEFAULT_PROMPT_VERSION}, the "
        "contract's). The version is hashed into every fingerprint: pass the published "
        "file's version to republish or extend its verdicts.",
    )
    parser.add_argument(
        "--source-revision",
        default=None,
        metavar="head|SHA",
        help="Public-projection revision to read. Default: the revision recorded in the "
        "published file when resuming it, upstream HEAD otherwise. 'head' moves both "
        "repositories to HEAD (unless --text-revision says otherwise).",
    )
    parser.add_argument(
        "--text-revision",
        default=None,
        metavar="head|SHA",
        help="Private-mirror revision to read. Same default as --source-revision.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print counts and a cost estimate, then exit without any API call or file write.",
    )
    parser.add_argument(
        "--prune-cache-only",
        action="store_true",
        help="Republish the selected cached evaluations without paid calls; the durable "
        "cache retains every evaluation.",
    )
    parser.add_argument(
        "--allow-shrink",
        action="store_true",
        help="Allow the public file to hold fewer evaluations than it does now (a narrower "
        "selection, another revision or prompt). Without it the public file is left as "
        "it is and the run says what would be lost.",
    )
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Re-attempt articles whose earlier paid call was refused, invalid or truncated "
        "(by default they are remembered and not billed again).",
    )
    parser.add_argument(
        "--max-consecutive-errors",
        type=positive_int,
        default=DEFAULT_MAX_CONSECUTIVE_ERRORS,
        metavar="K",
        help="Stop the paid loop, after checkpointing, once K API calls in a row fail "
        f"(default: {DEFAULT_MAX_CONSECUTIVE_ERRORS}).",
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Skip the interactive confirmation prompt (for non-interactive runs).",
    )


def confirm_api_calls(calls: int, model: str, assume_yes: bool, logger: logging.Logger) -> bool:
    """Ask before spending. Returns False when declined or non-interactive."""
    if assume_yes:
        logger.info("--yes given: proceeding with %d API calls", calls)
        return True
    print(f"\nWARNING: this will make {calls} paid API calls to {model}")
    try:
        response = input("Do you want to proceed? (yes/no): ").strip().lower()
    except EOFError:
        logger.error("No input available (non-interactive run?). Use --yes to skip the prompt.")
        return False
    return response in ("yes", "y")


# ============================================================================
# Source revisions
# ============================================================================


@dataclass(frozen=True)
class RevisionRequest:
    """What to ask Hugging Face for, per repository, and why.

    ``None`` means "no preference": `load_source` then reads upstream HEAD.
    """

    scores: str | None
    text: str | None
    scores_reason: str
    text_reason: str


def _source_revisions(metadata: Mapping[str, Any]) -> tuple[str | None, str | None]:
    source = metadata.get("source") or {}
    scores = (source.get("scores") or {}).get("revision")
    text = (source.get("text") or {}).get("revision")
    return (scores or None, text or None)


def recorded_revisions(*paths: Path) -> tuple[tuple[str | None, str | None], Path | None]:
    """The revisions recorded in the first populated arbiter file of ``paths``.

    Read strictly: an unreadable file raises `CacheUnreadableError` rather than
    being taken for a first run.
    """
    for path in paths:
        rows, metadata = load_cached_evaluations(path)
        if rows:
            return _source_revisions(metadata), path
    return (None, None), None


def plan_revisions(
    *,
    source_flag: str | None,
    text_flag: str | None,
    recorded: tuple[str | None, str | None],
    recorded_in: Path | None = None,
    environ: Mapping[str, str] | None = None,
) -> RevisionRequest:
    """Decide which revision of each repository a run reads.

    Precedence: the command-line flag, then the environment variable, then (for
    the text repository) ``--source-revision head``, then the revision recorded
    in the populated file being resumed, then upstream HEAD. Resuming at the
    recorded revision is what keeps a no-spend republish matching its own
    fingerprints after HEAD moves; moving is a deliberate flag.
    """
    environ = os.environ if environ is None else environ
    where = f"recorded in {recorded_in.name}" if recorded_in else "recorded"

    def pick(
        flag: str | None, env_name: str, recorded_value: str | None, head: bool
    ) -> tuple[str | None, str]:
        if flag:
            return (HF_HEAD_REVISION if flag == HEAD else flag), f"requested ({flag})"
        if environ.get(env_name):
            return environ[env_name], f"{env_name}={environ[env_name]}"
        if head:
            return HF_HEAD_REVISION, "--source-revision head"
        if recorded_value:
            return recorded_value, f"{where} (resuming it; pass --source-revision head to move)"
        return None, "upstream HEAD (no populated arbiter file to resume)"

    scores, scores_reason = pick(source_flag, SCORES_REVISION_ENV, recorded[0], False)
    text, text_reason = pick(text_flag, TEXT_REVISION_ENV, recorded[1], source_flag == HEAD)
    return RevisionRequest(scores, text, scores_reason, text_reason)


def require_revision(value: str | None, repository: str) -> str:
    """Refuse to fingerprint paid work against an unknown revision."""
    if not value or not isinstance(value, str):
        raise RevisionError(
            f"No immutable revision is known for {repository}. A verdict fingerprinted "
            "against None could never be matched again; refusing to continue."
        )
    return value


# ============================================================================
# Sources
# ============================================================================


def load_panel_records(
    contract: SentimentContract,
    revision: str | None,
    logger: logging.Logger,
    *,
    base_ids: set[str] | None = None,
    model_ids: Sequence[str] | None = None,
) -> tuple[list[dict], str]:
    """The public projection at ``revision``, scoped to the published article base.

    The live corpus has grown past the panel run (articles only Haiku rated),
    and the validator recomputes the arbiter frame over the published base, so
    the selection is held to the same base.

    ``model_ids`` is the set of models the run reads; only their columns must
    exist. The Opus arbiter passes its panel, so the revisions recorded in the
    published file, which predate Haiku's columns, still load. ``None`` requires
    the whole generation.
    """
    result = load_iwac_dataset_source(contract, revision, model_ids)
    validate_columns(result.data, REQUIRED_BASE_COLUMNS)
    logger.info(
        "Loaded %d articles from %s at %s", len(result.data), result.repository, result.revision
    )
    records = result.data.to_dict("records")
    ids = get_base_article_ids() if base_ids is None else base_ids
    return restrict_to_base_articles(records, ids, logger), result.revision


def load_panel_texts(revision: str | None) -> tuple[dict[str, str], str]:
    """The private mirror's unmasked text at ``revision``, and that revision."""
    source = load_iwac_full_text_source(revision)
    return source.texts, source.revision


# ============================================================================
# The run
# ============================================================================


def _now() -> str:
    return datetime.now(UTC).isoformat()


@dataclass
class PanelRun:
    """One arbiter session over a fixed selection: cache, publication, paid loop.

    Build it with `PanelRun.open`. ``evaluations`` holds the verdicts matching
    the selection (cached first, then new ones); ``remaining`` what still needs
    a call.
    """

    cache: PanelCache
    output_path: Path
    permutation: dict[str, str]
    fingerprint: Callable[[dict], str]
    selected: list[dict]
    prompt_version: str
    source: dict[str, str]
    save_results: Callable[[Path, list[dict], dict], None]
    build_metadata: Callable[[dict[str, int], ArbiterUsage], dict]
    usage: ArbiterUsage
    logger: logging.Logger
    missing_text: int = 0
    allow_shrink: bool = False
    sdk_package: str | None = None
    evaluations: list[dict] = field(default_factory=list)
    remaining: list[dict] = field(default_factory=list)
    skipped_failures: int = 0
    errors: int = 0
    _fingerprints: dict[str, str] = field(default_factory=dict)
    _public_rows: list[dict] = field(default_factory=list)
    _public_metadata: dict = field(default_factory=dict)
    _calls_at_start: int = 0
    _shrink_reported: bool = False

    @classmethod
    def open(
        cls,
        *,
        cache_path: Path,
        output_path: Path,
        panel: list[str],
        effort: str,
        selected: list[dict],
        fingerprint: Callable[[dict], str],
        prompt_version: str,
        source: dict[str, str],
        save_results: Callable[[Path, list[dict], dict], None],
        build_metadata: Callable[[dict[str, int], ArbiterUsage], dict],
        usage_provider: str,
        logger: logging.Logger,
        missing_text: int = 0,
        allow_shrink: bool = False,
        retry_failed: bool = False,
        sdk_package: str | None = None,
    ) -> PanelRun:
        """Load the caches and split the selection into cached, skipped and remaining.

        Raises `CacheUnreadableError` when either file cannot be interpreted, a
        populated cache has no valid blind permutation, or the effort differs.
        """
        cache = PanelCache.load(cache_path, output_path, panel, effort)
        permutation = resolve_blind_permutation(
            cache.metadata, panel, populated=bool(cache.evaluations)
        )
        usage = ArbiterUsage.from_metadata(cache.metadata.get("usage"), usage_provider)
        run = cls(
            cache=cache,
            output_path=output_path,
            permutation=permutation,
            fingerprint=fingerprint,
            selected=list(selected),
            prompt_version=prompt_version,
            source=dict(source),
            save_results=save_results,
            build_metadata=build_metadata,
            usage=usage,
            logger=logger,
            missing_text=missing_text,
            allow_shrink=allow_shrink,
            sdk_package=sdk_package,
            _public_rows=list(cache.published_evaluations),
            _public_metadata=dict(cache.published_metadata),
            _calls_at_start=usage.calls + usage.unmetered_calls,
        )
        for article in run.selected:
            article_id = str(article.get("o:id"))
            key = fingerprint(article)
            run._fingerprints[article_id] = key
            cached = cache.evaluations.get(key)
            if cached is not None:
                run.evaluations.append(cached)
            elif key in cache.failures and not retry_failed:
                run.skipped_failures += 1
            else:
                run.remaining.append(article)
        if cache.evaluations:
            logger.info(
                "Cache: %d evaluations match this selection; %d retained in durable history",
                len(run.evaluations),
                len(cache.evaluations),
            )
        if run.skipped_failures:
            logger.info(
                "%d selected article(s) failed deterministically on an earlier paid call and "
                "are not billed again (--retry-failed re-attempts them)",
                run.skipped_failures,
            )
        return run

    # -- bookkeeping ---------------------------------------------------------

    @property
    def evaluated_ids(self) -> set[str]:
        return {str(row["article_id"]) for row in self.evaluations}

    def cached_ids(self, articles: Sequence[dict]) -> set[str]:
        """Which of ``articles`` already have a verdict in the durable cache."""
        return {
            str(article.get("o:id"))
            for article in articles
            if self.fingerprint(article) in self.cache.evaluations
        }

    def counts(self) -> dict[str, int]:
        """Published counts, derived from the durable record so a no-call run keeps them."""
        refused = failed = 0
        for key in set(self._fingerprints.values()):
            failure = self.cache.failures.get(key)
            if failure is None or key in self.cache.evaluations:
                continue
            if failure.get("outcome") == OUTCOME_REFUSED:
                refused += 1
            else:
                failed += 1
        return {
            "total": len(self.selected),
            "successful": len(self.evaluations),
            "failed": failed + self.errors,
            "refused": refused,
            "missing_text": self.missing_text,
        }

    def _sdk_versions(self) -> dict[str, list[str]]:
        recorded = self.cache.metadata.get("sdk_versions")
        versions = {
            str(package): [str(v) for v in values]
            for package, values in (recorded.items() if isinstance(recorded, dict) else [])
            if isinstance(values, list)
        }
        called = self.usage.calls + self.usage.unmetered_calls > self._calls_at_start
        if called and self.sdk_package:
            version = installed_version(self.sdk_package)
            if version and version not in versions.setdefault(self.sdk_package, []):
                versions[self.sdk_package].append(version)
        return {package: values for package, values in versions.items() if values}

    def metadata(self) -> dict:
        """The envelope for the current state; ``generated`` survives a no-op."""
        body = self.build_metadata(self.counts(), self.usage)
        sdk_versions = self._sdk_versions()
        if sdk_versions:
            body["sdk_versions"] = sdk_versions
        previous = self._public_metadata
        unchanged = (
            bool(previous)
            and self._public_rows == self.evaluations
            and {k: v for k, v in previous.items() if k != "generated"} == body
        )
        stamp = previous.get("generated") if unchanged else _now()
        return {"generated": stamp, **body}

    # -- the shrink guard ----------------------------------------------------

    def _loss_reasons(self) -> list[str]:
        new_ids = self.evaluated_ids
        selected_ids = {str(article.get("o:id")) for article in self.selected}
        gone = [str(row.get("article_id")) for row in self._public_rows]
        gone = [article_id for article_id in gone if article_id not in new_ids]
        outside = sum(1 for article_id in gone if article_id not in selected_ids)
        inside = len(gone) - outside
        reasons = []
        if outside:
            reasons.append(f"{outside} are outside this run's selection (rule, frame or --limit)")
        if inside:
            why = []
            published_prompt = self._public_metadata.get("prompt_version")
            if published_prompt and published_prompt != self.prompt_version:
                why.append(
                    f"they were judged under prompt {published_prompt} and this run uses "
                    f"{self.prompt_version} (pass --prompt-version {published_prompt} to "
                    "republish them)"
                )
            scores, text = _source_revisions(self._public_metadata)
            if (scores, text) != (self.source.get("scores"), self.source.get("text")):
                why.append(
                    f"they were fingerprinted against source revisions {scores}/{text} and this "
                    f"run reads {self.source.get('scores')}/{self.source.get('text')}"
                )
            if not why:
                why.append("their inputs changed (analyses, text, model or effort)")
            reasons.append(f"{inside} are selected but unmatched: " + "; ".join(why))
        return reasons

    def shrink_refusal(self) -> str | None:
        """Why publishing now would drop published verdicts, or None if it would not."""
        held = len(self._public_rows)
        if self.allow_shrink or len(self.evaluations) >= held:
            return None
        return (
            f"Refusing to replace {self.output_path.name}: it holds {held} evaluations and this "
            f"run has {len(self.evaluations)}, so {held - len(self.evaluations)} would be lost — "
            + "; ".join(self._loss_reasons())
            + ". The durable cache keeps every paid verdict; pass --allow-shrink to replace "
            "the public file anyway."
        )

    def transition_notice(self, calls: int, usd: float) -> str | None:
        """What a default run under a newer prompt would do to the published verdicts."""
        published_prompt = self._public_metadata.get("prompt_version")
        if not self._public_rows or not published_prompt or published_prompt == self.prompt_version:
            return None
        return (
            f"{len(self._public_rows)} published verdicts were judged under prompt "
            f"{published_prompt}; re-judging under {self.prompt_version} needs {calls} call(s) "
            f"(~${usd:.2f}); pass --yes to proceed. The public file keeps the {published_prompt} "
            f"verdicts until the {self.prompt_version} selection holds at least as many "
            "(or pass --allow-shrink)."
        )

    # -- publication ---------------------------------------------------------

    def checkpoint(self) -> dict:
        """Durable first: paid work is saved before any public export can fail."""
        metadata = self.metadata()
        self.cache.checkpoint(self.evaluations, metadata)
        return metadata

    def export(self, metadata: dict, *, final: bool) -> bool:
        """Write the public file unless that would shrink it; True if it is current.

        Raises whatever the public write raises; the caller decides whether that
        ends the run.
        """
        refusal = self.shrink_refusal()
        if refusal:
            if final:
                self.logger.error("%s", refusal)
            elif not self._shrink_reported:
                self.logger.info(
                    "Public file left as it is until this run holds at least %d evaluations "
                    "(it holds %d); verdicts are checkpointed in the durable cache meanwhile",
                    len(self._public_rows),
                    len(self.evaluations),
                )
                self._shrink_reported = True
            return False
        if self._public_metadata and metadata.get("generated") == self._public_metadata.get(
            "generated"
        ):
            self.logger.info("%s is already current; not rewritten", self.output_path.name)
            return True
        self.save_results(self.output_path, self.evaluations, metadata)
        self._public_rows = list(self.evaluations)
        self._public_metadata = dict(metadata)
        return True

    def publish(self) -> int:
        """Checkpoint, then export once; the exit code of a run that makes no call."""
        metadata = self.checkpoint()
        return EXIT_OK if self.export(metadata, final=True) else EXIT_INCOMPLETE

    # -- the paid loop -------------------------------------------------------

    def evaluate_remaining(
        self,
        evaluate: Callable[[dict], EvaluationResult],
        make_row: Callable[[dict, Any, str], dict],
        *,
        desc: str,
        save_interval: int = DEFAULT_SAVE_INTERVAL,
        max_consecutive_errors: int = DEFAULT_MAX_CONSECUTIVE_ERRORS,
    ) -> int:
        """Evaluate every remaining article; checkpoint and publish on the way and at the end.

        * A refused, invalid or truncated outcome is recorded in the durable
          negative cache and not billed again by a later run.
        * ``max_consecutive_errors`` API errors in a row stop the loop: an
          outage or a revoked key should not walk the whole frame.
        * A failed intermediate public export is logged and the loop goes on —
          the durable checkpoint before it already holds the verdicts. A failed
          final export makes the run exit non-zero.
        * Ctrl-C or a crash still checkpoints every verdict already paid for.
        """
        successful = consecutive = 0
        aborted = False
        exported = False
        try:
            for article in tqdm(self.remaining, desc=desc):
                article_id = str(article.get("o:id"))
                key = self._fingerprints[article_id]
                result = evaluate(article)
                if result.analysis is None:
                    if result.outcome in NEGATIVE_OUTCOMES:
                        consecutive = 0
                        self.cache.record_failure(
                            key,
                            {
                                "article_id": article_id,
                                "outcome": result.outcome,
                                "recorded": _now(),
                                "prompt_version": self.prompt_version,
                            },
                        )
                    else:
                        self.errors += 1
                        consecutive += result.outcome == OUTCOME_ERROR
                        if consecutive >= max_consecutive_errors:
                            self.logger.error(
                                "%d API calls in a row failed; stopping after a checkpoint "
                                "(--max-consecutive-errors %d). Rerun to resume.",
                                consecutive,
                                max_consecutive_errors,
                            )
                            aborted = True
                            break
                    continue
                consecutive = 0
                self.cache.clear_failure(key)
                self.evaluations.append(make_row(article, result.analysis, key))
                successful += 1
                if successful % save_interval == 0:
                    metadata = self.checkpoint()
                    try:
                        if self.export(metadata, final=False):
                            self.logger.info("Saved %d evaluations", len(self.evaluations))
                    except Exception as error:  # noqa: BLE001 - the checkpoint holds the work
                        self.logger.error(
                            "Public export failed mid-run (%s); the durable checkpoint holds "
                            "%d evaluations, continuing",
                            error,
                            len(self.evaluations),
                        )
        finally:
            # Durable first, and loudly: if this fails nothing else matters.
            metadata = self.checkpoint()
            try:
                exported = self.export(metadata, final=True)
            except Exception as error:  # noqa: BLE001 - surfaced as the exit code
                self.logger.error(
                    "Final public export failed (%s); the durable cache holds %d evaluations. "
                    "Rerun (no paid call is needed for them) to publish.",
                    error,
                    len(self.evaluations),
                )
        counts = self.counts()
        self.logger.info(
            "Complete: %d newly evaluated, %d from cache, %d failed, %d refused; ~$%.2f "
            "recorded in all",
            successful,
            len(self.evaluations) - successful,
            counts["failed"],
            counts["refused"],
            self.usage.as_metadata().get("usd", 0.0),
        )
        return EXIT_INCOMPLETE if aborted or not exported else EXIT_OK

    def finish(
        self,
        *,
        prune_only: bool,
        assume_yes: bool,
        model: str,
        estimate: Mapping[str, Any],
        report_estimate: Callable[[], None],
        make_client: Callable[[], Any],
        evaluate: Callable[[Any, dict], EvaluationResult],
        make_row: Callable[[dict, Any, str], dict],
        desc: str,
        max_consecutive_errors: int = DEFAULT_MAX_CONSECUTIVE_ERRORS,
        save_interval: int = DEFAULT_SAVE_INTERVAL,
    ) -> int:
        """Everything after selection for a non-dry run.

        ``make_client`` raises `ArbiterRunError` when no key is configured.
        """
        if not self.remaining:
            code = self.publish()
            self.logger.info(
                "All %d selected articles are evaluated or remembered as failed; %s",
                len(self.selected),
                "republished the selection" if code == EXIT_OK else "public file unchanged",
            )
            return code
        if prune_only:
            code = self.publish()
            self.logger.info(
                "Prune-only mode left %d articles pending evaluation", len(self.remaining)
            )
            return code
        notice = self.transition_notice(len(self.remaining), float(estimate.get("usd", 0.0)))
        if notice:
            self.logger.warning("%s", notice)
        client = make_client()
        report_estimate()
        if not confirm_api_calls(len(self.remaining), model, assume_yes, self.logger):
            self.logger.info("Aborted.")
            return EXIT_OK
        return self.evaluate_remaining(
            lambda article: evaluate(client, article),
            make_row,
            desc=desc,
            save_interval=save_interval,
            max_consecutive_errors=max_consecutive_errors,
        )


__all__ = [
    "DEFAULT_MAX_CONSECUTIVE_ERRORS",
    "DEFAULT_SAVE_INTERVAL",
    "EXIT_INCOMPLETE",
    "EXIT_OK",
    "EXIT_REFUSED",
    "HEAD",
    "NEGATIVE_OUTCOMES",
    "OUTCOME_ERROR",
    "OUTCOME_INVALID",
    "OUTCOME_NO_TEXT",
    "OUTCOME_OK",
    "OUTCOME_REFUSED",
    "OUTCOME_TRUNCATED",
    "REQUIRED_BASE_COLUMNS",
    "ArbiterRunError",
    "CacheUnreadableError",
    "EvaluationResult",
    "PanelRun",
    "RevisionError",
    "RevisionRequest",
    "add_run_arguments",
    "confirm_api_calls",
    "load_env",
    "load_panel_records",
    "load_panel_texts",
    "plan_revisions",
    "positive_int",
    "positive_limit",
    "recorded_revisions",
    "require_revision",
    "run_locked",
]
