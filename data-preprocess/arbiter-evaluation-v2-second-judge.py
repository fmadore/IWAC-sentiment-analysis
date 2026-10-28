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
  per-article `display_order` (`iwac_preprocess.arbiter_prompt`);
* the response schema and the published verdict shape
  (`iwac_preprocess.arbiter_schema`);
* the input fingerprint, durable cache, run lock and checkpoint-before-publish
  lifecycle (`arbiter_cache`, `arbiter_lifecycle`), each under this judge's
  own names.

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
  (`iwac_preprocess.judge_comparison`). Without the replication the 45 verdicts
  come from a judge nobody has calibrated against the published one.
* **Provider.** Gemini 4 Argon runs through Google's Interactions API with
  structured output and `store=False`: the article text comes from the private
  mirror and must not be retained server-side. Other registered judges (GPT-6
  Astra, GPT-6.1 Sol) are priced by `--dry-run` but have no paid-call adapter
  yet, and a paid run for them is refused before anything is loaded.
* **Prices change.** Gemini 4 Argon's introductory rates double on
  1 December 2026; `--dry-run` prints the rate in force and the next change.

`--dry-run` makes no API call and writes nothing. It reports the frame, the
flips that exist only because of the published arbiter's recused member, the
rows this judge cannot see a flip on, and a cost estimate for both frames.

Usage:
  python arbiter-evaluation-v2-second-judge.py --dry-run
  python arbiter-evaluation-v2-second-judge.py --judge gpt-6.1-sol --dry-run
  python arbiter-evaluation-v2-second-judge.py --frame full --limit 20 --yes     # pilot
  python arbiter-evaluation-v2-second-judge.py --frame full --yes                # 346
  python arbiter-evaluation-v2-second-judge.py --frame recused --yes             # 45
  python arbiter-evaluation-v2-second-judge.py --prune-cache-only

Requires GOOGLE_API_KEY (or GEMINI_API_KEY) for a paid run and HF_TOKEN for the
private mirror.
Output: ma-visualisation-sentiments/static/data/iwac_arbiter_evaluations_v2_<judge>.json
"""

import argparse
import json
import os
import random
from dataclasses import asdict, dataclass
from datetime import date, datetime
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
    JudgeSpec,
    JudgeUsage,
    Rates,
    estimate_judge_cost,
)
from iwac_preprocess.arbiter_lifecycle import (
    CACHE_FILENAME,
    CacheUnreadableError,
    PanelCache,
    resolve_blind_permutation,
)
from iwac_preprocess.arbiter_prompt import (
    ARBITER_MAX_INPUT_CHARS,
    BLIND_LABELS,
    SYSTEM_INSTRUCTION,
    create_arbiter_prompt,
)
from iwac_preprocess.arbiter_schema import (
    ArbiterAnalysisV2,
    ArbiterResponseV2,
    convert_response,
    inline_json_schema,
)
from iwac_preprocess.arbiter_selection import (
    FLIP_NEGATIVE,
    FLIP_POSITIVE,
    RULE_VALENCE,
    apply_limit,
    attach_full_text,
    find_three_way_conflicts,
    flip_dissenters,
    project_to_panel,
)
from iwac_preprocess.judge_comparison import (
    judge_agreement,
    own_developer_affinity,
    polarity_verdicts,
)
from iwac_preprocess.publication import publication_lock, publish_json_files
from pydantic import ValidationError
from shared import (
    CONTRACT_V2,
    HF_FULL_REPO_ID,
    HF_REPO_ID,
    SentimentContract,
    build_model_sentiment,
    get_base_article_ids,
    get_logger,
    get_source_revision,
    get_staging_dir,
    get_webapp_data_dir,
    has_polarity_valence_flip,
    load_iwac_dataset,
    load_iwac_full_text,
    restrict_to_base_articles,
    three_way_cache_fingerprint,
    validate_columns,
)
from tqdm import tqdm
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
SAVE_INTERVAL = 10

# Flattened once: the Interactions API takes a JSON Schema, not a class.
RESPONSE_SCHEMA = inline_json_schema(ArbiterResponseV2)
# Repeated on every call and billed as input: the instruction and the schema.
PREFIX_CHARS = len(SYSTEM_INSTRUCTION) + len(json.dumps(RESPONSE_SCHEMA, ensure_ascii=False))

REQUIRED_BASE_COLUMNS = ["o:id", "title", "newspaper", "country", "pub_date"]


def output_filename(judge: JudgeSpec) -> str:
    return OUTPUT_TEMPLATE.format(judge=judge.id)


def judge_panel(judge: JudgeSpec, contract: SentimentContract = CONTRACT) -> list[str]:
    """The models ``judge`` reads: the generation minus its own developer's members."""
    panel = contract.panel_for(judge.developer)
    if len(panel) != len(BLIND_LABELS):
        # The prompt says "cinq analyses" and the schema accepts a-e: a judge
        # whose developer has no member (or two) needs a prompt version, not a
        # silently mislabelled run.
        raise ValueError(
            f"{judge.display_name} would read {len(panel)} models, but the prompt and the "
            f"schema present exactly {len(BLIND_LABELS)}"
        )
    return panel


