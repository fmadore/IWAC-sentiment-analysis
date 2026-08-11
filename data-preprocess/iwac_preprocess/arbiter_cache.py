"""Deterministic cache keys and reconciliation for paid arbiter evaluations.

Two arbiter modes share this module. v1 judges a **pair** of models; v2 judges
all three at once. Both hash exactly the inputs and versions that determine an
evaluation, so a changed article, analysis, prompt or arbiter model invalidates
the cached verdict instead of silently publishing a stale one.

The v1 payload shape is frozen — the published v1 files carry fingerprints
computed from it, and `test_arbiter_cache.py` pins one against a literal digest
so no refactor here can quietly orphan the paid v1 evaluations.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any

from .contract import CONTRACT_V1, SentimentContract

Article = Mapping[str, Any]
Fingerprint = Callable[[Article], str]


@dataclass(frozen=True)
class CacheReconciliation:
    evaluations: list[dict]
    evaluated_ids: set[str]
    pruned: int
    invalidated: int
    adopted_legacy: int


def _digest(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def _contract_identity(contract: SentimentContract) -> dict[str, Any]:
    """The version quadruple every fingerprint is bound to."""
    return {
        "contract_schema_version": contract.schema_version,
        "analysis_version": contract.analysis_version,
        "cache_schema_version": contract.arbiter["cacheSchemaVersion"],
        "prompt_version": contract.arbiter["promptVersion"],
    }


def cache_fingerprint(
    article: Article,
    *,
    pair: str,
    arbiter_model: str,
    source_revision: str | None,
    max_input_chars: int,
    contract: SentimentContract = CONTRACT_V1,
) -> str:
    """Hash the inputs of one **pairwise** (v1) arbiter evaluation.

    The key set is frozen: changing it would orphan every published v1
    fingerprint. Only the contract became a parameter, and its default resolves
    to the same values the module constants used to supply.
    """
    return _digest(
        {
            **_contract_identity(contract),
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
    )


def three_way_cache_fingerprint(
    article: Article,
    *,
    arbiter_model: str,
    source_revision: str | None,
    text_revision: str | None,
    max_input_chars: int,
    contract: SentimentContract,
) -> str:
    """Hash the inputs of one **three-way** (v2) arbiter evaluation.

    The analyses are keyed by canonical model id rather than by the anonymised
    A/B/C label they are shown under, so the fingerprint is independent of the
    blind permutation. Re-rolling the permutation would otherwise invalidate
    every paid evaluation at once.

    Two revisions are recorded because the two halves of the input come from
    different repositories: the scores from the public projection, the article
    text from the private mirror.
    """
    analyses = dict(article.get("analyses") or {})
    return _digest(
        {
            **_contract_identity(contract),
            "mode": "three-way",
            "arbiter_model": arbiter_model,
            "source_revision": source_revision,
            "text_revision": text_revision,
            "models": sorted(analyses),
            "article_id": str(article.get("o:id")),
            "title": article.get("o:title"),
            "article_text": (article.get("OCR") or "")[:max_input_chars],
            "analyses": analyses,
            "spread": article.get("spread"),
        }
    )


def reconcile_cached_evaluations(
    cached: list[dict],
    current_articles: list[dict],
    *,
    fingerprint: Fingerprint,
    adopt_legacy: bool = True,
) -> CacheReconciliation:
    """Keep only unique, current, fingerprint-compatible cache entries.

    ``fingerprint`` is the mode-specific hasher bound to this run's arbiter
    model and source revisions — pass ``cache_fingerprint`` for a v1 pair or
    ``three_way_cache_fingerprint`` for the v2 panel, both with their keyword
    arguments already applied.

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
        expected = fingerprint(article)
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
