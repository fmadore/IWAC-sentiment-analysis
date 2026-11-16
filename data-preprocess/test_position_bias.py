"""The position-bias check: χ² tail, both tests, and the published figures."""

from __future__ import annotations

import importlib.util
import math
import sys
from pathlib import Path

import pytest
from iwac_preprocess.arbiter_prompt import display_order
from iwac_preprocess.position_bias import (
    chi2_sf,
    naive_test,
    position_bias_report,
    seating_adjusted_test,
)
from validate_generated_data import ARBITER_V2_FILENAME, read_json


@pytest.mark.parametrize(
    ("statistic", "df", "expected"),
    [
        # Reference values of the chi-square survival function.
        (3.841458820694124, 1, 0.05),
        (5.991464547107979, 2, 0.05),
        (7.814727903251178, 3, 0.05),
        (9.487729036781154, 4, 0.05),
        (13.276704135987622, 4, 0.01),
        (11.070497693516351, 5, 0.05),
    ],
)
def test_chi2_tail_matches_reference_values(statistic, df, expected):
    assert chi2_sf(statistic, df) == pytest.approx(expected, rel=1e-6)


def test_chi2_tail_edges():
    assert chi2_sf(0, 4) == 1.0
    assert chi2_sf(1e6, 4) == pytest.approx(0.0, abs=1e-12)
    with pytest.raises(ValueError):
        chi2_sf(1.0, 0)


def fixed_order(article_id, labels):
    """Rotate the seating by article: every label sits in every slot equally."""
    shift = int(article_id) % len(labels)
    return list(labels[shift:]) + list(labels[:shift])


def test_a_balanced_seating_with_no_bias_has_no_signal():
    labels = ("a", "b", "c", "d", "e")
    # Label "a" always wins; under rotation it sits in each slot equally often.
    rows = [(str(i), "a", fixed_order(str(i), labels)) for i in range(50)]
    assert naive_test(rows, 5)["observed"] == [10] * 5
    adjusted = seating_adjusted_test(rows, 5, permutations=200, seed=1)
    assert adjusted["chi2"] == 0
    assert adjusted["p_permutation"] == 1.0


def test_the_seating_explains_a_strong_model_seated_unevenly():
    """A model that always wins and happens to sit first: a naive effect, no adjusted one."""
    rows = []
    for i in range(60):
        order = ["a", "b", "c", "d", "e"] if i < 30 else ["b", "a", "c", "d", "e"]
        rows.append((str(i), "a", order))
    naive = naive_test(rows, 5)
    assert naive["observed"] == [30, 30, 0, 0, 0]
    assert naive["p"] < 0.001
    adjusted = seating_adjusted_test(rows, 5, permutations=200, seed=1)
    assert adjusted["expected"] == [30.0, 30.0, 0.0, 0.0, 0.0]
    assert adjusted["chi2"] == 0


def test_the_permutation_test_is_deterministic_for_a_seed():
    payload = read_json(ARBITER_V2_FILENAME)
    first = position_bias_report(payload, display_order, permutations=300, seed=5)
    assert first == position_bias_report(payload, display_order, permutations=300, seed=5)


def test_the_published_run_figures():
    """The figures README and the methodology copy quote; recomputed, not copied."""
    report = position_bias_report(read_json(ARBITER_V2_FILENAME), display_order, permutations=2000)
    assert report["verdicts"] == 301
    assert report["single_winner"] == 228
    naive = report["naive"]
    assert naive["observed"] == [34, 50, 49, 44, 51]
    assert naive["chi2"] == pytest.approx(4.325, abs=1e-3)
    assert naive["p"] == pytest.approx(0.3639, abs=1e-4)
    adjusted = report["seating_adjusted"]
    assert adjusted["chi2"] == pytest.approx(1.893, abs=1e-3)
    assert 0.5 < adjusted["p_permutation"] < 0.8
    assert math.isclose(sum(adjusted["expected"]), 228, abs_tol=0.05)


def test_the_script_runs_offline(capsys):
    path = Path(__file__).with_name("arbiter-position-check.py")
    spec = importlib.util.spec_from_file_location("arbiter_position_check", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    report = module.main(["--permutations", "200"])
    assert report["single_winner"] == 228
    assert "Naive: chi2 = 4.325" in capsys.readouterr().out
