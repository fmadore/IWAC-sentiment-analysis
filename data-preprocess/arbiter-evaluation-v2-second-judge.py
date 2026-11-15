"""
Second panel arbiter for generation 2 — a judge from another developer.

The published panel arbiter is Claude Opus 5 (`arbiter-evaluation-v2.py`).
Claude Haiku 5.5 joined the panel after it ran and shares its developer, so the
contract's same-developer recusal keeps Haiku away from it. That kept the 301
paid verdicts valid, but it means nobody has heard Haiku's own dissents: with
six models the panel has 346 polarity valence flips, and 45 of them exist only
because of Haiku (38 as the sole negative reader, 7 as the sole positive one).
Settling those needs a judge from another developer — and since every frontier
developer now has a member on the panel, that judge recuses its own in turn:
Gemma for a Google judge, Luna for an OpenAI one. The recused set is derived
from the judge's developer (`SentimentContract.recused_for`), never listed.

What is shared with the published run, so the two judges' verdicts compare:

* the system instruction, the user prompt, the blind labels and the
  per-article `display_order` (`iwac_preprocess.arbiter_prompt`). The prompt
  version follows the same default as the primary judge (`--prompt-version`);
* the response schema and the published verdict shape
  (`iwac_preprocess.arbiter_schema`);
* the input fingerprint, durable cache, run lock, revision choice, shrink
  guard and checkpoint-before-publish loop (`iwac_preprocess.arbiter_run`),
  each under this judge's own names.

What differs, and why:

* **The frame is the whole generation's, the panel is the judge's.** Selection
  runs the contract's valence-flip rule over all six models — Haiku's dissents
  are what this judge exists to hear — and each row is then shown to the
  judge's panel of five (`project_to_panel`). The stored spread and the
  fingerprint describe what the judge read. On a few rows the only reader
  across the line is the judge's own recused member (27 for Gemma, 19 for
  Luna), so the judge sees no flip there; it still scores the article, and
  `panel_valence_flip` records it.
* **`--frame recused` or `--frame full`.** `recused` keeps the flips that exist
  only because of a model the *published* arbiter recused (Haiku's 45).
  `full` keeps all 346: the extra 301 replicate the published run, which is what
  gives a judge-agreement figure and a difference-in-differences estimate of
  each judge's affinity for its own developer's model
  (`iwac_preprocess.judge_comparison`).
* **Provider.** Gemini 4 Argon runs through Google's Interactions API with
  structured output and `store=False`: the article text comes from the private
  mirror and must not be retained server-side. Other registered judges (GPT-6
  Astra, GPT-6.1 Sol) are priced by `--dry-run` but have no paid-call adapter
  yet, and a paid run for them is refused before anything is loaded.
* **Prices change.** Gemini 4 Argon's introductory rates double on
  1 December 2026; `--dry-run` prints the rate in force and the next change.

`--dry-run` makes no API call and writes nothing.

Usage:
  python arbiter-evaluation-v2-second-judge.py --dry-run
  python arbiter-evaluation-v2-second-judge.py --judge gpt-6.1-sol --dry-run
  python arbiter-evaluation-v2-second-judge.py --frame full --limit 20 --yes     # pilot
  python arbiter-evaluation-v2-second-judge.py --frame full --yes                # 346
  python arbiter-evaluation-v2-second-judge.py --frame recused --yes             # 45

Requires GOOGLE_API_KEY (or GEMINI_API_KEY) for a paid run and HF_TOKEN for the
private mirror.
Output: ma-visualisation-sentiments/static/data/iwac_arbiter_evaluations_v2_<judge>.json
"""

import argparse
import json
import os
import random
from dataclasses import asdict
from datetime import date
from functools import partial
from pathlib import Path
from typing import Any

