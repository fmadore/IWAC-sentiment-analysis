"""
Panel arbiter evaluation for the generation-2 models — Claude Opus 5 as judge.

The v1 arbiter judges one *pair* of models at a time. Generation 2 ships five
models that were run on the same corpus with the same prompt, so a pairwise
arbiter would ask ten overlapping questions about the same article and give ten
verdicts that cannot be combined. This script asks the question once: the
arbiter sees all five analyses at once, scores the article itself, and says
which of them (if any) it prefers per dimension.

What differs from `arbiter-evaluation.py`, and why:

* **Selection** is panel-wide rather than a pairwise gap: either the spread
  (max minus min across all five models, per dimension) or a polarity valence
  flip, the two rules the contract's `arbiter.eligibility` declares. `--limit N`
  keeps the N widest disagreements *on the selected dimensions*, tie-broken by
  article id so a capped run is reproducible.
* **Article text comes from the private mirror.** This fixes a real v1 flaw:
  the public projection masks `OCR` per row via `OCR_is_public`, so a large
  share of v1-arbitrated articles were judged on an empty string. Only verdicts
  and justifications are published — no OCR is ever serialised here.
* **Blind assignment is a permutation, not a coin flip.** One global random
  permutation maps the five model ids onto the labels A-E; it is persisted in
  the output metadata and reused by every incremental run, so cached and new
  rows always mean the same thing.
* **`--dry-run` prints the eligible/selected counts and a cost estimate and
  exits without making a single API call.** The paid run is deliberately gated.

**Which disagreements are worth paying for.** Measured on the current corpus of
12,349 articles with all five models: 11,402 rows are comparable (every model
gave a comparable polarity and centrality) and 947 are excluded. 251 of those
exclusions are Qwen's deliberate abstentions — its retired 153-article gap plus
the 51 articles no model annotates — and they can never be arbitrated, because
on those rows a five-way comparison does not exist.

Of the comparable rows the *spread* rule (any dimension >= 3) selects 2,102, and
1,762 of them (84%) are triggered by *subjectivity* alone — the panel's least
reliable dimension and the one where "who is right" is least well defined.
Centrality is the opposite problem: it is the panel's most reliable dimension
(63.7% exact five-way agreement against 33.0% for polarity), so arbitrating it
buys the least, and it is also where Mistral Small's documented outlier reading
weighs most. Selecting on polarity + centrality gave 340 articles of which 198
had a clear majority, half of them Mistral alone against four.

That leaves polarity, which is what the research question turns on. Here the
scale's arithmetic matters: a spread of 3 on the 1-5 polarity scale *implies*
one model is positive and another negative, so `--dimensions polarity` selects
exactly the 103 widest sign reversals — and structurally cannot reach the 198
articles where one model says `Positif` and another `Négatif`, a gap of only 2.
Hence the contract's second arbiter rule, `valenceFlip`, and `--rule valence`.

**Published run: `--rule valence`** — 301 articles, US$17.61 at effort medium
over 281 paid calls (recorded in the file's `metadata.usage`; the dry run had
estimated roughly US$29). Every one of them is a disagreement about the *sign*
of the coverage. Mind what the frame is, though: only 19% (56) are the strict
four-against-one exact-label split, against 49% in the old polarity+centrality
block, but Mistral Small is the sole model across the valence line in 189 of
the 301 (162 as the only negative reader), so the per-model verdict tallies
measure how often the panel's dissenter was upheld, not the models' general
quality. Cost figures are notes, not quotes: `--dry-run` measures the real
prompts and is the authoritative estimate.

`--rule`, `--dimensions` and `--threshold` can only ever tighten the contract's
arbiter frame, because `validate_arbiter_three_way` recomputes eligibility from
the contract with `is_arbiter_eligible` and requires the published ids to be a
subset of it.

Usage:
  python arbiter-evaluation-v2.py --dry-run                      # counts + cost, no spend
  python arbiter-evaluation-v2.py --rule valence --dry-run
  python arbiter-evaluation-v2.py --rule valence --yes                    # 301, the published run
  python arbiter-evaluation-v2.py --rule spread --dimensions polarity --yes   # ~103
  python arbiter-evaluation-v2.py --rule spread --dimensions polarity --threshold 4 --yes  # 18
  python arbiter-evaluation-v2.py --rule valence --limit 20 --yes         # pilot
  python arbiter-evaluation-v2.py --prune-cache-only             # reconcile, no spend

Requires ANTHROPIC_API_KEY for a paid run and HF_TOKEN for the private mirror.
Output: ma-visualisation-sentiments/static/data/iwac_arbiter_evaluations_v2.json
"""

