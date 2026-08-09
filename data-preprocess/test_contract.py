"""Cross-language v1 contract, source normalization, and serialization tests."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import pytest
from iwac_preprocess import (
    ANALYSIS_VERSION,
    CONTRACT_SCHEMA_VERSION,
    SENTIMENT_FIELD_SUFFIXES,
    TOTAL_DISCREPANCY_MAXIMUM,
    build_base_article,
    calculate_discrepancies,
    normalize_sentiment_columns,
    save_json,
)

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = (
    ROOT / "ma-visualisation-sentiments" / "src" / "lib" / "data" / "discrepancy-v1-fixtures.json"
)


def test_shared_discrepancy_fixtures():
    fixtures = json.loads(FIXTURES.read_text(encoding="utf-8"))
    for fixture in fixtures:
        result = calculate_discrepancies(fixture["analysisA"], fixture["analysisB"])
        expected = fixture["expected"]
        if not expected["comparable"]:
            assert result is None, fixture["name"]
            continue
        assert result == {
            "polarity_diff": expected["polarity"],
            "subjectivity_diff": expected["subjectivity"],
            "centrality_diff": expected["centrality"],
            "total_diff": expected["total"],
            "has_significant_conflict": expected["conflict"],
        }, fixture["name"]
    assert max(fixture["expected"]["total"] for fixture in fixtures) == TOTAL_DISCREPANCY_MAXIMUM


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
