"""
Panel arbiter evaluation for the generation-2 models — Claude Opus 5 as judge.

The v1 arbiter judges one *pair* of models at a time. Generation 2 ships a
panel run on the same corpus with the same prompt, so a pairwise arbiter would
ask overlapping questions about the same article and give verdicts that cannot
be combined. This script asks the question once: the arbiter sees the panel's
analyses at once, scores the article itself, and says which of them (if any)
it prefers per dimension.

What differs from `arbiter-evaluation.py`, and why:

* **Selection** is panel-wide rather than a pairwise gap: either the spread
  (max minus min across the arbiter's panel, per dimension) or a polarity
  valence flip, the two rules the contract's `arbiter.eligibility` declares.
  `--limit N` keeps the N widest disagreements *on the selected dimensions*,
  tie-broken by article id so a capped run is reproducible.
* **Article text comes from the private mirror.** This fixes a real v1 flaw:
  the public projection masks `OCR` per row via `OCR_is_public`, so a large
  share of v1-arbitrated articles were judged on an empty string. Only verdicts
  and justifications are published — no OCR is ever serialised here.
* **Blind assignment is a permutation, not a coin flip.** One global random
  permutation maps the panel's model ids onto the labels A-E; it is persisted
  in the output metadata and reused by every incremental run, so cached and new
  rows always mean the same thing.
* **The judge never reads its own developer's model.** Claude Haiku 5.5 joined
  the panel as its sixth member on 2026-10-22; the judge is Claude Opus 5. Blind
  labels hide a name, not a house style, so the contract's `arbiter.recusal`
  keeps Haiku out of everything this script does: selection, prompt, labels and
  fingerprints run over the other five, exactly the panel the published run
  judged. The recused set is derived from the contract's `arbiter.developer`,
  not listed. Haiku's own dissents need a judge from another developer:
  `arbiter-evaluation-v2-second-judge.py`.
* **The prompt is versioned.** The published 301 were judged under prompt
  v2.2.0, a short scale reference that disagreed with the annotators' codebook
  on proper-name-only mentions. The default is v2.3.0, which carries the
  codebook verbatim. `--prompt-version v2.2.0` republishes or extends the
  published run; the shrink guard keeps the public file intact until a v2.3.0
  selection is at least as large (see the README).
* **`--dry-run` prints the eligible/selected counts and a cost estimate and
  exits without making a single API call.** The paid run is deliberately gated.

The lock, revision choice, durable cache, shrink guard and paid loop are
`iwac_preprocess.arbiter_run`, shared with the second judge.

**Published run: `--rule valence`** — 301 articles, US$17.61 at effort medium
over 281 paid calls (recorded in the file's `metadata.usage`). Mistral Small is
the sole model across the valence line in 189 of the 301 (162 as the only
negative reader), so the per-model verdict tallies measure how often the
panel's dissenter was upheld, not the models' general quality. `--dry-run`
measures the real prompts and is the authoritative estimate.

`--rule`, `--dimensions` and `--threshold` can only ever tighten the contract's
arbiter frame, because `validate_arbiter_three_way` recomputes eligibility from
the contract with `is_arbiter_eligible` and requires the published ids to be a
subset of it.

Usage:
  python arbiter-evaluation-v2.py --rule valence --dry-run          # counts + cost, no spend
  python arbiter-evaluation-v2.py --rule valence --yes              # re-judge under v2.3.0
  python arbiter-evaluation-v2.py --rule valence --prompt-version v2.2.0 --prune-cache-only
  python arbiter-evaluation-v2.py --rule valence --limit 20 --yes   # pilot
  python arbiter-evaluation-v2.py --rule valence --source-revision head --dry-run

Requires ANTHROPIC_API_KEY for a paid run and HF_TOKEN for the private mirror.
Output: ma-visualisation-sentiments/static/data/iwac_arbiter_evaluations_v2.json
"""

import argparse
import json
import os
import random
from dataclasses import asdict
from functools import partial
from pathlib import Path
from typing import Any

