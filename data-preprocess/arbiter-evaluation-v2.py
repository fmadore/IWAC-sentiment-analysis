"""
Three-way arbiter evaluation for the generation-2 panel — Claude Opus 5 as judge.

The v1 arbiter judges one *pair* of models at a time. Generation 2 ships three
models that were run on the same corpus with the same prompt, so a pairwise
arbiter would ask three overlapping questions about the same article and give
three verdicts that cannot be combined. This script asks the question once:
the arbiter sees all three analyses at once, scores the article itself, and says
which of them (if any) it prefers per dimension.

What differs from `arbiter-evaluation.py`, and why:

* **Selection** is the three-way spread (max minus min across the three models,
  per dimension) rather than a pairwise gap. `--limit N` keeps the N widest
  disagreements, tie-broken by article id so a capped run is reproducible.
* **Article text comes from the private mirror.** This fixes a real v1 flaw:
  the public projection masks `OCR` per row via `OCR_is_public`, so a large
  share of v1-arbitrated articles were judged on an empty string. Only verdicts
  and justifications are published — no OCR is ever serialised here.
* **Blind assignment is a permutation, not a coin flip.** One global random
  permutation maps the three model ids onto the labels A/B/C; it is persisted in
  the output metadata and reused by every incremental run, so cached and new
  rows always mean the same thing.
* **`--dry-run` prints the eligible/selected counts and a cost estimate and
  exits without making a single API call.** The paid run is deliberately gated.

Usage:
  python arbiter-evaluation-v2.py --dry-run            # counts + cost, no spend
  python arbiter-evaluation-v2.py --limit 200 --dry-run
  python arbiter-evaluation-v2.py --limit 200 --yes    # the paid run
  python arbiter-evaluation-v2.py --prune-cache-only   # reconcile, no spend

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

from pydantic import BaseModel, ConfigDict, Field, ValidationError
from shared import (
    CONTRACT_V2,
    HF_FULL_REPO_ID,
    HF_REPO_ID,
    SentimentContract,
    build_model_sentiment,
    calculate_three_way_spread,
    get_logger,
    get_source_revision,
    get_webapp_data_dir,
    load_iwac_dataset,
    load_iwac_full_text,
    reconcile_cached_evaluations,
    safe_save_json,
    safe_str,
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
ARBITER_MAX_INPUT_CHARS = 15000  # article text is truncated to this length
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
# French prose tokenizes at roughly this rate; the estimate says so out loud
# rather than pretending to be a measurement.
ESTIMATE_CHARS_PER_TOKEN = 3.2
ESTIMATE_OUTPUT_TOKENS = {"low": 1800, "medium": 3000, "high": 4500, "xhigh": 6500, "max": 9000}

# Dataset columns the selection pass depends on.
REQUIRED_BASE_COLUMNS = ["o:id", "title", "newspaper", "country", "pub_date"]

# The anonymised labels the three models are presented under.
BLIND_LABELS = ("a", "b", "c")
PREFERENCE_VALUES = (*BLIND_LABELS, "multiple", "none")

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
    preferred: Literal["a", "b", "c", "multiple", "none"] = Field(
        description="Quelle analyse est la plus juste: 'a', 'b', 'c', 'multiple' "
        "(plusieurs sont équivalentes) ou 'none' (aucune)"
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
    """Complete structured response from the three-way arbiter."""

    model_config = ConfigDict(extra="forbid")

    polarity: PolarityVerdict = Field(description="Évaluation de la polarité/sentiment")
    subjectivity: SubjectivityVerdict = Field(description="Évaluation de la subjectivité")
    centrality: CentralityVerdict = Field(
        description="Évaluation de la centralité de l'islam/des musulmans"
    )
    overall_winner: Literal["a", "b", "c", "multiple", "none"] = Field(
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
        "subjectivity": set(
            get_args(SubjectivityVerdict.model_fields["arbiter_score"].annotation)
        ),
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

SYSTEM_INSTRUCTION = """Vous êtes un arbitre expert évaluant l'analyse de sentiment d'articles de presse sur l'islam et les musulmans en Afrique de l'Ouest francophone.

Votre rôle est de :
1. Analyser l'article de manière indépendante et fournir votre propre évaluation
2. Comparer les analyses de trois modèles d'IA (Analyse A, Analyse B et Analyse C)
3. Déterminer laquelle est la plus précise, ou si plusieurs se valent, ou si aucune n'est juste
4. Fournir des justifications claires et bien argumentées pour vos décisions

## Référence des échelles d'évaluation :

### Polarité (Sentiment envers l'islam/les musulmans) :
- **Très positif** : Portrait extrêmement favorable, enthousiaste, élogieux
- **Positif** : Portrait favorable, optimiste
- **Neutre** : Pas de sentiment clair ou équilibre entre positif/négatif ; ton factuel
- **Négatif** : Portrait défavorable, critique, pessimiste
- **Très négatif** : Portrait extrêmement défavorable, alarmiste, très critique
- **Non applicable** : L'article ne traite pas de l'islam ou des musulmans

