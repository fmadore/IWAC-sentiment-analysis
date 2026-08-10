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
"""

import argparse
import json
import os

from shared import (
    CONTRACT,
    GENERATIONS,
    HF_REPO_ID,
    SentimentContract,
    build_base_article,
    build_model_justifications,
    build_model_scores,
    get_contract,
    get_logger,
    get_source_revision,
    get_webapp_data_dir,
    load_iwac_records,
    manifest_filename,
    safe_int_convert,
    safe_save_json,
    write_generation_manifest,
)
from tqdm import tqdm

logger = get_logger(__name__)
JUSTIFICATION_SHARDS = int(CONTRACT["delivery"]["justificationShards"])
BASE_FILENAME = "iwac_articles_base.json"


def justification_shard(article_id: str) -> int:
    """Stable browser-compatible shard for a numeric Omeka article ID."""
    try:
        return int(article_id) % JUSTIFICATION_SHARDS
    except ValueError:
        # FNV-1a fallback for any future non-numeric identifier.
        value = 2166136261
        for byte in article_id.encode("utf-8"):
            value ^= byte
            value = (value * 16777619) & 0xFFFFFFFF
        return value % JUSTIFICATION_SHARDS


def read_base_article_ids(base_path: str) -> set[str]:
    """Return the article ids recorded in the shared base metadata file."""
    with open(base_path, encoding="utf-8") as handle:
        base_items = json.load(handle)
    return {str(item["o:id"]) for item in base_items}


def assert_base_matches(base_path: str, article_ids: set[str]) -> None:
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

    existing = read_base_article_ids(base_path)
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
    args = parser.parse_args(argv)

    contract: SentimentContract = get_contract(args.generation)
    if contract.justification_shards != JUSTIFICATION_SHARDS:
        raise SystemExit(
            f"{contract.analysis_version} declares {contract.justification_shards} justification "
            f"shards but the browser resolves shards with {JUSTIFICATION_SHARDS}; both "
            "generations must agree."
        )

    logger.info("Loading config: articles (%s)", contract.analysis_version)

    records = load_iwac_records(contract)
    logger.info("Dataset loaded successfully! Number of articles: %d", len(records))

    model_ids = list(contract.model_names)
    base_items: list[dict] = []
    scores: dict[str, dict[str, dict | None]] = {model_id: {} for model_id in model_ids}
    justifications: dict[str, list[dict[str, dict | None]]] = {
        model_id: [{} for _ in range(JUSTIFICATION_SHARDS)] for model_id in model_ids
    }

    logger.info("Processing %d records...", len(records))
    for item in tqdm(records, desc="Processing articles"):
        article_id = safe_int_convert(item.get("o:id"))
        base_items.append(build_base_article(item))

        for model_id in model_ids:
            scores[model_id][str(article_id)] = build_model_scores(item, model_id, contract)
            article_key = str(article_id)
            justifications[model_id][justification_shard(article_key)][article_key] = (
                build_model_justifications(item, model_id, contract)
            )

    output_dir = get_webapp_data_dir()
    base_path = os.path.join(output_dir, BASE_FILENAME)

    if args.generation == "v1":
        logger.info("Saving shared article base metadata to: %s", base_path)
        safe_save_json(base_items, base_path)
        logger.info("Base metadata saved (%d records)", len(base_items))
    else:
        assert_base_matches(base_path, {str(item["o:id"]) for item in base_items})
        logger.info("Shared article base metadata verified against %s", base_path)

    # The base file is listed first either way: for v1 it is a published
    # artifact, for v2 an informational checksum of the input it was verified
    # against.
    generated_files = [base_path]
    for model_id in model_ids:
        score_path = os.path.join(output_dir, f"iwac_sentiment_{model_id}.json")
        logger.info("Saving %s sentiment scores to: %s", model_id, score_path)
        safe_save_json(
            {
                "schema_version": contract.schema_version,
                "analysis_version": contract.analysis_version,
                "model": model_id,
                "sentiments": scores[model_id],
            },
            score_path,
        )

        generated_files.append(score_path)
        for shard, shard_data in enumerate(justifications[model_id]):
            justification_path = os.path.join(
                output_dir, f"iwac_justifications_{model_id}_{shard:02d}.json"
            )
            safe_save_json(
                {
                    "schema_version": contract.schema_version,
                    "analysis_version": contract.analysis_version,
                    "model": model_id,
                    "shard": shard,
                    "shard_count": JUSTIFICATION_SHARDS,
                    "justifications": shard_data,
                },
                justification_path,
            )
            generated_files.append(justification_path)

        logger.info(
            "%s JSON files saved successfully! (%d records)", model_id, len(scores[model_id])
        )

    manifest_path = os.path.join(output_dir, manifest_filename(contract.analysis_version))
    write_generation_manifest(
        manifest_path,
        generated_files,
        contract_schema_version=contract.schema_version,
        analysis_version=contract.analysis_version,
        source_repository=HF_REPO_ID,
        source_revision=get_source_revision(HF_REPO_ID),
    )
    logger.info("Published generation manifest last: %s", manifest_path)


if __name__ == "__main__":
    main()
