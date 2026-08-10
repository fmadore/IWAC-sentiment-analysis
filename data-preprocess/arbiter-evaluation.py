"""
Arbiter Evaluation Script - Gemini 3 Pro as the Judge

This script uses Gemini 3 Pro with high reasoning level (thinking_level="high")
as an arbiter to evaluate articles where two AI models have significant
disagreements (>= 3 points difference).

Supports comparing any pair of models:
- chatgpt-gemini
- chatgpt-mistral
- gemini-mistral

The arbiter provides:
- Its own independent scores for each dimension
- Justification for each score
- Verdict on which model's analysis is more accurate
- Explanation of the reasoning

Features:
- Gemini 3 Pro Preview with thinking_level="high" for maximum reasoning
- System instructions for consistent evaluation context
- Pydantic structured outputs for reliable JSON parsing
- Configurable model pair via --pair argument
- Non-interactive mode via --yes for CI

Usage:
  python arbiter-evaluation.py                        # Process all pairs
  python arbiter-evaluation.py --pair chatgpt-mistral
  python arbiter-evaluation.py --pair gemini-mistral --yes

Output: JSON file with arbiter evaluations to be consumed by the visualization app
"""

import argparse
import json
import os
import random
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from functools import partial
from pathlib import Path
from typing import Any, Literal

import pandas as pd
from pydantic import BaseModel, Field, ValidationError
from shared import (
    ANALYSIS_VERSION,
    CONTRACT,
    CONTRACT_SCHEMA_VERSION,
    MODEL_NAMES,
    MODEL_PAIRS,
    cache_fingerprint,
    calculate_discrepancies,
    extract_model_analysis,
    get_article_text,
    get_logger,
    get_models_from_pair,
    get_source_revision,
    get_webapp_data_dir,
    load_iwac_dataset,
    reconcile_cached_evaluations,
    safe_save_json,
    validate_columns,
)
from tqdm import tqdm

logger = get_logger(__name__)

# ============================================================================
# Arbiter configuration constants
# ============================================================================

ARBITER_MODEL = "gemini-3-pro-preview"
ARBITER_MAX_INPUT_CHARS = 15000  # article text is truncated to this length
ARBITER_TEMPERATURE = 0.2
ARBITER_MAX_OUTPUT_TOKENS = 8192
SAVE_INTERVAL = 10  # save progress every N successful evaluations
RATE_LIMIT_INTERVAL = 10  # pause for a second after every N API calls

# Dataset columns every pair evaluation depends on.
REQUIRED_BASE_COLUMNS = ["o:id", "title", "OCR", "newspaper", "country", "pub_date"]


def pair_fingerprint(pair: str):
    """Bind this run's arbiter model and source revision to one pair's hasher.

    `reconcile_cached_evaluations` takes the hasher as a callable so the
    pairwise (v1) and three-way (v2) modes can share the reconciliation logic
    without either one knowing the other's payload shape.
    """
    return partial(
        cache_fingerprint,
        pair=pair,
        arbiter_model=ARBITER_MODEL,
        source_revision=get_source_revision(),
        max_input_chars=ARBITER_MAX_INPUT_CHARS,
    )


# ============================================================================
# Pydantic Models for Structured Output
# ============================================================================


class DimensionVerdict(BaseModel):
    """Verdict fields shared by each independently constrained dimension."""

    justification: str = Field(description="Raisonnement pour ce score")
    preferred_model: Literal["model_a", "model_b", "both", "neither"] = Field(
        description="Quel modèle a l'analyse la plus précise (model_a ou model_b)"
    )
    verdict_explanation: str = Field(description="Pourquoi l'analyse de ce modèle est préférée")


class PolarityScore(DimensionVerdict):
    arbiter_score: Literal[
        "Très positif", "Positif", "Neutre", "Négatif", "Très négatif", "Non applicable"
    ]


class SubjectivityScore(DimensionVerdict):
    arbiter_score: int = Field(ge=1, le=5)


class CentralityScore(DimensionVerdict):
    arbiter_score: Literal["Très central", "Central", "Secondaire", "Marginal", "Non abordé"]


