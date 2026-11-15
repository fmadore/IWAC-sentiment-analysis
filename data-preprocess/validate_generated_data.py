"""Offline integrity checks for every checked-in browser data asset.

Both published generations are validated. The shared article base is checked
once, then each generation's score, justification, extreme-analysis, arbiter
and manifest files are checked against their own contract.

Every check takes the directory it reads as ``data_dir``, defaulting to the
checked-in data. The exports call the same checks on their staging directory
before promoting anything, so a file the repository would reject never reaches
``static/data/``.

``collect_violations`` runs every check and returns every failure rather than
stopping at the first, which is what the test suite and the command line
report; the individual ``validate_*`` functions still raise on their first
failure, which is what an export wants before it promotes anything.
"""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Callable, Iterable, Mapping
from datetime import datetime
from functools import partial
from pathlib import Path
from typing import Any

from iwac_preprocess import (
    CONTRACTS,
    SentimentContract,
    calculate_discrepancies,
    calculate_three_way_spread,
    get_models_from_pair,
    has_polarity_valence_flip,
    is_arbiter_eligible,
    manifest_filename,
)
from iwac_preprocess.arbiter_prompt import BLIND_LABELS
from iwac_preprocess.arbiter_selection import RULES, qualifies
from iwac_preprocess.extremes import CATEGORIES, check_category_labels
from iwac_preprocess.shards import justification_shard

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "ma-visualisation-sentiments" / "static" / "data"
DATE_RE = re.compile(r"^\d{4}(?:-\d{2}(?:-\d{2})?)?(?:/\d{4}(?:-\d{2}(?:-\d{2})?)?)?$")
EXTREME_CATEGORIES = {category.key for category in CATEGORIES}
ARBITER_V2_FILENAME = "iwac_arbiter_evaluations_v2.json"
# A second v2 judge from another developer publishes beside the first, one file
# per judge (`arbiter-evaluation-v2-second-judge.py`).
SECOND_JUDGE_PATTERN = "iwac_arbiter_evaluations_v2_*.json"
# Arbiter modes that judge the whole panel in one call and publish a single
# file. "three-way" is the name the mode carried while the panel had three
# models; it is still accepted so an older contract or file validates.
PANEL_ARBITER_MODES = {"panel", "three-way"}
# The canonical anonymised label sequence: the prompt module's, which the browser's
# ARBITER_BLIND_LABELS is held to by `test_arbiter_evaluation_v2.py`. A panel of N
# models is presented as the first N labels.
ARBITER_BLIND_LABELS = BLIND_LABELS

Sentiments = dict[str, dict[str, dict | None]]