import argparse
import json
import os
import random
from dataclasses import asdict, dataclass
from datetime import datetime
from functools import partial
from pathlib import Path
from typing import Any, Literal, get_args

from iwac_preprocess.arbiter_prompt import (
    ARBITER_MAX_INPUT_CHARS,
    BLIND_LABELS,
    SYSTEM_INSTRUCTION,
    create_arbiter_prompt,
)
from iwac_preprocess.arbiter_prompt import (
    display_order as display_order,
)
from iwac_preprocess.arbiter_selection import (
    apply_limit,
    attach_full_text,
    find_three_way_conflicts,
    resolve_threshold,
)
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from shared import (
    CONTRACT_V2,
    HF_FULL_REPO_ID,
    HF_REPO_ID,
    SentimentContract,
    get_logger,
    get_source_revision,
    get_webapp_data_dir,
    load_iwac_dataset,
    load_iwac_full_text,
    reconcile_cached_evaluations,
    safe_save_json,
    three_way_cache_fingerprint,
    validate_columns,
)
from tqdm import tqdm

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
SAVE_INTERVAL = 10  # write partial progress every N successful evaluations

# Published Claude Opus 5 rates, used only for the --dry-run estimate.
USD_PER_MTOK_INPUT = 5.0
USD_PER_MTOK_OUTPUT = 25.0
# Measured, not assumed: `count_tokens` on the real system instruction returns
# 1,463 tokens for 3,540 characters. French accented prose tokenizes far worse
# than the 3.2 this constant used to carry, which made every estimate here read
# about a third low on the input side. Re-measure with `client.messages.
# count_tokens` (free, no spend) if the prompt language ever changes.
ESTIMATE_CHARS_PER_TOKEN = 2.42

# The cached prefix is identical on every call and sits above Opus 5's 512-token
# minimum, so it is billed once at the write rate and at a tenth of the base rate
# thereafter. Cache reads are 0.1x, 5-minute writes 1.25x; back-to-back calls
# keep the entry warm — the 301-article run wrote the entry exactly once and
# read it 281 times over roughly two hours.
CACHE_WRITE_MULTIPLIER = 1.25
CACHE_READ_MULTIPLIER = 0.1
# Measured at 3,565 tokens/call over that run, against 1,463 for the system
# instruction alone. The difference is the structured-output schema: the API
# renders `output_format` ahead of `system`, and a breakpoint on the system block
# caches everything before it too. Deriving this from `len(SYSTEM_INSTRUCTION)`
# understated the cached prefix — and so the saving — by well over half.
CACHED_PREFIX_TOKENS = 3565

# `medium` is measured (453,184 output tokens over 281 calls, thinking included).
# The other rungs are still assumptions, and the medium measurement suggests they
# are high by a similar margin — treat them as upper bounds until measured.
ESTIMATE_OUTPUT_TOKENS = {"low": 1100, "medium": 1613, "high": 2400, "xhigh": 3500, "max": 4800}

# Dataset columns the selection pass depends on.
REQUIRED_BASE_COLUMNS = ["o:id", "title", "newspaper", "country", "pub_date"]

# The anonymised labels the five panel models are presented under. One label per
# contract model, in this order; `resolve_blind_permutation` refuses to run if
# the two lengths ever disagree.
PREFERENCE_VALUES = (*BLIND_LABELS, "multiple", "none")