# ============================================================================
# Selection
# ============================================================================


def load_dataset_records(contract: SentimentContract = CONTRACT) -> list[dict]:
    """Load the public projection, scoped to the published article base.

    The live corpus has grown past the panel run (articles only Haiku rated);
    they cannot flip today, because the rest of the panel has no rating there,
    but the validator recomputes the frame over the published base, so the
    selection is held to the same base rather than relying on that.
    """
    df = load_iwac_dataset(contract)
    validate_columns(df, REQUIRED_BASE_COLUMNS)
    logger.info("Loaded %d articles from %s", len(df), HF_REPO_ID)
    return restrict_to_base_articles(df.to_dict("records"), get_base_article_ids(), logger)


@dataclass(frozen=True)
class FrameSummary:
    """What the dry run reports about the frame before any money is spent."""

    frame: int
    in_published_frame: int
    recused_only: int
    recused_only_sole_negative: int
    recused_only_sole_positive: int


def flips_over(row: dict, model_ids: list[str], contract: SentimentContract = CONTRACT) -> bool:
    """Whether ``model_ids`` alone, out of a frame row's analyses, show a valence flip."""
    return has_polarity_valence_flip(
        [row["analyses"][model_id] for model_id in model_ids], contract
    )


def classify_frame(
    rows: list[dict], contract: SentimentContract = CONTRACT
) -> tuple[list[dict], list[dict], FrameSummary]:
    """Mark each frame row with its flip's sole dissenters; split off the recused-only rows.

    A row is *recused-only* when it flips over the whole generation but not over
    the published arbiter's panel: the flip exists only because of a model that
    arbiter recused (for the Opus run, Haiku alone on its side of the line).
    Those are the flips the published run structurally could not reach. The
    sole-negative/positive split says which side the recused model was on.
    """
    published_recused = set(contract.arbiter_recused_ids)
    published_panel = list(contract.arbiter_model_ids)
    marked: list[dict] = []
    recused_only: list[dict] = []
    sole_negative = sole_positive = 0
    for row in rows:
        row = {**row, "flip_dissenters": flip_dissenters(row["analyses"], contract)}
        marked.append(row)
        if flips_over(row, published_panel, contract):
            continue
        recused_only.append(row)
        sides = {row["flip_dissenters"].get(model_id) for model_id in published_recused}
        sole_negative += FLIP_NEGATIVE in sides
        sole_positive += FLIP_POSITIVE in sides
    return (
        marked,
        recused_only,
        FrameSummary(
            frame=len(marked),
            in_published_frame=len(marked) - len(recused_only),
            recused_only=len(recused_only),
            recused_only_sole_negative=sole_negative,
            recused_only_sole_positive=sole_positive,
        ),
    )


