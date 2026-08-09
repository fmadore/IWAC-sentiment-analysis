"""Pure v1 cross-model discrepancy calculation."""

from __future__ import annotations

from typing import Any

from .contract import (
    CENTRALITY_NON_COMPARABLE,
    CENTRALITY_SCORES,
    POLARITY_NON_COMPARABLE,
    POLARITY_SCORES,
    SIGNIFICANT_CONFLICT_THRESHOLD,
)


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def calculate_discrepancies(analysis_a: dict, analysis_b: dict) -> dict | None:
    """Calculate a discrepancy only when both v1 analyses are comparable.

    Polarity ``Non applicable`` and centrality ``Non abordé`` mean that the
    sentiment task itself does not apply to the row. They are not ordinal
    endpoints and must not manufacture four- or five-point differences.
    Missing subjectivity skips that dimension while preserving comparable
    polarity/centrality evidence.
    """
    if not analysis_a or not analysis_b:
        return None

    polarity_a = analysis_a.get("polarite")
    polarity_b = analysis_b.get("polarite")
    centrality_a = analysis_a.get("centralite_islam_musulmans")
    centrality_b = analysis_b.get("centralite_islam_musulmans")

    if (
        polarity_a in POLARITY_NON_COMPARABLE
        or polarity_b in POLARITY_NON_COMPARABLE
        or centrality_a in CENTRALITY_NON_COMPARABLE
        or centrality_b in CENTRALITY_NON_COMPARABLE
    ):
        return None

    if polarity_a not in POLARITY_SCORES or polarity_b not in POLARITY_SCORES:
        return None
    if centrality_a not in CENTRALITY_SCORES or centrality_b not in CENTRALITY_SCORES:
        return None

    polarity_diff = abs(POLARITY_SCORES[polarity_a] - POLARITY_SCORES[polarity_b])
    centrality_diff = abs(CENTRALITY_SCORES[centrality_a] - CENTRALITY_SCORES[centrality_b])

    subj_a = _optional_int(analysis_a.get("subjectivite_score"))
    subj_b = _optional_int(analysis_b.get("subjectivite_score"))
    subjectivity_diff = abs(subj_a - subj_b) if subj_a is not None and subj_b is not None else 0

    has_significant_conflict = any(
        difference >= SIGNIFICANT_CONFLICT_THRESHOLD
        for difference in (polarity_diff, subjectivity_diff, centrality_diff)
    )

    return {
        "polarity_diff": polarity_diff,
        "subjectivity_diff": subjectivity_diff,
        "centrality_diff": centrality_diff,
        "total_diff": polarity_diff + subjectivity_diff + centrality_diff,
        "has_significant_conflict": has_significant_conflict,
    }