# Which dimensions may *trigger* selection, and where each one's spread lives.
# All three dimensions by default, matching the contract rule the validator
# enforces.
SPREAD_KEYS = {
    "polarity": "polarity_spread",
    "subjectivity": "subjectivity_spread",
    "centrality": "centrality_spread",
}
DIMENSIONS = tuple(SPREAD_KEYS)

# Which of the contract's two arbiter rules a run selects on. `spread` is
# amplitude, narrowed further by --dimensions/--threshold; `valence` is the
# polarity sign disagreement, which no spread threshold can reach below 3;
# `spread-or-valence` is the union, and is the frame the validator enforces.
RULE_SPREAD = "spread"
RULE_VALENCE = "valence"
RULE_UNION = "spread-or-valence"
RULES = (RULE_SPREAD, RULE_VALENCE, RULE_UNION)
DEFAULT_RULE = RULE_UNION if CONTRACT.polarity_valence_bands else RULE_SPREAD

MODEL_IDS = list(CONTRACT.model_names)
# rank -> upstream ordinal label. v2 stores subjectivity as the shared 1-5 rank
# everywhere, but the arbiter is shown (and answers with) the label wording the
# analysed models themselves used.
SUBJECTIVITY_LABELS = {rank: label for label, rank in CONTRACT.subjectivity_label_scores.items()}


# ============================================================================
# Structured output schema
# ============================================================================


class DimensionVerdict(BaseModel):
    """Verdict fields shared by each independently constrained dimension."""

    model_config = ConfigDict(extra="forbid")

    justification: str = Field(description="Raisonnement pour ce score")
    preferred: Literal["a", "b", "c", "d", "e", "multiple", "none"] = Field(
        description="Quelle analyse est la plus juste: 'a', 'b', 'c', 'd', 'e', "
        "'multiple' (plusieurs sont équivalentes) ou 'none' (aucune)"
    )
    verdict_explanation: str = Field(description="Pourquoi cette analyse est préférée")


class PolarityVerdict(DimensionVerdict):
    arbiter_score: Literal[
        "Très positif", "Positif", "Neutre", "Négatif", "Très négatif", "Non applicable"
    ]


class SubjectivityVerdict(DimensionVerdict):
    arbiter_score: Literal[
        "Très objectif", "Plutôt objectif", "Mixte", "Plutôt subjectif", "Très subjectif"
    ]


class CentralityVerdict(DimensionVerdict):
    arbiter_score: Literal["Très central", "Central", "Secondaire", "Marginal", "Non abordé"]


class ArbiterResponseV2(BaseModel):
    """Complete structured response from the panel arbiter."""

    model_config = ConfigDict(extra="forbid")

    polarity: PolarityVerdict = Field(description="Évaluation de la polarité/sentiment")
    subjectivity: SubjectivityVerdict = Field(description="Évaluation de la subjectivité")
    centrality: CentralityVerdict = Field(
        description="Évaluation de la centralité de l'islam/des musulmans"
    )
    overall_winner: Literal["a", "b", "c", "d", "e", "multiple", "none"] = Field(
        description="Quelle analyse est globalement la meilleure"
    )
    overall_explanation: str = Field(description="Explication détaillée du verdict global")
    confidence_level: Literal["high", "medium", "low"] = Field(
        description="Niveau de confiance dans l'évaluation"
    )


