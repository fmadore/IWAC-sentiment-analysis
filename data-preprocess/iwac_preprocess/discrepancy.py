"""Pure cross-model discrepancy and spread calculations."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from .contract import CONTRACT_V1, SentimentContract


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def calculate_discrepancies(
    analysis_a: dict, analysis_b: dict, contract: SentimentContract = CONTRACT_V1
) -> dict | None:
    """Calculate a discrepancy only when both analyses are comparable.

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
        polarity_a in contract.polarity_non_comparable
        or polarity_b in contract.polarity_non_comparable
        or centrality_a in contract.centrality_non_comparable
        or centrality_b in contract.centrality_non_comparable
    ):
        return None

    if polarity_a not in contract.polarity_scores or polarity_b not in contract.polarity_scores:
        return None
    if (
        centrality_a not in contract.centrality_scores
        or centrality_b not in contract.centrality_scores
    ):
        return None

    polarity_diff = abs(contract.polarity_scores[polarity_a] - contract.polarity_scores[polarity_b])
    centrality_diff = abs(
        contract.centrality_scores[centrality_a] - contract.centrality_scores[centrality_b]
    )

    subj_a = _optional_int(analysis_a.get("subjectivite_score"))
    subj_b = _optional_int(analysis_b.get("subjectivite_score"))
    subjectivity_diff = abs(subj_a - subj_b) if subj_a is not None and subj_b is not None else 0

    has_significant_conflict = any(
        difference >= contract.significant_conflict_threshold
        for difference in (polarity_diff, subjectivity_diff, centrality_diff)
    )

    return {
        "polarity_diff": polarity_diff,
        "subjectivity_diff": subjectivity_diff,
        "centrality_diff": centrality_diff,
        "total_diff": polarity_diff + subjectivity_diff + centrality_diff,
        "has_significant_conflict": has_significant_conflict,
    }


def calculate_three_way_spread(
    analyses: Sequence[dict], contract: SentimentContract = CONTRACT_V1
) -> dict | None:
    """Measure how far apart a panel's analyses of the same article sit.

    The name is historical: the panel was three models when the function was
    written and is five now, and the contract key (``threeWaySpread``) is a
    cross-language API. The calculation has always been over ``analyses``,
    whatever its length.

    The comparability rules match the pairwise calculation: a single
    non-comparable polarity or centrality excludes the whole row, because the
    models are then disagreeing about whether the task applies rather than
    about the answer. Subjectivity contributes a spread only when every model
    scored it, so a declined score never reads as agreement.
    """
    if len(analyses) < 2 or not all(analyses):
        return None

    polarities = [analysis.get("polarite") for analysis in analyses]
    centralities = [analysis.get("centralite_islam_musulmans") for analysis in analyses]

    if any(value in contract.polarity_non_comparable for value in polarities):
        return None
    if any(value in contract.centrality_non_comparable for value in centralities):
        return None
    if any(value not in contract.polarity_scores for value in polarities):
        return None
    if any(value not in contract.centrality_scores for value in centralities):
        return None

    polarity_ranks = [contract.polarity_scores[value] for value in polarities]
    centrality_ranks = [contract.centrality_scores[value] for value in centralities]
    polarity_spread = max(polarity_ranks) - min(polarity_ranks)
    centrality_spread = max(centrality_ranks) - min(centrality_ranks)

    subjectivity_ranks = [
        _optional_int(analysis.get("subjectivite_score")) for analysis in analyses
    ]
    if any(rank is None for rank in subjectivity_ranks):
        subjectivity_spread = 0
    else:
        subjectivity_spread = max(subjectivity_ranks) - min(subjectivity_ranks)  # type: ignore[type-var]

    threshold = contract.significant_spread_threshold or contract.significant_conflict_threshold
    spreads = (polarity_spread, subjectivity_spread, centrality_spread)

    return {
        "polarity_spread": polarity_spread,
        "subjectivity_spread": subjectivity_spread,
        "centrality_spread": centrality_spread,
        "total_spread": sum(spreads),
        "has_significant_spread": any(spread >= threshold for spread in spreads),
    }


def has_polarity_valence_flip(
    analyses: Sequence[dict], contract: SentimentContract = CONTRACT_V1
) -> bool:
    """Whether the panel disagrees about the *sign* of the polarity.

    A flip is at least one model at or above ``positiveMinimum`` and at least
    one at or below ``negativeMaximum`` on the same article: one reads the
    coverage as favourable, another as hostile.

    This is not the amplitude question restated. On the 1-5 scale a spread of 3
    already *implies* a flip — the arithmetic leaves no other arrangement — so
    the spread rule catches the widest reversals for free. What it can never
    reach is the commonest flip of all, ``Positif`` against ``Négatif``, which
    spans only 2 ranks; no threshold at or above the contract's significant
    spread can select it, which is why this rule exists separately.

    Returns ``False`` rather than ``None`` on a row the panel cannot be compared
    on, so callers can combine it with the spread rule without a three-valued
    dance. The comparability gate is `calculate_three_way_spread`'s own, called
    here rather than reimplemented so the two rules cannot drift apart.
    """
    if contract.polarity_valence_bands is None:
        return False
    if calculate_three_way_spread(analyses, contract) is None:
        return False

    positive_minimum, negative_maximum = contract.polarity_valence_bands
    ranks = [contract.polarity_scores[analysis.get("polarite")] for analysis in analyses]
    return any(rank >= positive_minimum for rank in ranks) and any(
        rank <= negative_maximum for rank in ranks
    )


def is_arbiter_eligible(
    analyses: Sequence[dict], contract: SentimentContract = CONTRACT_V1
) -> bool:
    """Whether an article may appear in the panel arbiter's published output.

    The union of the contract's two arbiter rules: a significant spread on any
    dimension, or a polarity valence flip. Deliberately *not* the same predicate
    as ``has_significant_spread`` — that one is what the dashboard flags to a
    reader, and widening what we chose to pay for must not move it.

    ``validate_arbiter_three_way`` computes the frame with this function and
    requires the published ids to be a subset of it. A run may narrow the rule
    with ``--rule`` or ``--dimensions``; nothing may widen it past this without
    a contract change.
    """
    spread = calculate_three_way_spread(analyses, contract)
    if spread is None:
        return False
    return bool(spread["has_significant_spread"]) or has_polarity_valence_flip(analyses, contract)
