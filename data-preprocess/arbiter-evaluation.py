"""
Arbiter Evaluation Script - Gemini 3 Pro as the Judge

This script uses Gemini 3 Pro with high reasoning level (thinking_level="high") 
as an arbiter to evaluate articles where two AI models have significant 
disagreements (≥3 points difference).

Supports comparing any pair of models:
- chatgpt-gemini (default)
- chatgpt-mistral
- gemini-mistral

The arbiter provides:
- Its own independent scores for each dimension
- Justification for each score
- Verdict on which model's analysis is more accurate
- Explanation of the reasoning

Features:
- Gemini 3 Pro Preview with thinking_level="high" for maximum reasoning
- System instructions for consistent evaluation context
- Pydantic structured outputs for reliable JSON parsing
- Configurable model pair via --pair argument

Usage:
  python arbiter-evaluation.py                    # Default: ChatGPT vs Gemini
  python arbiter-evaluation.py --pair chatgpt-mistral
  python arbiter-evaluation.py --pair gemini-mistral

Output: JSON file with arbiter evaluations to be consumed by the visualization app
"""

import os
import json
import time
import random
import argparse
import pandas as pd
from tqdm import tqdm
from datetime import datetime
from typing import Optional, Literal
from dataclasses import dataclass, asdict
from huggingface_hub import hf_hub_download
from pydantic import BaseModel, Field
from pathlib import Path
from dotenv import load_dotenv

# Model pair configuration
VALID_PAIRS = ['chatgpt-gemini', 'chatgpt-mistral', 'gemini-mistral']

# Model name mappings for display
MODEL_NAMES = {
    'chatgpt': 'ChatGPT',
    'gemini': 'Gemini',
    'mistral': 'Mistral'
}

def get_models_from_pair(pair: str) -> tuple[str, str]:
    """Get the two model IDs from a pair string"""
    parts = pair.split('-')
    return parts[0], parts[1]

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded environment variables from {env_path}")
else:
    print(f"⚠️ No .env file found at {env_path}")

# Google GenAI SDK (new unified SDK)
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Please install google-genai: pip install google-genai")
    exit(1)


# ============================================================================
# Pydantic Models for Structured Output
# ============================================================================

class DimensionScore(BaseModel):
    """Score for a single dimension (polarity, subjectivity, or centrality)"""
    arbiter_score: str = Field(description="The arbiter's score for this dimension")
    justification: str = Field(description="Reasoning for this score")
    preferred_model: Literal["model_a", "model_b", "both", "neither"] = Field(
        description="Which model's analysis is more accurate (model_a or model_b)"
    )
    verdict_explanation: str = Field(description="Why this model's analysis is preferred")


class ArbiterResponse(BaseModel):
    """Complete structured response from the arbiter"""
    polarity: DimensionScore = Field(description="Evaluation of polarity/sentiment")
    subjectivity: DimensionScore = Field(description="Evaluation of subjectivity score")
    centrality: DimensionScore = Field(description="Evaluation of centrality of Islam/Muslims")
    overall_verdict: str = Field(description="General assessment of which model performed better")
    confidence_level: Literal["high", "medium", "low"] = Field(
        description="Confidence in the evaluation"
    )


# ============================================================================
# Dataclasses for internal processing (matching frontend types)
# ============================================================================

@dataclass
class ArbiterScore:
    """Arbiter's score for a dimension"""
    score: str  # The arbiter's own score (e.g., "Positif", "3", "Central")
    justification: str  # Why the arbiter chose this score
    preferred_model: str  # "model_a", "model_b", "both", or "neither" (actual model assignment stored separately)
    verdict_explanation: str  # Why one model is preferred over the other


@dataclass
class ArbiterAnalysis:
    """Complete arbiter analysis for an article"""
    article_id: str
    polarity: ArbiterScore
    subjectivity: ArbiterScore
    centrality: ArbiterScore
    overall_verdict: str  # General assessment
    confidence_level: str  # "high", "medium", "low"
    timestamp: str
    # Note: model_a_is_chatgpt is stored once globally in metadata, not per article