def _assert_schema_matches_contract(contract: SentimentContract) -> None:
    """Fail at import if the response literals drift from the contract scales.

    Pydantic needs static literals, so the scales are spelled out twice. A
    silent divergence would let the arbiter return a score the dashboard cannot
    map, one paid article at a time.
    """
    expected = {
        "polarity": set(contract.polarity_scores),
        "centrality": set(contract.centrality_scores),
        "subjectivity": set(contract.subjectivity_label_scores),
    }
    declared = {
        "polarity": set(get_args(PolarityVerdict.model_fields["arbiter_score"].annotation)),
        "centrality": set(get_args(CentralityVerdict.model_fields["arbiter_score"].annotation)),
        "subjectivity": set(get_args(SubjectivityVerdict.model_fields["arbiter_score"].annotation)),
    }
    for dimension, values in expected.items():
        # Centrality's "Non applicable" is a v1 legacy key the arbiter is never
        # asked to produce; every other value must round-trip.
        if not declared[dimension] <= values:
            raise ValueError(
                f"Arbiter {dimension} literals are not a subset of the "
                f"{contract.analysis_version} contract scale: "
                f"{sorted(declared[dimension] - values)}"
            )


_assert_schema_matches_contract(CONTRACT)


# ============================================================================
# Serialized shapes (mirrored by the frontend types)
# ============================================================================


@dataclass
class UsageTotals:
    """What the run actually cost, accumulated across calls.

    Without this the dry-run estimate can never be checked against reality: the
    published verdicts show only the JSON the model returned, and thinking
    tokens — the larger half of the output at every effort level — leave no
    trace in the file. `cache_read_input_tokens` is also the only proof that the
    cached system prefix is being read rather than silently re-billed.
    """

    calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_creation_input_tokens: int = 0
    cache_read_input_tokens: int = 0

    def add(self, usage: Any) -> None:
        if usage is None:
            return
        self.calls += 1
        for field in (
            "input_tokens",
            "output_tokens",
            "cache_creation_input_tokens",
            "cache_read_input_tokens",
        ):
            setattr(self, field, getattr(self, field) + (getattr(usage, field, 0) or 0))

    def as_metadata(self) -> dict:
        """Serialisable totals, plus the per-call averages worth reading."""
        if not self.calls:
            return {}
        return {
            **asdict(self),
            "output_tokens_per_call": round(self.output_tokens / self.calls),
            "input_tokens_per_call": round(self.input_tokens / self.calls),
            "usd": round(
                (self.input_tokens + self.cache_creation_input_tokens * CACHE_WRITE_MULTIPLIER)
                / 1_000_000
                * USD_PER_MTOK_INPUT
                + self.cache_read_input_tokens
                / 1_000_000
                * USD_PER_MTOK_INPUT
                * CACHE_READ_MULTIPLIER
                + self.output_tokens / 1_000_000 * USD_PER_MTOK_OUTPUT,
                2,
            ),
        }


@dataclass
class ArbiterScoreV2:
    """The arbiter's own score for one dimension, plus its preference."""

    score: str
    justification: str
    preferred: str
    verdict_explanation: str


@dataclass
class ArbiterAnalysisV2:
    article_id: str
    polarity: ArbiterScoreV2
    subjectivity: ArbiterScoreV2
    centrality: ArbiterScoreV2
    overall_winner: str
    overall_explanation: str
    confidence_level: str
    timestamp: str
    # The label -> model mapping is stored once in metadata, not per article.


# ============================================================================
# Prompt
# ============================================================================

# ============================================================================
# Selection
# ============================================================================


def load_dataset_records(contract: SentimentContract = CONTRACT) -> list[dict]:
    """Load the public projection and validate the columns selection needs."""
    df = load_iwac_dataset(contract)
    validate_columns(df, REQUIRED_BASE_COLUMNS)
    logger.info("Loaded %d articles from %s", len(df), HF_REPO_ID)
    return df.to_dict("records")


# ============================================================================
# Blind permutation
# ============================================================================


