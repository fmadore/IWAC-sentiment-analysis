"""Deterministic cache keys and reconciliation for paid arbiter evaluations."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any

from .contract import ANALYSIS_VERSION, CONTRACT, CONTRACT_SCHEMA_VERSION


@dataclass(frozen=True)
class CacheReconciliation:
    evaluations: list[dict]
    evaluated_ids: set[str]
    pruned: int
    invalidated: int
    adopted_legacy: int


def cache_fingerprint(
    article: dict[str, Any],
    *,
    pair: str,
    arbiter_model: str,
    source_revision: str | None,
    max_input_chars: int,
) -> str:
    """Hash exactly the inputs and versions that determine an evaluation."""
    payload = {
        "contract_schema_version": CONTRACT_SCHEMA_VERSION,
        "analysis_version": ANALYSIS_VERSION,
        "cache_schema_version": CONTRACT["arbiter"]["cacheSchemaVersion"],
        "prompt_version": CONTRACT["arbiter"]["promptVersion"],
        "arbiter_model": arbiter_model,
        "source_revision": source_revision,
        "pair": pair,
        "article_id": str(article.get("o:id")),
        "title": article.get("o:title"),
        "article_text": (article.get("OCR") or "")[:max_input_chars],
        "model_a_analysis": article.get("model_a_analysis"),
        "model_b_analysis": article.get("model_b_analysis"),
        "discrepancies": article.get("discrepancies"),
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def reconcile_cached_evaluations(
    cached: list[dict],
    current_articles: list[dict],
    *,
    pair: str,
    arbiter_model: str,
    source_revision: str | None,
    max_input_chars: int,
    adopt_legacy: bool = True,
) -> CacheReconciliation:
    """Keep only unique, current, fingerprint-compatible cache entries.

    Pre-v2 rows have no fingerprint. By default they are adopted once against
    the current inputs so the migration does not discard paid evaluations;
    every subsequent run validates the stored fingerprint. Set
    ``adopt_legacy=False`` to force a complete refresh.
    """
    current_by_id = {str(article.get("o:id")): article for article in current_articles}
    cached_by_id: dict[str, dict] = {}
    duplicates = 0
    for evaluation in cached:
        article_id = str(evaluation.get("article_id"))
        if article_id in cached_by_id:
            duplicates += 1
            continue
        cached_by_id[article_id] = evaluation

    evaluations: list[dict] = []
    invalidated = 0
    adopted_legacy = 0
    for article_id, article in current_by_id.items():
        evaluation = cached_by_id.get(article_id)
        if evaluation is None:
            continue
        expected = cache_fingerprint(
            article,
            pair=pair,
            arbiter_model=arbiter_model,
            source_revision=source_revision,
            max_input_chars=max_input_chars,
        )
        stored = evaluation.get("cache_fingerprint")
        if stored is None and adopt_legacy:
            evaluation = {**evaluation, "cache_fingerprint": expected}
            adopted_legacy += 1
        elif stored != expected:
            invalidated += 1
            continue
        evaluations.append(evaluation)

    stale_ids = set(cached_by_id) - set(current_by_id)
    return CacheReconciliation(
        evaluations=evaluations,
        evaluated_ids={str(item["article_id"]) for item in evaluations},
        pruned=len(stale_ids) + duplicates,
        invalidated=invalidated,
        adopted_legacy=adopted_legacy,
    )
