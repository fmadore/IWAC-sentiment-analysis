"""
Fetch the IWAC articles dataset from Hugging Face and write one JSON file per
model (ChatGPT, Gemini, Mistral) into the webapp's static/data directory.
"""

import os

from tqdm import tqdm

from shared import (
    MODEL_NAMES,
    build_model_sentiment,
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

    # One output list per model, keyed by model id.
    data_lists: dict[str, list[dict]] = {model_id: [] for model_id in MODEL_NAMES}

    logger.info("Processing %d records...", len(records))
    for item in tqdm(records, desc="Processing articles"):
        # Base item structure shared by every per-model dataset.
        iiif = safe_str(item.get("iiif_manifest"))
        base_item = {
            "o:id": safe_int_convert(item.get("o:id")),
            "o:title": safe_str(item.get("title")),
            "Newspaper": safe_str(item.get("newspaper")),
            "Country": safe_str(item.get("country")),
            "dcterms:date": safe_str(item.get("pub_date")),
            **({"iiif_manifest": iiif} if iiif else {})
        }

        for model_id in MODEL_NAMES:
            model_item = base_item.copy()
            model_item["sentiment_analysis"] = build_model_sentiment(item, model_id)
            data_lists[model_id].append(model_item)

    # Save all model data
    output_dir = get_webapp_data_dir()

    for model_name, data_list in data_lists.items():
        json_path = os.path.join(output_dir, f"iwac_articles_{model_name}.json")
        logger.info("Saving %s articles dataset to: %s", model_name, json_path)
        safe_save_json(data_list, json_path)
        logger.info("%s JSON file saved successfully! (%d records)", model_name, len(data_list))


if __name__ == "__main__":
    main()