def resolve_blind_permutation(
    metadata: dict | None, model_ids: list[str], rng: random.Random | None = None
) -> dict[str, str]:
    """Reuse the stored label -> model mapping, or draw a new one once.

    Re-rolling on an incremental run would silently change what "Analyse A"
    means between cached and new rows, which is the panel analogue of v1's
    `model_a_is_first` bug.
    """
    if len(model_ids) != len(BLIND_LABELS):
        raise ValueError(
            f"The blind permutation is a bijection: {len(BLIND_LABELS)} labels "
            f"({', '.join(label.upper() for label in BLIND_LABELS)}) for "
            f"{len(model_ids)} model(s) ({', '.join(model_ids)}). Growing or shrinking the "
            "panel means editing BLIND_LABELS here, the browser's ARBITER_BLIND_LABELS, "
            "and the prompt prose that enumerates the analyses."
        )

    stored = (metadata or {}).get("blind_permutation")
    if (
        isinstance(stored, dict)
        and set(stored) == set(BLIND_LABELS)
        and sorted(str(value) for value in stored.values()) == sorted(model_ids)
    ):
        return {label: str(stored[label]) for label in BLIND_LABELS}

    shuffled = list(model_ids)
    (rng or random).shuffle(shuffled)
    return dict(zip(BLIND_LABELS, shuffled, strict=True))


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


def convert_response(
    response: ArbiterResponseV2, article_id: str, contract: SentimentContract = CONTRACT
) -> ArbiterAnalysisV2:
    """Map the validated response onto the published shape.

    Subjectivity is stored as the shared 1-5 rank, like every other v2 file, so
    the browser's numeric code paths keep working; the label is recoverable from
    the contract.
    """
    return ArbiterAnalysisV2(
        article_id=article_id,
        polarity=ArbiterScoreV2(
            score=response.polarity.arbiter_score,
            justification=response.polarity.justification,
            preferred=response.polarity.preferred,
            verdict_explanation=response.polarity.verdict_explanation,
        ),
        subjectivity=ArbiterScoreV2(
            score=str(contract.subjectivity_label_scores[response.subjectivity.arbiter_score]),
            justification=response.subjectivity.justification,
            preferred=response.subjectivity.preferred,
            verdict_explanation=response.subjectivity.verdict_explanation,
        ),
        centrality=ArbiterScoreV2(
            score=response.centrality.arbiter_score,
            justification=response.centrality.justification,
            preferred=response.centrality.preferred,
            verdict_explanation=response.centrality.verdict_explanation,
        ),
        overall_winner=response.overall_winner,
        overall_explanation=response.overall_explanation,
        confidence_level=response.confidence_level,
        timestamp=datetime.now().isoformat(),
    )


def evaluate_with_arbiter(
    client: Any,
    article: dict,
    permutation: dict[str, str],
    *,
    effort: str = ARBITER_DEFAULT_EFFORT,
    contract: SentimentContract = CONTRACT,
    usage: UsageTotals | None = None,
) -> ArbiterAnalysisV2 | None:
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
        return None

    prompt = create_arbiter_prompt(article, permutation, contract)

    try:
        response = client.messages.parse(
            model=ARBITER_MODEL,
            max_tokens=ARBITER_MAX_OUTPUT_TOKENS,
            # Cached: the instruction is byte-identical on all 301 calls and is
            # comfortably above Opus 5's 512-token minimum, so it is written
            # once and read at a tenth of the price after that. The article and
            # the analyses differ every time and cannot be cached at all, which
            # is why this saves single-digit percent rather than the 90% the
            # headline number suggests.
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_INSTRUCTION,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": prompt}],
            output_format=ArbiterResponseV2,
            output_config={"effort": effort},
        )
    except ValidationError as error:
        logger.error("Invalid structured response for article %s: %s", article_id, error)
        return None
    except Exception as error:  # noqa: BLE001 - one bad article must not end the run
        logger.error("Arbiter call failed for article %s: %s", article_id, error)
        return None

    # Recorded before any early return: a refused or truncated call is billed
    # like any other, and an accounting that skipped those would understate the
    # run exactly where it went wrong.
    if usage is not None:
        usage.add(getattr(response, "usage", None))

    stop_reason = getattr(response, "stop_reason", None)
    if stop_reason == "refusal":
        category = getattr(getattr(response, "stop_details", None), "category", None)
        logger.warning("Arbiter declined article %s (category=%s)", article_id, category)
        return None
    if stop_reason == "max_tokens":
        logger.error(
            "Article %s hit max_tokens (%d); raise ARBITER_MAX_OUTPUT_TOKENS or lower --effort",
            article_id,
            ARBITER_MAX_OUTPUT_TOKENS,
        )
        return None

    parsed = getattr(response, "parsed_output", None)
    if parsed is None:
        logger.error("Empty structured response for article %s", article_id)
        return None

    return convert_response(parsed, article_id, contract)


