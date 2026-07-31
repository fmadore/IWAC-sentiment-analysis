"""
Tests for the shared preprocessing helpers.

These are the functions whose output IS the published dataset, so a silent
change here changes figures the dashboard cites. `calculate_discrepancies` in
particular is duplicated logic against the frontend's `derivations.ts`; the
fixtures below encode the same cases both sides must agree on, so a change to
one without the other shows up as a failing test rather than as two views
quietly disagreeing.

Run with: python -m pytest data-preprocess/test_shared.py
"""

import math
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from shared import (  # noqa: E402
    CENTRALITY_SCORES,
    HF_COLUMN_PREFIXES,
    MODEL_NAMES,
    POLARITY_SCORES,
    SENTIMENT_COLUMNS,
    SENTIMENT_FIELD_SUFFIXES,
    SENTIMENT_JUSTIFICATION_SUFFIXES,
    SENTIMENT_SCORE_SUFFIXES,
    SIGNIFICANT_CONFLICT_THRESHOLD,
    build_model_justifications,
    build_model_scores,
    build_model_sentiment,
    calculate_discrepancies,
    safe_int_convert,
    safe_str,
    sentiment_column,
)


class TestSafeIntConvert:
    def test_converts_ints_and_numeric_strings(self):
        assert safe_int_convert(3) == 3
        assert safe_int_convert("4") == 4

    def test_returns_none_for_nan(self):
        # pandas hands back float('nan') for missing cells; int(nan) raises.
        assert safe_int_convert(float("nan")) is None

    def test_returns_none_for_none_and_junk(self):
        assert safe_int_convert(None) is None
        assert safe_int_convert("not a number") is None

    def test_truncates_a_float(self):
        assert safe_int_convert(3.0) == 3


class TestSafeStr:
    def test_passes_strings_through(self):
        assert safe_str("Positif") == "Positif"

    def test_returns_none_for_missing_values(self):
        assert safe_str(None) is None
        assert safe_str(float("nan")) is None


class TestFieldSuffixes:
    def test_scores_and_justifications_partition_the_full_set(self):
        # The webapp joins these two files back together; a field in neither
        # (or in both) would be silently lost or duplicated.
        assert set(SENTIMENT_SCORE_SUFFIXES).isdisjoint(SENTIMENT_JUSTIFICATION_SUFFIXES)
        assert set(SENTIMENT_SCORE_SUFFIXES) | set(SENTIMENT_JUSTIFICATION_SUFFIXES) == set(
            SENTIMENT_FIELD_SUFFIXES
        )

    def test_three_of_each(self):
        assert len(SENTIMENT_SCORE_SUFFIXES) == 3
        assert len(SENTIMENT_JUSTIFICATION_SUFFIXES) == 3


class TestSentimentColumn:
    """The model id -> column prefix indirection.

    The column names below are written out in full on purpose: they are the
    contract with the Hugging Face dataset, and deriving them from
    HF_COLUMN_PREFIXES here would make this suite agree with itself no matter
    what the mapping said.
    """

    def test_maps_each_model_id_to_its_annotating_model(self):
        assert sentiment_column("chatgpt", "polarite") == "gpt_5_mini_polarite"
        assert sentiment_column("gemini", "polarite") == "gemini_3_flash_preview_polarite"
        assert sentiment_column("mistral", "polarite") == "ministral_14b_2512_polarite"

    def test_every_model_id_has_a_prefix(self):
        assert set(HF_COLUMN_PREFIXES) == set(MODEL_NAMES)

    def test_rejects_an_unknown_model_id(self):
        # Silently building "claude_polarite" would read None for every field
        # and produce empty charts rather than an error.
        with pytest.raises(KeyError):
            sentiment_column("claude", "polarite")

    def test_sentiment_columns_covers_every_model_and_field(self):
        assert len(SENTIMENT_COLUMNS) == len(MODEL_NAMES) * len(SENTIMENT_FIELD_SUFFIXES)
        assert len(set(SENTIMENT_COLUMNS)) == len(SENTIMENT_COLUMNS)


