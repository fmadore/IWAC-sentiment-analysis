from datasets import load_dataset
import os
import json
from tqdm import tqdm
import pandas as pd
from huggingface_hub import hf_hub_download

# Helper function to safely convert to int, handling NaN values
def safe_int_convert(value):
    if pd.isna(value) or value is None:
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None

print(f"\n{'='*50}")
print(f"Loading config: articles")
print(f"{'='*50}")

# Try to download the parquet files directly
try:
    print("Attempting to download dataset files directly...")
    
    # Download the parquet file for articles directly
    parquet_path = hf_hub_download(
        repo_id="fmadore/islam-west-africa-collection", 
        filename="articles/train-00000-of-00001.parquet",
        repo_type="dataset"
    )
    
    print(f"Downloaded parquet file to: {parquet_path}")
    
    # Load with pandas first to see the structure
    df = pd.read_parquet(parquet_path)
    print(f"Successfully loaded {len(df)} rows")
    print(f"Number of columns: {len(df.columns)}")
    
    # Convert to list of dictionaries
    dataset_dict = df.to_dict('records')
    dataset = {"train": dataset_dict}
    
except Exception as e:
    print(f"Direct download failed: {e}")
    print("Trying alternative approach...")
    
    # Fallback: try to load dataset with ignore_verifications
    try:
        dataset = load_dataset("fmadore/islam-west-africa-collection", "articles", verification_mode="no_checks")
    except Exception as e2:
        print(f"Alternative approach also failed: {e2}")
        raise e2

# Access the data
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

# Save Mistral data as JSON file
mistral_json_filename = "iwac_articles_mistral.json"
mistral_json_path = os.path.join(output_dir, mistral_json_filename)

print(f"\nSaving Mistral articles dataset to JSON file: {mistral_json_path}")
with open(mistral_json_path, 'w', encoding='utf-8') as f:
    json.dump(mistral_data_list, f, ensure_ascii=False, indent=2)

print(f"Mistral JSON file saved successfully! ({len(mistral_data_list)} records)")

print(f"\nFiles created:")
print(f"- Gemini: {gemini_json_path}")
print(f"- ChatGPT: {chatgpt_json_path}")
print(f"- Mistral: {mistral_json_path}")
print(f"{'='*50}")