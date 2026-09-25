"""The justification shard contract, shared with the browser.

`src/lib/domain/sentimentContract.test.ts` reads the same fixture file, so the
pipeline that places a row and the browser that fetches it cannot drift apart.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from iwac_preprocess import CONTRACT_V1, CONTRACT_V2
from iwac_preprocess.shards import justification_shard

FIXTURES = json.loads(
    (
        Path(__file__).resolve().parents[1]
        / "ma-visualisation-sentiments"
        / "src"
        / "lib"
        / "data"
        / "justification-shard-fixtures.json"
    ).read_text(encoding="utf-8")
)


@pytest.mark.parametrize("case", FIXTURES["cases"], ids=lambda case: case["name"])
def test_shared_shard_fixtures(case):
    assert justification_shard(case["id"], FIXTURES["shardCount"]) == case["shard"]


def test_the_fixture_uses_the_contract_shard_count():
    assert FIXTURES["shardCount"] == CONTRACT_V1.justification_shards
    assert FIXTURES["shardCount"] == CONTRACT_V2.justification_shards


def test_an_integer_id_shards_like_its_decimal_string():
    assert justification_shard(12345, 32) == justification_shard("12345", 32)


def test_a_non_positive_shard_count_is_refused():
    with pytest.raises(ValueError):
        justification_shard("1", 0)
