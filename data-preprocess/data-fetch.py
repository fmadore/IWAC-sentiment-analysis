from datasets import load_dataset
import os
import json

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

# Convert to list of dictionaries with the specified mapping
data_list = []
for item in dataset['train']:
    mapped_item = {
        "o:id": item.get("o:id"),
        "o:title": item.get("title"),
        "Newspaper": item.get("newspaper"),
        "dcterms:date": item.get("pub_date"),
        "sentiment_analysis": {
            "centralite_islam_musulmans": item.get("gemini_centralite_islam_musulmans"),
            "centralite_justification": item.get("gemini_centralite_justification"),
            "subjectivite_score": item.get("gemini_subjectivite_score"),
            "subjectivite_justification": item.get("gemini_subjectivite_justification"),
            "polarite": item.get("gemini_polarite"),
            "polarite_justification": item.get("gemini_polarite_justification")
        }
    }
    data_list.append(mapped_item)

# Create the output directory if it doesn't exist
output_dir = os.path.join(os.path.dirname(__file__), "..", "ma-visualisation-sentiments", "static", "data")
os.makedirs(output_dir, exist_ok=True)

# Save as JSON file
json_filename = "iwac_articles_sentiment_analysis.json"
json_path = os.path.join(output_dir, json_filename)

print(f"\nSaving articles dataset to JSON file: {json_path}")
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data_list, f, ensure_ascii=False, indent=2)

print(f"JSON file saved successfully! ({len(data_list)} records)")
print(f"File created: {json_path}")
print(f"{'='*50}")