"""The validator's checks, exercised on small hand-built data directories."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from iwac_preprocess import CONTRACT_V1, CONTRACT_V2
from iwac_preprocess.shards import justification_shard
from validate_generated_data import (
    ContractError,
    validate_arbiter_envelope,
    validate_base,
    validate_core,
    validate_extremes,
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


def extremes_payload(contract, model_id, **stamps):
    categories = [
        "subjectivity_extreme_high",
        "subjectivity_extreme_low",
        "polarity_very_negative",
        "polarity_very_positive",
        "centrality_very_central",
        "centrality_not_central",
    ]
    return {
        **stamps,
        "model": model_id,
        "articles_index": {},
        "analysis": {category: {"article_ids": []} for category in categories},
        "statistics": {"total_articles": len(IDS)},
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