from iwac_preprocess.arbiter_judges import (
    PROVIDER_ANTHROPIC,
    USD_PER_MTOK_INPUT,
    USD_PER_MTOK_OUTPUT,
    ArbiterUsage,
    estimate_panel_cost,
)
from iwac_preprocess.arbiter_lifecycle import CACHE_FILENAME, CacheUnreadableError
from iwac_preprocess.arbiter_prompt import (
    ARBITER_MAX_INPUT_CHARS,
    BLIND_LABELS,
    DEFAULT_PROMPT_VERSION,
    create_arbiter_prompt,
    system_instruction,
)
from iwac_preprocess.arbiter_run import (
    OUTCOME_ERROR,
    OUTCOME_INVALID,
    OUTCOME_NO_TEXT,
    OUTCOME_OK,
    OUTCOME_REFUSED,
    OUTCOME_TRUNCATED,
    ArbiterRunError,
    EvaluationResult,
    PanelRun,
    add_run_arguments,
    load_env,
    load_panel_records,
    load_panel_texts,
    plan_revisions,
    positive_limit,
    recorded_revisions,
    require_revision,
    run_locked,
)
from iwac_preprocess.arbiter_schema import ArbiterResponseV2, convert_response
from iwac_preprocess.arbiter_selection import (
    DEFAULT_RULE,
    DIMENSIONS,
    RULE_UNION,
    RULE_VALENCE,
    RULES,
    SelectionError,
    apply_limit,
    attach_full_text,
    check_text_coverage,
    find_three_way_conflicts,
    resolve_threshold,
)
from iwac_preprocess.publication import publish_json_files
from iwac_preprocess.source import SourceScopeError
from pydantic import ValidationError
from shared import (
    CONTRACT_V2,
    HF_FULL_REPO_ID,
    HF_REPO_ID,
    get_logger,
    get_staging_dir,
    get_webapp_data_dir,
    three_way_cache_fingerprint,
)
from validate_generated_data import validate_arbiter_envelope

logger = get_logger(__name__)

# ============================================================================
# Arbiter configuration
# ============================================================================

CONTRACT = CONTRACT_V2
ARBITER_MODEL = CONTRACT.arbiter["arbiterModel"]
# Thinking is on by default on Claude Opus 5, so max_tokens has to cover the
# reasoning as well as the JSON. A truncated response is a wasted paid call.
ARBITER_MAX_OUTPUT_TOKENS = 16000
# `effort` is the cost lever on Opus 5 — the model performs unusually well at
# the lower rungs, and the alternative (disabling thinking) is both worse and
# capped at `high`. Overridable per run with --effort.
ARBITER_DEFAULT_EFFORT = "medium"
EFFORT_LEVELS = ("low", "medium", "high", "xhigh", "max")

OUTPUT_FILENAME = "iwac_arbiter_evaluations_v2.json"
STAGING_DIRNAME = "arbiter-v2"
SDK_PACKAGE = "anthropic"

# The arbiter's panel, not the generation's: a recused model (one from the
# judge's own developer, see `arbiter.recusal` in the contract) is never shown
# to it, so it takes no label, no fingerprint slot and no part in selection.
MODEL_IDS = list(CONTRACT.arbiter_model_ids)


# ============================================================================
# Sources (script-level so tests can replace them)
# ============================================================================


def load_dataset_records(revision: str | None = None) -> tuple[list[dict], str]:
    """The public projection at ``revision``, scoped to the published base."""
    return load_panel_records(CONTRACT, revision, logger, model_ids=MODEL_IDS)


def load_article_texts(revision: str | None = None) -> tuple[dict[str, str], str]:
    """The private mirror's text at ``revision``."""
    return load_panel_texts(revision)


# ============================================================================
# Paid evaluation
# ============================================================================


def create_anthropic_client(api_key: str):
    """Import the paid-API dependency only for an evaluation run."""
    try:
        import anthropic
    except ImportError as error:
        raise RuntimeError("anthropic is required for arbiter API calls") from error
    # The SDK retries 429/5xx with backoff; article-level failures below are
    # deterministic and are deliberately not retried.
    return anthropic.Anthropic(api_key=api_key, max_retries=5)


