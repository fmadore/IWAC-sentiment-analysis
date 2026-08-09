"""Versioned v1 sentiment contract shared with the Svelte application."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

CONTRACT_PATH = (
    Path(__file__).resolve().parents[2]
    / "ma-visualisation-sentiments"
    / "src"
    / "lib"
    / "data"
    / "sentiment-v1.json"
)


def _load_contract() -> dict[str, Any]:
    with CONTRACT_PATH.open(encoding="utf-8") as handle:
        contract = json.load(handle)
    if contract.get("analysisVersion") != "v1":
        raise ValueError(
            f"Expected the v1 sentiment contract, got {contract.get('analysisVersion')!r}"
        )
    return contract


CONTRACT = _load_contract()
CONTRACT_SCHEMA_VERSION = str(CONTRACT["schemaVersion"])
ANALYSIS_VERSION = str(CONTRACT["analysisVersion"])

MODEL_NAMES = {model_id: model["displayName"] for model_id, model in CONTRACT["models"].items()}
HF_COLUMN_PREFIX_CANDIDATES = {
    model_id: tuple(model["hfPrefixes"]) for model_id, model in CONTRACT["models"].items()
}
# The first prefix is canonical for newly generated data. Remaining values are
# read-only aliases for legacy v1 snapshots.
HF_COLUMN_PREFIXES = {
    model_id: prefixes[0] for model_id, prefixes in HF_COLUMN_PREFIX_CANDIDATES.items()
}
MODEL_PAIRS = list(CONTRACT["pairs"])

SENTIMENT_SCORE_SUFFIXES = tuple(CONTRACT["fields"]["scores"])
SENTIMENT_JUSTIFICATION_SUFFIXES = tuple(CONTRACT["fields"]["justifications"])
SENTIMENT_FIELD_SUFFIXES = SENTIMENT_SCORE_SUFFIXES + SENTIMENT_JUSTIFICATION_SUFFIXES

POLARITY_SCORES = dict(CONTRACT["scales"]["polarity"]["scores"])
CENTRALITY_SCORES = dict(CONTRACT["scales"]["centrality"]["scores"])
POLARITY_NON_COMPARABLE = frozenset(CONTRACT["scales"]["polarity"]["nonComparable"])
CENTRALITY_NON_COMPARABLE = frozenset(CONTRACT["scales"]["centrality"]["nonComparable"])
SIGNIFICANT_CONFLICT_THRESHOLD = int(CONTRACT["discrepancy"]["significantDimensionGap"])
TOTAL_DISCREPANCY_MAXIMUM = int(CONTRACT["discrepancy"]["maximumTotal"])


def sentiment_column(model_id: str, suffix: str) -> str:
    """Return the canonical HF column name for a stable v1 model id."""
    try:
        prefix = HF_COLUMN_PREFIXES[model_id]
    except KeyError:
        raise KeyError(
            f"Unknown model id {model_id!r}; expected one of "
            f"{', '.join(sorted(HF_COLUMN_PREFIXES))}"
        ) from None
    return f"{prefix}_{suffix}"


SENTIMENT_COLUMNS = [
    sentiment_column(model_id, suffix)
    for model_id in HF_COLUMN_PREFIXES
    for suffix in SENTIMENT_FIELD_SUFFIXES
]


def normalize_sentiment_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize an exact-model or legacy v1 HF snapshot to canonical columns.

    A model prefix is accepted only when *all* six sentiment fields are
    present. Mixing prefixes within one model would silently join analyses from
    different source generations, so it is rejected.
    """
    normalized = df.copy()
    missing_models: list[str] = []

    for model_id, candidates in HF_COLUMN_PREFIX_CANDIDATES.items():
        resolved_prefix = next(
            (
                prefix
                for prefix in candidates
                if all(
                    f"{prefix}_{suffix}" in normalized.columns
                    for suffix in SENTIMENT_FIELD_SUFFIXES
                )
            ),
            None,
        )
        if resolved_prefix is None:
            missing_models.append(model_id)
            continue

        canonical_prefix = HF_COLUMN_PREFIXES[model_id]
        if resolved_prefix != canonical_prefix:
            for suffix in SENTIMENT_FIELD_SUFFIXES:
                normalized[f"{canonical_prefix}_{suffix}"] = normalized[
                    f"{resolved_prefix}_{suffix}"
                ]

    if missing_models:
        raise ValueError(
            "Dataset has no complete v1 sentiment field set for model(s): "
            + ", ".join(missing_models)
        )
    return normalized
