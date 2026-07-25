"""
Fetch the IWAC articles dataset from Hugging Face and write the webapp's
article data as three kinds of file:

  * ``iwac_articles_base.json``      — shared metadata, stored once
  * ``iwac_sentiment_<model>.json``  — per-model SCORES, keyed by article id
  * ``iwac_justifications_<model>.json`` — per-model PROSE, keyed by article id

The base metadata is identical across models, so storing it once instead of in
three combined files saves ~2x the metadata volume. The score/justification
split matters far more: the justification prose is 86-92% of a model's bytes
but is only ever read by the article-detail views and the CSV exports, so the
webapp loads it on demand instead of paying for it before drawing a chart.
The frontend joins base + scores at load time (articles.svelte.ts) and merges
the justifications in lazily.
"""

import os

from tqdm import tqdm

from shared import (
    MODEL_NAMES,
    build_model_justifications,
    build_model_scores,
    get_logger,
    get_webapp_data_dir,
    load_iwac_records,
    safe_int_convert,
    safe_save_json,
    safe_str,
)

logger = get_logger(__name__)


def main() -> None:
    """Fetch the IWAC articles and export one JSON dataset per model."""
    logger.info("Loading config: articles")

    records = load_iwac_records()
    logger.info("Dataset loaded successfully! Number of articles: %d", len(records))

    base_items: list[dict] = []
    scores: dict[str, dict[str, dict | None]] = {model_id: {} for model_id in MODEL_NAMES}
    justifications: dict[str, dict[str, dict | None]] = {model_id: {} for model_id in MODEL_NAMES}

    logger.info("Processing %d records...", len(records))
    for item in tqdm(records, desc="Processing articles"):
        article_id = safe_int_convert(item.get("o:id"))
        iiif = safe_str(item.get("iiif_manifest"))
        base_items.append({
            "o:id": article_id,
            "o:title": safe_str(item.get("title")),
            "Newspaper": safe_str(item.get("newspaper")),
            "Country": safe_str(item.get("country")),
            "dcterms:date": safe_str(item.get("pub_date")),
            **({"iiif_manifest": iiif} if iiif else {})
        })

        for model_id in MODEL_NAMES:
            scores[model_id][str(article_id)] = build_model_scores(item, model_id)
            justifications[model_id][str(article_id)] = build_model_justifications(item, model_id)

    output_dir = get_webapp_data_dir()

    base_path = os.path.join(output_dir, "iwac_articles_base.json")
    logger.info("Saving shared article base metadata to: %s", base_path)
    safe_save_json(base_items, base_path)
    logger.info("Base metadata saved (%d records)", len(base_items))

    for model_id in MODEL_NAMES:
        score_path = os.path.join(output_dir, f"iwac_sentiment_{model_id}.json")
        logger.info("Saving %s sentiment scores to: %s", model_id, score_path)
        safe_save_json({"model": model_id, "sentiments": scores[model_id]}, score_path)

        justification_path = os.path.join(output_dir, f"iwac_justifications_{model_id}.json")
        logger.info("Saving %s justifications to: %s", model_id, justification_path)
        safe_save_json(
            {"model": model_id, "justifications": justifications[model_id]},
            justification_path,
        )

        logger.info("%s JSON files saved successfully! (%d records)", model_id, len(scores[model_id]))


if __name__ == "__main__":
    main()
