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
"""

import os

from shared import (
    ANALYSIS_VERSION,
    CONTRACT,
    CONTRACT_SCHEMA_VERSION,
    HF_REPO_ID,
    MODEL_NAMES,
    build_base_article,
    build_model_justifications,
    build_model_scores,
    get_logger,
    get_source_revision,
    get_webapp_data_dir,
    load_iwac_records,
    safe_int_convert,
    safe_save_json,
    write_generation_manifest,
)
from tqdm import tqdm

logger = get_logger(__name__)
JUSTIFICATION_SHARDS = int(CONTRACT["delivery"]["justificationShards"])


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


def main() -> None:
    """Fetch the IWAC articles and export one JSON dataset per model."""
    logger.info("Loading config: articles")

    records = load_iwac_records()
    logger.info("Dataset loaded successfully! Number of articles: %d", len(records))

    base_items: list[dict] = []
    scores: dict[str, dict[str, dict | None]] = {model_id: {} for model_id in MODEL_NAMES}
    justifications: dict[str, list[dict[str, dict | None]]] = {
        model_id: [{} for _ in range(JUSTIFICATION_SHARDS)] for model_id in MODEL_NAMES
    }

    logger.info("Processing %d records...", len(records))
    for item in tqdm(records, desc="Processing articles"):
        article_id = safe_int_convert(item.get("o:id"))
        base_items.append(build_base_article(item))

        for model_id in MODEL_NAMES:
            scores[model_id][str(article_id)] = build_model_scores(item, model_id)
            article_key = str(article_id)
            justifications[model_id][justification_shard(article_key)][article_key] = (
                build_model_justifications(item, model_id)
            )

    output_dir = get_webapp_data_dir()

    base_path = os.path.join(output_dir, "iwac_articles_base.json")
    logger.info("Saving shared article base metadata to: %s", base_path)
    safe_save_json(base_items, base_path)
    logger.info("Base metadata saved (%d records)", len(base_items))

    generated_files = [base_path]
    for model_id in MODEL_NAMES:
        score_path = os.path.join(output_dir, f"iwac_sentiment_{model_id}.json")
        logger.info("Saving %s sentiment scores to: %s", model_id, score_path)
        safe_save_json(
            {
                "schema_version": CONTRACT_SCHEMA_VERSION,
                "analysis_version": ANALYSIS_VERSION,
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
                    "schema_version": CONTRACT_SCHEMA_VERSION,
                    "analysis_version": ANALYSIS_VERSION,
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

    manifest_path = os.path.join(output_dir, "iwac_data_manifest.json")
    write_generation_manifest(
        manifest_path,
        generated_files,
        contract_schema_version=CONTRACT_SCHEMA_VERSION,
        analysis_version=ANALYSIS_VERSION,
        source_repository=HF_REPO_ID,
        source_revision=get_source_revision(),
    )
    logger.info("Published generation manifest last: %s", manifest_path)


if __name__ == "__main__":
    main()
