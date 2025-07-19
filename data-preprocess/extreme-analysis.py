"""
Script d'analyse des extrêmes lexicaux pour le corpus IWAC

Ce script analyse les mots-clés (subject et spatial) associés aux extrêmes 
de sentiment dans le corpus IWAC. Il génère des analyses détaillées pour 
chaque modèle (ChatGPT et Gemini) en identifiant :

1. Les mots-clés les plus fréquents pour chaque extrême
2. La répartition par pays et journaux 
3. Les mots-clés spécifiques par facette (pays/journal)
4. La liste complète des articles pour chaque catégorie

Auteur: Assistant IA
Date: 2024
"""

from datasets import load_dataset
import os
import json
import pandas as pd
from collections import Counter, defaultdict
from tqdm import tqdm
import re

def clean_and_split_keywords(text):
    """
    Nettoie et divise les mots-clés séparés par le caractère |
    
    Args:
        text (str): Texte contenant des mots-clés séparés par |
        
    Returns:
        list: Liste des mots-clés nettoyés
        
    Example:
        >>> clean_and_split_keywords("islam|musulman|religion")
        ['islam', 'musulman', 'religion']
    """
    if not text or pd.isna(text):
        return []
    
    # Diviser par | et nettoyer les espaces
    keywords = [kw.strip() for kw in str(text).split('|') if kw.strip()]
    # Filtrer les mots-clés vides ou trop courts (moins de 3 caractères)
    keywords = [kw for kw in keywords if len(kw) > 2]
    return keywords

def convert_keywords_by_facet(keywords_dict, top_n=20):
    """
    Convertit les structures defaultdict en dictionnaires normaux avec les top mots-clés
    
    Args:
        keywords_dict: Dictionnaire avec structure defaultdict
        top_n (int): Nombre de mots-clés les plus fréquents à conserver
        
    Returns:
        dict: Structure convertie avec les top mots-clés par facette
    """
    result = {}
    for facet_name, counters in keywords_dict.items():
        result[facet_name] = {
            "subject": dict(counters["subject"].most_common(top_n)),
            "spatial": dict(counters["spatial"].most_common(top_n))
        }
    return result