# ============================================================================
# System Instruction for the Arbiter
# ============================================================================

SYSTEM_INSTRUCTION = """You are an expert arbiter evaluating sentiment analysis of news articles about Islam and Muslims in Francophone West Africa.

Your role is to:
1. Analyze articles independently and provide your own assessment
2. Compare the analyses from two AI models (Model A and Model B)
3. Determine which model's analysis is more accurate
4. Provide clear, well-reasoned justifications for your decisions

## Evaluation Scales Reference:

### Polarity (Sentiment toward Islam/Muslims):
- **Très positif**: Extremely favorable, enthusiastic, praising portrait
- **Positif**: Favorable, optimistic portrait
- **Neutre**: No clear sentiment or balance between positive/negative; factual tone
- **Négatif**: Unfavorable, critical, pessimistic portrait
- **Très négatif**: Extremely unfavorable, alarmist, very critical portrait

### Subjectivity Score (1-5):
- **1 (Very Objective)**: Reports verifiable facts without personal opinions, purely informative
- **2 (Rather Objective)**: Mainly factual, may contain subtle traces of opinions
- **3 (Mixed)**: Balanced mix of facts and opinions, or presents multiple viewpoints
- **4 (Rather Subjective)**: Clearly expresses opinions and judgments
- **5 (Very Subjective)**: Heavily biased, intense opinions with little factual presentation

### Centrality:
- **Très central**: Islam/Muslims are the main subject of the article
- **Central**: Important theme but shared with other subjects
- **Secondaire**: Mentioned significantly but secondarily
- **Marginal**: Briefly or anecdotally mentioned
- **Non abordé**: No mention of Islam or Muslims

## Guidelines:
- Be thorough and analytical in your evaluation
- Consider the cultural and regional context of Francophone West Africa
- Provide specific textual evidence when possible
- Be honest about uncertainty when the correct answer is ambiguous
- Use French terminology for scores (as shown above)"""


def safe_int_convert(value) -> Optional[int]:
    """Safely convert to integer, handling NaN values"""
    if pd.isna(value) or value is None:
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def calculate_discrepancies(chatgpt_analysis: dict, gemini_analysis: dict) -> Optional[dict]:
    """Calculate discrepancies between the two analyses"""
    if not chatgpt_analysis or not gemini_analysis:
        return None
    
    polarity_scores = {
        'Très positif': 5, 'Positif': 4, 'Neutre': 3, 
        'Négatif': 2, 'Très négatif': 1, 'Non applicable': 0
    }
    
    centrality_scores = {
        'Très central': 5, 'Central': 4, 'Secondaire': 3, 
        'Marginal': 2, 'Non abordé': 1, 'Non applicable': 0
    }
    
    # Exclude "Non applicable" cases
    if (chatgpt_analysis.get('polarite') == 'Non applicable' or 
        gemini_analysis.get('polarite') == 'Non applicable' or
        chatgpt_analysis.get('centralite_islam_musulmans') == 'Non applicable' or 
        gemini_analysis.get('centralite_islam_musulmans') == 'Non applicable'):
        return None
    
    polarity_diff = abs(
        polarity_scores.get(chatgpt_analysis.get('polarite', 'Non applicable'), 0) -
        polarity_scores.get(gemini_analysis.get('polarite', 'Non applicable'), 0)
    )
    
    subj_a = safe_int_convert(chatgpt_analysis.get('subjectivite_score', 0)) or 0
    subj_b = safe_int_convert(gemini_analysis.get('subjectivite_score', 0)) or 0
    subjectivity_diff = abs(subj_a - subj_b)
    
    centrality_diff = abs(
        centrality_scores.get(chatgpt_analysis.get('centralite_islam_musulmans', 'Non applicable'), 0) -
        centrality_scores.get(gemini_analysis.get('centralite_islam_musulmans', 'Non applicable'), 0)
    )
    
    has_significant_conflict = (polarity_diff >= 3 or subjectivity_diff >= 3 or centrality_diff >= 3)
    
    return {
        "polarity_diff": polarity_diff,
        "subjectivity_diff": subjectivity_diff,
        "centrality_diff": centrality_diff,
        "total_diff": polarity_diff + subjectivity_diff + centrality_diff,
        "has_significant_conflict": has_significant_conflict
    }