class TestBuildModelBlocks:
    @pytest.fixture
    def item(self):
        return {
            "gpt_5_mini_polarite": "Positif",
            "gpt_5_mini_polarite_justification": "because",
            "gpt_5_mini_subjectivite_score": 2,
            "gpt_5_mini_subjectivite_justification": "factual",
            "gpt_5_mini_centralite_islam_musulmans": "Central",
            "gpt_5_mini_centralite_justification": "central",
            "gemini_3_flash_preview_polarite": "Neutre",
        }

    def test_scores_carry_only_the_score_fields(self, item):
        scores = build_model_scores(item, "chatgpt")
        assert set(scores) == set(SENTIMENT_SCORE_SUFFIXES)
        assert scores["polarite"] == "Positif"
        assert scores["subjectivite_score"] == 2

    def test_justifications_carry_only_the_prose_fields(self, item):
        prose = build_model_justifications(item, "chatgpt")
        assert set(prose) == set(SENTIMENT_JUSTIFICATION_SUFFIXES)
        assert prose["polarite_justification"] == "because"

    def test_split_blocks_reconstruct_the_full_block(self, item):
        combined = {
            **build_model_scores(item, "chatgpt"),
            **build_model_justifications(item, "chatgpt"),
        }
        assert combined == build_model_sentiment(item, "chatgpt")

    def test_reads_the_requested_model_prefix_only(self, item):
        assert build_model_scores(item, "gemini")["polarite"] == "Neutre"
        # gemini has no subjectivity column in the fixture.
        assert build_model_scores(item, "gemini")["subjectivite_score"] is None

    def test_missing_fields_become_none_not_nan(self, item):
        scores = build_model_scores({}, "mistral")
        assert all(value is None for value in scores.values())


class TestScoreMaps:
    def test_polarity_is_ordered_with_non_applicable_at_the_bottom(self):
        # The frontend's agreement statistics read ordinal POSITIONS from the
        # equivalent map in derivations.ts; the ordering is load-bearing.
        assert POLARITY_SCORES["Non applicable"] < POLARITY_SCORES["Très négatif"]
        assert (
            POLARITY_SCORES["Très négatif"]
            < POLARITY_SCORES["Négatif"]
            < POLARITY_SCORES["Neutre"]
            < POLARITY_SCORES["Positif"]
            < POLARITY_SCORES["Très positif"]
        )

    def test_centrality_is_ordered_with_not_addressed_at_the_bottom(self):
        assert (
            CENTRALITY_SCORES["Non abordé"]
            < CENTRALITY_SCORES["Marginal"]
            < CENTRALITY_SCORES["Secondaire"]
            < CENTRALITY_SCORES["Central"]
            < CENTRALITY_SCORES["Très central"]
        )


class TestCalculateDiscrepancies:
    def analysis(self, polarite=None, subjectivite=None, centralite=None):
        return {
            "polarite": polarite,
            "polarite_justification": None,
            "subjectivite_score": subjectivite,
            "subjectivite_justification": None,
            "centralite_islam_musulmans": centralite,
            "centralite_justification": None,
        }

    def test_identical_analyses_have_no_discrepancy(self):
        a = self.analysis("Positif", 2, "Central")
        result = calculate_discrepancies(a, dict(a))

        assert result["polarity_diff"] == 0
        assert result["subjectivity_diff"] == 0
        assert result["centrality_diff"] == 0
        assert result["total_diff"] == 0
        assert result["has_significant_conflict"] is False

    def test_sums_the_per_dimension_gaps(self):
        result = calculate_discrepancies(
            self.analysis("Très positif", 1, "Très central"),
            self.analysis("Neutre", 3, "Central"),
        )
        assert result["polarity_diff"] == 2
        assert result["subjectivity_diff"] == 2
        assert result["centrality_diff"] == 1
        assert result["total_diff"] == 5

    def test_flags_a_significant_conflict_at_the_threshold(self):
        result = calculate_discrepancies(
            self.analysis("Très positif", 1, "Central"),
            self.analysis("Négatif", 1, "Central"),
        )
        assert result["polarity_diff"] >= SIGNIFICANT_CONFLICT_THRESHOLD
        assert result["has_significant_conflict"] is True

    def test_does_not_flag_below_the_threshold(self):
        result = calculate_discrepancies(
            self.analysis("Positif", 2, "Central"),
            self.analysis("Neutre", 3, "Secondaire"),
        )
        assert result["has_significant_conflict"] is False

    def test_a_missing_subjectivity_score_is_skipped_not_treated_as_zero(self):
        # Coercing a missing score to 0 would manufacture a 4-point gap against
        # a present score. The frontend's derivations.ts makes the same choice.
        result = calculate_discrepancies(
            self.analysis("Neutre", None, "Central"),
            self.analysis("Neutre", 4, "Central"),
        )
        assert result["subjectivity_diff"] == 0
        assert result["total_diff"] == 0
