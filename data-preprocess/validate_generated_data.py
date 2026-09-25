"""Offline integrity checks for every checked-in browser data asset.

Both published generations are validated. The shared article base is checked
once, then each generation's score, justification, extreme-analysis, arbiter
and manifest files are checked against their own contract.

Every check takes the directory it reads as ``data_dir``, defaulting to the
checked-in data. The exports call the same checks on their staging directory
before promoting anything, so a file the repository would reject never reaches
``static/data/``.
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
    get_models_from_pair,
    is_arbiter_eligible,
    manifest_filename,
)
from iwac_preprocess.arbiter_prompt import BLIND_LABELS
from iwac_preprocess.shards import justification_shard

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
# Arbiter modes that judge the whole panel in one call and publish a single
# file. "three-way" is the name the mode carried while the panel had three
# models; it is still accepted so an older contract or file validates.
PANEL_ARBITER_MODES = {"panel", "three-way"}
# The canonical anonymised label sequence: the prompt module's, which the browser's
# ARBITER_BLIND_LABELS is held to by `test_arbiter_evaluation_v2.py`. A panel of N
# models is presented as the first N labels.
ARBITER_BLIND_LABELS = BLIND_LABELS


class ContractError(AssertionError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ContractError(message)


def read_json(name: str, data_dir: Path = DATA_DIR) -> Any:
    return json.loads((data_dir / name).read_text(encoding="utf-8"))


def validate_base(data_dir: Path = DATA_DIR) -> set[str]:
    base = read_json("iwac_articles_base.json", data_dir)
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
    contract: SentimentContract, id_set: set[str], data_dir: Path = DATA_DIR
) -> dict[str, dict[str, dict | None]]:
    version = contract.analysis_version
    sentiments: dict[str, dict[str, dict | None]] = {}
    for model_id in contract.model_names:
        payload = read_json(f"iwac_sentiment_{model_id}.json", data_dir)
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
            prose = read_json(f"iwac_justifications_{model_id}_{shard:02d}.json", data_dir)
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
            # The browser fetches exactly the shard `justificationShard` names; a
            # row anywhere else would read as "no justification" in the detail.
            misplaced = sorted(
                article_id
                for article_id in shard_ids
                if justification_shard(article_id, shard_count) != shard
            )
            require(
                not misplaced,
                f"justification {model_id}/{shard} holds {len(misplaced)} misplaced row(s) "
                f"(e.g. {misplaced[:5]})",
            )
            prose_ids.update(shard_ids)
        require(prose_ids == id_set, f"justification/base ID coverage mismatch for {model_id}")
    return sentiments


def validate_extremes(
    contract: SentimentContract, base_ids: set[str], data_dir: Path = DATA_DIR
) -> None:
    for model_id in contract.model_names:
        payload = read_json(f"iwac_extreme_analysis_{model_id}.json", data_dir)
        require(payload.get("model") == model_id, f"extreme file/model mismatch for {model_id}")
        # Stamped since the exports went through staged publication; the frozen
        # v1 files predate the stamp, so it is checked where present.
        for key, expected in (
            ("schema_version", contract.schema_version),
            ("analysis_version", contract.analysis_version),
        ):
            require(
                key not in payload or payload[key] == expected,
                f"extreme {model_id} {key} {payload.get(key)!r} is not {expected!r}",
            )
        index = payload.get("articles_index", {})
        require(
            set(index).issubset(base_ids), f"extreme {model_id} index contains unknown articles"
        )
        # The corpus keeps growing but a panel run is a discrete event, so a
        # denominator counting rows the panel never scored would silently
        # deflate every published percentage.
        require(
            payload.get("statistics", {}).get("total_articles") == len(base_ids),
            f"extreme {model_id} counts {payload.get('statistics', {}).get('total_articles')} "
            f"articles against a base of {len(base_ids)}: the run was not scoped to the "
            "articles the panel processed",
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


def validate_places(base_ids: set[str], data_dir: Path = DATA_DIR) -> None:
    payload = read_json("iwac_places.json", data_dir)
    place_ids = {place["id"] for place in payload.get("places", [])}
    require(len(place_ids) == len(payload.get("places", [])), "place IDs must be unique")
    for article_id, references in payload.get("articles", {}).items():
        require(article_id in base_ids, f"place edges contain unknown article {article_id}")
        require(
            set(references).issubset(place_ids), f"article {article_id} references an unknown place"
        )


def validate_arbiter(
    contract: SentimentContract,
    base_ids: set[str],
    sentiments: dict[str, dict[str, dict | None]],
    data_dir: Path = DATA_DIR,
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

        payload = read_json(f"iwac_arbiter_evaluations_{pair}.json", data_dir)
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


def validate_arbiter_envelope(contract: SentimentContract, payload: dict) -> None:
    """Check a panel arbiter file's self-consistency, without the score files.

    Everything that can be judged from the file and the contract alone: the
    contract binding, the model list, the blind permutation, duplicates, the
    stored count and the fingerprints. The export runs this on its stage before
    every save; `validate_arbiter_three_way` adds the eligibility frame, which
    needs the published scores.
    """
    model_ids = list(contract.model_names)
    metadata = payload.get("metadata", {})
    evaluations = payload.get("evaluations", [])
    evaluation_ids = [str(row.get("article_id")) for row in evaluations]

    require(
        metadata.get("contract_schema_version") == contract.schema_version
        and metadata.get("analysis_version") == contract.analysis_version,
        f"panel arbiter is not bound to the {contract.analysis_version} contract",
    )
    require(
        metadata.get("mode") == contract.arbiter.get("mode"),
        "panel arbiter metadata mode does not match the contract's",
    )
    require(
        list(metadata.get("models", [])) == model_ids,
        "panel arbiter metadata does not list the contract's models",
    )
    # One anonymised label per model, taken from the canonical sequence: the
    # published verdicts name a label, and only this mapping resolves it.
    require(
        len(model_ids) <= len(ARBITER_BLIND_LABELS),
        f"the {contract.analysis_version} panel has more models than there are blind labels",
    )
    expected_labels = set(ARBITER_BLIND_LABELS[: len(model_ids)])
    permutation = metadata.get("blind_permutation", {})
    require(
        set(permutation) == expected_labels,
        f"panel arbiter blind permutation must use the labels {sorted(expected_labels)}",
    )
    require(
        sorted(permutation.values()) == sorted(model_ids),
        "panel arbiter blind permutation must be a bijection over the models",
    )
    require(
        len(evaluation_ids) == len(set(evaluation_ids)),
        "panel arbiter contains duplicate IDs",
    )
    require(
        metadata.get("successful_evaluations") == len(evaluations),
        "panel arbiter metadata count is stale",
    )
    require(
        all(row.get("cache_fingerprint") for row in evaluations),
        "panel arbiter row lacks a fingerprint",
    )


def validate_arbiter_three_way(
    contract: SentimentContract,
    base_ids: set[str],
    sentiments: dict[str, dict[str, dict | None]],
    data_dir: Path = DATA_DIR,
) -> None:
    """Validate the v2 panel arbiter file, which is optional until it runs."""
    if not (data_dir / ARBITER_V2_FILENAME).exists():
        return

    payload = read_json(ARBITER_V2_FILENAME, data_dir)
    validate_arbiter_envelope(contract, payload)

    model_ids = list(contract.model_names)
    # The frame is the contract's *arbiter* eligibility, not the dashboard's
    # significant-spread rule: a valence flip two ranks wide is worth paying to
    # arbitrate without being worth flagging as a significant discrepancy. A run
    # may narrow this with --rule/--dimensions; nothing may widen it.
    eligible = {
        article_id
        for article_id in base_ids
        if is_arbiter_eligible(
            [sentiments[model_id].get(article_id) or {} for model_id in model_ids], contract
        )
    }
    evaluation_ids = {str(row.get("article_id")) for row in payload.get("evaluations", [])}
    require(
        evaluation_ids.issubset(eligible),
        "panel arbiter contains stale/non-eligible IDs",
    )


def validate_manifest(contract: SentimentContract, data_dir: Path = DATA_DIR) -> None:
    name = manifest_filename(contract.analysis_version)
    path = data_dir / name
    if not path.exists():
        return
    manifest = read_json(name, data_dir)
    require(
        manifest.get("schema_version") == contract.schema_version,
        f"{name} schema version mismatch",
    )
    require(
        manifest.get("analysis_version") == contract.analysis_version,
        f"{name} analysis version mismatch",
    )
    for entry_name, expected in manifest.get("files", {}).items():
        file_path = data_dir / entry_name
        require(file_path.is_file(), f"{name} references missing {entry_name}")
        require(
            file_path.stat().st_size == expected["bytes"], f"{name} size mismatch for {entry_name}"
        )
        actual = hashlib.sha256(file_path.read_bytes()).hexdigest()
        require(actual == expected["sha256"], f"{name} checksum mismatch for {entry_name}")


def validate_generation(
    contract: SentimentContract, base_ids: set[str], data_dir: Path = DATA_DIR
) -> None:
    sentiments = validate_core(contract, base_ids, data_dir)
    validate_extremes(contract, base_ids, data_dir)
    if contract.arbiter.get("mode") in PANEL_ARBITER_MODES:
        validate_arbiter_three_way(contract, base_ids, sentiments, data_dir)
    else:
        validate_arbiter(contract, base_ids, sentiments, data_dir)
    validate_manifest(contract, data_dir)


def validate_all(data_dir: Path = DATA_DIR) -> None:
    base_ids = validate_base(data_dir)
    validate_places(base_ids, data_dir)
    for contract in CONTRACTS.values():
        validate_generation(contract, base_ids, data_dir)


if __name__ == "__main__":
    validate_all()
    print("Generated data contract: OK (" + ", ".join(CONTRACTS) + ")")