class ArbiterResponse(BaseModel):
    """Complete structured response from the arbiter"""

    polarity: PolarityScore = Field(description="Évaluation de la polarité/sentiment")
    subjectivity: SubjectivityScore = Field(description="Évaluation du score de subjectivité")
    centrality: CentralityScore = Field(
        description="Évaluation de la centralité de l'islam/musulmans"
    )
    overall_winner: Literal["model_a", "model_b", "both", "neither"] = Field(
        description="Quel modèle est globalement meilleur: 'model_a', 'model_b', 'both' (les deux équivalents), ou 'neither' (aucun précis)"
    )
    overall_explanation: str = Field(description="Explication détaillée du verdict global")
    confidence_level: Literal["high", "medium", "low"] = Field(
        description="Niveau de confiance dans l'évaluation"
    )


# ============================================================================
# Dataclasses for internal processing (matching frontend types)
# ============================================================================


@dataclass
class ArbiterScore:
    """Arbiter's score for a dimension"""

    score: str  # The arbiter's own score (e.g., "Positif", "3", "Central")
    justification: str  # Why the arbiter chose this score
    preferred_model: str  # "model_a", "model_b", "both", or "neither" (actual model assignment stored separately)
    verdict_explanation: str  # Why one model is preferred over the other


@dataclass
class ArbiterAnalysis:
    """Complete arbiter analysis for an article"""

    article_id: str
    polarity: ArbiterScore
    subjectivity: ArbiterScore
    centrality: ArbiterScore
    overall_winner: str  # "model_a", "model_b", "both", or "neither"
    overall_explanation: str  # Detailed explanation of the verdict
    confidence_level: str  # "high", "medium", "low"
    timestamp: str
    # Note: the blind assignment is stored once globally in metadata, not per article


# ============================================================================
# System Instruction for the Arbiter
# ============================================================================

SYSTEM_INSTRUCTION = """Vous êtes un arbitre expert évaluant l'analyse de sentiment d'articles de presse sur l'islam et les musulmans en Afrique de l'Ouest francophone.

Votre rôle est de :
1. Analyser les articles de manière indépendante et fournir votre propre évaluation
2. Comparer les analyses de deux modèles d'IA (Modèle A et Modèle B)
3. Déterminer quelle analyse est la plus précise
4. Fournir des justifications claires et bien argumentées pour vos décisions

## Référence des échelles d'évaluation :

### Polarité (Sentiment envers l'islam/les musulmans) :
- **Très positif** : Portrait extrêmement favorable, enthousiaste, élogieux
- **Positif** : Portrait favorable, optimiste
- **Neutre** : Pas de sentiment clair ou équilibre entre positif/négatif ; ton factuel
- **Négatif** : Portrait défavorable, critique, pessimiste
- **Très négatif** : Portrait extrêmement défavorable, alarmiste, très critique

### Score de subjectivité (1-5) :
- **1 (Très objectif)** : Rapporte des faits vérifiables sans opinions personnelles, purement informatif
- **2 (Plutôt objectif)** : Principalement factuel, peut contenir de subtiles traces d'opinions
- **3 (Mixte)** : Mélange équilibré de faits et d'opinions, ou présente plusieurs points de vue
- **4 (Plutôt subjectif)** : Exprime clairement des opinions et des jugements
- **5 (Très subjectif)** : Fortement biaisé, opinions intenses avec peu de présentation factuelle

### Centralité :
- **Très central** : L'islam/les musulmans sont le sujet principal de l'article
- **Central** : Thème important mais partagé avec d'autres sujets
- **Secondaire** : Mentionné significativement mais de façon secondaire
- **Marginal** : Mentionné brièvement ou anecdotiquement
- **Non abordé** : Aucune mention de l'islam ou des musulmans

## Directives :
- Soyez rigoureux et analytique dans votre évaluation
- Tenez compte du contexte culturel et régional de l'Afrique de l'Ouest francophone
- Fournissez des preuves textuelles spécifiques lorsque possible
- Soyez honnête sur l'incertitude lorsque la réponse correcte est ambiguë
- Utilisez la terminologie française pour les scores (comme indiqué ci-dessus)
- Répondez entièrement en français (justifications, explications et verdicts)
- Pour overall_winner, utilisez strictement : "model_a", "model_b", "both" (équivalents), ou "neither" (aucun précis)
- Pour overall_explanation, fournissez une explication détaillée en français du verdict global"""