from iwac_preprocess.arbiter_judges import (
    DEFAULT_JUDGE,
    ESTIMATE_CHARS_PER_TOKEN,
    JUDGES,
    PAID_PROVIDERS,
    PRICES_CHECKED,
    PROVIDER_GOOGLE,
    TIER_STANDARD,
    ArbiterUsage,
    JudgeSpec,
    Rates,
    compare_with_published,
    estimate_judge_cost,
    judge_panel,
    prefix_chars,
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
from iwac_preprocess.arbiter_schema import ArbiterResponseV2, convert_response, inline_json_schema
from iwac_preprocess.arbiter_selection import (
    RULE_VALENCE,
    SelectionError,
    apply_limit,
    attach_full_text,
    check_text_coverage,
    classify_frame,
    find_three_way_conflicts,
    flips_over,
    project_to_panel,
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
from validate_generated_data import ARBITER_V2_FILENAME, validate_second_judge_envelope

logger = get_logger(__name__)

# ============================================================================
# Configuration
# ============================================================================

CONTRACT = CONTRACT_V2
# The frame is the generation's panel: every model, recused or not, may put an
# article in it. Only the judge's panel ever reaches the prompt.
FRAME_MODEL_IDS = list(CONTRACT.model_names)
FRAME_FULL = "full"
FRAME_RECUSED = "recused"
FRAMES = (FRAME_FULL, FRAME_RECUSED)
DEFAULT_FRAME = FRAME_FULL

# Thinking and the answer share this budget on Gemini 4 Argon; Google advises at
# least 32,768. A truncated response is a wasted paid call.
JUDGE_MAX_OUTPUT_TOKENS = 32768
# Google's guidance for long reasoning calls is a client timeout of at least 15
# minutes; the SDK retries 408/409/429/5xx before a failure reaches this script.
HTTP_TIMEOUT_MS = 15 * 60 * 1000
HTTP_RETRY_ATTEMPTS = 5

OUTPUT_TEMPLATE = "iwac_arbiter_evaluations_v2_{judge}.json"
STAGING_TEMPLATE = "arbiter-v2-{judge}"

# Flattened once: the Interactions API takes a JSON Schema, not a class.
RESPONSE_SCHEMA = inline_json_schema(ArbiterResponseV2)

# Interaction states that mean the budget ran out before the answer did.
TRUNCATED_STATUSES = frozenset({"incomplete", "budget_exceeded"})


def output_filename(judge: JudgeSpec) -> str:
    return OUTPUT_TEMPLATE.format(judge=judge.id)


# ============================================================================
# Sources (script-level so tests can replace them)
# ============================================================================


def load_dataset_records(revision: str | None = None) -> tuple[list[dict], str]:
    """The public projection at ``revision``, scoped to the published article base."""
    return load_panel_records(CONTRACT, revision, logger)


def load_article_texts(revision: str | None = None) -> tuple[dict[str, str], str]:
    return load_panel_texts(revision)


# ============================================================================
# Paid evaluation
# ============================================================================


def create_genai_client(api_key: str):
    """Import the paid-API dependency only for an evaluation run."""
    try:
        from google import genai
        from google.genai import types
    except ImportError as error:
        raise RuntimeError("google-genai is required for Gemini judge calls") from error
    return genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(
            timeout=HTTP_TIMEOUT_MS,
            retry_options=types.HttpRetryOptions(attempts=HTTP_RETRY_ATTEMPTS),
        ),
    )


def evaluate_with_gemini(
    client: Any,
    article: dict,
    permutation: dict[str, str],
    *,
    judge: JudgeSpec,
    effort: str,
    service_tier: str = TIER_STANDARD,
    rates: Rates | None = None,
    usage: ArbiterUsage | None = None,
    prompt_version: str = DEFAULT_PROMPT_VERSION,
) -> EvaluationResult:
    """Send one article to a Gemini judge and return its structured verdict.

    No temperature and no top_p: Gemini 4 Argon ignores sampling parameters.
    Depth is `thinking_level`, which is also the cost lever. `store=False`
    keeps the private mirror's text out of the provider's interaction history.

    Nothing here retries. A schema violation or a truncated answer is a
    deterministic outcome of this input; transport failures are retried by the
    SDK before they reach this function. Usage is recorded as soon as the
    interaction returns, so an invalid answer is still billed.
    """
    article_id = str(article.get("o:id"))
    if not article.get("OCR"):
        logger.warning("No text available for article %s", article_id)
        return EvaluationResult(OUTCOME_NO_TEXT)

    prompt = create_arbiter_prompt(article, permutation, CONTRACT)
    try:
        interaction = client.interactions.create(
            model=judge.model,
            system_instruction=system_instruction(prompt_version),
            input=prompt,
            generation_config={
                "thinking_level": effort,
                "max_output_tokens": JUDGE_MAX_OUTPUT_TOKENS,
            },
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": RESPONSE_SCHEMA,
            },
            service_tier=service_tier,
            store=False,
        )
    except Exception as error:  # noqa: BLE001 - one bad article must not end the run
        logger.error("Judge call failed for article %s: %s", article_id, error)
        return EvaluationResult(OUTCOME_ERROR)

    # Recorded before any early return: a truncated call is billed like any other.
    if usage is not None and rates is not None:
        usage.add_gemini(getattr(interaction, "usage", None), rates)

    status = getattr(interaction, "status", None)
    if status in TRUNCATED_STATUSES:
        logger.error(
            "Article %s ended %s (max_output_tokens=%d); lower the thinking level",
            article_id,
            status,
            JUDGE_MAX_OUTPUT_TOKENS,
        )
        return EvaluationResult(OUTCOME_TRUNCATED)
    if status != "completed":
        logger.error(
            "Article %s ended %s: %s", article_id, status, getattr(interaction, "errors", None)
        )
        return EvaluationResult(OUTCOME_ERROR)

    text = getattr(interaction, "output_text", None)
    if not text:
        # A completed interaction with no text is how a blocked answer surfaces.
        logger.warning("Judge returned no text for article %s", article_id)
        return EvaluationResult(OUTCOME_REFUSED)
    try:
        parsed = ArbiterResponseV2.model_validate_json(text)
    except ValidationError as error:
        logger.error("Invalid structured response for article %s: %s", article_id, error)
        return EvaluationResult(OUTCOME_INVALID)
    return EvaluationResult(OUTCOME_OK, convert_response(parsed, article_id, CONTRACT))


