"""Compare two panel arbiters on the articles both judged; pure, no I/O.

Two questions, on polarity, where each judge gives its *own* score:

* **Judge agreement** — how often the second judge's polarity matches the
  published arbiter's on the shared articles. The blind labels cannot be
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

Read the sign with its confound: recusal means J never read its own developer's
model while K did, so anchoring on a model it was shown inflates K's match and
pulls J's affinity *down*. The estimate is conservative — a positive value
survives the confound, a value near zero cannot rule out a small affinity.
"""

from __future__ import annotations

from collections.abc import Mapping
from statistics import fmean
from typing import Any

from .contract import SentimentContract

Verdicts = Mapping[str, str]
Ratings = Mapping[str, Mapping[str, str | None]]


def polarity_verdicts(evaluations: list[dict]) -> dict[str, str]:
    """``article_id -> polarity`` from a published or cached arbiter file."""
    return {
        str(row["article_id"]): row["arbiter"]["polarity"]["score"]
        for row in evaluations
        if row.get("arbiter", {}).get("polarity", {}).get("score")
    }


def judge_agreement(first: Verdicts, second: Verdicts, contract: SentimentContract) -> dict:
    """Exact, within-one-step and same-sign agreement on the shared articles.

    Within-one and sign agreement need two ranks on the 1-5 scale, so an article
    either judge called `Non applicable` counts towards ``articles`` and
    ``exact`` only; ``comparable`` is the denominator of the other two.
    """
    shared = sorted(set(first) & set(second))
    exact = sum(first[article_id] == second[article_id] for article_id in shared)
    ranks = [
        (contract.polarity_scores[first[article_id]], contract.polarity_scores[second[article_id]])
        for article_id in shared
    ]
    comparable = [(a, b) for a, b in ranks if a > 0 and b > 0]
    positive_minimum, negative_maximum = contract.polarity_valence_bands or (4, 2)

    def side(rank: int) -> int:
        return 1 if rank >= positive_minimum else -1 if rank <= negative_maximum else 0

    return {
        "articles": len(shared),
        "exact": exact,
        "exact_rate": round(exact / len(shared), 3) if shared else None,
        "comparable": len(comparable),
        "within_one": sum(abs(a - b) <= 1 for a, b in comparable),
        "same_sign": sum(side(a) == side(b) for a, b in comparable),
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
) -> dict[str, Any]:
    """Each judge's affinity for its own developer's models; see the module docstring.

    ``judges`` maps a judge name to ``(developer id, polarity verdicts)`` and
    must hold exactly two. The comparison runs on the articles both judged.
    """
    if len(judges) != 2:
        raise ValueError("The difference-in-differences compares exactly two judges")
    (name_a, (developer_a, verdicts_a)), (name_b, (developer_b, verdicts_b)) = judges.items()
    if developer_a == developer_b:
        raise ValueError("Two judges from one developer leave nothing to difference")
    shared = sorted(set(verdicts_a) & set(verdicts_b))
    rates = {
        name_a: match_rates(verdicts_a, ratings, shared),
        name_b: match_rates(verdicts_b, ratings, shared),
    }
    recused = {
        name_a: contract.recused_for(developer_a),
        name_b: contract.recused_for(developer_b),
    }
    controls = [
        model_id
        for model_id in ratings
        if model_id not in recused[name_a] and model_id not in recused[name_b]
    ]

    def gap(judge: str, other: str, model_id: str) -> float | None:
        mine, theirs = rates[judge][model_id]["rate"], rates[other][model_id]["rate"]
        return None if mine is None or theirs is None else mine - theirs

    def mean_gap(judge: str, other: str, model_ids: list[str]) -> float | None:
        gaps = [
            value for model_id in model_ids if (value := gap(judge, other, model_id)) is not None
        ]
        return fmean(gaps) if gaps else None

    affinity: dict[str, Any] = {}
    for judge, other in ((name_a, name_b), (name_b, name_a)):
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
    return {
        "articles": len(shared),
        "controls": controls,
        "match_rates": rates,
        "affinity": affinity,
    }
