"""Compare two panel arbiters on the articles both judged; pure, no I/O.

Two questions, on polarity, where each judge gives its *own* score:

* **Judge agreement** — how often the second judge's polarity matches the
  published arbiter's on the shared articles, as raw rates and as Cohen's κ
  (unweighted over every label, quadratic-weighted over the applicable 1-5
  ranks, the dashboard's v2 polarity rule). The blind labels cannot be
  compared across judges (each reads a different panel under its own
  permutation), so preferences are deliberately left out.
* **Own-developer affinity** — a difference-in-differences per judge. For judge
  J with reference judge K::

      affinity(J) = mean over J's own developer's models m of [match(J, m) - match(K, m)]
                  - mean over control models c of           [match(J, c) - match(K, c)]

  ``match(J, m)`` is the share of shared articles where J's polarity equals
  model m's rating. Controls are the models *both* judges read, so a judge that
  simply agrees with the panel more often is differenced away. A positive value
  says J agrees with its own developer's model more than K does, beyond its
  general excess agreement.

Every reported quantity carries a 95% percentile interval from an article
bootstrap: the shared articles are resampled with replacement, seeded, so a
run reproduces its intervals exactly. The interval describes sampling
variation over these articles only — not the selection of the frame, which is
the panel's disagreements and nothing like a random sample of the corpus.

Read the sign with its confound: recusal means J never read its own
developer's model while K did. *If* reading an analysis can only pull a judge
towards it (anchoring), K's match with that model is inflated and J's affinity
is biased downwards, so a positive estimate is not an artefact of exposure and
a value near zero cannot rule out a small affinity. That direction is an
assumption, not a property of the design: were a judge as likely to react
against an analysis it was shown, the bias could go either way and the
estimate would not be conservative.
"""

from __future__ import annotations

import random
from collections import Counter
from collections.abc import Callable, Mapping, Sequence
from statistics import fmean
from typing import Any

from .contract import SentimentContract

Verdicts = Mapping[str, str]
Ratings = Mapping[str, Mapping[str, str | None]]

BOOTSTRAP_SAMPLES = 2000
BOOTSTRAP_SEED = 20261114
CONFIDENCE = 0.95


def polarity_verdicts(evaluations: list[dict]) -> dict[str, str]:
    """``article_id -> polarity`` from a published or cached arbiter file."""
    return {
        str(row["article_id"]): row["arbiter"]["polarity"]["score"]
        for row in evaluations
        if row.get("arbiter", {}).get("polarity", {}).get("score")
    }


def applicable_ranks(contract: SentimentContract) -> list[int]:
    """The polarity ranks a weighted statistic may use (``Non applicable`` is 0)."""
    return sorted({rank for rank in contract.polarity_scores.values() if rank > 0})