def create_arbiter_prompt(
    article_text: str, title: str, model_a_analysis: dict, model_b_analysis: dict
) -> str:
    """Create the user prompt for the arbiter model.

    Note: The system instruction already contains the evaluation scales and guidelines.
    This prompt provides only the specific article and model analyses to evaluate.
    Model assignment is randomized for blind evaluation.
    """

    prompt = f"""Évaluez l'article suivant et les deux analyses de modèles.

## Informations sur l'article
**Titre :** {title}

**Texte intégral :**
{article_text[:ARBITER_MAX_INPUT_CHARS]}

---

## Analyse du Modèle A :
- **Polarité (sentiment envers l'islam/les musulmans) :** {model_a_analysis.get("polarite", "N/A")}
  - Justification : {model_a_analysis.get("polarite_justification", "N/A")}
- **Score de subjectivité (1=très objectif, 5=très subjectif) :** {model_a_analysis.get("subjectivite_score", "N/A")}
  - Justification : {model_a_analysis.get("subjectivite_justification", "N/A")}
- **Centralité de l'islam/des musulmans :** {model_a_analysis.get("centralite_islam_musulmans", "N/A")}
  - Justification : {model_a_analysis.get("centralite_justification", "N/A")}

## Analyse du Modèle B :
- **Polarité :** {model_b_analysis.get("polarite", "N/A")}
  - Justification : {model_b_analysis.get("polarite_justification", "N/A")}
- **Score de subjectivité :** {model_b_analysis.get("subjectivite_score", "N/A")}
  - Justification : {model_b_analysis.get("subjectivite_justification", "N/A")}
- **Centralité :** {model_b_analysis.get("centralite_islam_musulmans", "N/A")}
  - Justification : {model_b_analysis.get("centralite_justification", "N/A")}

---

Fournissez votre évaluation indépendante pour chaque dimension, déterminez quel modèle est le plus précis et expliquez votre raisonnement."""

    return prompt


def convert_pydantic_to_dataclass(response: ArbiterResponse, article_id: str) -> ArbiterAnalysis:
    """Convert Pydantic ArbiterResponse to ArbiterAnalysis dataclass"""
    return ArbiterAnalysis(
        article_id=article_id,
        polarity=ArbiterScore(
            score=response.polarity.arbiter_score,
            justification=response.polarity.justification,
            preferred_model=response.polarity.preferred_model,
            verdict_explanation=response.polarity.verdict_explanation,
        ),
        subjectivity=ArbiterScore(
            score=str(response.subjectivity.arbiter_score),
            justification=response.subjectivity.justification,
            preferred_model=response.subjectivity.preferred_model,
            verdict_explanation=response.subjectivity.verdict_explanation,
        ),
        centrality=ArbiterScore(
            score=response.centrality.arbiter_score,
            justification=response.centrality.justification,
            preferred_model=response.centrality.preferred_model,
            verdict_explanation=response.centrality.verdict_explanation,
        ),
        overall_winner=response.overall_winner,
        overall_explanation=response.overall_explanation,
        confidence_level=response.confidence_level,
        timestamp=datetime.now().isoformat(),
    )


def is_transient_api_error(error: Exception) -> bool:
    """Return True only for rate limits, timeouts, and server-side failures."""
    status = getattr(error, "status_code", None) or getattr(error, "code", None)
    if isinstance(status, int) and (status == 429 or status >= 500):
        return True
    name = type(error).__name__.lower()
    message = str(error).lower()
    return any(
        token in name or token in message
        for token in ("timeout", "temporar", "rate limit", "resource exhausted", "unavailable")
    )


def retry_delay(error: Exception, attempt: int) -> float:
    """Honor Retry-After when exposed, otherwise exponential backoff + jitter."""
    retry_after = getattr(error, "retry_after", None)
    try:
        if retry_after is not None:
            return max(0.0, float(retry_after))
    except (TypeError, ValueError):
        pass
    return (2**attempt) + random.random()


