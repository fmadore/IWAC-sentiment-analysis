import os
from tqdm import tqdm

from shared import (
    MODEL_NAMES,
    build_model_sentiment,
    get_webapp_data_dir,
    load_iwac_dataset,
    safe_int_convert,
    safe_save_json,
    safe_str,
)

print(f"\n{'='*50}")
print(f"Loading config: articles")
print(f"{'='*50}")

df = load_iwac_dataset()
dataset = {"train": df.to_dict('records')}

print(f"Dataset loaded successfully!")
print(f"Number of articles: {len(dataset['train'])}")
# Don't print the first example - it's too much data
# print(f"\nFirst example from 'articles':")
# print(dataset['train'][0])  # View first example

# One output list per model, keyed by model id.
data_lists = {model_id: [] for model_id in MODEL_NAMES}

print(f"\nProcessing {len(dataset['train'])} records...")
for item in tqdm(dataset['train'], desc="Processing articles"):
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
    print(f"\nSaving {model_name} articles dataset to: {json_path}")
    safe_save_json(data_list, json_path)
    print(f"{model_name} JSON file saved successfully! ({len(data_list)} records)")

print(f"\n{'='*50}")