### Subjectivité :
- **Très objectif** : Rapporte des faits vérifiables sans opinions personnelles, purement informatif
- **Plutôt objectif** : Principalement factuel, peut contenir de subtiles traces d'opinions
- **Mixte** : Mélange équilibré de faits et d'opinions, ou présente plusieurs points de vue
- **Plutôt subjectif** : Exprime clairement des opinions et des jugements
- **Très subjectif** : Fortement biaisé, opinions intenses avec peu de présentation factuelle

### Centralité :
- **Très central** : L'islam/les musulmans sont le sujet principal de l'article
- **Central** : Thème important mais partagé avec d'autres sujets
- **Secondaire** : Mentionné significativement mais de façon secondaire
- **Marginal** : Mentionné brièvement ou anecdotiquement
- **Non abordé** : Aucune mention de l'islam ou des musulmans

## Règles de démarcation :
- « Non applicable » et « Non abordé » signifient que la tâche ne s'applique pas à l'article, et non qu'elle s'y applique faiblement. N'utilisez ces valeurs que si l'islam et les musulmans sont réellement absents du texte.
- Une simple mention nominative (un nom propre, une date du calendrier islamique) relève de « Marginal », pas de « Secondaire ».
- La subjectivité mesure le ton de l'article envers l'islam et les musulmans, pas la subjectivité générale de la prose.
- La polarité porte sur la représentation de l'islam et des musulmans, pas sur le caractère heureux ou malheureux des faits rapportés.