# ============================================================================
# Paid evaluation
# ============================================================================

OUTCOME_OK = "ok"
OUTCOME_REFUSED = "refused"
OUTCOME_TRUNCATED = "truncated"
OUTCOME_INVALID = "invalid"
OUTCOME_ERROR = "error"
OUTCOME_NO_TEXT = "no_text"

# Interaction states that mean the budget ran out before the answer did.
TRUNCATED_STATUSES = frozenset({"incomplete", "budget_exceeded"})


@dataclass(frozen=True)
class EvaluationResult:
    """One article's verdict, or the reason there is none."""

    outcome: str
    analysis: ArbiterAnalysisV2 | None = None


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
    usage: JudgeUsage | None = None,
    contract: SentimentContract = CONTRACT,
) -> EvaluationResult:
    """Send one article to a Gemini judge and return its structured verdict.

    No temperature and no top_p: Gemini 4 Argon ignores sampling parameters.
    Depth is `thinking_level`, which is also the cost lever. `store=False`
    keeps the private mirror's text out of the provider's interaction history.

    Nothing here retries. A schema violation or a truncated answer is a
    deterministic outcome of this input; transport failures are retried by the
    SDK before they reach this function.
    """
    article_id = str(article.get("o:id"))
    if not article.get("OCR"):
        logger.warning("No text available for article %s", article_id)
        return EvaluationResult(OUTCOME_NO_TEXT)

    prompt = create_arbiter_prompt(article, permutation, contract)
    try:
        interaction = client.interactions.create(
            model=judge.model,
            system_instruction=SYSTEM_INSTRUCTION,
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
    return EvaluationResult(OUTCOME_OK, convert_response(parsed, article_id, contract))


# One adapter per provider in PAID_PROVIDERS. Adding a provider means adding an
# entry here and its SDK to requirements.txt (and both locks).
EVALUATORS = {PROVIDER_GOOGLE: evaluate_with_gemini}
CLIENT_FACTORIES = {PROVIDER_GOOGLE: create_genai_client}
# The environment variables each provider's client reads, in order. Only
# these names are ever logged; the name avoids "key" so CodeQL's
# sensitive-data heuristic does not mistake them for the secret itself.
PROVIDER_ENV_NAMES = {PROVIDER_GOOGLE: ("GOOGLE_API_KEY", "GEMINI_API_KEY")}


# ============================================================================
# Cache, output and comparison
# ============================================================================


def build_fingerprint(judge: JudgeSpec, source_revision: str | None, text_revision: str | None):
    """The published run's hasher, bound to this judge's model id.

    Same function, same key set: the judge's model and panel are inside the
    digest, so no fingerprint can collide with a published Opus 5 one.
    """
    return partial(
        three_way_cache_fingerprint,
        arbiter_model=judge.model,
        source_revision=source_revision,
        text_revision=text_revision,
        max_input_chars=ARBITER_MAX_INPUT_CHARS,
        contract=CONTRACT,
    )


def build_metadata(
    *,
    judge: JudgeSpec,
    panel: list[str],
    permutation: dict[str, str],
    selection: dict[str, Any],
    counts: dict[str, int],
    source_revision: str | None,
    text_revision: str | None,
    effort: str,
    service_tier: str,
    usage: JudgeUsage | None = None,
) -> dict:
    """The self-documenting envelope `validate_second_judge_envelope` checks."""
    return {
        "generated": datetime.now().isoformat(),
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
        "prompt_version": CONTRACT.arbiter["promptVersion"],
        "source": {
            "scores": {"repository": HF_REPO_ID, "revision": source_revision},
            "text": {"repository": HF_FULL_REPO_ID, "revision": text_revision},
        },
        "legacy_cache_adopted": 0,
    }


def save_results(path: str, evaluations: list[dict], metadata: dict) -> None:
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


def model_polarities(records: list[dict], article_ids: set[str]) -> dict[str, dict[str, Any]]:
    """Every generation model's polarity on ``article_ids``, recused or not."""
    ratings: dict[str, dict[str, Any]] = {model_id: {} for model_id in FRAME_MODEL_IDS}
    for item in records:
        article_id = str(item.get("o:id"))
        if article_id not in article_ids:
            continue
        for model_id in FRAME_MODEL_IDS:
            ratings[model_id][article_id] = build_model_sentiment(item, model_id, CONTRACT).get(
                "polarite"
            )
    return ratings


def compare_with_published(
    records: list[dict], evaluations: list[dict], judge: JudgeSpec, data_dir: str
) -> dict | None:
    """Judge agreement and own-developer affinity against the published arbiter.

    Logged, not published: the figures are only as good as the overlap, and the
    affinity estimate carries the exposure confound its module explains.
    """
    published_path = Path(data_dir) / ARBITER_V2_FILENAME
    if not evaluations or not published_path.exists():
        return None
    published = json.loads(published_path.read_text(encoding="utf-8"))
    first = polarity_verdicts(published.get("evaluations", []))
    second = polarity_verdicts(evaluations)
    shared = set(first) & set(second)
    if not shared:
        logger.info("No article is judged by both arbiters yet; nothing to compare")
        return None
    agreement = judge_agreement(first, second, CONTRACT)
    published_name = CONTRACT.arbiter["arbiterModel"]
    affinity = own_developer_affinity(
        {
            published_name: (CONTRACT.arbiter_developer, first),
            judge.model: (judge.developer, second),
        },
        model_polarities(records, shared),
        CONTRACT,
    )
    logger.info(
        "Judge agreement on %d shared articles: exact %d (%.1f%%); of %d comparable, "
        "within one step %d, same sign %d",
        agreement["articles"],
        agreement["exact"],
        100 * (agreement["exact_rate"] or 0),
        agreement["comparable"],
        agreement["within_one"],
        agreement["same_sign"],
    )
    for name, entry in affinity["affinity"].items():
        did = entry["difference_in_differences"]
        logger.info(
            "  %s own-developer affinity (%s vs controls %s): %s",
            name,
            ", ".join(entry["own_models"]) or "none",
            ", ".join(affinity["controls"]),
            "n/a" if did is None else f"{did:+.3f}",
        )
    logger.info(
        "  Conservative by construction: each judge never read its own developer's "
        "model, while the other judge did."
    )
    return {"agreement": agreement, "affinity": affinity}


# ============================================================================
# Cost estimate
# ============================================================================


def estimate_cost(
    articles: list[dict],
    permutation: dict[str, str],
    judge: JudgeSpec,
    effort: str,
    rates: Rates,
) -> dict:
    """Estimate evaluating ``articles`` with ``judge``, from the real prompts."""
    return estimate_judge_cost(
        [len(create_arbiter_prompt(article, permutation)) for article in articles],
        prefix_chars=PREFIX_CHARS,
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


def report_alternatives(rows: list[dict], recused_only: list[dict], texts: dict[str, str]) -> None:
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
            costs.append(estimate_cost(projected, permutation, judge, judge.default_effort, rates))
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


def confirm_api_calls(estimate: dict, judge: JudgeSpec, assume_yes: bool) -> bool:
    """Ask before spending. Returns False when declined or non-interactive."""
    if assume_yes:
        logger.info("--yes given: proceeding with %d API calls", estimate["calls"])
        return True
    print(f"\nWARNING: this will make {estimate['calls']} paid API calls to {judge.model}")
    try:
        response = input("Do you want to proceed? (yes/no): ").strip().lower()
    except EOFError:
        logger.error("No input available (non-interactive run?). Use --yes to skip the prompt.")
        return False
    return response in ("yes", "y")


# ============================================================================
# Entry point
# ============================================================================


def positive_limit(value: str) -> int:
    try:
        limit = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("--limit must be a positive integer") from error
    if limit <= 0:
        raise argparse.ArgumentTypeError("--limit must be a positive integer")
    return limit


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
  python arbiter-evaluation-v2-second-judge.py --prune-cache-only
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
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report the frame and a cost estimate for both frames, then exit without any API "
        "call or file write.",
    )
    parser.add_argument(
        "--prune-cache-only",
        action="store_true",
        help="Republish the selected cached evaluations without paid calls.",
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Skip the interactive confirmation prompt (for non-interactive runs).",
    )
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
    try:
        with publication_lock(Path(get_staging_dir()) / STAGING_TEMPLATE.format(judge=judge.id)):
            return run(args, judge)
    except BlockingIOError as error:
        logger.error("Another %s run holds the cache lock: %s", judge.display_name, error)
        return 2


def run(args: argparse.Namespace, judge: JudgeSpec) -> int:
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        from dotenv import load_dotenv

        load_dotenv(env_path)
        logger.info("Loaded environment variables from %s", env_path)

    try:
        panel = judge_panel(judge)
    except ValueError as error:
        logger.error("%s", error)
        return 2
    recused = CONTRACT.recused_for(judge.developer)
    today = date.today()
    rates = judge.rates_on(today, args.service_tier)
    logger.info(
        "IWAC second panel arbiter — %s (%s, effort=%s, tier=%s); recuses %s; reads %s",
        judge.display_name,
        judge.model,
        args.effort,
        args.service_tier,
        ", ".join(recused),
        ", ".join(panel),
    )

    try:
        records = load_dataset_records()
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
        texts = load_iwac_full_text()
    except Exception as error:  # noqa: BLE001 - surfaced as an exit code
        logger.error("Failed to load article text from the private mirror: %s", error)
        return 2

    framed = recused_only if args.frame == FRAME_RECUSED else rows
    with_text, missing_text = attach_full_text(framed, texts)
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

    source_revision = get_source_revision(HF_REPO_ID)
    text_revision = get_source_revision(HF_FULL_REPO_ID)
    data_dir = get_webapp_data_dir()
    output_path = os.path.join(data_dir, output_filename(judge))
    staging = Path(get_staging_dir()) / STAGING_TEMPLATE.format(judge=judge.id)
    try:
        cache = PanelCache.load(staging / CACHE_FILENAME, Path(output_path), panel, args.effort)
        permutation = resolve_blind_permutation(
            cache.metadata, panel, populated=bool(cache.evaluations)
        )
    except CacheUnreadableError as error:
        logger.error("%s", error)
        return 2
    logger.info(
        "Blind assignment: %s",
        ", ".join(f"{label.upper()}={permutation[label]}" for label in BLIND_LABELS),
    )

    fingerprint = build_fingerprint(judge, source_revision, text_revision)
    reconciliation = cache.select(selected, fingerprint)
    evaluations = reconciliation.evaluations
    if cache.evaluations:
        logger.info(
            "Cache: %d evaluations match this selection; %d retained in durable history",
            len(evaluations),
            len(cache.evaluations),
        )
    remaining = [
        article
        for article in selected
        if str(article.get("o:id")) not in reconciliation.evaluated_ids
    ]
    estimate = estimate_cost(remaining, permutation, judge, args.effort, rates)

    if args.dry_run:
        logger.info(
            "Dry run (--frame %s): %d framed, %d selected, %d cached, %d would be evaluated",
            args.frame,
            len(framed),
            len(selected),
            len(reconciliation.evaluated_ids),
            len(remaining),
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
            cached = cache.select(subset_projected, fingerprint).evaluated_ids
            uncached = [a for a in subset_projected if str(a.get("o:id")) not in cached]
            report_estimate(
                label,
                estimate_cost(uncached, permutation, judge, args.effort, rates),
                judge,
                args.effort,
                rates,
            )
            if change:
                start, later = change
                later_estimate = estimate_cost(uncached, permutation, judge, args.effort, later)
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
        report_alternatives(rows, recused_only, texts)
        compare_with_published(records, evaluations, judge, data_dir)
        logger.info("No API call was made and no file was written.")
        return 0

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
    usage = JudgeUsage.from_metadata(cache.metadata.get("usage"))
    counts = {
        "total": len(selected),
        "successful": len(evaluations),
        "failed": 0,
        "refused": 0,
        "missing_text": len(missing_text),
    }

    def publish(extra_counts: dict | None = None) -> None:
        metadata = build_metadata(
            judge=judge,
            panel=panel,
            permutation=permutation,
            selection=selection,
            counts={**counts, **(extra_counts or {}), "successful": len(evaluations)},
            source_revision=source_revision,
            text_revision=text_revision,
            effort=args.effort,
            service_tier=args.service_tier,
            usage=usage,
        )
        cache.checkpoint(evaluations, metadata)
        save_results(output_path, evaluations, metadata)

    if not remaining:
        publish()
        logger.info("All %d selected articles are already evaluated; republished", len(selected))
        compare_with_published(records, evaluations, judge, data_dir)
        return 0

    if args.prune_cache_only:
        publish()
        logger.info("Prune-only mode left %d articles pending evaluation", len(remaining))
        return 0

    api_key = next(
        (os.environ[name] for name in PROVIDER_ENV_NAMES[judge.provider] if os.environ.get(name)),
        None,
    )
    if not api_key:
        logger.error(
            "No API key found! Set %s, or use --dry-run.",
            " or ".join(PROVIDER_ENV_NAMES[judge.provider]),
        )
        return 2
    try:
        client = CLIENT_FACTORIES[judge.provider](api_key)
    except RuntimeError as error:
        logger.error("%s", error)
        return 2

    report_estimate("This run", estimate, judge, args.effort, rates)
    if not confirm_api_calls(estimate, judge, args.yes):
        logger.info("Aborted.")
        return 0

    evaluate = EVALUATORS[judge.provider]
    successful = failed = refused = 0

    def run_counts() -> dict[str, int]:
        return {"failed": failed, "refused": refused}

    try:
        for article in tqdm(remaining, desc=judge.display_name):
            result = evaluate(
                client,
                article,
                permutation,
                judge=judge,
                effort=args.effort,
                service_tier=args.service_tier,
                rates=rates,
                usage=usage,
            )
            if result.analysis is None:
                if result.outcome == OUTCOME_REFUSED:
                    refused += 1
                else:
                    failed += 1
                continue
            evaluations.append(
                {
                    "article_id": result.analysis.article_id,
                    "cache_fingerprint": fingerprint(article),
                    "spread": article["spread"],
                    "frame_spread": article["frame_spread"],
                    "panel_valence_flip": article["panel_valence_flip"],
                    "flip_dissenters": article["flip_dissenters"],
                    "arbiter": asdict(result.analysis),
                }
            )
            successful += 1
            if successful % SAVE_INTERVAL == 0:
                publish(run_counts())
                logger.info("Saved %d evaluations", len(evaluations))
    finally:
        # Also on Ctrl-C or a crash: every verdict already paid for is saved.
        publish(run_counts())

    logger.info(
        "Complete: %d newly evaluated, %d from cache, %d failed, %d refused; spent ~$%.2f in all",
        successful,
        len(reconciliation.evaluated_ids),
        failed,
        refused,
        usage.as_metadata().get("usd", 0.0),
    )
    compare_with_published(records, evaluations, judge, data_dir)
    return 0


if __name__ == "__main__":
    # No fixed seed: the blind permutation must be genuinely random the first
    # time, and every later run reuses the one stored in the output file.
    random.seed()
    raise SystemExit(main())