def evaluate_with_arbiter(
    client: Any,
    article: dict,
    first_analysis: dict,
    second_analysis: dict,
    model_a_is_first: bool,
    max_retries: int = 3,
) -> ArbiterAnalysis | None:
    """Send an article to the arbiter for evaluation using structured outputs.

    Uses:
    - System instruction for consistent evaluation context
    - thinking_level="high" for maximum reasoning capability
    - Pydantic structured outputs for reliable JSON parsing
    - Blind model assignment (Model A/B) - same for all articles

    Args:
        client: GenAI client.
        article: Article row (must carry the ``OCR`` text column).
        first_analysis: Analysis of the first model in the pair.
        second_analysis: Analysis of the second model in the pair.
        model_a_is_first: Global blind assignment - True if the pair's first
            model is presented as "Model A" for ALL articles.
        max_retries: Number of attempts before giving up on an article.
    """

    from google.genai import types

    article_id = str(article.get("o:id", article.get("id", "unknown")))
    title = article.get("o:title", article.get("title", "Unknown Title"))
    text = get_article_text(article)

    if not text:
        logger.warning("No text available for article %s", article_id)
        return None

    # Apply the GLOBAL model assignment (same for all articles)
    if model_a_is_first:
        model_a_analysis = first_analysis
        model_b_analysis = second_analysis
    else:
        model_a_analysis = second_analysis
        model_b_analysis = first_analysis

    prompt = create_arbiter_prompt(text, title, model_a_analysis, model_b_analysis)

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=ARBITER_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    thinking_config=types.ThinkingConfig(thinking_level="high"),
                    response_mime_type="application/json",
                    response_schema=ArbiterResponse,
                    temperature=ARBITER_TEMPERATURE,
                    max_output_tokens=ARBITER_MAX_OUTPUT_TOKENS,
                ),
            )

            if response.text:
                # Parse JSON response and convert to Pydantic model
                data = json.loads(response.text)
                arbiter_response = ArbiterResponse.model_validate(data)
                return convert_pydantic_to_dataclass(arbiter_response, article_id)

            logger.warning("Empty response for article %s, attempt %d", article_id, attempt + 1)

        except (json.JSONDecodeError, ValidationError) as e:
            # A response that violates the schema is deterministic bad output,
            # not a transport failure. Retrying it spends quota without making
            # the contract more likely to pass.
            logger.error("Invalid structured response for article %s: %s", article_id, e)
            return None
        except Exception as e:
            if not is_transient_api_error(e):
                logger.error("Non-retryable arbiter error for article %s: %s", article_id, e)
                return None
            logger.warning(
                "Transient error for article %s, attempt %d: %s", article_id, attempt + 1, e
            )
            if attempt < max_retries - 1:
                time.sleep(retry_delay(e, attempt))

    return None


def load_dataset_with_text_info() -> pd.DataFrame:
    """Load the IWAC dataset, validate required columns, and log text-field info."""
    df = load_iwac_dataset()
    logger.info("Available columns: %s", ", ".join(df.columns.tolist()))
    validate_columns(df, REQUIRED_BASE_COLUMNS)

    # Check for OCR/text field coverage
    ocr_fields = [
        col
        for col in df.columns
        if "ocr" in col.lower() or "text" in col.lower() or "content" in col.lower()
    ]
    if ocr_fields:
        logger.info("Found text fields: %s", ", ".join(ocr_fields))
        for field in ocr_fields:
            non_empty = df[field].notna().sum()
            logger.info(
                "  %s: %d/%d non-empty (%.1f%%)",
                field,
                non_empty,
                len(df),
                100 * non_empty / len(df),
            )
    else:
        logger.warning("No OCR/text field found in dataset!")

    return df


