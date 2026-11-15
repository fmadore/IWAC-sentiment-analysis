"""Did the panel arbiter favour an analysis for the slot it was shown in?

The blind labels are fixed for a run, but ``arbiter_prompt.display_order``
reshuffles the order the analyses are *presented* in for every article, seeded
on the article id. That makes position checkable after the fact: for every
verdict naming a single winning analysis, the slot it occupied is known.

Two tests, both over the single-winner verdicts (``multiple`` and ``none``
name no slot):

* **Naive.** Pearson χ² of the winners' slots against a uniform split, 4 df
  for five slots. Under the design every model is equally likely to sit in any
  slot, so with no position effect this is the right null *in expectation*.
* **Seating-adjusted.** In one run the realised shuffle is not balanced: the
  model the judge prefers most can happen to sit in some slots more often than
  others, and its preference then shows up as a position effect. The expected
  wins per slot are therefore computed from the seating: each model's overall
  share of single wins, summed over the slot it sat in on each article. The
  p-value comes from a permutation test that keeps every article's seating and
  every model's number of wins fixed, and reassigns which article each win
  belongs to — exactly the null "position is unrelated to winning, given who
  wins how often". The asymptotic χ² p-value is reported beside it for
  reference only: the expected counts are estimated from the same data, so 4
  df is approximate.

With a couple of hundred verdicts either test has little power against a
modest bias; a p-value above 0.05 is absence of evidence, not evidence of
absence.
"""

from __future__ import annotations

import math
import random
from collections import Counter
from collections.abc import Callable, Mapping, Sequence
from typing import Any

PERMUTATIONS = 10_000
PERMUTATION_SEED = 20260904


def chi2_sf(statistic: float, df: int) -> float:
    """Upper-tail probability of a χ² distribution with integer ``df``.

    Closed forms of the regularised upper incomplete gamma function, so the
    check needs nothing beyond the standard library.
    """
    if df < 1:
        raise ValueError("df must be a positive integer")
    if statistic <= 0:
        return 1.0
    half = statistic / 2
    if df % 2 == 0:
        term, total = 1.0, 1.0
        for k in range(1, df // 2):
            term *= half / k
            total += term
        return math.exp(-half) * total
    total = math.erfc(math.sqrt(half))
    term = math.sqrt(half) / math.gamma(1.5)
    for k in range(1, (df + 1) // 2):
        total += math.exp(-half) * term
        term *= half / (k + 0.5)
    return min(1.0, total)


def pearson_chi2(observed: Sequence[float], expected: Sequence[float]) -> float:
    return sum((o - e) ** 2 / e for o, e in zip(observed, expected, strict=True) if e > 0)


def single_winner_rows(
    evaluations: Sequence[Mapping[str, Any]],
    labels: Sequence[str],
    order_of: Callable[[str, Sequence[str]], list[str]],
) -> list[tuple[str, str, list[str]]]:
    """``(article id, winning label, presentation order)`` per single-winner verdict."""
    rows: list[tuple[str, str, list[str]]] = []
    for row in evaluations:
        winner = (row.get("arbiter") or {}).get("overall_winner")
        if isinstance(winner, str) and winner in labels:
            article_id = str(row["article_id"])
            rows.append((article_id, winner, order_of(article_id, tuple(labels))))
    return rows


def slot_counts(rows: Sequence[tuple[str, str, list[str]]], slots: int) -> list[int]:
    counts = Counter(order.index(winner) for _, winner, order in rows)
    return [counts[slot] for slot in range(slots)]


def naive_test(rows: Sequence[tuple[str, str, list[str]]], slots: int) -> dict[str, Any]:
    observed = slot_counts(rows, slots)
    expected = [len(rows) / slots] * slots
    statistic = pearson_chi2(observed, expected)
    return {
        "observed": observed,
        "expected": [round(value, 2) for value in expected],
        "chi2": round(statistic, 3),
        "df": slots - 1,
        "p": round(chi2_sf(statistic, slots - 1), 4),
    }


def seating_adjusted_test(
    rows: Sequence[tuple[str, str, list[str]]],
    slots: int,
    *,
    permutations: int = PERMUTATIONS,
    seed: int = PERMUTATION_SEED,
) -> dict[str, Any]:
    """χ² against seating-aware expectations, with a conditional permutation p-value."""
    n = len(rows)
    wins = Counter(winner for _, winner, _ in rows)
    share = {label: count / n for label, count in wins.items()}
    expected = [0.0] * slots
    for _, _, order in rows:
        for slot, label in enumerate(order):
            expected[slot] += share.get(label, 0.0)
    observed = slot_counts(rows, slots)
    statistic = pearson_chi2(observed, expected)

    orders = [order for _, _, order in rows]
    winners = [winner for _, winner, _ in rows]
    rng = random.Random(seed)
    at_least = 0
    for _ in range(permutations):
        rng.shuffle(winners)
        counts = [0] * slots
        for order, winner in zip(orders, winners, strict=True):
            counts[order.index(winner)] += 1
        if pearson_chi2(counts, expected) >= statistic - 1e-12:
            at_least += 1
    return {
        "observed": observed,
        "expected": [round(value, 2) for value in expected],
        "chi2": round(statistic, 3),
        "df": slots - 1,
        "p_asymptotic": round(chi2_sf(statistic, slots - 1), 4),
        "p_permutation": round((at_least + 1) / (permutations + 1), 4),
        "permutations": permutations,
        "seed": seed,
        "wins_by_label": dict(sorted(wins.items())),
    }


def position_bias_report(
    payload: Mapping[str, Any],
    order_of: Callable[[str, Sequence[str]], list[str]],
    *,
    permutations: int = PERMUTATIONS,
    seed: int = PERMUTATION_SEED,
) -> dict[str, Any]:
    """Both tests over a published panel arbiter file.

    ``order_of`` is ``arbiter_prompt.display_order``, passed in so the module
    stays free of the prompt and testable with a known seating.
    """
    labels = sorted(payload["metadata"]["blind_permutation"])
    evaluations = payload.get("evaluations", [])
    rows = single_winner_rows(evaluations, labels, order_of)
    slots = len(labels)
    return {
        "verdicts": len(evaluations),
        "single_winner": len(rows),
        "slots": slots,
        "naive": naive_test(rows, slots),
        "seating_adjusted": seating_adjusted_test(
            rows, slots, permutations=permutations, seed=seed
        ),
    }