# One adapter per provider in PAID_PROVIDERS. Adding a provider means adding an
# entry here and its SDK to requirements.txt (and both locks).
EVALUATORS = {PROVIDER_GOOGLE: evaluate_with_gemini}
CLIENT_FACTORIES = {PROVIDER_GOOGLE: create_genai_client}
SDK_PACKAGES = {PROVIDER_GOOGLE: "google-genai"}
# The environment variables each provider's client reads, in order. Only
# these names are ever logged; the name avoids "key" so CodeQL's
# sensitive-data heuristic does not mistake them for the secret itself.
PROVIDER_ENV_NAMES = {PROVIDER_GOOGLE: ("GOOGLE_API_KEY", "GEMINI_API_KEY")}


# ============================================================================
# Cache and output
# ============================================================================


def build_fingerprint(
    judge: JudgeSpec,
    source_revision: str,
    text_revision: str,
    prompt_version: str = DEFAULT_PROMPT_VERSION,
):
    """The published run's hasher, bound to this judge's model id.

    Same function, same key set: the judge's model and panel are inside the
    digest, so no fingerprint can collide with a published Opus 5 one.
    """
    return partial(
        three_way_cache_fingerprint,
        arbiter_model=judge.model,
        source_revision=require_revision(source_revision, HF_REPO_ID),
        text_revision=require_revision(text_revision, HF_FULL_REPO_ID),
        max_input_chars=ARBITER_MAX_INPUT_CHARS,
        contract=CONTRACT,
        prompt_version=prompt_version,
    )