def find_significant_differences(records: list[dict], model_a: str, model_b: str) -> list[dict]:
    """Find articles with significant differences between the specified models.

    Args:
        records: Article rows as plain dicts.
        model_a: First model ID (e.g., 'chatgpt', 'gemini', 'mistral').
        model_b: Second model ID (e.g., 'chatgpt', 'gemini', 'mistral').
    """
    significant_articles = []

    model_a_name = MODEL_NAMES.get(model_a, model_a)
    model_b_name = MODEL_NAMES.get(model_b, model_b)

    logger.info(
        "Processing %d articles to find significant differences between %s and %s...",
        len(records),
        model_a_name,
        model_b_name,
    )

    for item in tqdm(records, total=len(records), desc="Finding conflicts"):
        # Dynamically build column names based on model prefixes
        model_a_analysis = extract_model_analysis(item, model_a)
        model_b_analysis = extract_model_analysis(item, model_b)

        discrepancies = calculate_discrepancies(model_a_analysis, model_b_analysis)

        if discrepancies and discrepancies["has_significant_conflict"]:
            significant_articles.append(
                {
                    "o:id": item.get("o:id"),
                    "o:title": item.get("title"),
                    "OCR": get_article_text(item),  # Full text - uppercase column in dataset
                    "newspaper": item.get("newspaper"),
                    "country": item.get("country"),
                    "pub_date": item.get("pub_date"),
                    "model_a_analysis": model_a_analysis,
                    "model_b_analysis": model_b_analysis,
                    "model_a_id": model_a,
                    "model_b_id": model_b,
                    "discrepancies": discrepancies,
                }
            )

    return significant_articles


def load_cached_evaluations(webapp_file: str) -> tuple[list, set, bool | None]:
    """Load previously saved evaluations from a webapp output file (the cache).

    Returns:
        Tuple of (evaluations list, set of evaluated article ids as strings,
        stored blind assignment or None). Returns empty values if the file is
        missing or unreadable.
    """
    if not os.path.exists(webapp_file):
        return [], set(), None

    try:
        with open(webapp_file, encoding="utf-8") as f:
            existing_data = json.load(f)
        arbiter_results = existing_data.get("evaluations", [])
        evaluated_ids = {str(r["article_id"]) for r in arbiter_results}
        # Preserve the blind assignment from previous runs. Files written
        # before the key was persisted derive it from arbiter_model_a ==
        # pair_first_model - re-randomizing on an incremental run would
        # silently flip the model_a/model_b mapping for new rows relative
        # to the cached ones.
        metadata = existing_data.get("metadata", {})
        model_a_is_first = metadata.get("model_a_is_first")
        if model_a_is_first is None and metadata.get("arbiter_model_a"):
            model_a_is_first = metadata["arbiter_model_a"] == metadata.get("pair_first_model")
        return arbiter_results, evaluated_ids, model_a_is_first
    except (OSError, json.JSONDecodeError) as e:
        logger.warning("Failed to load existing data from %s: %s", webapp_file, e)
        return [], set(), None


