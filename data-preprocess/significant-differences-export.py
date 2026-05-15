"""
Script d'exportation des articles avec différences significatives pour évaluation aveugle

Ce script identifie et exporte les articles où les deux modèles d'IA ont des 
divergences significatives (≥3 points sur une dimension) dans leurs analyses 
de sentiment. Les données sont anonymisées pour un test aveugle.

Sortie : CSV simple avec articles et analyses anonymisées (Model A vs Model B)
"""

import os
import pandas as pd
from tqdm import tqdm
import random
from datetime import datetime

from shared import load_iwac_dataset, calculate_discrepancies, extract_model_analysis

def extract_significant_differences(dataset):
    """Extrait les articles avec des différences significatives"""
    significant_articles = []
    
    # Randomiser l'ordre des modèles pour anonymisation
    # True = ChatGPT est Model A, False = Gemini est Model A
    model_assignment = random.choice([True, False])
    assignment_key = "chatgpt_is_model_a" if model_assignment else "gemini_is_model_a"
    
    print(f"Processing {len(dataset)} articles for significant differences...")
    print(f"Model assignment randomized for blind evaluation")
    
    for item in tqdm(dataset, desc="Processing articles"):
        # Extraire les analyses des deux modèles
        chatgpt_analysis = extract_model_analysis(item, 'chatgpt')
        gemini_analysis = extract_model_analysis(item, 'gemini')
        
        # Calculer les divergences
        discrepancies = calculate_discrepancies(chatgpt_analysis, gemini_analysis)
        
        if discrepancies and discrepancies["has_significant_conflict"]:
            # Assigner anonymement les modèles
            if model_assignment:  # ChatGPT = Model A
                model_a = chatgpt_analysis
                model_b = gemini_analysis
            else:  # Gemini = Model A
                model_a = gemini_analysis
                model_b = chatgpt_analysis
            
            article_data = {
                'article_id': item.get('o:id'),
                'title': item.get('title'),
                'country': item.get('country'),
                'newspaper': item.get('newspaper'),
                'pub_date': item.get('pub_date'),
                'article_text': item.get('ocr'),  # Full OCR text
                'url': f"https://islam.zmo.de/s/afrique_ouest/item/{item.get('o:id')}" if item.get('o:id') else None,
                
                # Discrepancies
                'polarity_diff': discrepancies['polarity_diff'],
                'subjectivity_diff': discrepancies['subjectivity_diff'],
                'centrality_diff': discrepancies['centrality_diff'],
                'total_diff': discrepancies['total_diff'],
                
                # Model A (anonymized)
                'model_a_polarity': model_a['polarite'],
                'model_a_polarity_justification': model_a['polarite_justification'],
                'model_a_subjectivity': model_a['subjectivite_score'],
                'model_a_subjectivity_justification': model_a['subjectivite_justification'],
                'model_a_centrality': model_a['centralite_islam_musulmans'],
                'model_a_centrality_justification': model_a['centralite_justification'],
                
                # Model B (anonymized)
                'model_b_polarity': model_b['polarite'],
                'model_b_polarity_justification': model_b['polarite_justification'],
                'model_b_subjectivity': model_b['subjectivite_score'],
                'model_b_subjectivity_justification': model_b['subjectivite_justification'],
                'model_b_centrality': model_b['centralite_islam_musulmans'],
                'model_b_centrality_justification': model_b['centralite_justification']
            }
            
            significant_articles.append(article_data)
    
    return significant_articles, assignment_key

def main():
    """Fonction principale"""
    print(f"\n{'='*60}")
    print(f"IWAC Significant Differences Export - BLIND TEST")
    print(f"{'='*60}")
    
    # Charger le dataset
    try:
        df = load_iwac_dataset()
        dataset = df.to_dict('records')
    except Exception as e:
        print(f"Failed to load dataset: {e}")
        return
    
    # Extraire les articles avec différences significatives
    significant_articles, assignment_key = extract_significant_differences(dataset)
    
    if len(significant_articles) == 0:
        print("No articles with significant differences found!")
        return
    
    # Créer le répertoire de sortie
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = os.path.join(os.path.dirname(__file__), "..", "exports", f"blind_test_{timestamp}")
    os.makedirs(output_dir, exist_ok=True)
    
    # Exporter en CSV
    df_export = pd.DataFrame(significant_articles)
    csv_path = os.path.join(output_dir, "blind_evaluation_dataset.csv")
    df_export.to_csv(csv_path, index=False, encoding='utf-8')
    
    # Créer le fichier de clé (à garder secret jusqu'à la fin de l'évaluation)
    key_path = os.path.join(output_dir, "model_assignment_key.txt")
    with open(key_path, 'w', encoding='utf-8') as f:
        f.write(f"BLIND TEST MODEL ASSIGNMENT\n")
        f.write(f"========================\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        f.write(f"Total articles: {len(significant_articles)}\n\n")
        if assignment_key == "chatgpt_is_model_a":
            f.write(f"Model A = ChatGPT\n")
            f.write(f"Model B = Gemini\n")
        else:
            f.write(f"Model A = Gemini\n")
            f.write(f"Model B = ChatGPT\n")
        f.write(f"\nDO NOT REVEAL UNTIL EVALUATION IS COMPLETE!\n")
    
    print(f"\n{'='*60}")
    print(f"EXPORT COMPLETE")
    print(f"{'='*60}")
    print(f"Output directory: {output_dir}")
    print(f"\nFiles generated:")
    print(f"  📊 {csv_path}")
    print(f"     → Blind evaluation dataset (Model A vs Model B)")
    print(f"  🔐 {key_path}")
    print(f"     → Model assignment key (KEEP SECRET!)")
    
    print(f"\nDataset Summary:")
    print(f"  Total articles with significant conflicts: {len(significant_articles)}")
    
    # Show a few examples without revealing model identity
    print(f"\nExample conflicts (anonymized):")
    for i, article in enumerate(significant_articles[:3], 1):
        print(f"\n  Article {i}: {article['title'][:80]}...")
        print(f"    Total difference: {article['total_diff']} points")
        if article['polarity_diff'] >= 3:
            print(f"    Polarity: Model A='{article['model_a_polarity']}' vs Model B='{article['model_b_polarity']}'")
        if article['subjectivity_diff'] >= 3:
            print(f"    Subjectivity: Model A={article['model_a_subjectivity']} vs Model B={article['model_b_subjectivity']}")
        if article['centrality_diff'] >= 3:
            print(f"    Centrality: Model A='{article['model_a_centrality']}' vs Model B='{article['model_b_centrality']}'")
    
    print(f"\n🔐 IMPORTANT:")
    print(f"  The model assignment is randomized and stored in {key_path}")
    print(f"  Do NOT open this file until your evaluation is complete!")
    print(f"  The CSV contains full article text and anonymized analyses.")

if __name__ == "__main__":
    # Set random seed for reproducible model assignment
    random.seed(42)
    main()