"""
Fetch the IWAC articles dataset from Hugging Face and write the webapp's
article data as three kinds of file:

  * ``iwac_articles_base.json``      — shared metadata, stored once
  * ``iwac_sentiment_<model>.json``  — per-model SCORES, keyed by article id
  * ``iwac_justifications_<model>_<shard>.json`` — on-demand prose shards

The base metadata is identical across models, so storing it once instead of in
three combined files saves ~2x the metadata volume. The score/justification
split matters far more: the justification prose is 86-92% of a model's bytes
but is only ever read by the article-detail views and the CSV exports, so the
webapp loads it on demand instead of paying for it before drawing a chart.
The frontend joins base + scores at load time (articles.svelte.ts) and merges
the justifications in lazily.

Two analysis generations are published side by side, selected with the required
``--generation`` flag. The flag has no default on purpose: the v1 files are
frozen so that the published figures stay reproducible, and an unflagged
re-run would silently rewrite them from whatever revision is current. The base
metadata belongs to both generations, so only a v1 run writes it; a v2 run
verifies that the live article set still matches it and refuses to continue
otherwise.

The base is also the corpus. Articles ingested upstream after it was written
are left out of both generations, because a panel run is a discrete event and
a newer article is scored by part of the panel at most (Claude Haiku 5.5
annotated the 4,367 Burkina Faso articles added in October 2026, which no other
model has read). Admitting them is a deliberate step: a v1 run with
``--admit-new-articles``. An article deleted upstream fails a v2 run; a v1 run
drops it from the base, which is that run's job.

This command publishes one generation. A corpus refresh that touches the base
leaves the other generation, the extremes and the places stale until they are
re-run, so ``refresh-all.py`` is the preferred path: it stages everything and
publishes once. The payload assembly lives in ``iwac_preprocess.generation``.
"""

import argparse
import os
import shutil
from pathlib import Path

import validate_generated_data as validator
from iwac_preprocess.generation import (
    build_generation_payloads,
    require_shared_shard_count,
    scope_to_published_corpus,
    stage_generation,
)
from iwac_preprocess.publication import publish_generation, staged_publication
from shared import (
    BASE_FILENAME,
    GENERATIONS,
    HF_REPO_ID,
    SentimentContract,
    get_contract,
    get_logger,
    get_source_revision,
    get_staging_dir,
    get_webapp_data_dir,
    load_iwac_records,
)

logger = get_logger(__name__)


def main(argv: list[str] | None = None) -> None:
    """Fetch the IWAC articles and export one JSON dataset per model."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--generation",
        required=True,
        choices=GENERATIONS,
        help="Analysis generation to publish. Required: a v1 run rewrites the frozen "
        "published files.",
    )
    parser.add_argument(
        "--admit-new-articles",
        action="store_true",
        help="v1 only: add articles ingested upstream since the base was written, with "
        "null scores for every model that has not annotated them. Without it the "
        "published corpus never grows.",
    )
    args = parser.parse_args(argv)

    contract: SentimentContract = get_contract(args.generation)
    require_shared_shard_count(contract)

    logger.info("Loading config: articles (%s)", contract.analysis_version)

    records = load_iwac_records(contract)
    logger.info("Dataset loaded successfully! Number of articles: %d", len(records))
    target = Path(get_webapp_data_dir())
    records = scope_to_published_corpus(
        records, args.generation, args.admit_new_articles, target / BASE_FILENAME, logger
    )

    logger.info("Processing %d records...", len(records))
    payloads = build_generation_payloads(records, contract)

    # Exclusive writer lock, released by the OS even if a run is killed; the
    # stage sits beside static/, never inside it.
    with staged_publication(target, Path(get_staging_dir())) as stage:
        if (target / BASE_FILENAME).exists():
            shutil.copy2(target / BASE_FILENAME, stage / BASE_FILENAME)
        names = stage_generation(
            stage,
            payloads,
            source_repository=HF_REPO_ID,
            source_revision=get_source_revision(HF_REPO_ID),
            logger=logger,
        )
        logger.info("Staged %d files in %s", len(names), os.fspath(stage))

        base_ids = validator.validate_base(stage)
        validator.validate_core(contract, base_ids, stage)
        validator.validate_manifest(contract, stage)
        publish_generation(stage, target, names)


if __name__ == "__main__":
    main()