def process_pair(
    client,
    significant_articles: list[dict],
    pair: str,
    webapp_data_dir: str,
    *,
    evaluate_missing: bool = True,
) -> dict:
    """Process a single model pair and return statistics.

    Uses the webapp output file as cache for incremental processing.
    If new articles are added to the dataset, only the new ones will be processed.

    Args:
        client: GenAI client
        significant_articles: Precomputed conflict articles for this pair
            (from :func:`find_significant_differences`).
        pair: Model pair string (e.g., 'chatgpt-gemini')
        webapp_data_dir: Directory for webapp data files (used as cache)

    Returns:
        dict with processing statistics
    """
    model_a, model_b = get_models_from_pair(pair)
    model_a_name = MODEL_NAMES.get(model_a, model_a)
    model_b_name = MODEL_NAMES.get(model_b, model_b)

    logger.info("Processing: %s vs %s", model_a_name, model_b_name)

    # The published file is also the incremental cache. Load it even when the
    # current corpus has no eligible rows so stale paid evaluations are not
    # left behind indefinitely.
    webapp_file = os.path.join(webapp_data_dir, f"iwac_arbiter_evaluations_{pair}.json")
    cached_results, _, model_a_is_first = load_cached_evaluations(webapp_file)

    if not significant_articles:
        if model_a_is_first is None:
            model_a_is_first = random.choice([True, False])
        save_results(
            webapp_file,
            [],
            pair,
            model_a_is_first,
            model_a_name,
            model_b_name,
            0,
            0,
            0,
        )
        logger.warning(
            "No current significant differences; published an empty cache and pruned %d stale rows",
            len(cached_results),
        )
        return {"pair": pair, "total": 0, "new": 0, "cached": 0, "failed": 0}

    logger.info("Found %d articles with significant differences", len(significant_articles))

    reconciliation = reconcile_cached_evaluations(
        cached_results,
        significant_articles,
        fingerprint=pair_fingerprint(pair),
    )
    arbiter_results = reconciliation.evaluations
    evaluated_ids = reconciliation.evaluated_ids
    if cached_results:
        logger.info(
            "Reconciled cache: %d kept, %d stale/duplicate pruned, %d changed invalidated, %d legacy adopted",
            len(arbiter_results),
            reconciliation.pruned,
            reconciliation.invalidated,
            reconciliation.adopted_legacy,
        )

    # Filter out already-evaluated articles
    remaining_articles = [
        a for a in significant_articles if str(a.get("o:id")) not in evaluated_ids
    ]
    cached_count = len(evaluated_ids)

    # BLIND EVALUATION: Use existing assignment or create new one
    if model_a_is_first is None:
        model_a_is_first = random.choice([True, False])
        logger.info(
            "New blind assignment: Model A = %s", model_a_name if model_a_is_first else model_b_name
        )
    else:
        logger.info(
            "Using existing blind assignment: Model A = %s",
            model_a_name if model_a_is_first else model_b_name,
        )

    if not remaining_articles:
        # Still publish reconciled/pruned cache rows and upgraded metadata.
        save_results(
            webapp_file,
            arbiter_results,
            pair,
            model_a_is_first,
            model_a_name,
            model_b_name,
            len(significant_articles),
            len(arbiter_results),
            0,
            legacy_cache_adopted=reconciliation.adopted_legacy,
        )
        logger.info(
            "All %d current articles already evaluated; cache metadata refreshed",
            len(significant_articles),
        )
        return {
            "pair": pair,
            "total": len(significant_articles),
            "new": 0,
            "cached": cached_count,
            "failed": 0,
        }

    logger.info(
        "%d new or changed articles to evaluate (%d cached)", len(remaining_articles), cached_count
    )

    if not evaluate_missing:
        save_results(
            webapp_file,
            arbiter_results,
            pair,
            model_a_is_first,
            model_a_name,
            model_b_name,
            len(significant_articles),
            len(arbiter_results),
            0,
            legacy_cache_adopted=reconciliation.adopted_legacy,
        )
        logger.info("Prune-only mode left %d articles pending evaluation", len(remaining_articles))
        return {
            "pair": pair,
            "total": len(significant_articles),
            "new": 0,
            "cached": cached_count,
            "failed": 0,
            "pending": len(remaining_articles),
        }

    # Process new articles with arbiter
    successful = 0
    failed = 0

    for i, item in enumerate(tqdm(remaining_articles, desc=f"Arbiter eval ({pair})")):
        result = evaluate_with_arbiter(
            client, item, item["model_a_analysis"], item["model_b_analysis"], model_a_is_first
        )

        if result:
            arbiter_results.append(
                {
                    "article_id": result.article_id,
                    "arbiter": asdict(result),
                    "discrepancies": item["discrepancies"],
                    "cache_fingerprint": cache_fingerprint(
                        item,
                        pair=pair,
                        arbiter_model=ARBITER_MODEL,
                        source_revision=get_source_revision(),
                        max_input_chars=ARBITER_MAX_INPUT_CHARS,
                    ),
                }
            )
            successful += 1

            # Save progress periodically
            if successful % SAVE_INTERVAL == 0:
                save_results(
                    webapp_file,
                    arbiter_results,
                    pair,
                    model_a_is_first,
                    model_a_name,
                    model_b_name,
                    len(significant_articles),
                    len(arbiter_results),
                    failed,
                    legacy_cache_adopted=reconciliation.adopted_legacy,
                )
                logger.info("Saved %d results", len(arbiter_results))
        else:
            failed += 1

        # Rate limiting
        if (i + 1) % RATE_LIMIT_INTERVAL == 0:
            time.sleep(1)

    # Save final results
    save_results(
        webapp_file,
        arbiter_results,
        pair,
        model_a_is_first,
        model_a_name,
        model_b_name,
        len(significant_articles),
        len(arbiter_results),
        failed,
        legacy_cache_adopted=reconciliation.adopted_legacy,
    )

    logger.info("Completed: %d new, %d cached, %d failed", successful, cached_count, failed)

    return {
        "pair": pair,
        "total": len(significant_articles),
        "new": successful,
        "cached": cached_count,
        "failed": failed,
    }