def create_arbiter_prompt(article_text: str, title: str, 
                          model_a_analysis: dict, model_b_analysis: dict) -> str:
    """Create the user prompt for the arbiter model.
    
    Note: The system instruction already contains the evaluation scales and guidelines.
    This prompt provides only the specific article and model analyses to evaluate.
    Model assignment is randomized for blind evaluation.
    """
    
    prompt = f"""Evaluate the following article and the two model analyses.

## Article Information
**Title:** {title}

**Full Text:**
{article_text[:15000]}

---

## Model A Analysis:
- **Polarity (sentiment toward Islam/Muslims):** {model_a_analysis.get('polarite', 'N/A')}
  - Justification: {model_a_analysis.get('polarite_justification', 'N/A')}
- **Subjectivity Score (1=very objective, 5=very subjective):** {model_a_analysis.get('subjectivite_score', 'N/A')}
  - Justification: {model_a_analysis.get('subjectivite_justification', 'N/A')}
- **Centrality of Islam/Muslims:** {model_a_analysis.get('centralite_islam_musulmans', 'N/A')}
  - Justification: {model_a_analysis.get('centralite_justification', 'N/A')}

## Model B Analysis:
- **Polarity:** {model_b_analysis.get('polarite', 'N/A')}
  - Justification: {model_b_analysis.get('polarite_justification', 'N/A')}
- **Subjectivity Score:** {model_b_analysis.get('subjectivite_score', 'N/A')}
  - Justification: {model_b_analysis.get('subjectivite_justification', 'N/A')}
- **Centrality:** {model_b_analysis.get('centralite_islam_musulmans', 'N/A')}
  - Justification: {model_b_analysis.get('centralite_justification', 'N/A')}

---

Provide your independent evaluation for each dimension, determine which model is more accurate, and explain your reasoning."""

    return prompt


def convert_pydantic_to_dataclass(response: ArbiterResponse, article_id: str) -> ArbiterAnalysis:
    """Convert Pydantic ArbiterResponse to ArbiterAnalysis dataclass"""
    return ArbiterAnalysis(
        article_id=article_id,
        polarity=ArbiterScore(
            score=response.polarity.arbiter_score,
            justification=response.polarity.justification,
            preferred_model=response.polarity.preferred_model,
            verdict_explanation=response.polarity.verdict_explanation
        ),
        subjectivity=ArbiterScore(
            score=str(response.subjectivity.arbiter_score),
            justification=response.subjectivity.justification,
            preferred_model=response.subjectivity.preferred_model,
            verdict_explanation=response.subjectivity.verdict_explanation
        ),
        centrality=ArbiterScore(
            score=response.centrality.arbiter_score,
            justification=response.centrality.justification,
            preferred_model=response.centrality.preferred_model,
            verdict_explanation=response.centrality.verdict_explanation
        ),
        overall_verdict=response.overall_verdict,
        confidence_level=response.confidence_level,
        timestamp=datetime.now().isoformat()
    )