def build_metadata(
    *,
    judge: JudgeSpec,
    panel: list[str],
    permutation: dict[str, str],
    selection: dict[str, Any],
    counts: dict[str, int],
    source_revision: str,
    text_revision: str,
    effort: str,
    service_tier: str,
    prompt_version: str,
    usage: ArbiterUsage | None = None,
) -> dict:
    """The envelope `validate_second_judge_envelope` checks (``generated`` is the runner's)."""
    return {
        "usage": usage.as_metadata() if usage else {},
        "arbiter_model": judge.model,
        "arbiter_name": judge.display_name,
        "arbiter_developer": judge.developer,
        "provider": judge.provider,
        "service_tier": service_tier,
        "mode": CONTRACT.arbiter["mode"],
        "effort": effort,
        "blind_evaluation": True,
        "models": list(panel),
        "recused_models": list(CONTRACT.recused_for(judge.developer)),
        "model_names": {model_id: CONTRACT.model_names[model_id] for model_id in panel},
        "blind_permutation": dict(permutation),
        "note": (
            "preferred/overall_winner name an anonymised analysis label; resolve them "
            "through blind_permutation. Labels are this judge's own and do not match "
            "the published arbiter's."
        ),
        "published_arbiter": {
            "arbiter_model": CONTRACT.arbiter["arbiterModel"],
            "arbiter_developer": CONTRACT.arbiter_developer,
            "recused_models": list(CONTRACT.arbiter_recused_ids),
        },
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
        "source": {
            "scores": {"repository": HF_REPO_ID, "revision": source_revision},
            "text": {"repository": HF_FULL_REPO_ID, "revision": text_revision},
        },
        "legacy_cache_adopted": 0,
    }


def save_results(path: str | Path, evaluations: list[dict], metadata: dict) -> None:
    """Publish through the shared staged path, the envelope checked first."""
    output = Path(path)
    publish_json_files(
        output.parent,
        Path(get_staging_dir()),
        {output.name: {"metadata": metadata, "evaluations": evaluations}},
        validate=lambda stage: validate_second_judge_envelope(
            CONTRACT, json.loads((stage / output.name).read_text(encoding="utf-8"))
        ),
        blocking=True,
    )


# ============================================================================
# Cost estimate
# ============================================================================


def estimate_cost(
    articles: list[dict],
    permutation: dict[str, str],
    judge: JudgeSpec,
    effort: str,
    rates: Rates,
    prompt_version: str = DEFAULT_PROMPT_VERSION,
) -> dict:
    """Estimate evaluating ``articles`` with ``judge``, from the real prompts."""
    return estimate_judge_cost(
        [len(create_arbiter_prompt(article, permutation, CONTRACT)) for article in articles],
        prefix_chars=prefix_chars(prompt_version, RESPONSE_SCHEMA),
        rates=rates,
        effort=effort,
    )


def report_estimate(label: str, estimate: dict, judge: JudgeSpec, effort: str, rates: Rates):
    logger.info(
        "%s: %d call(s) to %s at %s — ~%s input + ~%s output tokens (assumed %s/call, "
        "thinking included): ~$%.2f, ~$%.2f if output doubles ($%.2f/$%.2f per MTok)",
        label,
        estimate["calls"],
        judge.model,
        effort,
        f"{estimate['input_tokens']:,}",
        f"{estimate['output_tokens']:,}",
        f"{estimate['assumed_output_tokens_per_call']:,}",
        estimate["usd"],
        estimate["usd_if_output_doubles"],
        rates.input,
        rates.output,
    )


def report_alternatives(
    rows: list[dict], recused_only: list[dict], texts: dict[str, str], prompt_version: str
) -> None:
    """One line per registered judge, so the choice of judge is made on numbers.

    Each judge is priced on its own panel's prompts under a contract-order
    permutation (the permutation changes the order of the blocks, not their
    length), at its default effort and the rates in force today.
    """
    today = date.today()
    for judge in JUDGES.values():
        panel = judge_panel(judge)
        permutation = dict(zip(BLIND_LABELS, panel, strict=True))
        rates = judge.rates_on(today)
        costs = []
        for subset in (recused_only, rows):
            with_text, _ = attach_full_text(subset, texts)
            projected = [project_to_panel(article, panel) for article in with_text]
            costs.append(
                estimate_cost(
                    projected, permutation, judge, judge.default_effort, rates, prompt_version
                )
            )
        hidden = sum(1 for row in rows if not flips_over(row, panel))
        logger.info(
            "  %-15s recuses %-6s recused frame ~$%.2f, full frame ~$%.2f, no visible flip on %d%s",
            judge.id,
            ",".join(CONTRACT.recused_for(judge.developer)),
            costs[0]["usd"],
            costs[1]["usd"],
            hidden,
            "" if judge.provider in PAID_PROVIDERS else "  [estimate only: no adapter yet]",
        )