def save_results(
    filepath: str,
    results: list,
    pair: str,
    model_a_is_first: bool,
    first_model_name: str,
    second_model_name: str,
    total: int,
    successful: int,
    failed: int,
    *,
    legacy_cache_adopted: int = 0,
):
    """Save arbiter results to JSON file

    Args:
        model_a_is_first: Whether the first model in the pair was presented as "Model A" to the arbiter
        first_model_name: Name of the first model in the pair (e.g., ChatGPT for chatgpt-gemini)
        second_model_name: Name of the second model in the pair (e.g., Gemini for chatgpt-gemini)
    """
    # CRITICAL: Save the actual model names that the arbiter saw as Model A/B
    # This makes the JSON self-documenting and avoids confusion
    arbiter_model_a = first_model_name if model_a_is_first else second_model_name
    arbiter_model_b = second_model_name if model_a_is_first else first_model_name

    safe_save_json(
        {
            "metadata": {
                "generated": datetime.now().isoformat(),
                "arbiter_model": ARBITER_MODEL,
                "thinking_level": "high",
                "blind_evaluation": True,
                "arbiter_model_a": arbiter_model_a,
                "arbiter_model_b": arbiter_model_b,
                # Persisted so incremental runs keep the same blind assignment
                "model_a_is_first": model_a_is_first,
                "pair": pair,
                "pair_first_model": first_model_name,
                "pair_second_model": second_model_name,
                "note": "arbiter_model_a/b = what the arbiter saw. preferred_model in verdicts directly maps to these names.",
                "total_articles": total,
                "successful_evaluations": successful,
                "failed_evaluations": failed,
                "contract_schema_version": CONTRACT_SCHEMA_VERSION,
                "analysis_version": ANALYSIS_VERSION,
                "cache_schema_version": CONTRACT["arbiter"]["cacheSchemaVersion"],
                "prompt_version": CONTRACT["arbiter"]["promptVersion"],
                "source_revision": get_source_revision(),
                "legacy_cache_adopted": legacy_cache_adopted,
            },
            "evaluations": results,
        },
        filepath,
    )


def confirm_api_calls(total_new: int, assume_yes: bool) -> bool:
    """Ask the user to confirm the paid API calls (skipped with --yes).

    Returns False (abort) when the user declines or when stdin is unavailable
    (e.g. non-interactive CI without --yes).
    """
    if assume_yes:
        logger.info("--yes given: proceeding with ~%d API calls without prompting", total_new)
        return True

    print(f"\nWARNING: this will make approximately {total_new} API calls to {ARBITER_MODEL}")
    try:
        response = input("Do you want to proceed? (yes/no): ").strip().lower()
    except EOFError:
        logger.error("No input available (non-interactive run?). Use --yes to skip the prompt.")
        return False
    return response in ["yes", "y"]


def create_genai_client(api_key: str):
    """Import the optional paid-API dependency only for an evaluation run."""
    try:
        from google import genai
    except ImportError as error:
        raise RuntimeError("google-genai is required for arbiter API calls") from error
    return genai.Client(api_key=api_key)


