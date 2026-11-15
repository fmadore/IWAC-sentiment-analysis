"""Payload assembly, file naming and the base-ownership rule of a generation."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import pytest
from iwac_preprocess import BASE_FILENAME, CONTRACT_V1, CONTRACT_V2
from iwac_preprocess.generation import (
    JUSTIFICATION_SHARDS,
    assert_base_matches,
    build_generation_payloads,
    justification_filename,
    owns_base,
    sentiment_filename,
    stage_generation,
)
from iwac_preprocess.serialization import manifest_filename
from iwac_preprocess.shards import justification_shard
from validate_generated_data import validate_base, validate_core, validate_manifest

LOGGER = logging.getLogger("test_generation")


def fake_record(article_id: int, contract=CONTRACT_V2, **overrides) -> dict:
    """One upstream row carrying every model's six fields for ``contract``."""
    subjectivity = "Mixte" if contract.subjectivity_label_scores else 3
    row: dict = {
        "o:id": article_id,
        "title": f"Article {article_id}",
        "newspaper": "Fraternité Matin",
        "country": "Côte d'Ivoire",
        "pub_date": "1999-05-01",
    }
    for model_id in contract.model_names:
        column = lambda suffix, m=model_id: contract.sentiment_column(m, suffix)  # noqa: E731
        row[column("polarite")] = "Neutre"
        row[column("subjectivite_score")] = subjectivity
        row[column("centralite_islam_musulmans")] = "Central"
        for suffix in contract.justification_suffixes:
            row[column(suffix)] = f"{model_id} on {article_id}"
    row.update(overrides)
    return row


def test_only_v1_owns_the_shared_base():
    assert owns_base("v1")
    assert not owns_base("v2")


def test_file_names_are_the_ones_the_browser_requests():
    assert sentiment_filename("mistral-small") == "iwac_sentiment_mistral-small.json"
    assert justification_filename("qwen", 3) == "iwac_justifications_qwen_03.json"


def test_payloads_are_ordered_by_article_id_whatever_the_upstream_order():
    payloads = build_generation_payloads(
        [fake_record(40), fake_record(2), fake_record(1)], CONTRACT_V2
    )
    assert [item["o:id"] for item in payloads.base] == [1, 2, 40]
    for model_id in CONTRACT_V2.model_names:
        scores = payloads.files[sentiment_filename(model_id)]["sentiments"]
        assert list(scores) == ["1", "2", "40"]
        assert scores["1"] == {
            "polarite": "Neutre",
            "subjectivite_score": 3,
            "centralite_islam_musulmans": "Central",
        }


def test_every_row_lands_in_the_shard_the_browser_fetches():
    payloads = build_generation_payloads([fake_record(i) for i in (1, 2, 40, 77)], CONTRACT_V2)
    model_id = next(iter(CONTRACT_V2.model_names))
    for article_id in ("1", "2", "40", "77"):
        shard = justification_shard(article_id, JUSTIFICATION_SHARDS)
        payload = payloads.files[justification_filename(model_id, shard)]
        assert payload["shard"] == shard and payload["shard_count"] == JUSTIFICATION_SHARDS
        assert article_id in payload["justifications"]


def test_an_unknown_subjectivity_label_raises_instead_of_writing_nulls():
    model_id = next(iter(CONTRACT_V2.model_names))
    record = fake_record(
        1, **{CONTRACT_V2.sentiment_column(model_id, "subjectivite_score"): "Assez objectif"}
    )
    with pytest.raises(ValueError, match="subjectivity label"):
        build_generation_payloads([record], CONTRACT_V2)


class TestAssertBaseMatches:
    def write_base(self, tmp_path: Path, ids) -> Path:
        path = tmp_path / BASE_FILENAME
        path.write_text(json.dumps([{"o:id": i} for i in ids]), encoding="utf-8")
        return path

    def test_an_identical_article_set_passes(self, tmp_path):
        assert_base_matches(self.write_base(tmp_path, [1, 2]), {"1", "2"})

    def test_a_missing_base_names_the_command_that_writes_it(self, tmp_path):
        with pytest.raises(SystemExit, match="--generation v1"):
            assert_base_matches(tmp_path / BASE_FILENAME, {"1"})

    def test_a_drifted_snapshot_reports_both_directions(self, tmp_path):
        with pytest.raises(SystemExit) as raised:
            assert_base_matches(self.write_base(tmp_path, [1, 2]), {"2", "3"})
        message = str(raised.value)
        assert "1 article(s) gone (e.g. ['1'])" in message
        assert "1 new (e.g. ['3'])" in message


def test_v1_stages_and_publishes_the_base(tmp_path):
    payloads = build_generation_payloads(
        [fake_record(2, CONTRACT_V1), fake_record(1, CONTRACT_V1)], CONTRACT_V1
    )
    names = stage_generation(
        tmp_path, payloads, source_repository="example/corpus", source_revision="abc"
    )
    assert names[0] == BASE_FILENAME
    assert names[-1] == manifest_filename("v1")
    base_ids = validate_base(tmp_path)
    validate_core(CONTRACT_V1, base_ids, tmp_path)
    validate_manifest(CONTRACT_V1, tmp_path)


def test_v2_verifies_the_staged_base_and_never_publishes_it(tmp_path):
    (tmp_path / BASE_FILENAME).write_text(json.dumps([{"o:id": 1}, {"o:id": 2}]), "utf-8")
    payloads = build_generation_payloads([fake_record(1), fake_record(2)], CONTRACT_V2)
    names = stage_generation(
        tmp_path, payloads, source_repository="example/corpus", source_revision="abc"
    )
    assert BASE_FILENAME not in names
    assert names[-1] == manifest_filename("v2")
    manifest = json.loads((tmp_path / names[-1]).read_text(encoding="utf-8"))
    # The base is still checksummed: it is the input the run was verified against.
    assert next(iter(manifest["files"])) == BASE_FILENAME
    validate_core(CONTRACT_V2, validate_base(tmp_path), tmp_path)
    validate_manifest(CONTRACT_V2, tmp_path)


def test_v2_refuses_a_stage_whose_base_disagrees(tmp_path):
    (tmp_path / BASE_FILENAME).write_text(json.dumps([{"o:id": 1}]), "utf-8")
    payloads = build_generation_payloads([fake_record(1), fake_record(2)], CONTRACT_V2)
    with pytest.raises(SystemExit, match="no longer matches"):
        stage_generation(tmp_path, payloads, source_repository="r", source_revision=None)
