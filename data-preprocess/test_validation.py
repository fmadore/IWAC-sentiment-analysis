"""The validator's checks, exercised on small hand-built data directories."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from iwac_preprocess import CONTRACT_V1, CONTRACT_V2, calculate_three_way_spread
from iwac_preprocess.extremes import CATEGORIES
from iwac_preprocess.serialization import provenance_block
from iwac_preprocess.shards import justification_shard
from validate_generated_data import (
    ContractError,
    collect_violations,
    validate_arbiter_envelope,
    validate_arbiter_rows,
    validate_base,
    validate_core,
    validate_extremes,
    validate_extremes_model,
    validate_places,
    validate_source_block,
)

IDS = ["1", "2", "40"]


def write(directory: Path, name: str, payload) -> None:
    (directory / name).write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def core_directory(tmp_path: Path, contract=CONTRACT_V1, *, misplace: str | None = None) -> Path:
    """A complete, valid score-and-prose set for ``IDS``; ``misplace`` moves one row."""
    shards = contract.justification_shards
    write(tmp_path, "iwac_articles_base.json", [{"o:id": int(i)} for i in IDS])
    for model_id in contract.model_names:
        envelope = {
            "schema_version": contract.schema_version,
            "analysis_version": contract.analysis_version,
            "model": model_id,
        }
        write(
            tmp_path,
            f"iwac_sentiment_{model_id}.json",
            {**envelope, "sentiments": dict.fromkeys(IDS)},
        )
        prose: list[dict] = [{} for _ in range(shards)]
        for article_id in IDS:
            shard = justification_shard(article_id, shards)
            if article_id == misplace:
                shard = (shard + 1) % shards
            prose[shard][article_id] = {}
        for shard, rows in enumerate(prose):
            write(
                tmp_path,
                f"iwac_justifications_{model_id}_{shard:02d}.json",
                {**envelope, "shard": shard, "shard_count": shards, "justifications": rows},
            )
    return tmp_path


def test_a_well_placed_set_validates(tmp_path):
    directory = core_directory(tmp_path)
    assert validate_core(CONTRACT_V1, validate_base(directory), directory).keys() == set(
        CONTRACT_V1.model_names
    )


def test_a_row_in_a_shard_the_browser_never_fetches_is_rejected(tmp_path):
    """Coverage and disjointness both still hold here; only placement is wrong."""
    directory = core_directory(tmp_path, misplace="40")
    with pytest.raises(ContractError, match="misplaced"):
        validate_core(CONTRACT_V1, validate_base(directory), directory)


def extremes_payload(contract, model_id, members=None, **stamps):
    """An extremes file whose categories hold ``members`` (category key -> ids)."""
    members = members or {}
    return {
        **stamps,
        "model": model_id,
        "articles_index": {
            article_id: {"id": int(article_id)} for ids in members.values() for article_id in ids
        },
        "analysis": {
            category.key: {"article_ids": list(members.get(category.key, []))}
            for category in CATEGORIES
        },
        "statistics": {
            "total_articles": len(IDS),
            **{
                f"{category.stat_key}_count": len(members.get(category.key, []))
                for category in CATEGORIES
            },
        },
    }


def test_extremes_stamps_are_optional_but_must_match_when_present(tmp_path):
    for model_id in CONTRACT_V2.model_names:
        write(
            tmp_path,
            f"iwac_extreme_analysis_{model_id}.json",
            extremes_payload(CONTRACT_V2, model_id),
        )
    validate_extremes(CONTRACT_V2, set(IDS), tmp_path)

    model_id = next(iter(CONTRACT_V2.model_names))
    write(
        tmp_path,
        f"iwac_extreme_analysis_{model_id}.json",
        extremes_payload(CONTRACT_V2, model_id, analysis_version="v1"),
    )
    with pytest.raises(ContractError, match="analysis_version"):
        validate_extremes(CONTRACT_V2, set(IDS), tmp_path)


def test_the_published_panel_arbiter_envelope_is_valid():
    payload = json.loads(
        (
            Path(__file__).resolve().parents[1]
            / "ma-visualisation-sentiments/static/data/iwac_arbiter_evaluations_v2.json"
        ).read_text(encoding="utf-8")
    )
    validate_arbiter_envelope(CONTRACT_V2, payload)
    payload["metadata"]["successful_evaluations"] += 1
    with pytest.raises(ContractError, match="count is stale"):
        validate_arbiter_envelope(CONTRACT_V2, payload)


def analysis(polarite="Neutre", subjectivite_score=3, centralite="Central"):
    return {
        "polarite": polarite,
        "subjectivite_score": subjectivite_score,
        "centralite_islam_musulmans": centralite,
    }


class TestExtremesMembership:
    """Category membership is recomputed from the published score map."""

    model_id = "luna"
    scores = {
        "1": analysis("Très négatif", 5, "Très central"),
        "2": analysis("Neutre", 3, "Marginal"),
        "40": None,
    }
    members = {
        "polarity_very_negative": ["1"],
        "subjectivity_extreme_high": ["1"],
        "centrality_very_central": ["1"],
        "centrality_not_central": ["2"],
    }

    def check(self, tmp_path, members):
        write(
            tmp_path,
            f"iwac_extreme_analysis_{self.model_id}.json",
            extremes_payload(CONTRACT_V2, self.model_id, members),
        )
        validate_extremes_model(CONTRACT_V2, self.model_id, set(IDS), tmp_path, self.scores)

    def test_membership_matching_the_scores_validates(self, tmp_path):
        self.check(tmp_path, self.members)

    def test_a_category_missing_an_article_the_scores_place_in_it_fails(self, tmp_path):
        """What a renamed label produces: an empty category that otherwise validates."""
        members = {**self.members, "polarity_very_negative": []}
        with pytest.raises(ContractError, match="polarity_very_negative disagrees"):
            self.check(tmp_path, members)

    def test_an_article_the_scores_do_not_place_in_a_category_fails(self, tmp_path):
        members = {**self.members, "polarity_very_positive": ["2"]}
        with pytest.raises(ContractError, match="1 extra"):
            self.check(tmp_path, members)

    def test_a_stale_count_fails(self, tmp_path):
        payload = extremes_payload(CONTRACT_V2, self.model_id, self.members)
        payload["statistics"]["polarity_very_negative_count"] = 2
        write(tmp_path, f"iwac_extreme_analysis_{self.model_id}.json", payload)
        with pytest.raises(ContractError, match="count 2 is not its 1 references"):
            validate_extremes_model(CONTRACT_V2, self.model_id, set(IDS), tmp_path, self.scores)

    def test_an_index_row_no_category_references_fails(self, tmp_path):
        payload = extremes_payload(CONTRACT_V2, self.model_id, self.members)
        payload["articles_index"]["40"] = {"id": 40}
        write(tmp_path, f"iwac_extreme_analysis_{self.model_id}.json", payload)
        with pytest.raises(ContractError, match="no category references"):
            validate_extremes_model(CONTRACT_V2, self.model_id, set(IDS), tmp_path)


class TestSourceBlock:
    def test_absent_is_valid_for_files_published_before_it(self):
        validate_source_block({"places": []}, "iwac_places.json")

    def test_a_well_formed_block_validates(self):
        validate_source_block(
            {"source": provenance_block("example/corpus", "abc123")}, "iwac_places.json"
        )

    @pytest.mark.parametrize(
        "source",
        [
            "abc123",
            {"revision": "abc"},
            {"repository": "example/corpus", "revision": ""},
            {"repository": "example/corpus", "revision": "abc", "generated": "2026-11-14T10:00"},
        ],
    )
    def test_a_malformed_block_fails(self, source):
        with pytest.raises(ContractError):
            validate_source_block({"source": source}, "iwac_places.json")

    def test_places_check_it(self, tmp_path):
        write(tmp_path, "iwac_places.json", {"source": {"revision": "x"}, "places": []})
        with pytest.raises(ContractError, match="no repository"):
            validate_places(set(IDS), tmp_path)


class TestArbiterRows:
    """A verdict's stored spread and its selection rule, against the scores."""

    panel = list(CONTRACT_V2.arbiter_model_ids)

    def sentiments(self, flip_polarity="Négatif"):
        rows = {model_id: {i: analysis() for i in IDS} for model_id in CONTRACT_V2.model_names}
        rows[self.panel[0]]["1"] = analysis("Positif")
        rows[self.panel[1]]["1"] = analysis(flip_polarity)
        return rows

    def payload(self, sentiments, ids=("1",), **selection):
        evaluations = [
            {
                "article_id": article_id,
                "spread": calculate_three_way_spread(
                    [sentiments[m][article_id] for m in self.panel], CONTRACT_V2
                ),
            }
            for article_id in ids
        ]
        return {
            "metadata": {
                "selection": {
                    "arbiter_rule": "valence",
                    "dimensions": ["polarity", "subjectivity", "centrality"],
                    "threshold": 3,
                    "eligible_articles": 1,
                    **selection,
                }
            },
            "evaluations": evaluations,
        }

    def test_rows_matching_the_scores_validate(self):
        sentiments = self.sentiments()
        validate_arbiter_rows(CONTRACT_V2, self.payload(sentiments), set(IDS), sentiments)

    def test_a_spread_the_scores_no_longer_give_fails(self):
        sentiments = self.sentiments()
        payload = self.payload(sentiments)
        sentiments[self.panel[1]]["1"] = analysis("Très négatif")
        with pytest.raises(ContractError, match="spread record"):
            validate_arbiter_rows(CONTRACT_V2, payload, set(IDS), sentiments)

    def test_a_row_its_recorded_rule_does_not_select_fails(self):
        sentiments = self.sentiments()
        payload = self.payload(sentiments, ids=("1", "2"))
        with pytest.raises(ContractError, match="'valence' rule does not select"):
            validate_arbiter_rows(CONTRACT_V2, payload, set(IDS), sentiments)

    def test_a_recorded_frame_size_the_scores_no_longer_give_fails(self):
        sentiments = self.sentiments()
        with pytest.raises(ContractError, match="frame of 2 articles"):
            validate_arbiter_rows(
                CONTRACT_V2, self.payload(sentiments, eligible_articles=2), set(IDS), sentiments
            )

    def test_a_recused_model_never_moves_the_frame(self):
        """The recused member's ratings are not the judge's panel."""
        sentiments = self.sentiments(flip_polarity="Neutre")
        (recused,) = CONTRACT_V2.arbiter_recused_ids
        sentiments[recused]["1"] = analysis("Négatif")
        with pytest.raises(ContractError, match="rule does not select"):
            validate_arbiter_rows(CONTRACT_V2, self.payload(sentiments), set(IDS), sentiments)


def test_collect_violations_reports_every_failure_not_the_first(tmp_path):
    directory = core_directory(tmp_path, misplace="40")
    write(directory, "iwac_places.json", {"places": [{"id": 1}, {"id": 1}], "articles": {}})
    violations = collect_violations(directory)
    assert any(line.startswith("places:") for line in violations)
    # Every v1 model's misplaced row is reported, not only the first model's.
    misplaced = [line for line in violations if "misplaced" in line and line.startswith("v1/")]
    assert len(misplaced) == len(CONTRACT_V1.model_names)
    # Absent files are reported beside the others rather than hiding them.
    assert any("FileNotFoundError" in line for line in violations)