def analyze_extreme_keywords(dataset, model_prefix, top_n=50):
    """
    Analyse les mots-clés associés aux extrêmes de sentiment pour un modèle donné
    
    Cette fonction identifie les articles avec des scores extrêmes (subjectivité, 
    polarité, centralité) et analyse les mots-clés associés. Elle génère des 
    statistiques globales et par facette (pays, journal).
    
    Args:
        dataset: Dataset Hugging Face contenant les articles IWAC
        model_prefix (str): Préfixe du modèle ('chatgpt' ou 'gemini')
        top_n (int): Nombre de mots-clés les plus fréquents à retourner
        
    Returns:
        dict: Structure complète avec analyses, statistiques et facettes
        
    Structure de retour:
        {
            "model": "chatgpt/gemini",
            "analysis": {
                "subjectivity_extreme_high": {
                    "subject": {mot: fréquence},
                    "spatial": {mot: fréquence},
                    "by_country": {pays: nb_articles},
                    "by_newspaper": {journal: nb_articles},
                    "keywords_by_country": {pays: {subject: {}, spatial: {}}},
                    "keywords_by_newspaper": {journal: {subject: {}, spatial: {}}},
                    "articles": [liste_articles]
                },
                ...
            },
            "statistics": {...},
            "facets": {...}
        }
    """
    results = {
        "model": model_prefix,
        "analysis": {
            "subjectivity_extreme_high": {
                "subject": {}, 
                "spatial": {},
                "by_country": {},
                "by_newspaper": {},
                "keywords_by_country": {},
                "keywords_by_newspaper": {},
                "articles": []
            },
            "subjectivity_extreme_low": {
                "subject": {}, 
                "spatial": {},
                "by_country": {},
                "by_newspaper": {},
                "keywords_by_country": {},
                "keywords_by_newspaper": {},
                "articles": []
            },
            "polarity_very_negative": {
                "subject": {}, 
                "spatial": {},
                "by_country": {},
                "by_newspaper": {},
                "keywords_by_country": {},
                "keywords_by_newspaper": {},
                "articles": []
            },
            "polarity_very_positive": {
                "subject": {}, 
                "spatial": {},
                "by_country": {},
                "by_newspaper": {},
                "keywords_by_country": {},
                "keywords_by_newspaper": {},
                "articles": []
            },
            "centrality_very_central": {
                "subject": {}, 
                "spatial": {},
                "by_country": {},
                "by_newspaper": {},
                "keywords_by_country": {},
                "keywords_by_newspaper": {},
                "articles": []
            },
            "centrality_not_central": {
                "subject": {}, 
                "spatial": {},
                "by_country": {},
                "by_newspaper": {},
                "keywords_by_country": {},
                "keywords_by_newspaper": {},
                "articles": []
            }
        },
        "statistics": {},
        "facets": {
            "countries": {},
            "newspapers": {}
        }
    }
    
    # Compteurs pour chaque catégorie
    counters = {
        "subjectivity_high_subject": Counter(),
        "subjectivity_high_spatial": Counter(),
        "subjectivity_low_subject": Counter(),
        "subjectivity_low_spatial": Counter(),
        "polarity_very_negative_subject": Counter(),
        "polarity_very_negative_spatial": Counter(),
        "polarity_very_positive_subject": Counter(),
        "polarity_very_positive_spatial": Counter(),
        "centrality_very_central_subject": Counter(),
        "centrality_very_central_spatial": Counter(),
        "centrality_not_central_subject": Counter(),
        "centrality_not_central_spatial": Counter()
    }
    
    # Compteurs par facettes
    facet_counters = {
        "subjectivity_high_country": Counter(),
        "subjectivity_high_newspaper": Counter(),
        "subjectivity_low_country": Counter(),
        "subjectivity_low_newspaper": Counter(),
        "polarity_very_negative_country": Counter(),
        "polarity_very_negative_newspaper": Counter(),
        "polarity_very_positive_country": Counter(),
        "polarity_very_positive_newspaper": Counter(),
        "centrality_very_central_country": Counter(),
        "centrality_very_central_newspaper": Counter(),
        "centrality_not_central_country": Counter(),
        "centrality_not_central_newspaper": Counter()
    }
    
    # Listes d'articles pour chaque catégorie
    article_lists = {
        "subjectivity_high": [],
        "subjectivity_low": [],
        "polarity_very_negative": [],
        "polarity_very_positive": [],
        "centrality_very_central": [],
        "centrality_not_central": []
    }
    
    # Compteurs globaux pour les facettes
    all_countries = Counter()
    all_newspapers = Counter()
    
    # Structures pour collecter les mots-clés par facette
    # Format: keywords_by_facet[category][facet_type][facet_name] = {subject: Counter(), spatial: Counter()}
    keywords_by_country = {
        "subjectivity_high": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "subjectivity_low": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "polarity_very_negative": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "polarity_very_positive": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "centrality_very_central": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "centrality_not_central": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()})
    }
    
    keywords_by_newspaper = {
        "subjectivity_high": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "subjectivity_low": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "polarity_very_negative": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "polarity_very_positive": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "centrality_very_central": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "centrality_not_central": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()})
    }
    
    # Statistiques
    stats = {
        "total_articles": 0,
        "subjectivity_high_count": 0,
        "subjectivity_low_count": 0,
        "polarity_very_negative_count": 0,
        "polarity_very_positive_count": 0,
        "centrality_very_central_count": 0,
        "centrality_not_central_count": 0
    }
    
    print(f"\nAnalyzing extreme keywords for {model_prefix}...")
    print(f"Processing {len(dataset['train'])} articles...")
    
    # Boucle principale : traitement de chaque article du dataset
    for item in tqdm(dataset['train'], desc=f"Processing {model_prefix} data"):
        stats["total_articles"] += 1
        
        # Récupérer les données du modèle
        subjectivity = item.get(f"{model_prefix}_subjectivite_score")
        polarity = item.get(f"{model_prefix}_polarite")
        centrality = item.get(f"{model_prefix}_centralite_islam_musulmans")
        
        # Récupérer les métadonnées
        country = item.get("country")
        newspaper = item.get("newspaper")
        title = item.get("title")
        pub_date = item.get("pub_date")
        article_id = item.get("o:id")
        
        # Compter toutes les facettes
        if country:
            all_countries[country] += 1
        if newspaper:
            all_newspapers[newspaper] += 1
        
        # Récupérer les mots-clés
        subject_keywords = clean_and_split_keywords(item.get("subject"))
        spatial_keywords = clean_and_split_keywords(item.get("spatial"))
        
        # Article de base pour les listes
        article_info = {
            "id": article_id,
            "title": title,
            "country": country,
            "newspaper": newspaper,
            "pub_date": pub_date,
            "subject_keywords": subject_keywords,
            "spatial_keywords": spatial_keywords
        }
        
        # Analyser la subjectivité extrême haute (4-5)
        # Articles très subjectifs : opinions marquées, émotions fortes
        if subjectivity and int(subjectivity) >= 4:
            stats["subjectivity_high_count"] += 1
            # Comptage global des mots-clés
            counters["subjectivity_high_subject"].update(subject_keywords)
            counters["subjectivity_high_spatial"].update(spatial_keywords)
            # Comptage par facettes
            if country:
                facet_counters["subjectivity_high_country"][country] += 1
                keywords_by_country["subjectivity_high"][country]["subject"].update(subject_keywords)
                keywords_by_country["subjectivity_high"][country]["spatial"].update(spatial_keywords)
            if newspaper:
                facet_counters["subjectivity_high_newspaper"][newspaper] += 1
                keywords_by_newspaper["subjectivity_high"][newspaper]["subject"].update(subject_keywords)
                keywords_by_newspaper["subjectivity_high"][newspaper]["spatial"].update(spatial_keywords)
            article_lists["subjectivity_high"].append(article_info)
        
        # Analyser la subjectivité extrême basse (1-2)
        # Articles très objectifs : faits, informations neutres
        if subjectivity and int(subjectivity) <= 2:
            stats["subjectivity_low_count"] += 1
            # Comptage global des mots-clés
            counters["subjectivity_low_subject"].update(subject_keywords)
            counters["subjectivity_low_spatial"].update(spatial_keywords)
            # Comptage par facettes
            if country:
                facet_counters["subjectivity_low_country"][country] += 1
                keywords_by_country["subjectivity_low"][country]["subject"].update(subject_keywords)
                keywords_by_country["subjectivity_low"][country]["spatial"].update(spatial_keywords)
            if newspaper:
                facet_counters["subjectivity_low_newspaper"][newspaper] += 1
                keywords_by_newspaper["subjectivity_low"][newspaper]["subject"].update(subject_keywords)
                keywords_by_newspaper["subjectivity_low"][newspaper]["spatial"].update(spatial_keywords)
            article_lists["subjectivity_low"].append(article_info)
        
        # Analyser la polarité très négative
        # Articles avec sentiment très négatif : critique, condamnation, stigmatisation
        if polarity == "Très négatif":
            stats["polarity_very_negative_count"] += 1
            # Comptage global des mots-clés
            counters["polarity_very_negative_subject"].update(subject_keywords)
            counters["polarity_very_negative_spatial"].update(spatial_keywords)
            # Comptage par facettes
            if country:
                facet_counters["polarity_very_negative_country"][country] += 1
                keywords_by_country["polarity_very_negative"][country]["subject"].update(subject_keywords)
                keywords_by_country["polarity_very_negative"][country]["spatial"].update(spatial_keywords)
            if newspaper:
                facet_counters["polarity_very_negative_newspaper"][newspaper] += 1
                keywords_by_newspaper["polarity_very_negative"][newspaper]["subject"].update(subject_keywords)
                keywords_by_newspaper["polarity_very_negative"][newspaper]["spatial"].update(spatial_keywords)
            article_lists["polarity_very_negative"].append(article_info)
        
        # Analyser la polarité très positive
        # Articles avec sentiment très positif : éloge, valorisation, promotion
        if polarity == "Très positif":
            stats["polarity_very_positive_count"] += 1
            # Comptage global des mots-clés
            counters["polarity_very_positive_subject"].update(subject_keywords)
            counters["polarity_very_positive_spatial"].update(spatial_keywords)
            # Comptage par facettes
            if country:
                facet_counters["polarity_very_positive_country"][country] += 1
                keywords_by_country["polarity_very_positive"][country]["subject"].update(subject_keywords)
                keywords_by_country["polarity_very_positive"][country]["spatial"].update(spatial_keywords)
            if newspaper:
                facet_counters["polarity_very_positive_newspaper"][newspaper] += 1
                keywords_by_newspaper["polarity_very_positive"][newspaper]["subject"].update(subject_keywords)
                keywords_by_newspaper["polarity_very_positive"][newspaper]["spatial"].update(spatial_keywords)
            article_lists["polarity_very_positive"].append(article_info)
        
        # Analyser la centralité très élevée
        # Articles où l'islam/musulmans sont au cœur du sujet principal
        if centrality == "Très central":
            stats["centrality_very_central_count"] += 1
            # Comptage global des mots-clés
            counters["centrality_very_central_subject"].update(subject_keywords)
            counters["centrality_very_central_spatial"].update(spatial_keywords)
            # Comptage par facettes
            if country:
                facet_counters["centrality_very_central_country"][country] += 1
                keywords_by_country["centrality_very_central"][country]["subject"].update(subject_keywords)
                keywords_by_country["centrality_very_central"][country]["spatial"].update(spatial_keywords)
            if newspaper:
                facet_counters["centrality_very_central_newspaper"][newspaper] += 1
                keywords_by_newspaper["centrality_very_central"][newspaper]["subject"].update(subject_keywords)
                keywords_by_newspaper["centrality_very_central"][newspaper]["spatial"].update(spatial_keywords)
            article_lists["centrality_very_central"].append(article_info)
        
        # Analyser la centralité très faible
        # Articles où l'islam/musulmans sont mentionnés de manière périphérique
        if centrality == "Marginal":
            stats["centrality_not_central_count"] += 1
            # Comptage global des mots-clés
            counters["centrality_not_central_subject"].update(subject_keywords)
            counters["centrality_not_central_spatial"].update(spatial_keywords)
            # Comptage par facettes
            if country:
                facet_counters["centrality_not_central_country"][country] += 1
                keywords_by_country["centrality_not_central"][country]["subject"].update(subject_keywords)
                keywords_by_country["centrality_not_central"][country]["spatial"].update(spatial_keywords)
            if newspaper:
                facet_counters["centrality_not_central_newspaper"][newspaper] += 1
                keywords_by_newspaper["centrality_not_central"][newspaper]["subject"].update(subject_keywords)
                keywords_by_newspaper["centrality_not_central"][newspaper]["spatial"].update(spatial_keywords)
            article_lists["centrality_not_central"].append(article_info)
    
    # Compiler les résultats
    print("Compiling results and generating keyword analysis by facets...")
    
    # Subjectivité haute
    results["analysis"]["subjectivity_extreme_high"]["subject"] = dict(counters["subjectivity_high_subject"].most_common(top_n))
    results["analysis"]["subjectivity_extreme_high"]["spatial"] = dict(counters["subjectivity_high_spatial"].most_common(top_n))
    results["analysis"]["subjectivity_extreme_high"]["by_country"] = dict(facet_counters["subjectivity_high_country"].most_common())
    results["analysis"]["subjectivity_extreme_high"]["by_newspaper"] = dict(facet_counters["subjectivity_high_newspaper"].most_common())
    results["analysis"]["subjectivity_extreme_high"]["keywords_by_country"] = convert_keywords_by_facet(keywords_by_country["subjectivity_high"])
    results["analysis"]["subjectivity_extreme_high"]["keywords_by_newspaper"] = convert_keywords_by_facet(keywords_by_newspaper["subjectivity_high"])
    results["analysis"]["subjectivity_extreme_high"]["articles"] = article_lists["subjectivity_high"]
    
    # Subjectivité basse
    results["analysis"]["subjectivity_extreme_low"]["subject"] = dict(counters["subjectivity_low_subject"].most_common(top_n))
    results["analysis"]["subjectivity_extreme_low"]["spatial"] = dict(counters["subjectivity_low_spatial"].most_common(top_n))
    results["analysis"]["subjectivity_extreme_low"]["by_country"] = dict(facet_counters["subjectivity_low_country"].most_common())
    results["analysis"]["subjectivity_extreme_low"]["by_newspaper"] = dict(facet_counters["subjectivity_low_newspaper"].most_common())
    results["analysis"]["subjectivity_extreme_low"]["keywords_by_country"] = convert_keywords_by_facet(keywords_by_country["subjectivity_low"])
    results["analysis"]["subjectivity_extreme_low"]["keywords_by_newspaper"] = convert_keywords_by_facet(keywords_by_newspaper["subjectivity_low"])
    results["analysis"]["subjectivity_extreme_low"]["articles"] = article_lists["subjectivity_low"]
    
    # Polarité très négative
    results["analysis"]["polarity_very_negative"]["subject"] = dict(counters["polarity_very_negative_subject"].most_common(top_n))
    results["analysis"]["polarity_very_negative"]["spatial"] = dict(counters["polarity_very_negative_spatial"].most_common(top_n))
    results["analysis"]["polarity_very_negative"]["by_country"] = dict(facet_counters["polarity_very_negative_country"].most_common())
    results["analysis"]["polarity_very_negative"]["by_newspaper"] = dict(facet_counters["polarity_very_negative_newspaper"].most_common())
    results["analysis"]["polarity_very_negative"]["keywords_by_country"] = convert_keywords_by_facet(keywords_by_country["polarity_very_negative"])
    results["analysis"]["polarity_very_negative"]["keywords_by_newspaper"] = convert_keywords_by_facet(keywords_by_newspaper["polarity_very_negative"])
    results["analysis"]["polarity_very_negative"]["articles"] = article_lists["polarity_very_negative"]
    
    # Polarité très positive
    results["analysis"]["polarity_very_positive"]["subject"] = dict(counters["polarity_very_positive_subject"].most_common(top_n))
    results["analysis"]["polarity_very_positive"]["spatial"] = dict(counters["polarity_very_positive_spatial"].most_common(top_n))
    results["analysis"]["polarity_very_positive"]["by_country"] = dict(facet_counters["polarity_very_positive_country"].most_common())
    results["analysis"]["polarity_very_positive"]["by_newspaper"] = dict(facet_counters["polarity_very_positive_newspaper"].most_common())
    results["analysis"]["polarity_very_positive"]["keywords_by_country"] = convert_keywords_by_facet(keywords_by_country["polarity_very_positive"])
    results["analysis"]["polarity_very_positive"]["keywords_by_newspaper"] = convert_keywords_by_facet(keywords_by_newspaper["polarity_very_positive"])
    results["analysis"]["polarity_very_positive"]["articles"] = article_lists["polarity_very_positive"]
    
    # Centralité très élevée
    results["analysis"]["centrality_very_central"]["subject"] = dict(counters["centrality_very_central_subject"].most_common(top_n))
    results["analysis"]["centrality_very_central"]["spatial"] = dict(counters["centrality_very_central_spatial"].most_common(top_n))
    results["analysis"]["centrality_very_central"]["by_country"] = dict(facet_counters["centrality_very_central_country"].most_common())
    results["analysis"]["centrality_very_central"]["by_newspaper"] = dict(facet_counters["centrality_very_central_newspaper"].most_common())
    results["analysis"]["centrality_very_central"]["keywords_by_country"] = convert_keywords_by_facet(keywords_by_country["centrality_very_central"])
    results["analysis"]["centrality_very_central"]["keywords_by_newspaper"] = convert_keywords_by_facet(keywords_by_newspaper["centrality_very_central"])
    results["analysis"]["centrality_very_central"]["articles"] = article_lists["centrality_very_central"]
    
    # Centralité très faible
    results["analysis"]["centrality_not_central"]["subject"] = dict(counters["centrality_not_central_subject"].most_common(top_n))
    results["analysis"]["centrality_not_central"]["spatial"] = dict(counters["centrality_not_central_spatial"].most_common(top_n))
    results["analysis"]["centrality_not_central"]["by_country"] = dict(facet_counters["centrality_not_central_country"].most_common())
    results["analysis"]["centrality_not_central"]["by_newspaper"] = dict(facet_counters["centrality_not_central_newspaper"].most_common())
    results["analysis"]["centrality_not_central"]["keywords_by_country"] = convert_keywords_by_facet(keywords_by_country["centrality_not_central"])
    results["analysis"]["centrality_not_central"]["keywords_by_newspaper"] = convert_keywords_by_facet(keywords_by_newspaper["centrality_not_central"])
    results["analysis"]["centrality_not_central"]["articles"] = article_lists["centrality_not_central"]
    
    # Statistiques et facettes globales
    results["statistics"] = stats
    results["facets"]["countries"] = dict(all_countries.most_common())
    results["facets"]["newspapers"] = dict(all_newspapers.most_common())
    
    return results