# ============================================================================
# Cache and output
# ============================================================================


def load_cached_evaluations(path: str) -> tuple[list[dict], dict]:
    """Load the published file, which doubles as the incremental cache."""
    if not os.path.exists(path):
        return [], {}
    try:
        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)
        return list(payload.get("evaluations", [])), dict(payload.get("metadata", {}))
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as error:
        logger.warning("Failed to load existing data from %s: %s", path, error)
        return [], {}


def build_fingerprint(source_revision: str | None, text_revision: str | None):
    """Bind this run's model and both source revisions to the v2 hasher."""
    return partial(
        three_way_cache_fingerprint,
        arbiter_model=ARBITER_MODEL,
        source_revision=source_revision,
        text_revision=text_revision,
        max_input_chars=ARBITER_MAX_INPUT_CHARS,
        contract=CONTRACT,
    )


def build_metadata(
    *,
    permutation: dict[str, str],
    selection: dict[str, Any],
    counts: dict[str, int],
    source_revision: str | None,
    text_revision: str | None,
    effort: str,
    legacy_cache_adopted: int = 0,
    usage: UsageTotals | None = None,
) -> dict:
    """Assemble the self-documenting envelope the dashboard and validator read."""
    measured = usage.as_metadata() if usage else {}
    return {
        "generated": datetime.now().isoformat(),
        # Empty on a run that made no paid call, and cumulative only over the
        # calls of *this* run — a resumed run measures what it added, not the
        # whole file.
        "usage": measured,
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
        "prompt_version": CONTRACT.arbiter["promptVersion"],
        # Two repositories, two revisions: scores from the public projection,
        # article text from the private mirror.
        "source": {
            "scores": {"repository": HF_REPO_ID, "revision": source_revision},
            "text": {"repository": HF_FULL_REPO_ID, "revision": text_revision},
        },
        "legacy_cache_adopted": legacy_cache_adopted,
    }


def save_results(path: str, evaluations: list[dict], metadata: dict) -> None:
    safe_save_json({"metadata": metadata, "evaluations": evaluations}, path)


# ============================================================================
# Cost estimate
# ============================================================================


def estimate_cost(articles: list[dict], permutation: dict[str, str], effort: str) -> dict:
    """Estimate the spend of evaluating ``articles``, from real prompt sizes.

    The input side is measured (the prompts are assembled here); the output side
    is an assumption, printed alongside the number so nobody reads the total as
    a quote.
    """
    calls = len(articles)
    prompt_chars = sum(
        len(SYSTEM_INSTRUCTION) + len(create_arbiter_prompt(article, permutation))
        for article in articles
    )
    input_tokens = prompt_chars / ESTIMATE_CHARS_PER_TOKEN

    # Split the input in two, because the two halves are not billed alike: the
    # schema and the system instruction are cached, the article and the analyses
    # are fresh on every call. `prompt_chars` counts the system instruction but
    # not the schema, so the fresh half is derived by removing only what it
    # actually counted.
    system_tokens = len(SYSTEM_INSTRUCTION) / ESTIMATE_CHARS_PER_TOKEN
    fresh_tokens = input_tokens - calls * system_tokens
    cached_tokens = (
        CACHED_PREFIX_TOKENS * CACHE_WRITE_MULTIPLIER
        + max(calls - 1, 0) * CACHED_PREFIX_TOKENS * CACHE_READ_MULTIPLIER
        if calls
        else 0.0
    )
    billable_input = fresh_tokens + cached_tokens
    # What the same run would have cost with no breakpoint: every call paying
    # for the whole prefix at the base rate.
    uncached_input = fresh_tokens + calls * CACHED_PREFIX_TOKENS

    output_tokens = calls * ESTIMATE_OUTPUT_TOKENS.get(effort, 3000)
    return {
        "calls": calls,
        "input_tokens": round(uncached_input),
        "billable_input_tokens": round(billable_input),
        "cache_saving_usd": round(
            (uncached_input - billable_input) / 1_000_000 * USD_PER_MTOK_INPUT, 2
        ),
        "output_tokens": output_tokens,
        "assumed_output_tokens_per_call": ESTIMATE_OUTPUT_TOKENS.get(effort, 3000),
        "usd": round(
            billable_input / 1_000_000 * USD_PER_MTOK_INPUT
            + output_tokens / 1_000_000 * USD_PER_MTOK_OUTPUT,
            2,
        ),
    }


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