# ============================================================================
# Entry point
# ============================================================================


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="IWAC second panel arbiter (generation 2, a judge from another developer)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python arbiter-evaluation-v2-second-judge.py --dry-run
  python arbiter-evaluation-v2-second-judge.py --judge gpt-6.1-sol --dry-run
  python arbiter-evaluation-v2-second-judge.py --frame full --limit 20 --yes   # pilot
  python arbiter-evaluation-v2-second-judge.py --frame full --yes
""",
    )
    parser.add_argument(
        "--judge",
        choices=sorted(JUDGES),
        default=DEFAULT_JUDGE,
        help=f"Which judge to run (default: {DEFAULT_JUDGE}). It recuses its own developer's "
        "panel member; only judges with a paid-call adapter can run beyond --dry-run.",
    )
    parser.add_argument(
        "--frame",
        choices=FRAMES,
        default=DEFAULT_FRAME,
        help="'recused': only the valence flips that exist because of a model the published "
        "arbiter recused (Haiku's 45). 'full' (default): all six-model flips (346), which "
        "also replicates the published run for a judge-agreement figure.",
    )
    parser.add_argument(
        "--limit",
        type=positive_limit,
        default=None,
        help="Evaluate at most N articles, the widest polarity disagreements first "
        "(ties broken by article id).",
    )
    parser.add_argument(
        "--effort",
        default=None,
        help="The judge's reasoning level (default: the judge's own default). The primary cost "
        "lever; a populated cache binds the effort it was run at.",
    )
    parser.add_argument(
        "--service-tier",
        default=TIER_STANDARD,
        help="Provider service tier, priced from the registry (Gemini: standard or flex).",
    )
    add_run_arguments(parser)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    judge = JUDGES[args.judge]
    effort = args.effort or judge.default_effort
    if effort not in judge.effort_levels:
        logger.error(
            "%s accepts effort %s, not %r",
            judge.display_name,
            "/".join(judge.effort_levels),
            effort,
        )
        return 2
    if args.service_tier not in judge.rates:
        logger.error(
            "%s has no %r service tier; expected %s",
            judge.display_name,
            args.service_tier,
            "/".join(judge.rates),
        )
        return 2
    if not args.dry_run and judge.provider not in PAID_PROVIDERS:
        # Refused before any loading: there is no adapter to spend through.
        logger.error(
            "%s has no paid-call adapter yet (provider %s); run it with --dry-run, or add an "
            "adapter and its SDK first.",
            judge.display_name,
            judge.provider,
        )
        return 2
    args.effort = effort
    if args.dry_run:
        return run(args, judge)
    return run_locked(
        Path(get_staging_dir()) / STAGING_TEMPLATE.format(judge=judge.id),
        judge.display_name,
        lambda: run(args, judge),
        logger,
    )


def run(args: argparse.Namespace, judge: JudgeSpec) -> int:
    load_env(__file__, logger)

    try:
        panel = judge_panel(judge)
    except ValueError as error:
        logger.error("%s", error)
        return 2
    recused = CONTRACT.recused_for(judge.developer)
    today = date.today()
    rates = judge.rates_on(today, args.service_tier)
    logger.info(
        "IWAC second panel arbiter — %s (%s, effort=%s, tier=%s, prompt %s); recuses %s; reads %s",
        judge.display_name,
        judge.model,
        args.effort,
        args.service_tier,
        args.prompt_version,
        ", ".join(recused),
        ", ".join(panel),
    )
    data_dir = get_webapp_data_dir()
    output_path = Path(data_dir) / output_filename(judge)
    cache_path = Path(get_staging_dir()) / STAGING_TEMPLATE.format(judge=judge.id) / CACHE_FILENAME

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

    rows, recused_only, summary = classify_frame(
        find_three_way_conflicts(records, CONTRACT, rule=RULE_VALENCE, model_ids=FRAME_MODEL_IDS)
    )
    published_recused = ", ".join(CONTRACT.arbiter_recused_ids) or "none"
    logger.info(
        "%d six-model valence flips; %d also flip over the published arbiter's panel; "
        "%d exist only because of %s (%d as the sole negative reader, %d as the sole positive)",
        summary.frame,
        summary.in_published_frame,
        summary.recused_only,
        published_recused,
        summary.recused_only_sole_negative,
        summary.recused_only_sole_positive,
    )

    try:
        texts, text_revision = load_article_texts(request.text)
    except Exception as error:  # noqa: BLE001 - surfaced as an exit code
        logger.error("Failed to load article text from the private mirror: %s", error)
        return 2

    framed = recused_only if args.frame == FRAME_RECUSED else rows
    with_text, missing_text = attach_full_text(framed, texts)
    try:
        check_text_coverage(missing_text, len(framed))
    except SelectionError as error:
        logger.error("%s", error)
        return 2
    if missing_text:
        logger.warning(
            "%d framed article(s) have no text even in %s and were skipped (e.g. %s)",
            len(missing_text),
            HF_FULL_REPO_ID,
            ", ".join(missing_text[:5]),
        )
    projected = [project_to_panel(article, panel) for article in with_text]
    hidden = sum(1 for article in projected if not article["panel_valence_flip"])
    logger.info(
        "%s sees no flip on %d of the %d framed articles: the only reader across the line "
        "is its own recused member (%s). It still scores them.",
        judge.display_name,
        hidden,
        len(projected),
        ", ".join(recused),
    )
    selected = apply_limit(projected, args.limit, ("polarity",))
    if args.limit is not None:
        logger.info(
            "--limit %d kept the %d widest polarity disagreements", args.limit, len(selected)
        )

    selection = {
        "arbiter_rule": RULE_VALENCE,
        "contract_arbiter_rule": CONTRACT.arbiter_eligibility_rule,
        "frame": args.frame,
        "frame_models": FRAME_MODEL_IDS,
        "frame_articles": summary.frame,
        "frame_in_published_arbiter": summary.in_published_frame,
        "recused_only_articles": summary.recused_only,
        "recused_only_sole_negative": summary.recused_only_sole_negative,
        "recused_only_sole_positive": summary.recused_only_sole_positive,
        "framed_articles": len(framed),
        "selected_articles": len(selected),
        "panel_flip_hidden": hidden,
        "limit": args.limit,
    }

    try:
        fingerprint = build_fingerprint(judge, source_revision, text_revision, args.prompt_version)
        holder: dict[str, PanelRun] = {}

        def metadata(counts: dict[str, int], usage: ArbiterUsage) -> dict:
            return build_metadata(
                judge=judge,
                panel=panel,
                permutation=holder["run"].permutation,
                selection=selection,
                counts=counts,
                source_revision=source_revision,
                text_revision=text_revision,
                effort=args.effort,
                service_tier=args.service_tier,
                prompt_version=args.prompt_version,
                usage=usage,
            )

        panel_run = PanelRun.open(
            cache_path=cache_path,
            output_path=output_path,
            panel=panel,
            effort=args.effort,
            selected=selected,
            fingerprint=fingerprint,
            prompt_version=args.prompt_version,
            source={"scores": source_revision, "text": text_revision},
            save_results=lambda path, rows_, meta: save_results(path, rows_, meta),
            build_metadata=metadata,
            usage_provider=judge.provider,
            logger=logger,
            missing_text=len(missing_text),
            allow_shrink=args.allow_shrink,
            retry_failed=args.retry_failed,
            sdk_package=SDK_PACKAGES.get(judge.provider),
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
    estimate = estimate_cost(
        panel_run.remaining, permutation, judge, args.effort, rates, args.prompt_version
    )
    published_path = Path(data_dir) / ARBITER_V2_FILENAME

    if args.dry_run:
        logger.info(
            "Dry run (--frame %s): %d framed, %d selected, %d cached, %d would be evaluated",
            args.frame,
            len(framed),
            len(selected),
            len(panel_run.evaluations),
            len(panel_run.remaining),
        )
        # Both frames are priced whatever --frame says: choosing between them is
        # what the dry run is for. A --limit narrows the run, not this comparison.
        change = judge.next_rate_change(today, args.service_tier)
        for label, subset in (
            (f"(a) --frame {FRAME_RECUSED}", recused_only),
            (f"(b) --frame {FRAME_FULL}", rows),
        ):
            subset_text, _ = attach_full_text(subset, texts)
            subset_projected = [project_to_panel(row, panel) for row in subset_text]
            cached = panel_run.cached_ids(subset_projected)
            uncached = [a for a in subset_projected if str(a.get("o:id")) not in cached]
            report_estimate(
                label,
                estimate_cost(
                    uncached, permutation, judge, args.effort, rates, args.prompt_version
                ),
                judge,
                args.effort,
                rates,
            )
            if change:
                start, later = change
                later_estimate = estimate_cost(
                    uncached, permutation, judge, args.effort, later, args.prompt_version
                )
                logger.info(
                    "    from %s the same run is ~$%.2f ($%.2f/$%.2f per MTok)",
                    start.isoformat(),
                    later_estimate["usd"],
                    later.input,
                    later.output,
                )
        if args.limit is not None:
            report_estimate("This --limit selection", estimate, judge, args.effort, rates)
        logger.info(
            "Input estimated at %.2f chars/token (the published arbiter's French "
            "tokenizer: conservative); prices read %s from %s",
            ESTIMATE_CHARS_PER_TOKEN,
            PRICES_CHECKED.isoformat(),
            judge.pricing_source,
        )
        logger.info("Every registered judge, at its default effort and today's rates:")
        report_alternatives(rows, recused_only, texts, args.prompt_version)
        compare_with_published(records, panel_run.evaluations, judge, published_path, logger)
        logger.info("No API call was made and no file was written.")
        return 0

    def make_client():
        names = PROVIDER_ENV_NAMES[judge.provider]
        api_key = next((os.environ[name] for name in names if os.environ.get(name)), None)
        if not api_key:
            raise ArbiterRunError(f"No API key found! Set {' or '.join(names)}, or use --dry-run.")
        try:
            return CLIENT_FACTORIES[judge.provider](api_key)
        except RuntimeError as error:
            raise ArbiterRunError(str(error)) from error

    def make_row(article: dict, analysis: Any, key: str) -> dict:
        return {
            "article_id": analysis.article_id,
            "cache_fingerprint": key,
            "spread": article["spread"],
            "frame_spread": article["frame_spread"],
            "panel_valence_flip": article["panel_valence_flip"],
            "flip_dissenters": article["flip_dissenters"],
            "arbiter": asdict(analysis),
        }

    evaluate = EVALUATORS[judge.provider]
    try:
        code = panel_run.finish(
            prune_only=args.prune_cache_only,
            assume_yes=args.yes,
            model=judge.model,
            estimate=estimate,
            report_estimate=lambda: report_estimate(
                "This run", estimate, judge, args.effort, rates
            ),
            make_client=make_client,
            evaluate=lambda client, article: evaluate(
                client,
                article,
                permutation,
                judge=judge,
                effort=args.effort,
                service_tier=args.service_tier,
                rates=rates,
                usage=panel_run.usage,
                prompt_version=args.prompt_version,
            ),
            make_row=make_row,
            desc=judge.display_name,
            max_consecutive_errors=args.max_consecutive_errors,
        )
    except ArbiterRunError as error:
        logger.error("%s", error)
        return 2
    if not args.prune_cache_only:
        compare_with_published(records, panel_run.evaluations, judge, published_path, logger)
    return code


if __name__ == "__main__":
    # No fixed seed: the blind permutation must be genuinely random the first
    # time, and every later run reuses the one stored in the output file.
    random.seed()
    raise SystemExit(main())
