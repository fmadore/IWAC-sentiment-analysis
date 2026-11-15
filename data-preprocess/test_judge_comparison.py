"""κ, bootstrap intervals and scale handling of the two-judge comparison."""

from __future__ import annotations

import pytest
from iwac_preprocess import CONTRACT_V1, CONTRACT_V2
from iwac_preprocess.judge_comparison import (
    AGREEMENT_RATES,
    applicable_ranks,
    bootstrap_intervals,
    cohen_kappa,
    judge_agreement,
    own_developer_affinity,
    valence_bands,
    weighted_kappa,
)


def test_cohen_kappa_matches_a_hand_computation():
    # 2x2: 20 agree yes, 15 agree no, 5 + 10 disagree. po = 0.7;
    # pe = (25/50)(30/50) + (25/50)(20/50) = 0.3 + 0.2 = 0.5; kappa = 0.4.
    pairs = [("y", "y")] * 20 + [("n", "n")] * 15 + [("y", "n")] * 5 + [("n", "y")] * 10
    assert cohen_kappa(pairs) == pytest.approx(0.4)


def test_kappa_is_undefined_without_variation_or_data():
    assert cohen_kappa([]) is None
    assert cohen_kappa([("a", "a")] * 5) is None


def test_weighted_kappa_rewards_near_misses_on_the_ordinal_scale():
    ranks = applicable_ranks(CONTRACT_V2)
    assert ranks == [1, 2, 3, 4, 5]
    perfect = [(r, r) for r in ranks for _ in range(3)]
    assert weighted_kappa(perfect, ranks) == pytest.approx(1.0)
    near = [(r, min(r + 1, 5)) for r in ranks for _ in range(3)]
    far = [(r, 6 - r) for r in ranks for _ in range(3)]
    assert weighted_kappa(near, ranks) > 0.5 > weighted_kappa(far, ranks)
    # Unweighted kappa cannot tell a near miss from a reversal.
    assert cohen_kappa(near) < weighted_kappa(near, ranks)


def test_weighted_kappa_matches_a_hand_computation():
    # Two raters on three categories, quadratic weights 1, 0.75, 0.
    pairs = [(1, 1), (2, 2), (3, 3), (1, 2)]
    # observed = (1 + 1 + 1 + 0.75) / 4 = 0.9375
    # marginals: first {1: 2, 2: 1, 3: 1}, second {1: 1, 2: 2, 3: 1}
    # expected = sum f1[a] f2[b] w(a, b) / 16
    #          = (2*1*1 + 2*2*.75 + 2*1*0 + 1*1*.75 + 1*2*1 + 1*1*.75
    #             + 1*1*0 + 1*2*.75 + 1*1*1) / 16 = 11 / 16 = 0.6875
    expected = 11 / 16
    assert weighted_kappa(pairs, [1, 2, 3]) == pytest.approx((0.9375 - expected) / (1 - expected))


def test_valence_bands_come_from_the_contract_not_a_constant():
    assert valence_bands(CONTRACT_V2) == CONTRACT_V2.polarity_valence_bands
    # v1 declares no bands; they are read off its scale's midpoint.
    assert CONTRACT_V1.polarity_valence_bands is None
    assert valence_bands(CONTRACT_V1) == (4, 2)


def test_bootstrap_is_deterministic_for_a_seed():
    ids = [str(i) for i in range(40)]
    values = {i: int(i) % 3 == 0 for i in ids}

    def share(sample):
        return {"share": sum(values[i] for i in sample) / len(sample)}

    first = bootstrap_intervals(ids, share, samples=300, seed=7)
    assert first == bootstrap_intervals(list(reversed(ids)), share, samples=300, seed=7)
    low, high = first["share"]
    assert low <= share(ids)["share"] <= high
    assert bootstrap_intervals(ids, share, samples=300, seed=8) != first or low == high


def test_bootstrap_of_nothing_reports_no_interval():
    assert bootstrap_intervals([], lambda sample: {"share": None}) == {"share": None}


def verdict_sets():
    labels = ["Positif", "Négatif", "Neutre", "Très négatif", "Non applicable"]
    first = {str(i): labels[i % 5] for i in range(50)}
    second = {
        article_id: ("Neutre" if int(article_id) % 7 == 0 else label)
        for article_id, label in first.items()
    }
    return first, second


def test_judge_agreement_reports_kappa_and_an_interval_for_every_rate():
    first, second = verdict_sets()
    agreement = judge_agreement(first, second, CONTRACT_V2, bootstrap_samples=200, seed=1)
    assert agreement["articles"] == 50
    assert 0 < agreement["kappa"] < 1
    assert 0 < agreement["weighted_kappa"] <= 1
    assert set(agreement["intervals"]) == set(AGREEMENT_RATES)
    for key in AGREEMENT_RATES:
        low, high = agreement["intervals"][key]
        assert low <= agreement[key] + 1e-9 and agreement[key] - 1e-9 <= high, key
    assert agreement == judge_agreement(first, second, CONTRACT_V2, bootstrap_samples=200, seed=1)


def test_affinity_reports_an_interval_for_the_difference_in_differences():
    ids = [str(i) for i in range(30)]
    models = list(CONTRACT_V2.model_names)
    ratings = {model_id: dict.fromkeys(ids, "Positif") for model_id in models}
    for article_id in ids[:12]:
        ratings["gemma"][article_id] = "Négatif"
    google = {**dict.fromkeys(ids, "Positif"), **dict.fromkeys(ids[:10], "Négatif")}
    opus = dict.fromkeys(ids, "Positif")
    result = own_developer_affinity(
        {"claude-opus-5": ("anthropic", opus), "gemini-4-argon": ("google", google)},
        ratings,
        CONTRACT_V2,
        bootstrap_samples=300,
        seed=3,
    )
    google_affinity = result["affinity"]["gemini-4-argon"]
    low, high = google_affinity["intervals"]["difference_in_differences"]
    assert low <= google_affinity["difference_in_differences"] <= high
    assert set(google_affinity["intervals"]) == {
        "own_gap",
        "control_gap",
        "difference_in_differences",
    }
    gemma = result["match_rates"]["gemini-4-argon"]["gemma"]
    assert gemma["interval"][0] <= gemma["rate"] <= gemma["interval"][1]
    assert result["bootstrap"] == {"samples": 300, "seed": 3, "confidence": 0.95}