class ContractError(AssertionError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ContractError(message)


def read_json(name: str, data_dir: Path = DATA_DIR) -> Any:
    return json.loads((data_dir / name).read_text(encoding="utf-8"))


def validate_source_block(payload: Mapping[str, Any], name: str) -> None:
    """The optional provenance block of a derived payload, checked where present.

    Files published before the block existed carry none and stay valid.
    """
    if "source" not in payload:
        return
    source = payload["source"]
    require(isinstance(source, dict), f"{name} source block must be an object")
    require(
        isinstance(source.get("repository"), str) and bool(source["repository"]),
        f"{name} source block names no repository",
    )
    revision = source.get("revision")
    require(
        revision is None or isinstance(revision, str) and bool(revision),
        f"{name} source revision must be a non-empty string or null",
    )
    if "generated" in source:
        try:
            generated = datetime.fromisoformat(source["generated"])
        except (TypeError, ValueError):
            raise ContractError(f"{name} source timestamp is not ISO 8601") from None
        require(generated.utcoffset() is not None, f"{name} source timestamp is not tz-aware")


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


def read_scores(contract: SentimentContract, data_dir: Path = DATA_DIR) -> Sentiments:
    """Every model's score map, unvalidated; for checks that only need to read them."""
    return {
        model_id: read_json(f"iwac_sentiment_{model_id}.json", data_dir).get("sentiments") or {}
        for model_id in contract.model_names
    }


def validate_core_model(
    contract: SentimentContract, model_id: str, id_set: set[str], data_dir: Path = DATA_DIR
) -> dict[str, dict | None]:
    """One model's score file and prose shards; returns its score map."""
    version = contract.analysis_version
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
    require(set(model_sentiments) == id_set, f"sentiment/base ID coverage mismatch for {model_id}")
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
        require(prose_ids.isdisjoint(shard_ids), f"duplicate prose IDs across {model_id} shards")
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
    return model_sentiments


def validate_core(
    contract: SentimentContract, id_set: set[str], data_dir: Path = DATA_DIR
) -> Sentiments:
    return {
        model_id: validate_core_model(contract, model_id, id_set, data_dir)
        for model_id in contract.model_names
    }


def extreme_members(scores: Mapping[str, dict | None]) -> dict[str, set[str]]:
    """Each extremes category's article ids, recomputed from one score map.

    The same predicates the export applies to the upstream rows, applied to
    what was published from those rows: a mismatch means the extremes and the
    scores were computed from different data, or a label stopped matching.
    """
    members: dict[str, set[str]] = {category.key: set() for category in CATEGORIES}
    for article_id, analysis in scores.items():
        if not analysis:
            continue
        values = (
            analysis.get("subjectivite_score"),
            analysis.get("polarite"),
            analysis.get("centralite_islam_musulmans"),
        )
        for category in CATEGORIES:
            if category.matches(*values):
                members[category.key].add(article_id)
    return members


def validate_extremes_model(
    contract: SentimentContract,
    model_id: str,
    base_ids: set[str],
    data_dir: Path = DATA_DIR,
    scores: Mapping[str, dict | None] | None = None,
) -> None:
    """One model's extremes file; with ``scores``, its category membership too."""
    name = f"iwac_extreme_analysis_{model_id}.json"
    payload = read_json(name, data_dir)
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
    validate_source_block(payload, name)
    index = payload.get("articles_index", {})
    require(set(index).issubset(base_ids), f"extreme {model_id} index contains unknown articles")
    # The corpus keeps growing but a panel run is a discrete event, so a
    # denominator counting rows the panel never scored would silently
    # deflate every published percentage.
    statistics = payload.get("statistics", {})
    require(
        statistics.get("total_articles") == len(base_ids),
        f"extreme {model_id} counts {statistics.get('total_articles')} "
        f"articles against a base of {len(base_ids)}: the run was not scoped to the "
        "articles the panel processed",
    )
    analysis = payload.get("analysis", {})
    require(set(analysis) == EXTREME_CATEGORIES, f"extreme {model_id} category set is incomplete")
    referenced: set[str] = set()
    for category in CATEGORIES:
        references = analysis[category.key].get("article_ids", [])
        require(
            len(references) == len(set(references)),
            f"extreme {model_id}/{category.key} contains duplicate references",
        )
        require(
            set(references).issubset(index),
            f"extreme {model_id}/{category.key} references an unknown index row",
        )
        require(
            statistics.get(f"{category.stat_key}_count") == len(references),
            f"extreme {model_id}/{category.key} count "
            f"{statistics.get(f'{category.stat_key}_count')} is not its "
            f"{len(references)} references",
        )
        referenced.update(references)
    # The index exists to be referenced; a row nothing points at is dead weight
    # the browser denormalises for nothing, and a sign the lists were truncated.
    require(set(index) == referenced, f"extreme {model_id} index holds rows no category references")
    if scores is None:
        return
    recomputed = extreme_members(scores)
    for category in CATEGORIES:
        published = set(analysis[category.key].get("article_ids", []))
        missing = sorted(recomputed[category.key] - published, key=int)
        extra = sorted(published - recomputed[category.key], key=int)
        require(
            not missing and not extra,
            f"extreme {model_id}/{category.key} disagrees with iwac_sentiment_{model_id}.json: "
            f"{len(missing)} missing (e.g. {missing[:5]}), {len(extra)} extra (e.g. {extra[:5]})",
        )


def validate_extremes(
    contract: SentimentContract,
    base_ids: set[str],
    data_dir: Path = DATA_DIR,
    sentiments: Mapping[str, Mapping[str, dict | None]] | None = None,
) -> None:
    """Every model's extremes file; pass ``sentiments`` to recompute membership.

    An export validating a stage that holds only the extremes passes the
    published score maps, read with `read_scores` from the target.
    """
    check_category_labels(contract)
    for model_id in contract.model_names:
        validate_extremes_model(
            contract,
            model_id,
            base_ids,
            data_dir,
            None if sentiments is None else sentiments[model_id],
        )


def validate_places(base_ids: set[str], data_dir: Path = DATA_DIR) -> None:
    payload = read_json("iwac_places.json", data_dir)
    validate_source_block(payload, "iwac_places.json")
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
    sentiments: Mapping[str, Mapping[str, dict | None]],
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
        # The discrepancy stored beside each verdict is what the view shows as
        # the reason the article was judged; it must still be the scores'.
        stale = [
            str(row.get("article_id"))
            for row in evaluations
            if "discrepancies" in row
            and row["discrepancies"]
            != calculate_discrepancies(
                sentiments[model_a].get(str(row.get("article_id"))) or {},
                sentiments[model_b].get(str(row.get("article_id"))) or {},
                contract,
            )
        ]
        require(
            not stale,
            f"arbiter {pair} stores {len(stale)} discrepancy record(s) the scores no longer "
            f"give (e.g. {stale[:5]})",
        )


def validate_arbiter_envelope(
    contract: SentimentContract, payload: dict, model_ids: list[str] | None = None
) -> None:
    """Check a panel arbiter file's self-consistency, without the score files.

    Everything that can be judged from the file and the contract alone: the
    contract binding, the model list, the blind permutation, duplicates, the
    stored count and the fingerprints. The export runs this on its stage before
    every save; `validate_arbiter_three_way` adds the eligibility frame, which
    needs the published scores.

    The model list is the arbiter's panel — the published judge's unless
    ``model_ids`` names another judge's: a model the contract recuses must never
    appear in the file, which a bijection over the unrecused models already
    guarantees.
    """
    model_ids = list(contract.arbiter_model_ids if model_ids is None else model_ids)
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
        "panel arbiter metadata does not list the contract's arbiter panel",
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


def panel_frame(
    contract: SentimentContract,
    model_ids: Iterable[str],
    article_ids: Iterable[str],
    sentiments: Mapping[str, Mapping[str, dict | None]],
    selection: Mapping[str, Any] | None = None,
) -> set[str]:
    """The articles a panel arbiter may publish: the contract's frame, or a run's.

    Without ``selection`` this is the contract's arbiter eligibility, the
    widest frame any run may publish from. With a run's recorded
    ``metadata.selection`` it is the narrower frame that run selected from,
    recomputed under its own rule, dimensions and threshold.
    """
    model_ids = list(model_ids)
    frame: set[str] = set()
    for article_id in article_ids:
        analyses = [sentiments[model_id].get(article_id) or {} for model_id in model_ids]
        if selection is None:
            if is_arbiter_eligible(analyses, contract):
                frame.add(article_id)
            continue
        spread = calculate_three_way_spread(analyses, contract)
        if spread and qualifies(
            spread,
            selection["dimensions"],
            selection["threshold"],
            rule=selection["arbiter_rule"],
            valence_flip=has_polarity_valence_flip(analyses, contract),
        ):
            frame.add(article_id)
    return frame


def validate_arbiter_rows(
    contract: SentimentContract,
    payload: Mapping[str, Any],
    base_ids: set[str],
    sentiments: Mapping[str, Mapping[str, dict | None]],
    model_ids: list[str] | None = None,
) -> None:
    """Each published verdict's stored context, recomputed from the score files.

    The ``spread`` beside a verdict is what the view shows as the reason the
    article was judged, and it is hashed into the cache fingerprint, so it must
    still be the spread the scores give over the judge's panel. Each row must
    also qualify under the rule the run recorded in ``metadata.selection`` (a
    file recorded before that block existed is held to the contract frame
    only), and the recorded frame size must still be the frame the scores give.
    """
    model_ids = list(contract.arbiter_model_ids if model_ids is None else model_ids)
    evaluations = payload.get("evaluations", [])
    selection = (payload.get("metadata") or {}).get("selection")
    if not isinstance(selection, dict) or "arbiter_rule" not in selection:
        selection = None
    else:
        require(
            selection["arbiter_rule"] in RULES,
            f"panel arbiter records unknown rule {selection['arbiter_rule']!r}",
        )
        require(
            selection.get("threshold", 0) >= (contract.significant_spread_threshold or 0),
            "panel arbiter records a threshold looser than the contract's",
        )

    stale: list[str] = []
    for row in evaluations:
        article_id = str(row.get("article_id"))
        analyses = [sentiments[model_id].get(article_id) or {} for model_id in model_ids]
        if row.get("spread") != calculate_three_way_spread(analyses, contract):
            stale.append(article_id)
    require(
        not stale,
        f"panel arbiter stores {len(stale)} spread record(s) the scores no longer give "
        f"(e.g. {stale[:5]})",
    )

    if selection is None:
        return
    frame = panel_frame(contract, model_ids, base_ids, sentiments, selection)
    outside = sorted(
        (
            str(row.get("article_id"))
            for row in evaluations
            if str(row.get("article_id")) not in frame
        ),
        key=int,
    )
    require(
        not outside,
        f"panel arbiter publishes {len(outside)} verdict(s) its recorded "
        f"{selection['arbiter_rule']!r} rule does not select (e.g. {outside[:5]})",
    )
    if "eligible_articles" in selection:
        require(
            selection["eligible_articles"] == len(frame),
            f"panel arbiter records a frame of {selection['eligible_articles']} articles; "
            f"the scores now give {len(frame)} under its rule",
        )


def validate_arbiter_three_way(
    contract: SentimentContract,
    base_ids: set[str],
    sentiments: Mapping[str, Mapping[str, dict | None]],
    data_dir: Path = DATA_DIR,
) -> None:
    """Validate the v2 panel arbiter file, which is optional until it runs."""
    if not (data_dir / ARBITER_V2_FILENAME).exists():
        return

    payload = read_json(ARBITER_V2_FILENAME, data_dir)
    validate_arbiter_envelope(contract, payload)

    # Recomputed over the arbiter's panel only: a recused model never moves an
    # article into the frame or out of it.
    # The frame is the contract's *arbiter* eligibility, not the dashboard's
    # significant-spread rule: a valence flip two ranks wide is worth paying to
    # arbitrate without being worth flagging as a significant discrepancy. A run
    # may narrow this with --rule/--dimensions; nothing may widen it.
    eligible = panel_frame(contract, contract.arbiter_model_ids, base_ids, sentiments)
    evaluation_ids = {str(row.get("article_id")) for row in payload.get("evaluations", [])}
    require(
        evaluation_ids.issubset(eligible),
        "panel arbiter contains stale/non-eligible IDs",
    )
    validate_arbiter_rows(contract, payload, base_ids, sentiments)


def validate_second_judge_envelope(contract: SentimentContract, payload: dict) -> None:
    """Check a second judge's file: its panel is its *own* developer's recusal.

    The judge's developer is read from the file and must be registered; the
    model list must then be exactly `panel_for(developer)` and the recorded
    recusal exactly `recused_for(developer)`. A judge whose file listed its own
    developer's member would be the unrecused reading this whole design exists
    to prevent.
    """
    metadata = payload.get("metadata", {})
    developer = metadata.get("arbiter_developer")
    require(
        developer in contract.developers,
        f"second judge names unregistered developer {developer!r}",
    )
    require(
        list(metadata.get("recused_models", [])) == list(contract.recused_for(developer)),
        f"second judge from {developer} does not record its own developer's recusal",
    )
    validate_arbiter_envelope(contract, payload, contract.panel_for(developer))


def validate_second_judges(
    contract: SentimentContract,
    base_ids: set[str],
    sentiments: Mapping[str, Mapping[str, dict | None]],
    data_dir: Path = DATA_DIR,
) -> None:
    """Validate every second-judge file, each optional until it runs.

    A second judge's frame is the whole generation's, not its own panel's: it
    exists to hear the flips the published arbiter's recused member creates. So
    eligibility is recomputed over every model of the generation.
    """
    model_ids = list(contract.model_names)
    eligible: set[str] | None = None
    for path in sorted(data_dir.glob(SECOND_JUDGE_PATTERN)):
        payload = read_json(path.name, data_dir)
        validate_second_judge_envelope(contract, payload)
        if eligible is None:
            eligible = panel_frame(contract, model_ids, base_ids, sentiments)
        evaluation_ids = {str(row.get("article_id")) for row in payload.get("evaluations", [])}
        require(
            evaluation_ids.issubset(eligible),
            f"{path.name} contains stale/non-eligible IDs",
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
    validate_extremes(contract, base_ids, data_dir, sentiments)
    if contract.arbiter.get("mode") in PANEL_ARBITER_MODES:
        validate_arbiter_three_way(contract, base_ids, sentiments, data_dir)
        validate_second_judges(contract, base_ids, sentiments, data_dir)
    else:
        validate_arbiter(contract, base_ids, sentiments, data_dir)
    validate_manifest(contract, data_dir)


def _attempt(violations: list[str], label: str, check: Callable[[], Any]) -> Any:
    """Run one check, recording its failure instead of raising; ``None`` on failure."""
    try:
        return check()
    except ContractError as error:
        violations.append(f"{label}: {error}")
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as error:
        # A missing or malformed file is a violation to report beside the
        # others, not a reason to hide them.
        violations.append(f"{label}: {type(error).__name__}: {error}")
    return None


def collect_violations(data_dir: Path = DATA_DIR) -> list[str]:
    """Run every check on ``data_dir`` and return every failure, in order.

    Checks are split per model where the files are per model, so one bad file
    never hides another's problem. A check that needs a failed input (the
    arbiter needs every score file) is skipped and the skip is reported.
    """
    violations: list[str] = []
    base_ids: set[str] | None = _attempt(violations, "base", partial(validate_base, data_dir))
    if base_ids is None:
        return violations
    _attempt(violations, "places", partial(validate_places, base_ids, data_dir))
    for contract in CONTRACTS.values():
        version = contract.analysis_version
        sentiments: Sentiments = {}
        for model_id in contract.model_names:
            scores = _attempt(
                violations,
                f"{version}/core/{model_id}",
                partial(validate_core_model, contract, model_id, base_ids, data_dir),
            )
            if scores is not None:
                sentiments[model_id] = scores
        _attempt(violations, f"{version}/extremes", partial(check_category_labels, contract))
        for model_id in contract.model_names:
            _attempt(
                violations,
                f"{version}/extremes/{model_id}",
                partial(
                    validate_extremes_model,
                    contract,
                    model_id,
                    base_ids,
                    data_dir,
                    sentiments.get(model_id),
                ),
            )
        checks: list[tuple[str, Callable[[], Any]]] = []
        if set(sentiments) != set(contract.model_names):
            violations.append(f"{version}/arbiter: skipped, a score file failed validation")
        elif contract.arbiter.get("mode") in PANEL_ARBITER_MODES:
            checks += [
                (
                    "arbiter",
                    partial(validate_arbiter_three_way, contract, base_ids, sentiments, data_dir),
                ),
                (
                    "second-judges",
                    partial(validate_second_judges, contract, base_ids, sentiments, data_dir),
                ),
            ]
        else:
            checks.append(
                ("arbiter", partial(validate_arbiter, contract, base_ids, sentiments, data_dir))
            )
        checks.append(("manifest", partial(validate_manifest, contract, data_dir)))
        for name, check in checks:
            _attempt(violations, f"{version}/{name}", check)
    return violations


def validate_all(data_dir: Path = DATA_DIR) -> None:
    """Raise one ``ContractError`` listing every violation in ``data_dir``."""
    violations = collect_violations(data_dir)
    require(
        not violations,
        f"{len(violations)} generated-data violation(s):\n" + "\n".join(violations),
    )


if __name__ == "__main__":
    validate_all()
    print("Generated data contract: OK (" + ", ".join(CONTRACTS) + ")")