def main(
    pairs: list[str] | None = None, assume_yes: bool = False, prune_cache_only: bool = False
) -> int:
    """Main function - processes all specified pairs

    Args:
        pairs: List of model pairs to evaluate. If None, processes all pairs.
        assume_yes: Skip the interactive confirmation prompt (for CI).
    """
    if pairs is None:
        pairs = MODEL_PAIRS

    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        from dotenv import load_dotenv

        load_dotenv(env_path)
        logger.info("Loaded environment variables from %s", env_path)

    logger.info("IWAC Arbiter Evaluation - %s (thinking_level=high)", ARBITER_MODEL)
    logger.info("Processing %d model pair(s): %s", len(pairs), ", ".join(pairs))

    # Load dataset
    try:
        df = load_dataset_with_text_info()
    except Exception as e:
        logger.error("Failed to load dataset: %s", e)
        return 2
    records = df.to_dict("records")

    # Setup webapp data directory
    webapp_data_dir = get_webapp_data_dir()

    # Find the conflict articles ONCE per pair (reused below by process_pair)
    significant_by_pair: dict[str, list[dict]] = {}
    total_new = 0
    for pair in pairs:
        model_a, model_b = get_models_from_pair(pair)
        articles = find_significant_differences(records, model_a, model_b)
        significant_by_pair[pair] = articles

        webapp_file = os.path.join(webapp_data_dir, f"iwac_arbiter_evaluations_{pair}.json")
        cached, _, _ = load_cached_evaluations(webapp_file)
        reconciled = reconcile_cached_evaluations(
            cached, articles, fingerprint=pair_fingerprint(pair)
        )
        total_new += len(articles) - len(reconciled.evaluated_ids)

    client = None
    if total_new > 0 and not prune_cache_only:
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.error("No API key found! Set GOOGLE_API_KEY or use --prune-cache-only")
            return 2
        try:
            client = create_genai_client(api_key)
        except RuntimeError as error:
            logger.error("%s", error)
            return 2
        logger.info("Configured %s as arbiter (thinking_level=high)", ARBITER_MODEL)

    if total_new == 0:
        logger.info("All articles across all pairs are already evaluated! No API calls needed.")
    elif not prune_cache_only and not confirm_api_calls(total_new, assume_yes):
        logger.info("Aborted.")
        return 0

    # Process each pair
    all_stats = []
    for pair in pairs:
        stats = process_pair(
            client,
            significant_by_pair[pair],
            pair,
            webapp_data_dir,
            evaluate_missing=not prune_cache_only,
        )
        all_stats.append(stats)

    # Print summary
    logger.info("ARBITER EVALUATION COMPLETE")
    for stats in all_stats:
        logger.info("%s:", stats["pair"])
        logger.info("  Total articles: %d", stats["total"])
        logger.info("  Newly evaluated: %d", stats["new"])
        logger.info("  From cache: %d", stats["cached"])
        logger.info("  Failed: %d", stats["failed"])
        if stats.get("pending"):
            logger.info("  Pending: %d", stats["pending"])

    return 0


if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="IWAC Arbiter Evaluation - Compare AI models using Gemini 3 Pro as arbiter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python arbiter-evaluation.py                      # Process all pairs (default)
  python arbiter-evaluation.py --pair chatgpt-gemini  # Process single pair
  python arbiter-evaluation.py --pair chatgpt-mistral --pair gemini-mistral
  python arbiter-evaluation.py --yes                # Skip the confirmation prompt (CI)
""",
    )
    parser.add_argument(
        "--pair",
        "-p",
        type=str,
        choices=MODEL_PAIRS,
        action="append",
        dest="pairs",
        help="Model pair(s) to evaluate. Can be specified multiple times. Default: all pairs",
    )
    parser.add_argument(
        "--prune-cache-only",
        action="store_true",
        help="Reconcile/prune cache files without making paid API calls",
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Skip the interactive confirmation prompt (for non-interactive runs)",
    )

    args = parser.parse_args()

    # If no pairs specified, process all pairs
    pairs_to_process = args.pairs if args.pairs else None

    # Set random seed - no fixed seed for true randomization of blind assignment
    random.seed()
    raise SystemExit(
        main(
            pairs=pairs_to_process,
            assume_yes=args.yes,
            prune_cache_only=args.prune_cache_only,
        )
    )
