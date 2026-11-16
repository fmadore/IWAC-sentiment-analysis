"""The checked-in data, validated in full and pinned to its published figures.

``collect_violations`` reports every failure at once rather than the first.
The pins below are computed from the checked-in files, not copied from prose:
they are what README, CLAUDE.md and the dashboard copy quote, so a data
refresh that moves one fails here and the prose gets updated with it.

Every pin reads the published files only. None asserts an ordering, so a
refresh that rewrites the files (sorted by article id) needs no change here
unless it moves a figure.
"""

from __future__ import annotations

import json
from functools import cache

import pytest
from iwac_preprocess import CONTRACT_V1, CONTRACT_V2, SentimentContract
from validate_generated_data import (
    ARBITER_V2_FILENAME,
    DATA_DIR,
    collect_violations,
    panel_frame,
    read_json,
    read_scores,
    validate_arbiter_rows,
    validate_base,
)

# --- Corpus figures ----------------------------------------------------------
ARTICLES = 12_348
# Articles no model of the generation annotates (all-null rows): in v2 the 50
# that are neither French nor English, skipped by design.
UNANNOTATED_BY_ALL = {"v1": 69, "v2": 50}

# Null ratings per model and dimension, counted over all 12,348 articles. A
# null is a rating never produced (`Non applicable` / `Non abordé` are
# verdicts and are not counted). Polarity and centrality are null on exactly
# the same rows for every model.
#   Qwen: 250 = the 50 nobody annotates + the 200 it declined (retired gap).
#   Haiku: 97 = the 50 + 47 French articles its pass logged as empty.
NULLS = {
    "v1": {
        "chatgpt": {"polarite": 69, "centralite_islam_musulmans": 69, "subjectivite_score": 697},
        "gemini": {"polarite": 69, "centralite_islam_musulmans": 69, "subjectivite_score": 379},
        "mistral": {"polarite": 69, "centralite_islam_musulmans": 69, "subjectivite_score": 623},
    },
    "v2": {
        "luna": {"polarite": 50, "centralite_islam_musulmans": 50, "subjectivite_score": 340},
        "mistral-small": {
            "polarite": 50,
            "centralite_islam_musulmans": 50,
            "subjectivite_score": 304,
        },
        "deepseek": {"polarite": 50, "centralite_islam_musulmans": 50, "subjectivite_score": 539},
        "gemma": {"polarite": 50, "centralite_islam_musulmans": 50, "subjectivite_score": 293},
        "qwen": {"polarite": 250, "centralite_islam_musulmans": 250, "subjectivite_score": 537},
        "haiku": {"polarite": 97, "centralite_islam_musulmans": 97, "subjectivite_score": 503},
    },
}
CONTRACTS = {"v1": CONTRACT_V1, "v2": CONTRACT_V2}

# --- The published v2 panel arbiter -------------------------------------------
ARBITER_V2_ARTICLES = 301
ARBITER_V2_SINGLE_WINNER = 228


@cache
def scores(generation: str) -> dict[str, dict[str, dict | None]]:
    return read_scores(CONTRACTS[generation])


def null_count(rows: dict[str, dict | None], field: str) -> int:
    return sum(row is None or row.get(field) is None for row in rows.values())


def test_checked_in_generated_data_contract():
    violations = collect_violations()
    assert not violations, f"{len(violations)} violation(s):\n" + "\n".join(violations)


def test_corpus_size():
    assert len(validate_base()) == ARTICLES
    for generation in CONTRACTS:
        for model_id, rows in scores(generation).items():
            assert len(rows) == ARTICLES, (generation, model_id)


@pytest.mark.parametrize(
    ("generation", "model_id", "field"),
    [
        (generation, model_id, field)
        for generation, models in NULLS.items()
        for model_id, fields in models.items()
        for field in fields
    ],
)
def test_null_rating_counts(generation: str, model_id: str, field: str):
    assert null_count(scores(generation)[model_id], field) == NULLS[generation][model_id][field]


@pytest.mark.parametrize("generation", CONTRACTS)
def test_every_model_is_pinned(generation: str):
    assert set(NULLS[generation]) == set(CONTRACTS[generation].model_names)


@pytest.mark.parametrize("generation", CONTRACTS)
def test_articles_no_model_annotates(generation: str):
    rows = scores(generation)
    unannotated = [
        article_id
        for article_id in next(iter(rows.values()))
        if all((rows[m][article_id] or {}).get("polarite") is None for m in rows)
    ]
    assert len(unannotated) == UNANNOTATED_BY_ALL[generation]


@pytest.mark.parametrize("generation", CONTRACTS)
def test_annotated_counts(generation: str):
    """README's "Articles annotated" row: polarity and centrality both present."""
    expected = {
        model_id: ARTICLES - fields["polarite"] for model_id, fields in NULLS[generation].items()
    }
    actual = {
        model_id: sum(
            bool(row)
            and row.get("polarite") is not None
            and row.get("centralite_islam_musulmans") is not None
            for row in rows.values()
        )
        for model_id, rows in scores(generation).items()
    }
    assert actual == expected
    if generation == "v2":
        assert actual["qwen"] == 12_098 and actual["haiku"] == 12_251
        assert {actual[m] for m in actual if m not in {"qwen", "haiku"}} == {12_298}


def published_arbiter() -> dict:
    return read_json(ARBITER_V2_FILENAME)


def test_arbiter_rows_are_the_scores_rows():
    """Each verdict's stored spread and rule, recomputed from the score files."""
    validate_arbiter_rows(CONTRACT_V2, published_arbiter(), validate_base(), scores("v2"))


def test_arbiter_frame_figures():
    payload = published_arbiter()
    selection = payload["metadata"]["selection"]
    assert selection["arbiter_rule"] == "valence"
    frame = panel_frame(
        CONTRACT_V2, CONTRACT_V2.arbiter_model_ids, validate_base(), scores("v2"), selection
    )
    assert len(frame) == len(payload["evaluations"]) == ARBITER_V2_ARTICLES
    labels = set(payload["metadata"]["blind_permutation"])
    single = [
        row for row in payload["evaluations"] if row["arbiter"].get("overall_winner") in labels
    ]
    assert len(single) == ARBITER_V2_SINGLE_WINNER


def test_contract_frame_contains_the_published_run():
    contract: SentimentContract = CONTRACT_V2
    frame = panel_frame(contract, contract.arbiter_model_ids, validate_base(), scores("v2"))
    published = {str(row["article_id"]) for row in published_arbiter()["evaluations"]}
    assert published <= frame


def test_the_data_directory_is_the_published_one():
    # Guards the pins against silently reading a stage or a fixture directory.
    assert (DATA_DIR / "iwac_articles_base.json").is_file()
    assert json.loads((DATA_DIR / "iwac_data_manifest_v2.json").read_text("utf-8"))["files"]