def confirm_api_calls(estimate: dict, effort: str, assume_yes: bool) -> bool:
    """Ask before spending. Returns False when declined or non-interactive."""
    if assume_yes:
        logger.info("--yes given: proceeding with %d API calls", estimate["calls"])
        return True

    report_estimate(estimate, effort)
    print(f"\nWARNING: this will make {estimate['calls']} paid API calls to {ARBITER_MODEL}")
    try:
        response = input("Do you want to proceed? (yes/no): ").strip().lower()
    except EOFError:
        logger.error("No input available (non-interactive run?). Use --yes to skip the prompt.")
        return False
    return response in ("yes", "y")


# ============================================================================
# Entry point
# ============================================================================


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="IWAC panel arbiter evaluation (generation 2)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python arbiter-evaluation-v2.py --dry-run
  python arbiter-evaluation-v2.py --rule valence --dry-run
  python arbiter-evaluation-v2.py --rule valence --yes                   # ~301, recommended
  python arbiter-evaluation-v2.py --rule valence --limit 20 --yes        # pilot
  python arbiter-evaluation-v2.py --rule spread --dimensions polarity --yes
  python arbiter-evaluation-v2.py --rule spread --dimensions polarity --threshold 4 --yes
  python arbiter-evaluation-v2.py --prune-cache-only
