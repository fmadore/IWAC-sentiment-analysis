"""
Shared utilities for IWAC data preprocessing scripts.

Common functions and constants used across data-fetch, extreme-analysis,
significant-differences-export, and arbiter-evaluation scripts.
"""

import os
import json
from typing import Optional

import pandas as pd
from huggingface_hub import hf_hub_download


# ============================================================================
# Constants
# ============================================================================

HF_REPO_ID = "fmadore/islam-west-africa-collection"
HF_PARQUET_FILENAME = "articles/train-00000-of-00001.parquet"

POLARITY_SCORES = {
    'Très positif': 5, 'Positif': 4, 'Neutre': 3,
    'Négatif': 2, 'Très négatif': 1, 'Non applicable': 0
}

CENTRALITY_SCORES = {
    'Très central': 5, 'Central': 4, 'Secondaire': 3,
    'Marginal': 2, 'Non abordé': 1, 'Non applicable': 0
}

MODEL_NAMES = {
    'chatgpt': 'ChatGPT',
    'gemini': 'Gemini',
    'mistral': 'Mistral'
}


# ============================================================================
# Data type helpers
# ============================================================================

def safe_int_convert(value) -> Optional[int]:
    """Safely convert a value to int, handling NaN and None."""
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (ValueError, TypeError):
        pass
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def safe_str(value) -> Optional[str]:
    """Safely convert a value to str, handling NaN, pd.NA, and None.

    Returns None for any missing/NA value so that JSON serialization
    produces ``null`` instead of invalid tokens like ``NaN``.
    """
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (ValueError, TypeError):
        pass
    return str(value)


# ============================================================================
# Dataset loading
# ============================================================================

def load_iwac_dataset() -> pd.DataFrame:
    """Load the IWAC articles dataset from Hugging Face as a DataFrame.

    Tries direct parquet download first, falls back to datasets library.

    Returns:
        pd.DataFrame with all article rows.
    """
    try:
        print("Downloading dataset from Hugging Face...")
        parquet_path = hf_hub_download(
            repo_id=HF_REPO_ID,
            filename=HF_PARQUET_FILENAME,
            repo_type="dataset"
        )
        df = pd.read_parquet(parquet_path)
        print(f"Successfully loaded {len(df)} rows with {len(df.columns)} columns")
        return df

    except Exception as e:
        print(f"Direct download failed: {e}")
        print("Trying datasets library fallback...")
        from datasets import load_dataset
        dataset = load_dataset(HF_REPO_ID, "articles", verification_mode="no_checks")
        df = pd.DataFrame(dataset['train'])
        print(f"Loaded {len(df)} rows via datasets library")
        return df


# ============================================================================
# Discrepancy calculation
# ============================================================================

def calculate_discrepancies(analysis_a: dict, analysis_b: dict) -> Optional[dict]:
    """Calculate discrepancies between two model analyses.

    Returns None if either analysis is missing or contains 'Non applicable' values.
    """
    if not analysis_a or not analysis_b:
        return None

    # Exclude "Non applicable" cases
    if (analysis_a.get('polarite') == 'Non applicable' or
        analysis_b.get('polarite') == 'Non applicable' or
        analysis_a.get('centralite_islam_musulmans') == 'Non applicable' or
        analysis_b.get('centralite_islam_musulmans') == 'Non applicable'):
        return None

    polarity_diff = abs(
        POLARITY_SCORES.get(analysis_a.get('polarite', 'Non applicable'), 0) -
        POLARITY_SCORES.get(analysis_b.get('polarite', 'Non applicable'), 0)
    )

    subj_a = safe_int_convert(analysis_a.get('subjectivite_score', 0)) or 0
    subj_b = safe_int_convert(analysis_b.get('subjectivite_score', 0)) or 0
    subjectivity_diff = abs(subj_a - subj_b)

    centrality_diff = abs(
        CENTRALITY_SCORES.get(analysis_a.get('centralite_islam_musulmans', 'Non applicable'), 0) -
        CENTRALITY_SCORES.get(analysis_b.get('centralite_islam_musulmans', 'Non applicable'), 0)
    )

    has_significant_conflict = (polarity_diff >= 3 or subjectivity_diff >= 3 or centrality_diff >= 3)

    return {
        "polarity_diff": polarity_diff,
        "subjectivity_diff": subjectivity_diff,
        "centrality_diff": centrality_diff,
        "total_diff": polarity_diff + subjectivity_diff + centrality_diff,
        "has_significant_conflict": has_significant_conflict
    }


# ============================================================================
# Output helpers
# ============================================================================

def get_webapp_data_dir() -> str:
    """Get the path to the webapp's static/data directory, creating it if needed."""
    output_dir = os.path.join(
        os.path.dirname(__file__), "..", "ma-visualisation-sentiments", "static", "data"
    )
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def save_json(data, filepath: str) -> None:
    """Save data as JSON with UTF-8 encoding and 2-space indent."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