def valence_bands(contract: SentimentContract) -> tuple[int, int]:
    """``(positive minimum, negative maximum)`` ranks, from the contract.

    The contract's ``valenceFlip`` bands where it declares them (v2); otherwise
    the ranks either side of the scale's midpoint, read from the scale itself
    rather than assumed to be a 1-5 scale.
    """
    if contract.polarity_valence_bands is not None:
        return contract.polarity_valence_bands
    ranks = applicable_ranks(contract)
    if len(ranks) % 2 == 0:
        raise ValueError(
            f"The {contract.analysis_version} polarity scale has no neutral midpoint and "
            "declares no valence bands"
        )
    middle = ranks[len(ranks) // 2]
    return middle + 1, middle - 1


def cohen_kappa(pairs: Sequence[tuple[Any, Any]]) -> float | None:
    """Unweighted Cohen's κ over every observed category; ``None`` if undefined."""
    if not pairs:
        return None
    n = len(pairs)
    observed = sum(a == b for a, b in pairs) / n
    first, second = Counter(a for a, _ in pairs), Counter(b for _, b in pairs)
    expected = sum(first[c] * second[c] for c in first.keys() | second.keys()) / n**2
    if expected == 1:
        return None
    return (observed - expected) / (1 - expected)


def weighted_kappa(pairs: Sequence[tuple[int, int]], categories: Sequence[int]) -> float | None:
    """Quadratic-weighted Cohen's κ over ordinal ``categories``; ``None`` if undefined.

    The weights are those of ``kappaFromMatrix(..., 'quadratic')`` in the
    browser's ``agreementMetrics.ts``: ``1 - (i - j)^2 / (k - 1)^2``.
    """
    if not pairs or len(categories) < 2:
        return None
    position = {category: index for index, category in enumerate(categories)}
    span = (len(categories) - 1) ** 2

    def weight(a: int, b: int) -> float:
        return 1 - (position[a] - position[b]) ** 2 / span

    n = len(pairs)
    observed = sum(weight(a, b) for a, b in pairs) / n
    first, second = Counter(a for a, _ in pairs), Counter(b for _, b in pairs)
    expected = sum(first[a] * second[b] * weight(a, b) for a in categories for b in categories) / (
        n**2
    )
    if expected == 1:
        return None
    return (observed - expected) / (1 - expected)


def bootstrap_intervals(
    article_ids: Sequence[str],
    statistics: Callable[[Sequence[str]], Mapping[str, float | None]],
    *,
    samples: int = BOOTSTRAP_SAMPLES,
    seed: int = BOOTSTRAP_SEED,
    confidence: float = CONFIDENCE,
) -> dict[str, list[float] | None]:
    """Percentile intervals for every scalar ``statistics`` returns.

    Articles are the resampling unit. Deterministic for a given ``seed``,
    ``samples`` and article order (the ids are sorted first). A statistic that
    is undefined in a resample (``None``) is left out of that statistic's
    distribution; one undefined in every resample gets ``None``.
    """
    ids = sorted(article_ids)
    if not ids or samples < 1:
        return {key: None for key in statistics(ids)}
    rng = random.Random(seed)
    draws: dict[str, list[float]] = {}
    for _ in range(samples):
        resample = [ids[rng.randrange(len(ids))] for _ in ids]
        for key, value in statistics(resample).items():
            draws.setdefault(key, [])
            if value is not None:
                draws[key].append(value)
    tail = (1 - confidence) / 2
    intervals: dict[str, list[float] | None] = {}
    for key, values in draws.items():
        if not values:
            intervals[key] = None
            continue
        values.sort()
        low = values[min(len(values) - 1, int(tail * len(values)))]
        high = values[max(0, min(len(values) - 1, int((1 - tail) * len(values)) - 1))]
        intervals[key] = [round(low, 4), round(high, 4)]
    return intervals


def _agreement_statistics(
    first: Verdicts, second: Verdicts, contract: SentimentContract, article_ids: Sequence[str]
) -> dict[str, Any]:
    exact = sum(first[article_id] == second[article_id] for article_id in article_ids)
    ranks = [
        (contract.polarity_scores[first[article_id]], contract.polarity_scores[second[article_id]])
        for article_id in article_ids
    ]
    comparable = [(a, b) for a, b in ranks if a > 0 and b > 0]
    positive_minimum, negative_maximum = valence_bands(contract)

    def side(rank: int) -> int:
        return 1 if rank >= positive_minimum else -1 if rank <= negative_maximum else 0

    within_one = sum(abs(a - b) <= 1 for a, b in comparable)
    same_sign = sum(side(a) == side(b) for a, b in comparable)
    return {
        "articles": len(article_ids),
        "exact": exact,
        "comparable": len(comparable),
        "within_one": within_one,
        "same_sign": same_sign,
        "exact_rate": exact / len(article_ids) if article_ids else None,
        "within_one_rate": within_one / len(comparable) if comparable else None,
        "same_sign_rate": same_sign / len(comparable) if comparable else None,
        "kappa": cohen_kappa([(first[i], second[i]) for i in article_ids]),
        "weighted_kappa": weighted_kappa(comparable, applicable_ranks(contract)),
    }


AGREEMENT_RATES = ("exact_rate", "within_one_rate", "same_sign_rate", "kappa", "weighted_kappa")


def judge_agreement(
    first: Verdicts,
    second: Verdicts,
    contract: SentimentContract,
    *,
    bootstrap_samples: int = BOOTSTRAP_SAMPLES,
    seed: int = BOOTSTRAP_SEED,
) -> dict:
    """Exact, within-one-step and same-sign agreement and κ on the shared articles.

    Within-one, sign agreement and weighted κ need two ranks on the 1-5 scale,
    so an article either judge called `Non applicable` counts towards
    ``articles``, ``exact`` and the unweighted ``kappa`` only; ``comparable`` is
    the denominator of the rest. ``intervals`` holds a 95% article-bootstrap
    interval for every rate and κ.
    """
    shared = sorted(set(first) & set(second))
    point = _agreement_statistics(first, second, contract, shared)

    def rates(sample: Sequence[str]) -> dict[str, float | None]:
        statistics = _agreement_statistics(first, second, contract, sample)
        return {key: statistics[key] for key in AGREEMENT_RATES}

    return {
        **{key: point[key] for key in ("articles", "exact", "comparable")},
        "exact_rate": round(point["exact_rate"], 3) if shared else None,
        "within_one": point["within_one"],
        "same_sign": point["same_sign"],
        "within_one_rate": point["within_one_rate"],
        "same_sign_rate": point["same_sign_rate"],
        "kappa": point["kappa"],
        "weighted_kappa": point["weighted_kappa"],
        "intervals": bootstrap_intervals(shared, rates, samples=bootstrap_samples, seed=seed),
        "bootstrap": {"samples": bootstrap_samples, "seed": seed, "confidence": CONFIDENCE},
    }


def match_rates(verdicts: Verdicts, ratings: Ratings, article_ids: list[str]) -> dict[str, dict]:
    """Per model: on how many of ``article_ids`` it has a rating, and how many equal the verdict."""
    rates: dict[str, dict] = {}
    for model_id, model_ratings in ratings.items():
        rated = [
            article_id for article_id in article_ids if model_ratings.get(article_id) is not None
        ]
        matches = sum(model_ratings[article_id] == verdicts[article_id] for article_id in rated)
        rates[model_id] = {
            "rated": len(rated),
            "matches": matches,
            "rate": matches / len(rated) if rated else None,
        }
    return rates


def own_developer_affinity(
    judges: Mapping[str, tuple[str, Verdicts]],
    ratings: Ratings,
    contract: SentimentContract,
    *,
    bootstrap_samples: int = BOOTSTRAP_SAMPLES,
    seed: int = BOOTSTRAP_SEED,
) -> dict[str, Any]:
    """Each judge's affinity for its own developer's models; see the module docstring.

    ``judges`` maps a judge name to ``(developer id, polarity verdicts)`` and
    must hold exactly two. The comparison runs on the articles both judged.
    ``intervals`` holds a 95% article-bootstrap interval for every match rate,
    gap and difference-in-differences, resampling the shared articles once per
    draw so the two judges' figures stay paired.
    """
    if len(judges) != 2:
        raise ValueError("The difference-in-differences compares exactly two judges")
    (name_a, (developer_a, verdicts_a)), (name_b, (developer_b, verdicts_b)) = judges.items()
    if developer_a == developer_b:
        raise ValueError("Two judges from one developer leave nothing to difference")
    shared = sorted(set(verdicts_a) & set(verdicts_b))
    recused = {
        name_a: contract.recused_for(developer_a),
        name_b: contract.recused_for(developer_b),
    }
    controls = [
        model_id
        for model_id in ratings
        if model_id not in recused[name_a] and model_id not in recused[name_b]
    ]
    pairs = ((name_a, name_b), (name_b, name_a))

    def compute(article_ids: Sequence[str]) -> tuple[dict, dict]:
        rates = {
            name_a: match_rates(verdicts_a, ratings, list(article_ids)),
            name_b: match_rates(verdicts_b, ratings, list(article_ids)),
        }

        def gap(judge: str, other: str, model_id: str) -> float | None:
            mine, theirs = rates[judge][model_id]["rate"], rates[other][model_id]["rate"]
            return None if mine is None or theirs is None else mine - theirs

        def mean_gap(judge: str, other: str, model_ids: list[str]) -> float | None:
            gaps = [
                value
                for model_id in model_ids
                if (value := gap(judge, other, model_id)) is not None
            ]
            return fmean(gaps) if gaps else None

        affinity: dict[str, Any] = {}
        for judge, other in pairs:
            own = [model_id for model_id in recused[judge] if model_id in ratings]
            own_gap = mean_gap(judge, other, own)
            control_gap = mean_gap(judge, other, controls)
            affinity[judge] = {
                "own_models": own,
                "own_gap": own_gap,
                "control_gap": control_gap,
                "difference_in_differences": (
                    None if own_gap is None or control_gap is None else own_gap - control_gap
                ),
            }
        return rates, affinity

    def scalars(article_ids: Sequence[str]) -> dict[str, float | None]:
        rates, affinity = compute(article_ids)
        flat: dict[str, float | None] = {}
        for judge in (name_a, name_b):
            for model_id, entry in rates[judge].items():
                flat[f"{judge}|rate|{model_id}"] = entry["rate"]
            for key in ("own_gap", "control_gap", "difference_in_differences"):
                flat[f"{judge}|{key}"] = affinity[judge][key]
        return flat

    rates, affinity = compute(shared)
    intervals = bootstrap_intervals(shared, scalars, samples=bootstrap_samples, seed=seed)
    for judge in (name_a, name_b):
        affinity[judge]["intervals"] = {
            key: intervals[f"{judge}|{key}"]
            for key in ("own_gap", "control_gap", "difference_in_differences")
        }
        for model_id, entry in rates[judge].items():
            entry["interval"] = intervals[f"{judge}|rate|{model_id}"]
    return {
        "articles": len(shared),
        "controls": controls,
        "match_rates": rates,
        "affinity": affinity,
        "bootstrap": {"samples": bootstrap_samples, "seed": seed, "confidence": CONFIDENCE},
    }
