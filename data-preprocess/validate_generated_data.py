"""Offline integrity checks for every checked-in browser data asset.

Both published generations are validated. The shared article base is checked
once, then each generation's score, justification, extreme-analysis, arbiter
and manifest files are checked against their own contract.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from iwac_preprocess import (
    CONTRACTS,
    SentimentContract,
    calculate_discrepancies,
    calculate_three_way_spread,
    get_models_from_pair,
    manifest_filename,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "ma-visualisation-sentiments" / "static" / "data"
DATE_RE = re.compile(r"^\d{4}(?:-\d{2}(?:-\d{2})?)?(?:/\d{4}(?:-\d{2}(?:-\d{2})?)?)?$")
EXTREME_CATEGORIES = {
    "subjectivity_extreme_high",
    "subjectivity_extreme_low",
    "polarity_very_negative",
    "polarity_very_positive",
    "centrality_very_central",
    "centrality_not_central",
}
ARBITER_V2_FILENAME = "iwac_arbiter_evaluations_v2.json"


class ContractError(AssertionError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ContractError(message)


def read_json(name: str) -> Any:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def validate_base() -> set[str]:
    base = read_json("iwac_articles_base.json")
    require(isinstance(base, list), "iwac_articles_base.json must be an array")
    ids: list[str] = []
    for index, row in enumerate(base):
        require(isinstance(row, dict), f"base row {index} must be an object")
        require(row.get("o:id") is not None, f"base row {index} has no o:id")
        article_id = str(row["o:id"])
        ids.append(article_id)
        date = row.get("dcterms:date")
        require(
            date is None or bool(DATE_RE.fullmatch(date)),
            f"article {article_id} has invalid date {date!r}",
        )
        month = row.get("hijri_month")
        require(
            month is None or isinstance(month, int) and 1 <= month <= 12,
            f"article {article_id} has invalid hijri_month",
        )
    require(len(ids) == len(set(ids)), "base article IDs must be unique")
    return set(ids)


def validate_core(
    contract: SentimentContract, id_set: set[str]
) -> dict[str, dict[str, dict | None]]:
    version = contract.analysis_version
    sentiments: dict[str, dict[str, dict | None]] = {}
    for model_id in contract.model_names:
        payload = read_json(f"iwac_sentiment_{model_id}.json")
        require(payload.get("model") == model_id, f"sentiment file/model mismatch for {model_id}")
        require(
            payload.get("schema_version") == contract.schema_version,
            f"sentiment {model_id} schema does not match the {version} contract",
        )
        require(
            payload.get("analysis_version") == version,
            f"sentiment {model_id} is not {version}",
        )
        model_sentiments = payload.get("sentiments")
        require(isinstance(model_sentiments, dict), f"sentiment {model_id} has no map")
        require(
            set(model_sentiments) == id_set, f"sentiment/base ID coverage mismatch for {model_id}"
        )
        for article_id, analysis in model_sentiments.items():
            if analysis is None:
                continue
            require(
                analysis.get("polarite") in contract.polarity_scores
                or analysis.get("polarite") is None,
                f"unknown polarity for {model_id}/{article_id}",
            )
            require(
                analysis.get("centralite_islam_musulmans") in contract.centrality_scores
                or analysis.get("centralite_islam_musulmans") is None,
                f"unknown centrality for {model_id}/{article_id}",
            )
            # Subjectivity is stored as the shared 1-5 rank in every
            # generation, whatever the upstream encoding was.
            score = analysis.get("subjectivite_score")
            require(
                score is None
                or isinstance(score, int)
                and contract.subjectivity_minimum <= score <= contract.subjectivity_maximum,
                f"invalid subjectivity for {model_id}/{article_id}",
            )
        sentiments[model_id] = model_sentiments

        prose_ids: set[str] = set()
        shard_count = contract.justification_shards
        for shard in range(shard_count):
            prose = read_json(f"iwac_justifications_{model_id}_{shard:02d}.json")
            require(
                prose.get("model") == model_id,
                f"justification file/model mismatch for {model_id}/{shard}",
            )
            require(
                prose.get("schema_version") == contract.schema_version
                and prose.get("analysis_version") == version,
                f"justification {model_id}/{shard} is not {version}",
            )
            require(
                prose.get("shard") == shard and prose.get("shard_count") == shard_count,
                f"justification shard metadata mismatch for {model_id}/{shard}",
            )
            shard_ids = set(prose.get("justifications", {}))
            require(
                prose_ids.isdisjoint(shard_ids), f"duplicate prose IDs across {model_id} shards"
            )
            prose_ids.update(shard_ids)
        require(prose_ids == id_set, f"justification/base ID coverage mismatch for {model_id}")
    return sentiments


def validate_extremes(contract: SentimentContract, base_ids: set[str]) -> None:
    for model_id in contract.model_names:
        payload = read_json(f"iwac_extreme_analysis_{model_id}.json")
        require(payload.get("model") == model_id, f"extreme file/model mismatch for {model_id}")
        index = payload.get("articles_index", {})
        require(
            set(index).issubset(base_ids), f"extreme {model_id} index contains unknown articles"
        )
        analysis = payload.get("analysis", {})
        require(
            set(analysis) == EXTREME_CATEGORIES, f"extreme {model_id} category set is incomplete"
        )
        for category, entry in analysis.items():
            references = entry.get("article_ids", [])
            require(
                len(references) == len(set(references)),
                f"extreme {model_id}/{category} contains duplicate references",
            )
            require(
                set(references).issubset(index),
                f"extreme {model_id}/{category} references an unknown index row",
            )


def validate_places(base_ids: set[str]) -> None:
    payload = read_json("iwac_places.json")
    place_ids = {place["id"] for place in payload.get("places", [])}
    require(len(place_ids) == len(payload.get("places", [])), "place IDs must be unique")
    for article_id, references in payload.get("articles", {}).items():
        require(article_id in base_ids, f"place edges contain unknown article {article_id}")
        require(
            set(references).issubset(place_ids), f"article {article_id} references an unknown place"
        )


def validate_arbiter(
    contract: SentimentContract, base_ids: set[str], sentiments: dict[str, dict[str, dict | None]]
) -> None:
    """Validate the v1 pairwise arbiter files."""
    for pair in contract.model_pairs:
        model_a, model_b = get_models_from_pair(pair)
        eligible: set[str] = set()
        for article_id in base_ids:
            discrepancies = calculate_discrepancies(
                sentiments[model_a].get(article_id) or {},
                sentiments[model_b].get(article_id) or {},
                contract,
            )
            if discrepancies and discrepancies["has_significant_conflict"]:
                eligible.add(article_id)

        payload = read_json(f"iwac_arbiter_evaluations_{pair}.json")
        metadata = payload.get("metadata", {})
        evaluations = payload.get("evaluations", [])
        evaluation_ids = [str(row.get("article_id")) for row in evaluations]
        require(metadata.get("pair") == pair, f"arbiter file/pair mismatch for {pair}")
        require(
            metadata.get("contract_schema_version") == contract.schema_version
            and metadata.get("analysis_version") == contract.analysis_version,
            f"arbiter {pair} is not bound to the {contract.analysis_version} contract",
        )
        require(
            len(evaluation_ids) == len(set(evaluation_ids)),
            f"arbiter {pair} contains duplicate IDs",
        )
        require(
            set(evaluation_ids).issubset(eligible),
            f"arbiter {pair} contains stale/non-eligible IDs",
        )
        require(
            set(evaluation_ids).issubset(base_ids), f"arbiter {pair} contains unknown article IDs"
        )
        require(
            metadata.get("successful_evaluations") == len(evaluations),
            f"arbiter {pair} metadata count is stale",
        )
        if metadata.get("cache_schema_version"):
            require(
                all(row.get("cache_fingerprint") for row in evaluations),
                f"arbiter {pair} cache-v2 row lacks a fingerprint",
            )


def validate_arbiter_three_way(
    contract: SentimentContract, base_ids: set[str], sentiments: dict[str, dict[str, dict | None]]
) -> None:
    """Validate the v2 three-way arbiter file, which is optional until it runs."""
    path = DATA_DIR / ARBITER_V2_FILENAME
    if not path.exists():
        return

    model_ids = list(contract.model_names)
    eligible: set[str] = set()
    for article_id in base_ids:
        spread = calculate_three_way_spread(
            [sentiments[model_id].get(article_id) or {} for model_id in model_ids], contract
        )
        if spread and spread["has_significant_spread"]:
            eligible.add(article_id)

    payload = read_json(ARBITER_V2_FILENAME)
    metadata = payload.get("metadata", {})
    evaluations = payload.get("evaluations", [])
    evaluation_ids = [str(row.get("article_id")) for row in evaluations]

    require(
        metadata.get("contract_schema_version") == contract.schema_version
        and metadata.get("analysis_version") == contract.analysis_version,
        f"three-way arbiter is not bound to the {contract.analysis_version} contract",
    )
    require(metadata.get("mode") == "three-way", "three-way arbiter metadata mode mismatch")
    require(
        list(metadata.get("models", [])) == model_ids,
        "three-way arbiter metadata does not list the contract's models",
    )
    permutation = metadata.get("blind_permutation", {})
    require(
        set(permutation) == {"a", "b", "c"} and sorted(permutation.values()) == sorted(model_ids),
        "three-way arbiter blind permutation must be a bijection over the models",
    )
    require(
        len(evaluation_ids) == len(set(evaluation_ids)),
        "three-way arbiter contains duplicate IDs",
    )
    require(
        set(evaluation_ids).issubset(eligible),
        "three-way arbiter contains stale/non-eligible IDs",
    )
    require(
        metadata.get("successful_evaluations") == len(evaluations),
        "three-way arbiter metadata count is stale",
    )
    require(
        all(row.get("cache_fingerprint") for row in evaluations),
        "three-way arbiter row lacks a fingerprint",
    )


def validate_manifest(contract: SentimentContract) -> None:
    name = manifest_filename(contract.analysis_version)
    path = DATA_DIR / name
    if not path.exists():
        return
    manifest = read_json(name)
    require(
        manifest.get("schema_version") == contract.schema_version,
        f"{name} schema version mismatch",
    )
    require(
        manifest.get("analysis_version") == contract.analysis_version,
        f"{name} analysis version mismatch",
    )
    for entry_name, expected in manifest.get("files", {}).items():
        file_path = DATA_DIR / entry_name
        require(file_path.is_file(), f"{name} references missing {entry_name}")
        require(
            file_path.stat().st_size == expected["bytes"], f"{name} size mismatch for {entry_name}"
        )
        actual = hashlib.sha256(file_path.read_bytes()).hexdigest()
        require(actual == expected["sha256"], f"{name} checksum mismatch for {entry_name}")


def validate_generation(contract: SentimentContract, base_ids: set[str]) -> None:
    sentiments = validate_core(contract, base_ids)
    validate_extremes(contract, base_ids)
    if contract.arbiter.get("mode") == "three-way":
        validate_arbiter_three_way(contract, base_ids, sentiments)
    else:
        validate_arbiter(contract, base_ids, sentiments)
    validate_manifest(contract)


def validate_all() -> None:
    base_ids = validate_base()
    validate_places(base_ids)
    for contract in CONTRACTS.values():
        validate_generation(contract, base_ids)


if __name__ == "__main__":
    validate_all()
    print("Generated data contract: OK (" + ", ".join(CONTRACTS) + ")")
