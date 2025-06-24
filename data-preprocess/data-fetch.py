from datasets import load_dataset
import os
import json
from tqdm import tqdm

print(f"\n{'='*50}")
print(f"Loading config: articles")
print(f"{'='*50}")

# Load the dataset with 'articles' config only
dataset = load_dataset("fmadore/iwac-newspaper-articles", "articles")

# Access the data
print(f"Dataset info for 'articles':")
print(dataset)
print(f"\nFirst example from 'articles':")
print(dataset['train'][0])  # View first example

# Convert to list of dictionaries with Gemini data mapping
gemini_data_list = []
# Convert to list of dictionaries with ChatGPT data mapping
chatgpt_data_list = []

print(f"\nProcessing {len(dataset['train'])} records...")
for item in tqdm(dataset['train'], desc="Processing articles"):
    # Base item structure for both datasets
    base_item = {
        "o:id": int(item.get("o:id")) if item.get("o:id") is not None else None,
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
        "subjectivite_score": int(item.get("gemini_subjectivite_score")) if item.get("gemini_subjectivite_score") is not None else None,
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
        "subjectivite_score": int(item.get("chatgpt_subjectivite_score")) if item.get("chatgpt_subjectivite_score") is not None else None,
        "subjectivite_justification": item.get("chatgpt_subjectivite_justification"),
        "polarite": item.get("chatgpt_polarite"),
        "polarite_justification": item.get("chatgpt_polarite_justification")
    }
    chatgpt_data_list.append(chatgpt_item)

# Create the output directory if it doesn't exist
output_dir = os.path.join(os.path.dirname(__file__), "..", "ma-visualisation-sentiments", "static", "data")
os.makedirs(output_dir, exist_ok=True)

# Save Gemini data as JSON file
gemini_json_filename = "iwac_articles_gemini.json"
gemini_json_path = os.path.join(output_dir, gemini_json_filename)

print(f"\nSaving Gemini articles dataset to JSON file: {gemini_json_path}")
with open(gemini_json_path, 'w', encoding='utf-8') as f:
    json.dump(gemini_data_list, f, ensure_ascii=False, indent=2)

print(f"Gemini JSON file saved successfully! ({len(gemini_data_list)} records)")

# Save ChatGPT data as JSON file
chatgpt_json_filename = "iwac_articles_chatgpt.json"
chatgpt_json_path = os.path.join(output_dir, chatgpt_json_filename)

print(f"\nSaving ChatGPT articles dataset to JSON file: {chatgpt_json_path}")
with open(chatgpt_json_path, 'w', encoding='utf-8') as f:
    json.dump(chatgpt_data_list, f, ensure_ascii=False, indent=2)

print(f"ChatGPT JSON file saved successfully! ({len(chatgpt_data_list)} records)")

print(f"\nFiles created:")
print(f"- Gemini: {gemini_json_path}")
print(f"- ChatGPT: {chatgpt_json_path}")
print(f"{'='*50}")