def evaluate_with_arbiter(
    client: Any,
    article: dict,
    permutation: dict[str, str],
    *,
    effort: str = ARBITER_DEFAULT_EFFORT,
    usage: ArbiterUsage | None = None,
    prompt_version: str = DEFAULT_PROMPT_VERSION,
) -> EvaluationResult:
    """Send one article to Claude Opus 5 and return its structured verdict.

    No `temperature` and no `thinking` block: sampling parameters are rejected
    on Opus 5, and adaptive thinking is already on by default there. Depth is
    controlled with `output_config.effort` instead, which is also the cost lever.

    Nothing here retries. A schema violation, a refusal or a truncated response
    are all deterministic outcomes of this input — retrying spends money without
    making the contract more likely to hold. Transport failures are retried by
    the SDK before they ever reach this function.
    """
    article_id = str(article.get("o:id"))
    if not article.get("OCR"):
        logger.warning("No text available for article %s", article_id)
        return EvaluationResult(OUTCOME_NO_TEXT)

    request = {
        "model": ARBITER_MODEL,
        "max_tokens": ARBITER_MAX_OUTPUT_TOKENS,
        # Cached: the instruction is byte-identical on every call and above
        # Opus 5's 512-token minimum, so it is written once and read at a tenth
        # of the price after that. The article and the analyses differ every
        # time and cannot be cached at all.
        "system": [
            {
                "type": "text",
                "text": system_instruction(prompt_version),
                "cache_control": {"type": "ephemeral"},
            }
        ],
        "messages": [
            {"role": "user", "content": create_arbiter_prompt(article, permutation, CONTRACT)}
        ],
        "output_format": ArbiterResponseV2,
        "output_config": {"effort": effort},
    }

    try:
        response = client.messages.parse(**request)
    except ValidationError as error:
        logger.error("Invalid structured response for article %s: %s", article_id, error)
        if usage is not None:
            # Billed like any other call, but `messages.parse` validates inside
            # the SDK and raises before handing back the usage (and its raw
            # wrapper has no `parse`), so the call is counted without tokens.
            usage.add_unmetered()
        return EvaluationResult(OUTCOME_INVALID)
    except Exception as error:  # noqa: BLE001 - one bad article must not end the run
        logger.error("Arbiter call failed for article %s: %s", article_id, error)
        return EvaluationResult(OUTCOME_ERROR)

    # Recorded before any early return: a refused or truncated call is billed
    # like any other, and an accounting that skipped those would understate the
    # run exactly where it went wrong.
    if usage is not None:
        usage.add_anthropic(getattr(response, "usage", None))

    stop_reason = getattr(response, "stop_reason", None)
    if stop_reason == "refusal":
        category = getattr(getattr(response, "stop_details", None), "category", None)
        logger.warning("Arbiter declined article %s (category=%s)", article_id, category)
        return EvaluationResult(OUTCOME_REFUSED)
    if stop_reason == "max_tokens":
        logger.error(
            "Article %s hit max_tokens (%d); raise ARBITER_MAX_OUTPUT_TOKENS or lower --effort",
            article_id,
            ARBITER_MAX_OUTPUT_TOKENS,
        )
        return EvaluationResult(OUTCOME_TRUNCATED)

    parsed = getattr(response, "parsed_output", None)
    if parsed is None:
        logger.error("Empty structured response for article %s", article_id)
        return EvaluationResult(OUTCOME_INVALID)

    return EvaluationResult(OUTCOME_OK, convert_response(parsed, article_id, CONTRACT))


# ============================================================================
# Cache and output
# ============================================================================


def build_fingerprint(
    source_revision: str, text_revision: str, prompt_version: str = DEFAULT_PROMPT_VERSION
):
    """Bind this run's model, prompt and both source revisions to the v2 hasher."""
    return partial(
        three_way_cache_fingerprint,
        arbiter_model=ARBITER_MODEL,
        source_revision=require_revision(source_revision, HF_REPO_ID),
        text_revision=require_revision(text_revision, HF_FULL_REPO_ID),
        max_input_chars=ARBITER_MAX_INPUT_CHARS,
        contract=CONTRACT,
        prompt_version=prompt_version,
    )


