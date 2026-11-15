"""
Extreme lexical analysis for the IWAC corpus.

Analyses the subject and spatial keywords associated with sentiment extremes
in the IWAC corpus. For each model of the selected analysis generation it
produces:

1. The most frequent keywords for each extreme category
2. The distribution by country and newspaper
3. The top keywords per facet (country/newspaper)
4. The complete article list for each category

The set of extreme categories is driven by ``CATEGORIES`` in
``iwac_preprocess.extremes``; adding a seventh category is a one-line change.

Each payload records the Hugging Face revision it was computed from under an
optional ``source`` block. The staged files are validated against the
published score files, category by category, before anything is promoted.
``refresh-all.py`` runs this step together with the data fetch, which is the
preferred path after a corpus change.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from iwac_preprocess.extremes import CATEGORIES, TOP_KEYWORDS, build_extremes_payloads
from iwac_preprocess.publication import publish_json_files
from iwac_preprocess.serialization import provenance_block
from shared import (
    GENERATIONS,
    HF_REPO_ID,
    get_base_article_ids,
    get_contract,
    get_logger,
    get_source_revision,
    get_staging_dir,
    get_webapp_data_dir,
    load_iwac_records,
    restrict_to_base_articles,
)
from validate_generated_data import read_scores, validate_extremes

logger = get_logger(__name__)


def main(argv: list[str] | None = None) -> None:
    """Run the extreme lexical analysis for every model and save the results.

    Loads the IWAC dataset from Hugging Face, analyses the extremes for each
    model of the selected generation, writes one JSON file per model into the
    webapp's static/data directory, and logs summary statistics.
    """
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--generation",
        required=True,
        choices=GENERATIONS,
        help="Analysis generation to publish. Required: a v1 run rewrites the frozen "
        "published files.",
    )
    args = parser.parse_args(argv)
    contract = get_contract(args.generation)

    logger.info("IWAC Extreme Lexical Analysis (%s)", contract.analysis_version)

    output_dir = get_webapp_data_dir()
    records = load_iwac_records(contract)
    logger.info("Dataset loaded: %d articles", len(records))

    # Scope every figure below to the articles the panel actually processed.
    # Without this the corpus-wide facets and `total_articles` drift away from
    # the annotation-scoped category counts as new articles are ingested.
    base_ids = get_base_article_ids(output_dir)
    records = restrict_to_base_articles(records, base_ids, logger)
    logger.info("Analysing %d processed articles", len(records))

    source = provenance_block(HF_REPO_ID, get_source_revision(HF_REPO_ID))
    payloads = build_extremes_payloads(records, contract, source, top_n=TOP_KEYWORDS)
    all_results = {payload["model"]: payload for payload in payloads.values()}
    for name in payloads:
        logger.info("Saving %s", os.path.join(output_dir, name))
    # Staged and validated as a set, then promoted together under the writer
    # lock: a failure part-way leaves every published file untouched. The
    # membership check reads the published scores, so extremes computed from a
    # different revision than the score files are refused.
    published_scores = read_scores(contract, Path(output_dir))
    publish_json_files(
        Path(output_dir),
        Path(get_staging_dir()),
        payloads,
        validate=lambda stage: validate_extremes(
            contract, base_ids, data_dir=stage, sentiments=published_scores
        ),
    )

    logger.info("ANALYSIS SUMMARY")
    for model_id, results in all_results.items():
        stats = results["statistics"]
        total = stats["total_articles"]
        logger.info("%s statistics:", model_id)
        logger.info("  Total articles: %d", total)
        for category in CATEGORIES:
            count = stats[f"{category.stat_key}_count"]
            logger.info(
                "  %s: %d (%.1f%%)", category.key, count, count / total * 100 if total else 0.0
            )

    # The facets are identical across models; report them from whichever model
    # the generation happens to list first.
    facets = next(iter(all_results.values()))["facets"]
    logger.info("Total countries in dataset: %d", len(facets["countries"]))
    logger.info("Total newspapers in dataset: %d", len(facets["newspapers"]))
    logger.info("Files created in: %s", output_dir)


if __name__ == "__main__":
    main()