## Directives :
- Soyez rigoureux et analytique dans votre évaluation
- Tenez compte du contexte culturel et régional de l'Afrique de l'Ouest francophone
- Fournissez des preuves textuelles spécifiques lorsque possible
- Soyez honnête sur l'incertitude lorsque la réponse correcte est ambiguë
- Les trois analyses sont anonymisées : jugez-les uniquement sur leur contenu
- Utilisez la terminologie française pour les scores (comme indiqué ci-dessus)
- Répondez entièrement en français (justifications, explications et verdicts)
- Pour `preferred` et `overall_winner`, utilisez strictement : "a", "b", "c", "multiple" (plusieurs analyses équivalentes) ou "none" (aucune n'est juste)"""


def format_analysis(label: str, analysis: dict, contract: SentimentContract) -> str:
    """Render one anonymised analysis block for the user prompt."""
    rank = analysis.get("subjectivite_score")
    subjectivity = SUBJECTIVITY_LABELS.get(rank, "Non renseigné") if rank is not None else "Non renseigné"
    return f"""## Analyse {label.upper()} :
- **Polarité (sentiment envers l'islam/les musulmans) :** {analysis.get("polarite") or "N/A"}
  - Justification : {analysis.get("polarite_justification") or "N/A"}
- **Subjectivité :** {subjectivity}
  - Justification : {analysis.get("subjectivite_justification") or "N/A"}
- **Centralité de l'islam/des musulmans :** {analysis.get("centralite_islam_musulmans") or "N/A"}
  - Justification : {analysis.get("centralite_justification") or "N/A"}"""


def create_arbiter_prompt(
    article: dict, permutation: dict[str, str], contract: SentimentContract = CONTRACT
) -> str:
    """Build the user prompt: the article, then the three analyses in label order.

    The system instruction already carries the scales and the guidelines, so
    this prompt is only the case at hand.
    """
    analyses = article.get("analyses") or {}
    blocks = "\n\n".join(
        format_analysis(label, analyses.get(permutation[label]) or {}, contract)
        for label in BLIND_LABELS
    )
    text = (article.get("OCR") or "")[:ARBITER_MAX_INPUT_CHARS]
    return f"""Évaluez l'article suivant et les trois analyses de modèles.

## Informations sur l'article
**Titre :** {article.get("o:title") or "Sans titre"}

**Texte intégral :**
{text}

---

{blocks}

---

Fournissez votre évaluation indépendante pour chaque dimension, déterminez quelle analyse est la plus précise et expliquez votre raisonnement."""


# ============================================================================
# Selection
# ============================================================================


def load_dataset_records(contract: SentimentContract = CONTRACT) -> list[dict]:
    """Load the public projection and validate the columns selection needs."""
    df = load_iwac_dataset(contract)
    validate_columns(df, REQUIRED_BASE_COLUMNS)
    logger.info("Loaded %d articles from %s", len(df), HF_REPO_ID)
    return df.to_dict("records")


def find_three_way_conflicts(
    records: list[dict], contract: SentimentContract = CONTRACT
) -> list[dict]:
    """Select every article where the three models disagree significantly.

    Comparability is the contract's: one non-comparable polarity or centrality
    excludes the row, because the models are then disagreeing about whether the
    task applies rather than about the answer.
    """
    model_ids = list(contract.model_names)
    selected: list[dict] = []

    for item in tqdm(records, total=len(records), desc="Finding three-way conflicts"):
        analyses = {
            model_id: build_model_sentiment(item, model_id, contract) for model_id in model_ids
        }
        spread = calculate_three_way_spread([analyses[m] for m in model_ids], contract)
        if not spread or not spread["has_significant_spread"]:
            continue
        selected.append(
            {
                "o:id": item.get("o:id"),
                "o:title": safe_str(item.get("title")),
                "newspaper": safe_str(item.get("newspaper")),
                "country": safe_str(item.get("country")),
                "pub_date": safe_str(item.get("pub_date")),
                "analyses": analyses,
                "spread": spread,
            }
        )

    return selected


def attach_full_text(articles: list[dict], texts: dict[str, str]) -> tuple[list[dict], list[str]]:
    """Join the private mirror's unmasked OCR onto the selected articles.

    An article with no text even in the mirror is dropped rather than sent: the
    arbiter would be judging three analyses of nothing.
    """
    kept: list[dict] = []
    missing: list[str] = []
    for article in articles:
        text = texts.get(str(article.get("o:id")))
        if not text:
            missing.append(str(article.get("o:id")))
            continue
        kept.append({**article, "OCR": text})
    return kept, missing


def apply_limit(articles: list[dict], limit: int | None) -> list[dict]:
    """Keep the ``limit`` widest disagreements, deterministically.

    Ties on total spread are broken by article id so that two runs with the
    same corpus and the same cap select the same articles.
    """
    if limit is None or limit >= len(articles):
        return articles
    ordered = sorted(
        articles, key=lambda article: (-article["spread"]["total_spread"], str(article["o:id"]))
    )
    return ordered[:limit]


# ============================================================================
# Blind permutation
# ============================================================================


def resolve_blind_permutation(
    metadata: dict | None, model_ids: list[str], rng: random.Random | None = None
) -> dict[str, str]:
    """Reuse the stored label -> model mapping, or draw a new one once.

    Re-rolling on an incremental run would silently change what "Analyse A"
    means between cached and new rows, which is the three-way analogue of v1's
    `model_a_is_first` bug.
    """
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
            system=SYSTEM_INSTRUCTION,
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
) -> dict:
    """Assemble the self-documenting envelope the dashboard and validator read."""
    return {
        "generated": datetime.now().isoformat(),
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
    prompt_chars = sum(
        len(SYSTEM_INSTRUCTION) + len(create_arbiter_prompt(article, permutation))
        for article in articles
    )
    input_tokens = prompt_chars / ESTIMATE_CHARS_PER_TOKEN
    output_tokens = len(articles) * ESTIMATE_OUTPUT_TOKENS.get(effort, 3000)
    return {
        "calls": len(articles),
        "input_tokens": round(input_tokens),
        "output_tokens": output_tokens,
        "assumed_output_tokens_per_call": ESTIMATE_OUTPUT_TOKENS.get(effort, 3000),
        "usd": round(
            input_tokens / 1_000_000 * USD_PER_MTOK_INPUT
            + output_tokens / 1_000_000 * USD_PER_MTOK_OUTPUT,
            2,
        ),
    }


def report_estimate(estimate: dict, effort: str) -> None:
    logger.info("Estimated spend for %d call(s) at effort=%s:", estimate["calls"], effort)
    logger.info("  input  ~%s tokens (measured prompts)", f"{estimate['input_tokens']:,}")
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
        description="IWAC three-way arbiter evaluation (generation 2)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python arbiter-evaluation-v2.py --dry-run
  python arbiter-evaluation-v2.py --limit 200 --dry-run
  python arbiter-evaluation-v2.py --limit 200 --yes
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
        "IWAC three-way arbiter — %s (effort=%s), contract %s",
        ARBITER_MODEL,
        args.effort,
        CONTRACT.analysis_version,
    )

    try:
        records = load_dataset_records()
    except Exception as error:  # noqa: BLE001 - surfaced as an exit code
        logger.error("Failed to load dataset: %s", error)
        return 2

    eligible = find_three_way_conflicts(records)
    logger.info(
        "%d of %d articles have a three-way spread >= %d on some dimension",
        len(eligible),
        len(records),
        CONTRACT.significant_spread_threshold,
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

    selected = apply_limit(with_text, args.limit)
    if args.limit is not None:
        logger.info("--limit %d kept the %d widest disagreements", args.limit, len(selected))

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
        "threshold": CONTRACT.significant_spread_threshold,
        "limit": args.limit,
        "eligible_articles": len(eligible),
        "selected_articles": len(selected),
    }
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

    for article in tqdm(remaining, desc="Three-way arbiter"):
        result = evaluate_with_arbiter(client, article, permutation, effort=args.effort)
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