def build_metadata(
    *,
    permutation: dict[str, str],
    selection: dict[str, Any],
    counts: dict[str, int],
    source_revision: str,
    text_revision: str,
    effort: str,
    prompt_version: str,
    usage: ArbiterUsage | None = None,
) -> dict:
    """Assemble the self-documenting envelope (``generated`` is the runner's)."""
    return {
        # Cumulative over every run that contributed to the file: seeded from
        # the published record, so a resumed run adds to it and a run that
        # makes no call leaves it as it was.
        "usage": usage.as_metadata() if usage else {},
        "arbiter_model": ARBITER_MODEL,
        "mode": CONTRACT.arbiter["mode"],
        "effort": effort,
        "blind_evaluation": True,
        "models": MODEL_IDS,
        "model_names": {model_id: CONTRACT.model_names[model_id] for model_id in MODEL_IDS},
        # label -> model id. Verdicts are stored under the labels; this is the
        # only place that resolves them back to a model.
        "blind_permutation": dict(permutation),
        "note": (
            "preferred/overall_winner name an anonymised analysis label; resolve "
            "them through blind_permutation."
        ),
        "selection": selection,
        "total_articles": counts["total"],
        "successful_evaluations": counts["successful"],
        "failed_evaluations": counts["failed"],
        "refused_evaluations": counts.get("refused", 0),
        "articles_without_text": counts.get("missing_text", 0),
        "contract_schema_version": CONTRACT.schema_version,
        "analysis_version": CONTRACT.analysis_version,
        "cache_schema_version": CONTRACT.arbiter["cacheSchemaVersion"],
        "prompt_version": prompt_version,
        # Two repositories, two revisions: scores from the public projection,
        # article text from the private mirror.
        "source": {
            "scores": {"repository": HF_REPO_ID, "revision": source_revision},
            "text": {"repository": HF_FULL_REPO_ID, "revision": text_revision},
        },
        "legacy_cache_adopted": 0,
    }


def save_results(path: str | Path, evaluations: list[dict], metadata: dict) -> None:
    """Publish the file through the shared staged path, envelope checked first.

    Waits for the writer lock rather than failing: a concurrent export must not
    cost this run the paid verdicts it is about to save.
    """
    output = Path(path)
    publish_json_files(
        output.parent,
        Path(get_staging_dir()),
        {output.name: {"metadata": metadata, "evaluations": evaluations}},
        validate=lambda stage: validate_arbiter_envelope(
            CONTRACT, json.loads((stage / output.name).read_text(encoding="utf-8"))
        ),
        blocking=True,
    )


def report_estimate(estimate: dict, effort: str) -> None:
    logger.info("Estimated spend for %d call(s) at effort=%s:", estimate["calls"], effort)
    logger.info(
        "  input  ~%s tokens (measured prompts), ~%s billable after the cached "
        "system prefix — saves ~$%.2f",
        f"{estimate['input_tokens']:,}",
        f"{estimate['billable_input_tokens']:,}",
        estimate["cache_saving_usd"],
    )
    logger.info(
        "  output ~%s tokens (assumed %s per call, thinking included)",
        f"{estimate['output_tokens']:,}",
        f"{estimate['assumed_output_tokens_per_call']:,}",
    )
    logger.info(
        "  ~$%.2f at $%.2f/$%.2f per MTok — an estimate, not a quote",
        estimate["usd"],
        USD_PER_MTOK_INPUT,
        USD_PER_MTOK_OUTPUT,
    )


# ============================================================================
# Entry point
# ============================================================================


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="IWAC panel arbiter evaluation (generation 2)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python arbiter-evaluation-v2.py --rule valence --dry-run
  python arbiter-evaluation-v2.py --rule valence --yes                   # re-judge, v2.3.0
  python arbiter-evaluation-v2.py --rule valence --prompt-version v2.2.0 --prune-cache-only
  python arbiter-evaluation-v2.py --rule valence --limit 20 --yes        # pilot
  python arbiter-evaluation-v2.py --rule spread --dimensions polarity --dry-run