def main():
    """
    Fonction principale qui orchestre l'analyse complète des extrêmes lexicaux
    
    Cette fonction :
    1. Charge le dataset IWAC depuis Hugging Face
    2. Analyse les extrêmes pour ChatGPT et Gemini
    3. Sauvegarde les résultats en JSON
    4. Affiche des statistiques et exemples
    """
    print(f"\n{'='*60}")
    print(f"IWAC Extreme Lexical Analysis")
    print(f"{'='*60}")
    
    # Charger le dataset depuis Hugging Face
    print("Loading dataset from Hugging Face...")
    dataset = load_dataset("fmadore/iwac-newspaper-articles", "articles")
    
    print(f"Dataset loaded: {len(dataset['train'])} articles")
    print("This dataset contains articles with sentiment analysis from both ChatGPT and Gemini")
    
    # Analyser pour ChatGPT
    print(f"\n{'='*40}")
    print(f"ANALYZING CHATGPT RESULTS")
    print(f"{'='*40}")
    chatgpt_results = analyze_extreme_keywords(dataset, "chatgpt", top_n=50)
    
    # Analyser pour Gemini
    print(f"\n{'='*40}")
    print(f"ANALYZING GEMINI RESULTS")
    print(f"{'='*40}")
    gemini_results = analyze_extreme_keywords(dataset, "gemini", top_n=50)
    
    # Créer le répertoire de sortie
    output_dir = os.path.join(os.path.dirname(__file__), "..", "ma-visualisation-sentiments", "static", "data")
    os.makedirs(output_dir, exist_ok=True)
    
    # Sauvegarder les résultats ChatGPT
    chatgpt_path = os.path.join(output_dir, "iwac_extreme_analysis_chatgpt.json")
    print(f"\nSaving ChatGPT extreme analysis to: {chatgpt_path}")
    with open(chatgpt_path, 'w', encoding='utf-8') as f:
        json.dump(chatgpt_results, f, ensure_ascii=False, indent=2)
    
    # Sauvegarder les résultats Gemini
    gemini_path = os.path.join(output_dir, "iwac_extreme_analysis_gemini.json")
    print(f"Saving Gemini extreme analysis to: {gemini_path}")
    with open(gemini_path, 'w', encoding='utf-8') as f:
        json.dump(gemini_results, f, ensure_ascii=False, indent=2)
    
    # Afficher les statistiques
    print(f"\n{'='*60}")
    print(f"ANALYSIS SUMMARY")
    print(f"{'='*60}")
    
    for model, results in [("ChatGPT", chatgpt_results), ("Gemini", gemini_results)]:
        stats = results["statistics"]
        print(f"\n{model} Statistics:")
        print(f"  Total articles: {stats['total_articles']}")
        print(f"  High subjectivity (4-5): {stats['subjectivity_high_count']} ({stats['subjectivity_high_count']/stats['total_articles']*100:.1f}%)")
        print(f"  Low subjectivity (1-2): {stats['subjectivity_low_count']} ({stats['subjectivity_low_count']/stats['total_articles']*100:.1f}%)")
        print(f"  Very negative polarity: {stats['polarity_very_negative_count']} ({stats['polarity_very_negative_count']/stats['total_articles']*100:.1f}%)")
        print(f"  Very positive polarity: {stats['polarity_very_positive_count']} ({stats['polarity_very_positive_count']/stats['total_articles']*100:.1f}%)")
        print(f"  Very central: {stats['centrality_very_central_count']} ({stats['centrality_very_central_count']/stats['total_articles']*100:.1f}%)")
        print(f"  Not central: {stats['centrality_not_central_count']} ({stats['centrality_not_central_count']/stats['total_articles']*100:.1f}%)")
    
    print(f"\n{'='*60}")
    print(f"Files created:")
    print(f"- ChatGPT: {chatgpt_path}")
    print(f"- Gemini: {gemini_path}")
    print(f"{'='*60}")
    
    # Afficher quelques exemples de mots-clés les plus fréquents
    print(f"\nTop 10 subject keywords for high subjectivity (ChatGPT):")
    for keyword, count in list(chatgpt_results["analysis"]["subjectivity_extreme_high"]["subject"].items())[:10]:
        print(f"  {keyword}: {count}")
    
    print(f"\nTop 10 spatial keywords for very negative polarity (ChatGPT):")
    for keyword, count in list(chatgpt_results["analysis"]["polarity_very_negative"]["spatial"].items())[:10]:
        print(f"  {keyword}: {count}")
    
    print(f"\nCountries with most high subjectivity articles (ChatGPT):")
    for country, count in list(chatgpt_results["analysis"]["subjectivity_extreme_high"]["by_country"].items())[:5]:
        print(f"  {country}: {count}")
    
    print(f"\nNewspapers with most very negative polarity articles (ChatGPT):")
    for newspaper, count in list(chatgpt_results["analysis"]["polarity_very_negative"]["by_newspaper"].items())[:5]:
        print(f"  {newspaper}: {count}")
    
    print(f"\nTotal countries in dataset: {len(chatgpt_results['facets']['countries'])}")
    print(f"Total newspapers in dataset: {len(chatgpt_results['facets']['newspapers'])}")
    
    # Exemples d'analyse par facette
    print(f"\n{'='*60}")
    print(f"EXAMPLES OF KEYWORD ANALYSIS BY FACETS")
    print(f"{'='*60}")
    
    # Exemple : mots-clés spatiaux très négatifs par pays
    negative_by_country = chatgpt_results["analysis"]["polarity_very_negative"]["keywords_by_country"]
    if negative_by_country:
        first_country = list(negative_by_country.keys())[0]
        spatial_keywords = negative_by_country[first_country]["spatial"]
        if spatial_keywords:
            print(f"\nTop spatial keywords for very negative articles in {first_country} (ChatGPT):")
            for keyword, count in list(spatial_keywords.items())[:5]:
                print(f"  {keyword}: {count}")
    
    # Exemple : mots-clés sujets haute subjectivité par journal
    subjective_by_newspaper = chatgpt_results["analysis"]["subjectivity_extreme_high"]["keywords_by_newspaper"]
    if subjective_by_newspaper:
        first_newspaper = list(subjective_by_newspaper.keys())[0]
        subject_keywords = subjective_by_newspaper[first_newspaper]["subject"]
        if subject_keywords:
            print(f"\nTop subject keywords for high subjectivity articles in '{first_newspaper}' (ChatGPT):")
            for keyword, count in list(subject_keywords.items())[:5]:
                print(f"  {keyword}: {count}")
    
    print(f"\n{'='*60}")
    print(f"DATA STRUCTURE EXPLANATION")
    print(f"{'='*60}")
    print(f"""
The generated JSON files contain:

 1. GLOBAL ANALYSIS:
    - 'subject': Top 50 subject keywords across all articles
    - 'spatial': Top 50 spatial keywords across all articles
   
2. FACET DISTRIBUTION:
   - 'by_country': Number of articles per country
   - 'by_newspaper': Number of articles per newspaper
   
3. KEYWORD ANALYSIS BY FACET:
   - 'keywords_by_country': Top 20 keywords per country
   - 'keywords_by_newspaper': Top 20 keywords per newspaper
   
4. ARTICLE LISTS:
   - 'articles': Complete list of articles with metadata
   
5. GLOBAL FACETS:
   - 'facets.countries': All countries with article counts
   - 'facets.newspapers': All newspapers with article counts

This allows for filtering and exploration by:
- Country-specific keyword patterns
- Newspaper-specific editorial tendencies
- Cross-referencing with the main app's facets
    """)

if __name__ == "__main__":
    # Importer pandas pour la vérification des valeurs NaN
    try:
        import pandas as pd
    except ImportError:
        print("pandas not found, implementing basic NaN check")
        # Fonction de remplacement simple pour pd.isna
        def isna_replacement(value):
            return value is None or (isinstance(value, str) and value.strip() == "")
        
        # Créer un module fictif pour pd.isna
        class MockPd:
            @staticmethod
            def isna(value):
                return isna_replacement(value)
        
        pd = MockPd()
    
    main() 