def evaluate_with_arbiter(client: genai.Client, article: dict, chatgpt_analysis: dict, 
                          gemini_analysis: dict, model_a_is_chatgpt: bool, 
                          max_retries: int = 3) -> Optional[ArbiterAnalysis]:
    """Send an article to the arbiter for evaluation using Gemini 3 Pro with structured outputs.
    
    Uses:
    - System instruction for consistent evaluation context
    - thinking_level="high" for maximum reasoning capability
    - Pydantic structured outputs for reliable JSON parsing
    - Blind model assignment (Model A/B) - same for all articles
    
    Args:
        model_a_is_chatgpt: Global assignment - True if Model A = ChatGPT for ALL articles
    """
    
    article_id = str(article.get('o:id', article.get('id', 'unknown')))
    title = article.get('o:title', article.get('title', 'Unknown Title'))
    # Use OCR field for full text from HuggingFace dataset (uppercase field name)
    text = article.get('OCR', article.get('ocr', article.get('full_text', article.get('text', ''))))
    
    if not text:
        print(f"  ⚠️ No text available for article {article_id}")
        return None
    
    # Apply the GLOBAL model assignment (same for all articles)
    if model_a_is_chatgpt:
        model_a_analysis = chatgpt_analysis
        model_b_analysis = gemini_analysis
    else:
        model_a_analysis = gemini_analysis
        model_b_analysis = chatgpt_analysis
    
    prompt = create_arbiter_prompt(text, title, model_a_analysis, model_b_analysis)
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-3-pro-preview",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    thinking_config=types.ThinkingConfig(thinking_level="high"),
                    response_mime_type="application/json",
                    response_schema=ArbiterResponse,
                    temperature=0.2,
                    max_output_tokens=8192,
                )
            )
            
            if response.text:
                # Parse JSON response and convert to Pydantic model
                data = json.loads(response.text)
                arbiter_response = ArbiterResponse.model_validate(data)
                result = convert_pydantic_to_dataclass(arbiter_response, article_id)
                return result
            
            print(f"  ⚠️ Empty response for article {article_id}, attempt {attempt + 1}")
            
        except json.JSONDecodeError as e:
            print(f"  ⚠️ JSON parse error for article {article_id}, attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
        except Exception as e:
            print(f"  ⚠️ Error for article {article_id}, attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
    
    return None


def load_dataset() -> pd.DataFrame:
    """Load the IWAC dataset from Hugging Face"""
    print("Loading dataset from Hugging Face...")
    
    try:
        parquet_path = hf_hub_download(
            repo_id="fmadore/islam-west-africa-collection", 
            filename="articles/train-00000-of-00001.parquet",
            repo_type="dataset"
        )
        
        df = pd.read_parquet(parquet_path)
        print(f"Successfully loaded {len(df)} rows")
        print(f"Available columns: {', '.join(df.columns.tolist())}")
        
        # Check for OCR/text field
        ocr_fields = [col for col in df.columns if 'ocr' in col.lower() or 'text' in col.lower() or 'content' in col.lower()]
        if ocr_fields:
            print(f"Found text fields: {', '.join(ocr_fields)}")
            # Check how many have non-empty values
            for field in ocr_fields:
                non_empty = df[field].notna().sum()
                print(f"  {field}: {non_empty}/{len(df)} non-empty ({100*non_empty/len(df):.1f}%)")
        else:
            print("⚠️ WARNING: No OCR/text field found in dataset!")
        
        return df
        
    except Exception as e:
        print(f"Failed to load dataset: {e}")
        raise


def find_significant_differences(df: pd.DataFrame, model_a: str = 'chatgpt', model_b: str = 'gemini') -> list:
    """Find articles with significant differences between the specified models
    
    Args:
        df: DataFrame with article data
        model_a: First model ID (e.g., 'chatgpt', 'gemini', 'mistral')
        model_b: Second model ID (e.g., 'chatgpt', 'gemini', 'mistral')
    """
    significant_articles = []
    
    model_a_name = MODEL_NAMES.get(model_a, model_a)
    model_b_name = MODEL_NAMES.get(model_b, model_b)
    
    print(f"Processing {len(df)} articles to find significant differences between {model_a_name} and {model_b_name}...")
    
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Finding conflicts"):
        item = row.to_dict()
        
        # Dynamically build column names based on model prefixes
        model_a_analysis = {
            'polarite': item.get(f'{model_a}_polarite'),
            'polarite_justification': item.get(f'{model_a}_polarite_justification'),
            'subjectivite_score': item.get(f'{model_a}_subjectivite_score'),
            'subjectivite_justification': item.get(f'{model_a}_subjectivite_justification'),
            'centralite_islam_musulmans': item.get(f'{model_a}_centralite_islam_musulmans'),
            'centralite_justification': item.get(f'{model_a}_centralite_justification')
        }
        
        model_b_analysis = {
            'polarite': item.get(f'{model_b}_polarite'),
            'polarite_justification': item.get(f'{model_b}_polarite_justification'),
            'subjectivite_score': item.get(f'{model_b}_subjectivite_score'),
            'subjectivite_justification': item.get(f'{model_b}_subjectivite_justification'),
            'centralite_islam_musulmans': item.get(f'{model_b}_centralite_islam_musulmans'),
            'centralite_justification': item.get(f'{model_b}_centralite_justification')
        }
        
        discrepancies = calculate_discrepancies(model_a_analysis, model_b_analysis)
        
        if discrepancies and discrepancies["has_significant_conflict"]:
            # Include the OCR field for full text (field name is uppercase)
            article_data = {
                'o:id': item.get('o:id'),
                'o:title': item.get('title'),
                'OCR': item.get('OCR'),  # Include OCR field - uppercase in dataset
                'newspaper': item.get('newspaper'),
                'country': item.get('country'),
                'pub_date': item.get('pub_date'),
                'model_a_analysis': model_a_analysis,
                'model_b_analysis': model_b_analysis,
                'model_a_id': model_a,
                'model_b_id': model_b,
                'discrepancies': discrepancies
            }
            significant_articles.append(article_data)
    
    return significant_articles



def process_pair(client, df: pd.DataFrame, pair: str, webapp_data_dir: str) -> dict:
    """Process a single model pair and return statistics
    
    Uses the webapp output file as cache for incremental processing.
    If new articles are added to the dataset, only the new ones will be processed.
    
    Args:
        client: GenAI client
        df: DataFrame with article data
        pair: Model pair string (e.g., 'chatgpt-gemini')
        webapp_data_dir: Directory for webapp data files (used as cache)
        
    Returns:
        dict with processing statistics
    """
    model_a, model_b = get_models_from_pair(pair)
    model_a_name = MODEL_NAMES.get(model_a, model_a)
    model_b_name = MODEL_NAMES.get(model_b, model_b)
    
    print(f"\n{'='*60}")
    print(f"Processing: {model_a_name} vs {model_b_name}")
    print(f"{'='*60}")
    
    # Find articles with significant differences for this pair
    significant_articles = find_significant_differences(df, model_a, model_b)
    
    if not significant_articles:
        print(f"❌ No articles with significant differences found!")
        return {'pair': pair, 'total': 0, 'new': 0, 'cached': 0, 'failed': 0}
    
    print(f"📊 Found {len(significant_articles)} articles with significant differences")
    
    # Use webapp output file as primary cache (for incremental processing)
    webapp_file = os.path.join(webapp_data_dir, f"iwac_arbiter_evaluations_{pair}.json")
    
    # Load existing evaluations from output file (acts as cache)
    arbiter_results = []
    evaluated_ids = set()
    model_a_is_first = None  # Whether model_a is assigned as "Model A" in blind eval
    
    if os.path.exists(webapp_file):
        print(f"📦 Found existing data file: {os.path.basename(webapp_file)}")
        try:
            with open(webapp_file, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                arbiter_results = existing_data.get('evaluations', [])
                evaluated_ids = {str(r['article_id']) for r in arbiter_results}
                # Preserve the blind assignment from previous runs
                model_a_is_first = existing_data.get('metadata', {}).get('model_a_is_first')
                print(f"   ✓ Loaded {len(arbiter_results)} cached evaluations")
        except Exception as e:
            print(f"   ⚠️ Failed to load existing data: {e}")
            arbiter_results = []
            evaluated_ids = set()
    
    # Filter out already-evaluated articles
    remaining_articles = [a for a in significant_articles if str(a.get('o:id')) not in evaluated_ids]
    cached_count = len(evaluated_ids)
    
    if not remaining_articles:
        print(f"✓ All {len(significant_articles)} articles already evaluated!")
        return {'pair': pair, 'total': len(significant_articles), 'new': 0, 'cached': cached_count, 'failed': 0}
    
    print(f"📝 {len(remaining_articles)} new articles to evaluate ({cached_count} cached)")
    
    # BLIND EVALUATION: Use existing assignment or create new one
    if model_a_is_first is None:
        model_a_is_first = random.choice([True, False])
        print(f"🎲 New blind assignment: Model A = {model_a_name if model_a_is_first else model_b_name}")
    else:
        print(f"📋 Using existing blind assignment: Model A = {model_a_name if model_a_is_first else model_b_name}")
    
    # Process new articles with arbiter
    successful = 0
    failed = 0
    
    for i, item in enumerate(tqdm(remaining_articles, desc=f"Arbiter eval ({pair})")):
        result = evaluate_with_arbiter(
            client,
            item,
            item['model_a_analysis'],
            item['model_b_analysis'],
            model_a_is_first
        )
        
        if result:
            arbiter_results.append({
                'article_id': result.article_id,
                'arbiter': asdict(result),
                'discrepancies': item['discrepancies']
            })
            successful += 1
            
            # Save progress every 10 successful evaluations
            if successful % 10 == 0:
                save_results(webapp_file, arbiter_results, pair, model_a_is_first, 
                            model_a_name, model_b_name, len(significant_articles), 
                            len(arbiter_results), failed)
                print(f"  💾 Saved {len(arbiter_results)} results")
        else:
            failed += 1
        
        # Rate limiting
        if (i + 1) % 10 == 0:
            time.sleep(1)
    
    # Save final results
    save_results(webapp_file, arbiter_results, pair, model_a_is_first,
                model_a_name, model_b_name, len(significant_articles),
                len(arbiter_results), failed)
    
    print(f"✓ Completed: {successful} new, {cached_count} cached, {failed} failed")
    
    return {
        'pair': pair,
        'total': len(significant_articles),
        'new': successful,
        'cached': cached_count,
        'failed': failed
    }


def save_results(filepath: str, results: list, pair: str, model_a_is_first: bool,
                 first_model_name: str, second_model_name: str, total: int, successful: int, failed: int):
    """Save arbiter results to JSON file
    
    Args:
        model_a_is_first: Whether the first model in the pair was presented as "Model A" to the arbiter
        first_model_name: Name of the first model in the pair (e.g., ChatGPT for chatgpt-gemini)
        second_model_name: Name of the second model in the pair (e.g., Gemini for chatgpt-gemini)
    """
    # CRITICAL: Save the actual model names that the arbiter saw as Model A/B
    # This makes the JSON self-documenting and avoids confusion
    arbiter_model_a = first_model_name if model_a_is_first else second_model_name
    arbiter_model_b = second_model_name if model_a_is_first else first_model_name
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'generated': datetime.now().isoformat(),
                'arbiter_model': 'gemini-3-pro-preview',
                'thinking_level': 'high',
                'blind_evaluation': True,
                # Clarified naming: these are what the arbiter ACTUALLY saw
                'arbiter_model_a': arbiter_model_a,  # What arbiter saw as "Model A"
                'arbiter_model_b': arbiter_model_b,  # What arbiter saw as "Model B"
                # Keep pair info for reference
                'pair': pair,
                'pair_first_model': first_model_name,
                'pair_second_model': second_model_name,
                'note': 'arbiter_model_a/b = what the arbiter saw. preferred_model in verdicts directly maps to these names.',
                'total_articles': total,
                'successful_evaluations': successful,
                'failed_evaluations': failed
            },
            'evaluations': results
        }, f, ensure_ascii=False, indent=2)