""",
    )
    parser.add_argument(
        "--limit",
        type=positive_limit,
        default=None,
        help="Evaluate at most N articles, the widest disagreements first "
        "(ties broken by article id).",
    )
    parser.add_argument(
        "--rule",
        choices=RULES,
        default=DEFAULT_RULE,
        help=f"Which of the contract's arbiter rules to select on (default: {DEFAULT_RULE}, "
        "the full contract frame). 'valence' keeps every article where one model reports a "
        "positive polarity and another a negative one — the published run, ~301 articles — "
        "and ignores --dimensions/--threshold, which narrow the spread rule only.",
    )
    parser.add_argument(
        "--dimensions",
        nargs="+",
        choices=DIMENSIONS,
        default=list(DIMENSIONS),
        metavar="DIM",
        help="Which dimensions may trigger selection under the spread rule (default: all three).",
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=None,
        help="Minimum spread on a triggering dimension (default: the contract's "
        "significant spread). Can only be raised, never lowered.",
    )
    parser.add_argument(
        "--effort",
        choices=EFFORT_LEVELS,
        default=ARBITER_DEFAULT_EFFORT,
        help=f"Reasoning effort on the arbiter model (default: {ARBITER_DEFAULT_EFFORT}). "
        "The primary cost lever; a populated cache binds the effort it was run at.",
    )
    add_run_arguments(parser)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    # Parse limits before source loading, cache reads, or filesystem mutation.
    args = parse_args(argv)
    if args.dry_run:
        return run(args)
    return run_locked(
        Path(get_staging_dir()) / STAGING_DIRNAME, "panel arbiter", lambda: run(args), logger
    )


def run(args: argparse.Namespace) -> int:
    load_env(__file__, logger)
    logger.info(
        "IWAC panel arbiter — %s (effort=%s, prompt %s), contract %s",
        ARBITER_MODEL,
        args.effort,
        args.prompt_version,
        CONTRACT.analysis_version,
    )
    output_path = Path(get_webapp_data_dir()) / OUTPUT_FILENAME
    cache_path = Path(get_staging_dir()) / STAGING_DIRNAME / CACHE_FILENAME

    try:
        recorded, recorded_in = recorded_revisions(output_path, cache_path)
    except CacheUnreadableError as error:
        logger.error("%s", error)
        return 2
    request = plan_revisions(
        source_flag=args.source_revision,
        text_flag=args.text_revision,
        recorded=recorded,
        recorded_in=recorded_in,
    )
    logger.info("Scores revision: %s — %s", request.scores or "HEAD", request.scores_reason)
    logger.info("Text revision: %s — %s", request.text or "HEAD", request.text_reason)

    try:
        records, source_revision = load_dataset_records(request.scores)
    except Exception as error:  # noqa: BLE001 - surfaced as an exit code
        logger.error("Failed to load dataset: %s", error)
        return 2

    try:
        threshold = resolve_threshold(args.threshold)
    except SelectionError as error:
        logger.error("%s", error)
        return 2

    eligible = find_three_way_conflicts(
        records, dimensions=args.dimensions, threshold=threshold, rule=args.rule
    )
    if args.rule == RULE_VALENCE:
        logger.info(
            "%d of %d articles carry a polarity valence flip (--dimensions and --threshold "
            "do not apply to this rule)",
            len(eligible),
            len(records),
        )
    else:
        logger.info(
            "%d of %d articles qualify under --rule %s (spread >= %d on %s%s)",
            len(eligible),
            len(records),
            args.rule,
            threshold,
            " / ".join(args.dimensions),
            ", or a polarity valence flip" if args.rule == RULE_UNION else "",
        )

    try:
        texts, text_revision = load_article_texts(request.text)
    except Exception as error:  # noqa: BLE001 - surfaced as an exit code
        logger.error("Failed to load article text from the private mirror: %s", error)
        return 2

    with_text, missing_text = attach_full_text(eligible, texts)
    try:
        check_text_coverage(missing_text, len(eligible))
    except SelectionError as error:
        logger.error("%s", error)
        return 2
    if missing_text:
        logger.warning(
            "%d eligible article(s) have no text even in %s and were skipped (e.g. %s)",
            len(missing_text),
            HF_FULL_REPO_ID,
            ", ".join(missing_text[:5]),
        )

    selected = apply_limit(with_text, args.limit, args.dimensions)
    if args.limit is not None:
        logger.info(
            "--limit %d kept the %d widest disagreements, ranked on %s",
            args.limit,
            len(selected),
            " / ".join(args.dimensions),
        )

    selection = {
        "rule": CONTRACT.contract["discrepancy"]["threeWaySpread"]["rule"],
        # What this run actually selected on, which may be tighter than the
        # contract frame above. A reader of the published file needs both.
        "arbiter_rule": args.rule,
        "contract_arbiter_rule": CONTRACT.arbiter_eligibility_rule,
        "dimensions": list(args.dimensions),
        "threshold": threshold,
        "contract_threshold": CONTRACT.significant_spread_threshold,
        "limit": args.limit,
        "eligible_articles": len(eligible),
        "selected_articles": len(selected),
        "valence_flips_selected": sum(1 for article in selected if article.get("valence_flip")),
    }

    try:
        fingerprint = build_fingerprint(source_revision, text_revision, args.prompt_version)
        holder: dict[str, PanelRun] = {}

        def metadata(counts: dict[str, int], usage: ArbiterUsage) -> dict:
            return build_metadata(
                permutation=holder["run"].permutation,
                selection=selection,
                counts=counts,
                source_revision=source_revision,
                text_revision=text_revision,
                effort=args.effort,
                prompt_version=args.prompt_version,
                usage=usage,
            )

        panel_run = PanelRun.open(
            cache_path=cache_path,
            output_path=output_path,
            panel=MODEL_IDS,
            effort=args.effort,
            selected=selected,
            fingerprint=fingerprint,
            prompt_version=args.prompt_version,
            source={"scores": source_revision, "text": text_revision},
            save_results=lambda path, rows, meta: save_results(path, rows, meta),
            build_metadata=metadata,
            usage_provider=PROVIDER_ANTHROPIC,
            logger=logger,
            missing_text=len(missing_text),
            allow_shrink=args.allow_shrink,
            retry_failed=args.retry_failed,
            sdk_package=SDK_PACKAGE,
        )
        holder["run"] = panel_run
    except (ArbiterRunError, CacheUnreadableError, SourceScopeError) as error:
        logger.error("%s", error)
        return 2

    permutation = panel_run.permutation
    logger.info(
        "Blind assignment: %s",
        ", ".join(f"{label.upper()}={permutation[label]}" for label in BLIND_LABELS),
    )
    estimate = estimate_panel_cost(panel_run.remaining, permutation, args.effort, CONTRACT)

    if args.dry_run:
        logger.info(
            "Dry run: %d eligible, %d selected, %d cached, %d would be evaluated",
            len(eligible),
            len(selected),
            len(panel_run.evaluations),
            len(panel_run.remaining),
        )
        report_estimate(estimate, args.effort)
        notice = panel_run.transition_notice(len(panel_run.remaining), estimate["usd"])
        if notice:
            logger.warning("%s", notice)
        refusal = panel_run.shrink_refusal()
        if refusal and not panel_run.remaining:
            logger.warning("%s", refusal)
        logger.info("No API call was made and no file was written.")
        return 0

    def make_client():
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ArbiterRunError("No API key found! Set ANTHROPIC_API_KEY, or use --dry-run.")
        try:
            return create_anthropic_client(api_key)
        except RuntimeError as error:
            raise ArbiterRunError(str(error)) from error

    def make_row(article: dict, analysis: Any, key: str) -> dict:
        return {
            "article_id": analysis.article_id,
            "cache_fingerprint": key,
            "spread": article["spread"],
            "arbiter": asdict(analysis),
        }

    try:
        return panel_run.finish(
            prune_only=args.prune_cache_only,
            assume_yes=args.yes,
            model=ARBITER_MODEL,
            estimate=estimate,
            report_estimate=lambda: report_estimate(estimate, args.effort),
            make_client=make_client,
            evaluate=lambda client, article: evaluate_with_arbiter(
                client,
                article,
                permutation,
                effort=args.effort,
                usage=panel_run.usage,
                prompt_version=args.prompt_version,
            ),
            make_row=make_row,
            desc="Panel arbiter",
            max_consecutive_errors=args.max_consecutive_errors,
        )
    except ArbiterRunError as error:
        logger.error("%s", error)
        return 2


if __name__ == "__main__":
    # No fixed seed: the blind permutation must be genuinely random the first
    # time, and every later run reuses the one stored in the output file.
    random.seed()
    raise SystemExit(main())
