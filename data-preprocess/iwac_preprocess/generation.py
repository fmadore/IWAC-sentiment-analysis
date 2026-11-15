"""Assembly and staging of one generation's browser payloads.

``data-fetch.py`` and ``refresh-all.py`` are thin CLIs around this module, so
the file naming, the payload shapes and the rule that only v1 publishes the
shared base are importable and tested without the network.

Three kinds of file per generation:

* ``iwac_articles_base.json`` — shared metadata, stored once for both
  generations and written only by the generation that owns it (v1);
* ``iwac_sentiment_<model>.json`` — per-model scores keyed by article id;
* ``iwac_justifications_<model>_<shard>.json`` — on-demand prose shards.

Article-keyed output is ordered by numeric article id, never by upstream row
order, so two runs over the same rows write the same bytes even if the source
parquet is reshuffled.
"""

from __future__ import annotations

import logging
import math
import os
from collections.abc import Iterable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .contract import CONTRACT_V1, SentimentContract
from .serialization import manifest_filename, safe_save_json, write_generation_manifest
from .shards import justification_shard
from .source import (
    BASE_FILENAME,
    build_base_article,
    build_model_justifications,
    build_model_scores,
    read_base_article_ids,
    restrict_to_base_articles,
    safe_int_convert,
)

# The generation that writes the shared base. Every other generation verifies
# the live article set against it and refuses to continue on a mismatch.
BASE_OWNER = "v1"
# The browser resolves shards with one count for both generations.
JUSTIFICATION_SHARDS = int(CONTRACT_V1.contract["delivery"]["justificationShards"])


def owns_base(generation: str) -> bool:
    """Whether a run of ``generation`` writes ``iwac_articles_base.json``."""
    return generation == BASE_OWNER


def sentiment_filename(model_id: str) -> str:
    return f"iwac_sentiment_{model_id}.json"


def justification_filename(model_id: str, shard: int) -> str:
    return f"iwac_justifications_{model_id}_{shard:02d}.json"


def require_shared_shard_count(contract: SentimentContract) -> None:
    """Both generations must shard prose the way the browser resolves it."""
    if contract.justification_shards != JUSTIFICATION_SHARDS:
        raise SystemExit(
            f"{contract.analysis_version} declares {contract.justification_shards} justification "
            f"shards but the browser resolves shards with {JUSTIFICATION_SHARDS}; both "
            "generations must agree."
        )


def article_sort_key(record: dict) -> tuple[int, float]:
    """Numeric article id first; an unparseable id sorts last (and fails validation)."""
    article_id = safe_int_convert(record.get("o:id"))
    return (0, article_id) if article_id is not None else (1, math.inf)


def sorted_by_article_id(records: Iterable[dict]) -> list[dict]:
    return sorted(records, key=article_sort_key)


@dataclass
class GenerationPayloads:
    """Everything one generation publishes, keyed by published filename.

    ``base`` is kept apart from ``files`` because whether it is published
    depends on the generation (`owns_base`), not on its content.
    """

    contract: SentimentContract
    base: list[dict] = field(default_factory=list)
    files: dict[str, Any] = field(default_factory=dict)

    @property
    def article_ids(self) -> set[str]:
        return {str(item["o:id"]) for item in self.base}


def build_generation_payloads(
    records: Iterable[dict], contract: SentimentContract
) -> GenerationPayloads:
    """Build the base list, score maps and prose shards for every model."""
    require_shared_shard_count(contract)
    model_ids = list(contract.model_names)
    shard_count = contract.justification_shards
    payloads = GenerationPayloads(contract)
    scores: dict[str, dict[str, dict | None]] = {model_id: {} for model_id in model_ids}
    prose: dict[str, list[dict[str, dict | None]]] = {
        model_id: [{} for _ in range(shard_count)] for model_id in model_ids
    }

    for item in sorted_by_article_id(records):
        article_key = str(safe_int_convert(item.get("o:id")))
        shard = justification_shard(article_key, shard_count)
        payloads.base.append(build_base_article(item))
        for model_id in model_ids:
            scores[model_id][article_key] = build_model_scores(item, model_id, contract)
            prose[model_id][shard][article_key] = build_model_justifications(
                item, model_id, contract
            )

    envelope = {
        "schema_version": contract.schema_version,
        "analysis_version": contract.analysis_version,
    }
    for model_id in model_ids:
        payloads.files[sentiment_filename(model_id)] = {
            **envelope,
            "model": model_id,
            "sentiments": scores[model_id],
        }
        for shard, rows in enumerate(prose[model_id]):
            payloads.files[justification_filename(model_id, shard)] = {
                **envelope,
                "model": model_id,
                "shard": shard,
                "shard_count": shard_count,
                "justifications": rows,
            }
    return payloads