def main(pairs: list[str] | None = None):
    """Main function - processes all specified pairs
    
    Args:
        pairs: List of model pairs to evaluate. If None, processes all pairs.
    """
    if pairs is None:
        pairs = VALID_PAIRS
    
    print(f"\n{'='*60}")
    print(f"IWAC Arbiter Evaluation - Gemini 3 Pro (High Reasoning)")
    print(f"Processing {len(pairs)} model pair(s): {', '.join(pairs)}")
    print(f"{'='*60}")
    
    # Check for API key
    api_key = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("\n❌ Error: No API key found!")
        print("Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable")
        return
    
    # Create GenAI client
    client = genai.Client(api_key=api_key)
    print(f"✓ Configured Gemini 3 Pro as arbiter (thinking_level=high)")
    
    # Load dataset
    try:
        df = load_dataset()
    except Exception as e:
        print(f"Failed to load dataset: {e}")
        return
    
    # Setup webapp data directory
    webapp_data_dir = os.path.join(os.path.dirname(__file__), "..", 
                                    "ma-visualisation-sentiments", "static", "data")
    os.makedirs(webapp_data_dir, exist_ok=True)
    
    # Count total new articles to process across all pairs
    total_new = 0
    for pair in pairs:
        model_a, model_b = get_models_from_pair(pair)
        articles = find_significant_differences(df, model_a, model_b)
        webapp_file = os.path.join(webapp_data_dir, f"iwac_arbiter_evaluations_{pair}.json")
        
        evaluated_ids = set()
        if os.path.exists(webapp_file):
            try:
                with open(webapp_file, 'r', encoding='utf-8') as f:
                    evaluated_ids = {str(r['article_id']) for r in json.load(f).get('evaluations', [])}
            except:
                pass
        
        new_count = len([a for a in articles if str(a.get('o:id')) not in evaluated_ids])
        total_new += new_count
    
    if total_new == 0:
        print(f"\n✓ All articles across all pairs are already evaluated!")
        print("No API calls needed.")
    else:
        print(f"\n⚠️  This will make approximately {total_new} API calls to Gemini 3 Pro")
        response = input("Do you want to proceed? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            print("Aborted.")
            return
    
    # Process each pair
    all_stats = []
    for pair in pairs:
        stats = process_pair(client, df, pair, webapp_data_dir)
        all_stats.append(stats)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"ARBITER EVALUATION COMPLETE")
    print(f"{'='*60}")
    
    for stats in all_stats:
        print(f"\n{stats['pair']}:")
        print(f"  Total articles: {stats['total']}")
        print(f"  Newly evaluated: {stats['new']}")
        print(f"  From cache: {stats['cached']}")
        print(f"  Failed: {stats['failed']}")


if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description='IWAC Arbiter Evaluation - Compare AI models using Gemini 3 Pro as arbiter',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python arbiter-evaluation.py                      # Process all pairs (default)
  python arbiter-evaluation.py --pair chatgpt-gemini  # Process single pair
  python arbiter-evaluation.py --pair chatgpt-mistral --pair gemini-mistral
"""
    )
    parser.add_argument(
        '--pair', '-p',
        type=str,
        choices=VALID_PAIRS,
        action='append',
        dest='pairs',
        help=f'Model pair(s) to evaluate. Can be specified multiple times. Default: all pairs'
    )
    
    args = parser.parse_args()
    
    # If no pairs specified, process all pairs
    pairs_to_process = args.pairs if args.pairs else None
    
    # Set random seed - no fixed seed for true randomization of blind assignment
    random.seed()
    main(pairs=pairs_to_process)

