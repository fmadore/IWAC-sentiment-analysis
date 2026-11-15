"""Shared fixtures and literals that both languages, or two modules, must agree on.

``test_contract.py`` runs every discrepancy fixture through the Python rules;
the TypeScript suite (``discrepancyContractV2.test.ts``) reads the same file.
This module guards the fixtures' coverage of the panel sizes that exist, the
shared recusal fixture, and the arbiter schema's preference literals.
"""

from __future__ import annotations

import json
from typing import get_args

import pytest
from iwac_preprocess import CONTRACT_V1, CONTRACT_V2
from iwac_preprocess.arbiter_prompt import BLIND_LABELS
from iwac_preprocess.arbiter_schema import (
    PREFERENCE_VALUES,
    ArbiterResponseV2,
    DimensionVerdict,
)
from iwac_preprocess.contract import CONTRACT_DIR

DISCREPANCY_V2 = json.loads((CONTRACT_DIR / "discrepancy-v2-fixtures.json").read_text("utf-8"))
RECUSAL_V2 = json.loads((CONTRACT_DIR / "recusal-v2-fixtures.json").read_text("utf-8"))
# The spread rule runs over every panel that exists (v1's three, v2's six); the
# valence rule exists in v2 only, over the arbiter's five and the generation's six.
PANEL_SIZES = {
    "threeWay": {len(CONTRACT_V1.model_names), len(CONTRACT_V2.model_names)},
    "valenceFlip": {len(CONTRACT_V2.arbiter_model_ids), len(CONTRACT_V2.model_names)},
}


@pytest.mark.parametrize("section", sorted(PANEL_SIZES))
def test_the_panel_fixtures_cover_every_panel_size_that_exists(section):
    """The v2 panel is six models; fixtures written at three and five never saw it."""
    sizes = {len(fixture["analyses"]) for fixture in DISCREPANCY_V2[section]}
    assert sizes >= PANEL_SIZES[section], sizes


def test_six_model_fixtures_cover_spread_flip_exclusion_and_declined_subjectivity():
    six = len(CONTRACT_V2.model_names)
    spread = [f for f in DISCREPANCY_V2["threeWay"] if len(f["analyses"]) == six]
    flips = [f for f in DISCREPANCY_V2["valenceFlip"] if len(f["analyses"]) == six]
    assert any(f["expected"]["significant"] for f in spread)
    assert any(not f["expected"]["comparable"] for f in spread)
    assert any(
        f["expected"]["comparable"] and any(a["subjectivite_score"] is None for a in f["analyses"])
        for f in spread
    )
    assert any(f["expected"]["flip"] for f in flips)
    assert any(f["expected"]["polarity"] is None for f in flips)


@pytest.mark.parametrize("case", RECUSAL_V2["cases"], ids=lambda case: case["developer"])
def test_recusal_fixture(case):
    assert list(CONTRACT_V2.recused_for(case["developer"])) == case["recused"]
    assert CONTRACT_V2.panel_for(case["developer"]) == [
        model_id for model_id in CONTRACT_V2.model_names if model_id not in case["recused"]
    ]


def test_the_recusal_fixture_names_every_registered_developer():
    assert {case["developer"] for case in RECUSAL_V2["cases"]} == set(CONTRACT_V2.developers)


@pytest.mark.parametrize("developer", RECUSAL_V2["unregistered"])
def test_an_unregistered_developer_is_an_error_not_an_empty_recusal(developer):
    with pytest.raises(ValueError, match="Unknown judge developer"):
        CONTRACT_V2.recused_for(developer)


def test_the_published_arbiter_panel_matches_the_fixture():
    published = RECUSAL_V2["publishedArbiter"]
    assert CONTRACT_V2.arbiter_developer == published["developer"]
    assert CONTRACT_V2.arbiter_model_ids == published["panel"]


def contract_preference_values(panel_size: int) -> set[str]:
    """What a verdict may name: one blind label per panel member, or a non-answer."""
    return {*BLIND_LABELS[:panel_size], "multiple", "none"}


def test_preferred_literals_are_the_contract_preference_values():
    """Pydantic needs static literals, so they are spelled out by hand in the schema."""
    expected = contract_preference_values(len(CONTRACT_V2.arbiter_model_ids))
    preferred = set(get_args(DimensionVerdict.model_fields["preferred"].annotation))
    overall = set(get_args(ArbiterResponseV2.model_fields["overall_winner"].annotation))
    assert preferred == overall == set(PREFERENCE_VALUES) == expected


@pytest.mark.parametrize("developer", sorted(CONTRACT_V2.developers))
def test_every_possible_judge_can_name_each_analysis_it_reads(developer):
    panel = CONTRACT_V2.panel_for(developer)
    preferred = set(get_args(DimensionVerdict.model_fields["preferred"].annotation))
    assert contract_preference_values(len(panel)) <= preferred