""",
    )
    parser.add_argument(
        "--limit",
        type=int,
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
        "positive polarity and another a negative one — the recommended run, ~301 articles — "
        "and ignores --dimensions/--threshold, which narrow the spread rule only.",
    )
    parser.add_argument(
        "--dimensions",
        nargs="+",
        choices=DIMENSIONS,
        default=list(DIMENSIONS),
        metavar="DIM",
        help="Which dimensions may trigger selection under the spread rule (default: all three). "
        "Subjectivity disagreement dominates the corpus, so narrowing to 'polarity' is the "
        "difference between ~2,100 articles and ~103.",
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
        "The primary cost lever.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print eligible/selected counts and a cost estimate, then exit without "
        "making any API call.",
    )
    parser.add_argument(
        "--prune-cache-only",
        action="store_true",
        help="Reconcile and republish the cache file without making paid API calls.",
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

    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        from dotenv import load_dotenv

        load_dotenv(env_path)
        logger.info("Loaded environment variables from %s", env_path)

    logger.info(
        "IWAC panel arbiter — %s (effort=%s), contract %s",
        ARBITER_MODEL,
        args.effort,
        CONTRACT.analysis_version,
    )

    try:
        records = load_dataset_records()
    except Exception as error:  # noqa: BLE001 - surfaced as an exit code
        logger.error("Failed to load dataset: %s", error)
        return 2

    try:
        threshold = resolve_threshold(args.threshold)
    except SystemExit as error:
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
        texts = load_iwac_full_text()
    except Exception as error:  # noqa: BLE001 - surfaced as an exit code
        logger.error("Failed to load article text from the private mirror: %s", error)
        return 2

    with_text, missing_text = attach_full_text(eligible, texts)
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

    source_revision = get_source_revision(HF_REPO_ID)
    text_revision = get_source_revision(HF_FULL_REPO_ID)
    output_path = os.path.join(get_webapp_data_dir(), OUTPUT_FILENAME)
    cached, cached_metadata = load_cached_evaluations(output_path)
    permutation = resolve_blind_permutation(cached_metadata, MODEL_IDS)
    logger.info(
        "Blind assignment: %s",
        ", ".join(f"{label.upper()}={permutation[label]}" for label in BLIND_LABELS),
    )

    reconciliation = reconcile_cached_evaluations(
        cached, selected, fingerprint=build_fingerprint(source_revision, text_revision)
    )
    evaluations = reconciliation.evaluations
    if cached:
        logger.info(
            "Reconciled cache: %d kept, %d stale/duplicate pruned, %d changed invalidated, "
            "%d legacy adopted",
            len(evaluations),
            reconciliation.pruned,
            reconciliation.invalidated,
            reconciliation.adopted_legacy,
        )

    remaining = [
        article
        for article in selected
        if str(article.get("o:id")) not in reconciliation.evaluated_ids
    ]
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
    # Threaded through `publish`, so a partial save carries the spend so far.
    usage = UsageTotals()
    counts = {
        "total": len(selected),
        "successful": len(evaluations),
        "failed": 0,
        "refused": 0,
        "missing_text": len(missing_text),
    }

    def publish(extra_counts: dict | None = None) -> None:
        save_results(
            output_path,
            evaluations,
            build_metadata(
                permutation=permutation,
                selection=selection,
                counts={**counts, **(extra_counts or {}), "successful": len(evaluations)},
                source_revision=source_revision,
                text_revision=text_revision,
                effort=args.effort,
                legacy_cache_adopted=reconciliation.adopted_legacy,
                usage=usage,
            ),
        )

    estimate = estimate_cost(remaining, permutation, args.effort)

    if args.dry_run:
        logger.info(
            "Dry run: %d eligible, %d selected, %d cached, %d would be evaluated",
            len(eligible),
            len(selected),
            len(reconciliation.evaluated_ids),
            len(remaining),
        )
        report_estimate(estimate, args.effort)
        logger.info("No API call was made and no file was written.")
        return 0

    if not remaining:
        publish()
        logger.info(
            "All %d selected articles are already evaluated; republished the cache file",
            len(selected),
        )
        return 0

    if args.prune_cache_only:
        publish()
        logger.info("Prune-only mode left %d articles pending evaluation", len(remaining))
        return 0

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("No API key found! Set ANTHROPIC_API_KEY, or use --dry-run.")
        return 2
    try:
        client = create_anthropic_client(api_key)
    except RuntimeError as error:
        logger.error("%s", error)
        return 2

    if not confirm_api_calls(estimate, args.effort, args.yes):
        logger.info("Aborted.")
        return 0

    fingerprint = build_fingerprint(source_revision, text_revision)
    successful = failed = 0

    for article in tqdm(remaining, desc="Panel arbiter"):
        result = evaluate_with_arbiter(
            client, article, permutation, effort=args.effort, usage=usage
        )
        if result is None:
            failed += 1
            continue

        evaluations.append(
            {
                "article_id": result.article_id,
                "cache_fingerprint": fingerprint(article),
                "spread": article["spread"],
                "arbiter": asdict(result),
            }
        )
        successful += 1
        if successful % SAVE_INTERVAL == 0:
            publish({"failed": failed})
            logger.info("Saved %d evaluations", len(evaluations))

    publish({"failed": failed})
    logger.info(
        "Complete: %d newly evaluated, %d from cache, %d failed",
        successful,
        len(reconciliation.evaluated_ids),
        failed,
    )
    return 0


if __name__ == "__main__":
    # No fixed seed: the blind permutation must be genuinely random the first
    # time, and every later run reuses the one stored in the output file.
    random.seed()
    raise SystemExit(main())
