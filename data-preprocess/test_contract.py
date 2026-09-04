"""Cross-language contract, source normalization, and serialization tests."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import pytest
from iwac_preprocess import (
    ANALYSIS_VERSION,
    CONTRACT_SCHEMA_VERSION,
    CONTRACT_V1,
    CONTRACT_V2,
    CONTRACTS,
    SENTIMENT_FIELD_SUFFIXES,
    TOTAL_DISCREPANCY_MAXIMUM,
    build_base_article,
    calculate_discrepancies,
    calculate_three_way_spread,
    get_models_from_pair,
    has_polarity_valence_flip,
    is_arbiter_eligible,
    normalize_sentiment_columns,
    save_json,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "ma-visualisation-sentiments" / "src" / "lib" / "data"
FIXTURES = DATA_DIR / "discrepancy-v1-fixtures.json"
FIXTURES_V2 = DATA_DIR / "discrepancy-v2-fixtures.json"
SUBJECTIVITY_FIXTURES_V2 = DATA_DIR / "subjectivity-labels-v2-fixtures.json"


def _assert_pairwise(fixture: dict, contract) -> None:
    result = calculate_discrepancies(fixture["analysisA"], fixture["analysisB"], contract)
    expected = fixture["expected"]
    if not expected["comparable"]:
        assert result is None, fixture["name"]
        return
    assert result == {
        "polarity_diff": expected["polarity"],
        "subjectivity_diff": expected["subjectivity"],
        "centrality_diff": expected["centrality"],
        "total_diff": expected["total"],
        "has_significant_conflict": expected["conflict"],
    }, fixture["name"]


def test_shared_discrepancy_fixtures():
    fixtures = json.loads(FIXTURES.read_text(encoding="utf-8"))
    for fixture in fixtures:
        _assert_pairwise(fixture, CONTRACT_V1)
    assert max(fixture["expected"]["total"] for fixture in fixtures) == TOTAL_DISCREPANCY_MAXIMUM


def test_shared_v2_pairwise_fixtures():
    fixtures = json.loads(FIXTURES_V2.read_text(encoding="utf-8"))["pairwise"]
    for fixture in fixtures:
        _assert_pairwise(fixture, CONTRACT_V2)
    assert (
        max(fixture["expected"]["total"] for fixture in fixtures)
        == CONTRACT_V2.total_discrepancy_maximum
    )


def test_shared_three_way_spread_fixtures():
    fixtures = json.loads(FIXTURES_V2.read_text(encoding="utf-8"))["threeWay"]
    for fixture in fixtures:
        result = calculate_three_way_spread(fixture["analyses"], CONTRACT_V2)
        expected = fixture["expected"]
        if not expected["comparable"]:
            assert result is None, fixture["name"]
            continue
        assert result == {
            "polarity_spread": expected["polarity"],
            "subjectivity_spread": expected["subjectivity"],
            "centrality_spread": expected["centrality"],
            "total_spread": expected["total"],
            "has_significant_spread": expected["significant"],
        }, fixture["name"]
    assert (
        max(fixture["expected"]["total"] for fixture in fixtures)
        == CONTRACT_V2.total_discrepancy_maximum
    )


def test_shared_valence_flip_fixtures():
    """The arbiter frame is a cross-language contract like the spread is."""
    fixtures = json.loads(FIXTURES_V2.read_text(encoding="utf-8"))["valenceFlip"]
    for fixture in fixtures:
        analyses, expected = fixture["analyses"], fixture["expected"]
        spread = calculate_three_way_spread(analyses, CONTRACT_V2)
        assert has_polarity_valence_flip(analyses, CONTRACT_V2) is expected["flip"], fixture["name"]
        assert is_arbiter_eligible(analyses, CONTRACT_V2) is expected["arbiterEligible"], fixture[
            "name"
        ]
        assert (bool(spread["has_significant_spread"]) if spread else False) is expected[
            "significantSpread"
        ], fixture["name"]
        assert (spread["polarity_spread"] if spread else None) == expected["polarity"], fixture[
            "name"
        ]


def test_the_arbiter_frame_contains_the_dashboard_rule_but_is_not_it():
    """Widening what we pay to arbitrate must not move what a reader is shown.

    A `Positif`/`Négatif` panel is two ranks apart: eligible for arbitration,
    and deliberately still not a significant discrepancy in the dashboard.
    """
    flip_only = [
        {"polarite": polarite, "subjectivite_score": 3, "centralite_islam_musulmans": "Central"}
        for polarite in ("Positif", "Négatif", "Neutre", "Neutre", "Neutre")
    ]
    spread = calculate_three_way_spread(flip_only, CONTRACT_V2)
    assert spread is not None
    assert spread["has_significant_spread"] is False
    assert is_arbiter_eligible(flip_only, CONTRACT_V2) is True


def test_v1_declares_no_valence_rule_so_the_archive_frame_is_unchanged():
    """The frozen generation must keep selecting exactly what it always did."""
    assert CONTRACT_V1.polarity_valence_bands is None
    flip = [
        {"polarite": polarite, "subjectivite_score": 3, "centralite_islam_musulmans": "Central"}
        for polarite in ("Positif", "Négatif", "Neutre")
    ]
    assert has_polarity_valence_flip(flip, CONTRACT_V1) is False
    assert is_arbiter_eligible(flip, CONTRACT_V1) is False


def test_subjectivity_labels_map_onto_the_shared_rank():
    fixtures = json.loads(SUBJECTIVITY_FIXTURES_V2.read_text(encoding="utf-8"))
    for case in fixtures["labels"]:
        assert CONTRACT_V2.coerce_subjectivity(case["label"]) == case["rank"], case["label"]
    # The five labels must cover the whole published scale exactly once.
    assert sorted(case["rank"] for case in fixtures["labels"]) == [1, 2, 3, 4, 5]

    for case in fixtures["declined"]:
        assert CONTRACT_V2.coerce_subjectivity(case["value"]) is None, case["name"]

    for case in fixtures["rejected"]:
        with pytest.raises(ValueError, match="subjectivity label"):
            CONTRACT_V2.coerce_subjectivity(case["value"])


def test_v1_subjectivity_stays_numeric():
    assert CONTRACT_V1.coerce_subjectivity(3) == 3
    assert CONTRACT_V1.coerce_subjectivity("4") == 4
    assert CONTRACT_V1.coerce_subjectivity(None) is None
    # v1 has no label table, so a label degrades to a null rather than raising:
    # the v1 files are frozen and must not start failing on new input.
    assert CONTRACT_V1.coerce_subjectivity("Mixte") is None


def test_pair_ids_are_never_split_on_hyphen():
    for contract in CONTRACTS.values():
        for pair_id, members in contract.pair_models.items():
            assert "-".join(members) == pair_id
            assert all(member in contract.model_names for member in members)
            assert get_models_from_pair(pair_id) == members
    # The hazard this guards: a model id that itself contains a hyphen.
    assert get_models_from_pair("mistral-small-deepseek") == ("mistral-small", "deepseek")


def test_generations_share_the_polarity_and_centrality_scales():
    assert CONTRACT_V2.polarity_scores == CONTRACT_V1.polarity_scores
    assert CONTRACT_V2.centrality_scores == CONTRACT_V1.centrality_scores
    assert CONTRACT_V2.polarity_non_comparable == CONTRACT_V1.polarity_non_comparable
    assert CONTRACT_V2.centrality_non_comparable == CONTRACT_V1.centrality_non_comparable
    assert CONTRACT_V2.justification_shards == CONTRACT_V1.justification_shards


def test_v2_uses_exact_model_column_prefixes():
    assert CONTRACT_V2.hf_column_prefixes == {
        "luna": "gpt_5_6_luna",
        "mistral-small": "mistral_small_2603",
        "deepseek": "deepseek_v4_flash_0731",
        "gemma": "gemma_4_31b_it",
        "qwen": "qwen3_8_27b",
    }
    assert CONTRACT_V2.sentiment_column("deepseek", "polarite") == "deepseek_v4_flash_0731_polarite"
    # No vendor aliases: a v2 id must never resolve through a v1 prefix.
    assert set(CONTRACT_V2.hf_column_prefixes).isdisjoint(CONTRACT_V1.hf_column_prefixes)


def test_legacy_hf_prefixes_are_normalized_to_exact_v1_names():
    row = (
        {f"chatgpt_{suffix}": None for suffix in SENTIMENT_FIELD_SUFFIXES}
        | {f"gemini_{suffix}": None for suffix in SENTIMENT_FIELD_SUFFIXES}
        | {f"mistral_{suffix}": None for suffix in SENTIMENT_FIELD_SUFFIXES}
    )
    row["chatgpt_polarite"] = "Positif"
    normalized = normalize_sentiment_columns(pd.DataFrame([row]))
    assert normalized.loc[0, "gpt_5_mini_polarite"] == "Positif"
    assert "gemini_3_flash_preview_polarite" in normalized
    assert "ministral_14b_2512_polarite" in normalized


def test_mixed_or_incomplete_prefix_is_rejected():
    with pytest.raises(ValueError, match="complete v1 sentiment field set"):
        normalize_sentiment_columns(pd.DataFrame([{"chatgpt_polarite": "Positif"}]))


def test_base_article_preserves_stored_hijri_fields_and_null_dates():
    result = build_base_article(
        {"o:id": "42", "title": "A", "pub_date": None, "hijri_year": 1445, "hijri_month": 9}
    )
    assert result["o:id"] == 42
    assert result["dcterms:date"] is None
    assert result["hijri_year"] == 1445
    assert result["hijri_month"] == 9
    assert result["hijri_day"] is None


def test_atomic_json_failure_preserves_previous_file(tmp_path, monkeypatch):
    target = tmp_path / "data.json"
    target.write_text('{"old":true}', encoding="utf-8")

    def fail_dump(*_args, **_kwargs):
        raise OSError("simulated interrupted write")

    monkeypatch.setattr(json, "dump", fail_dump)
    with pytest.raises(OSError):
        save_json({"new": True}, target)
    assert target.read_text(encoding="utf-8") == '{"old":true}'
    assert not list(tmp_path.glob("*.tmp"))


def test_contract_is_explicitly_v1():
    assert ANALYSIS_VERSION == "v1"
    assert CONTRACT_SCHEMA_VERSION == "1.0.0"
