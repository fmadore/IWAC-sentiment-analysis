import os
from tqdm import tqdm

from shared import safe_int_convert, load_iwac_dataset, get_webapp_data_dir, save_json

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

# Convert to list of dictionaries with Gemini data mapping
gemini_data_list = []
# Convert to list of dictionaries with ChatGPT data mapping
chatgpt_data_list = []
# Convert to list of dictionaries with Mistral data mapping
mistral_data_list = []

print(f"\nProcessing {len(dataset['train'])} records...")
for item in tqdm(dataset['train'], desc="Processing articles"):
    # Base item structure for all datasets
    base_item = {
        "o:id": safe_int_convert(item.get("o:id")),
        "o:title": item.get("title"),
        "Newspaper": item.get("newspaper"),
        "Country": item.get("country"),
        "dcterms:date": item.get("pub_date")
    }
    
    # Gemini data mapping
    gemini_item = base_item.copy()
    gemini_item["sentiment_analysis"] = {
        "centralite_islam_musulmans": item.get("gemini_centralite_islam_musulmans"),
        "centralite_justification": item.get("gemini_centralite_justification"),
        "subjectivite_score": safe_int_convert(item.get("gemini_subjectivite_score")),
        "subjectivite_justification": item.get("gemini_subjectivite_justification"),
        "polarite": item.get("gemini_polarite"),
        "polarite_justification": item.get("gemini_polarite_justification")
    }
    gemini_data_list.append(gemini_item)
    
    # ChatGPT data mapping
    chatgpt_item = base_item.copy()
    chatgpt_item["sentiment_analysis"] = {
        "centralite_islam_musulmans": item.get("chatgpt_centralite_islam_musulmans"),
        "centralite_justification": item.get("chatgpt_centralite_justification"),
        "subjectivite_score": safe_int_convert(item.get("chatgpt_subjectivite_score")),
        "subjectivite_justification": item.get("chatgpt_subjectivite_justification"),
        "polarite": item.get("chatgpt_polarite"),
        "polarite_justification": item.get("chatgpt_polarite_justification")
    }
    chatgpt_data_list.append(chatgpt_item)
    
    # Mistral data mapping
    mistral_item = base_item.copy()
    mistral_item["sentiment_analysis"] = {
        "centralite_islam_musulmans": item.get("mistral_centralite_islam_musulmans"),
        "centralite_justification": item.get("mistral_centralite_justification"),
        "subjectivite_score": safe_int_convert(item.get("mistral_subjectivite_score")),
        "subjectivite_justification": item.get("mistral_subjectivite_justification"),
        "polarite": item.get("mistral_polarite"),
        "polarite_justification": item.get("mistral_polarite_justification")
    }
    mistral_data_list.append(mistral_item)

# Save all model data
output_dir = get_webapp_data_dir()

for model_name, data_list in [("gemini", gemini_data_list), ("chatgpt", chatgpt_data_list), ("mistral", mistral_data_list)]:
    json_path = os.path.join(output_dir, f"iwac_articles_{model_name}.json")
    print(f"\nSaving {model_name} articles dataset to: {json_path}")
    save_json(data_list, json_path)
    print(f"{model_name} JSON file saved successfully! ({len(data_list)} records)")

print(f"\n{'='*50}")