def assert_base_matches(base_path: str | os.PathLike[str], article_ids: set[str]) -> None:
    """Refuse to publish a generation that disagrees with the shared base.

    The frontend joins the base metadata to each generation's score file and
    requires the two id sets to be identical, so a drifted snapshot would ship
    a dataset the app rejects at load time. Failing here is also the only
    signal that the corpus changed under a frozen v1.
    """
    if not os.path.exists(base_path):
        raise SystemExit(
            f"{BASE_FILENAME} is missing. Generate it with `--generation v1` before "
            "publishing another generation."
        )

    existing = read_base_article_ids(os.fspath(base_path))
    if existing == article_ids:
        return

    missing = sorted(existing - article_ids)[:5]
    added = sorted(article_ids - existing)[:5]
    raise SystemExit(
        f"The Hugging Face snapshot no longer matches {BASE_FILENAME}: "
        f"{len(existing - article_ids)} article(s) gone (e.g. {missing}), "
        f"{len(article_ids - existing)} new (e.g. {added}). The base metadata is shared "
        "with the frozen v1 files, so refreshing it is a deliberate cross-generation "
        "decision rather than a side effect of this run."
    )


def scope_to_published_corpus(
    records: list[dict],
    generation: str,
    admit_new_articles: bool,
    base_path: str | os.PathLike[str],
    logger: logging.Logger,
) -> list[dict]:
    """Keep the run on the corpus the base at ``base_path`` already defines.

    The base owner may drop articles deleted upstream and, only when asked,
    admit new ones; with no base yet it writes the first one from everything.
    Any other generation may do neither: an article deleted upstream fails it.
    """
    if admit_new_articles and not owns_base(generation):
        raise SystemExit(
            "--admit-new-articles changes the shared base, which only a v1 run writes. "
            "Run `data-fetch.py --generation v1 --admit-new-articles` first."
        )
    if owns_base(generation) and (admit_new_articles or not os.path.exists(base_path)):
        return records
    return restrict_to_base_articles(
        records,
        read_base_article_ids(os.fspath(base_path)),
        logger,
        drop_vanished=owns_base(generation),
    )


def stage_generation(
    stage: Path,
    payloads: GenerationPayloads,
    *,
    source_repository: str,
    source_revision: str | None,
    logger: logging.Logger | None = None,
) -> list[str]:
    """Write one generation into ``stage`` and return the names to publish.

    The base owner writes ``stage/iwac_articles_base.json``; any other
    generation verifies its article set against the base already in the stage
    (the published one, or the one an earlier step of the same refresh wrote).
    The manifest lists the base first either way — a published artifact for
    the owner, an informational checksum of the verified input otherwise — and
    is written, and returned, last.
    """
    contract = payloads.contract
    base_path = stage / BASE_FILENAME
    if owns_base(contract.analysis_version):
        safe_save_json(payloads.base, base_path)
        if logger:
            logger.info("Staged shared article base (%d records)", len(payloads.base))
    else:
        assert_base_matches(base_path, payloads.article_ids)
        if logger:
            logger.info("Shared article base verified against %s", base_path)

    generated = [base_path]
    for name, payload in payloads.files.items():
        safe_save_json(payload, stage / name)
        generated.append(stage / name)

    manifest = stage / manifest_filename(contract.analysis_version)
    write_generation_manifest(
        manifest,
        list(generated),
        contract_schema_version=contract.schema_version,
        analysis_version=contract.analysis_version,
        source_repository=source_repository,
        source_revision=source_revision,
    )
    names = [
        path.name
        for path in generated
        if owns_base(contract.analysis_version) or path.name != BASE_FILENAME
    ]
    return [*names, manifest.name]
