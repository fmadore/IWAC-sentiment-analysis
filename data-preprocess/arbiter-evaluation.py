"""
Arbiter Evaluation Script - Gemini 3 Pro as the Judge

This script uses Gemini 3 Pro with high reasoning level (thinking_level="high") 
as an arbiter to evaluate articles where ChatGPT and Gemini have significant 
disagreements (≥3 points difference).

The arbiter provides:
- Its own independent scores for each dimension
- Justification for each score
- Verdict on which model's analysis is more accurate
- Explanation of the reasoning

Features:
- Gemini 3 Pro Preview with thinking_level="high" for maximum reasoning
- System instructions for consistent evaluation context
- Pydantic structured outputs for reliable JSON parsing

Output: JSON file with arbiter evaluations to be consumed by the visualization app
"""

import os
import json
import time
import random
import pandas as pd
from tqdm import tqdm
from datetime import datetime
from typing import Optional, Literal
from dataclasses import dataclass, asdict
from huggingface_hub import hf_hub_download
from pydantic import BaseModel, Field
from pathlib import Path
from dotenv import load_dotenv

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
    text = article.get('full_text', article.get('text', ''))
    
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
        return df
        
    except Exception as e:
        print(f"Failed to load dataset: {e}")
        raise


def find_significant_differences(df: pd.DataFrame) -> list:
    """Find articles with significant differences between models"""
    significant_articles = []
    
    print(f"Processing {len(df)} articles to find significant differences...")
    
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Finding conflicts"):
        item = row.to_dict()
        
        chatgpt_analysis = {
            'polarite': item.get('chatgpt_polarite'),
            'polarite_justification': item.get('chatgpt_polarite_justification'),
            'subjectivite_score': item.get('chatgpt_subjectivite_score'),
            'subjectivite_justification': item.get('chatgpt_subjectivite_justification'),
            'centralite_islam_musulmans': item.get('chatgpt_centralite_islam_musulmans'),
            'centralite_justification': item.get('chatgpt_centralite_justification')
        }
        
        gemini_analysis = {
            'polarite': item.get('gemini_polarite'),
            'polarite_justification': item.get('gemini_polarite_justification'),
            'subjectivite_score': item.get('gemini_subjectivite_score'),
            'subjectivite_justification': item.get('gemini_subjectivite_justification'),
            'centralite_islam_musulmans': item.get('gemini_centralite_islam_musulmans'),
            'centralite_justification': item.get('gemini_centralite_justification')
        }
        
        discrepancies = calculate_discrepancies(chatgpt_analysis, gemini_analysis)
        
        if discrepancies and discrepancies["has_significant_conflict"]:
            significant_articles.append({
                'article': item,
                'chatgpt': chatgpt_analysis,
                'gemini': gemini_analysis,
                'discrepancies': discrepancies
            })
    
    return significant_articles


def main():
    """Main function"""
    print(f"\n{'='*60}")
    print(f"IWAC Arbiter Evaluation - Gemini 3 Pro (High Reasoning)")
    print(f"{'='*60}")
    
    # Check for API key
    api_key = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("\n❌ Error: No API key found!")
        print("Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable")
        print("\nExample:")
        print("  export GOOGLE_API_KEY='your-api-key-here'")
        print("  # or on Windows:")
        print("  set GOOGLE_API_KEY=your-api-key-here")
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
    
    # Find articles with significant differences
    significant_articles = find_significant_differences(df)
    
    if not significant_articles:
        print("\n❌ No articles with significant differences found!")
        return
    
    print(f"\n📊 Found {len(significant_articles)} articles with significant differences")
    
    # BLIND EVALUATION: Randomize model assignment ONCE for ALL articles
    model_a_is_chatgpt = random.choice([True, False])
    if model_a_is_chatgpt:
        print(f"\n🎲 Blind assignment: Model A = ChatGPT, Model B = Gemini (key stored in output)")
    else:
        print(f"\n🎲 Blind assignment: Model A = Gemini, Model B = ChatGPT (key stored in output)")
    
    # Ask for confirmation before proceeding (API costs)
    print(f"\n⚠️  This will make {len(significant_articles)} API calls to Gemini 3 Pro")
    response = input("Do you want to proceed? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print("Aborted.")
        return
    
    # Process articles with arbiter
    arbiter_results = []
    successful = 0
    failed = 0
    
    print(f"\n🔄 Evaluating articles with arbiter (using high reasoning level)...")
    
    for i, item in enumerate(tqdm(significant_articles, desc="Arbiter evaluation")):
        result = evaluate_with_arbiter(
            client,
            item['article'],
            item['chatgpt'],
            item['gemini'],
            model_a_is_chatgpt  # Same assignment for ALL articles
        )
        
        if result:
            arbiter_results.append({
                'article_id': result.article_id,
                'arbiter': asdict(result),
                'discrepancies': item['discrepancies']
            })
            successful += 1
        else:
            failed += 1
        
        # Rate limiting - Gemini has rate limits
        if (i + 1) % 10 == 0:
            time.sleep(1)
    
    # Create output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = os.path.join(os.path.dirname(__file__), "..", "exports", f"arbiter_{timestamp}")
    os.makedirs(output_dir, exist_ok=True)
    
    # Save the assignment key file (like significant-differences-export.py does)
    key_path = os.path.join(output_dir, "model_assignment_key.txt")
    with open(key_path, 'w', encoding='utf-8') as f:
        f.write(f"ARBITER BLIND TEST MODEL ASSIGNMENT\\n")
        f.write(f"====================================\\n")
        f.write(f"Generated: {datetime.now().isoformat()}\\n")
        f.write(f"Total articles evaluated: {successful}\\n\\n")
        if model_a_is_chatgpt:
            f.write(f"Model A = ChatGPT\\n")
            f.write(f"Model B = Gemini\\n")
        else:
            f.write(f"Model A = Gemini\\n")
            f.write(f"Model B = ChatGPT\\n")
        f.write(f"\\nTo decode verdicts:\\n")
        f.write(f"  - 'model_a' preferred = {'ChatGPT' if model_a_is_chatgpt else 'Gemini'} preferred\\n")
        f.write(f"  - 'model_b' preferred = {'Gemini' if model_a_is_chatgpt else 'ChatGPT'} preferred\\n")
    
    # Save results as JSON
    output_file = os.path.join(output_dir, "arbiter_evaluations.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'generated': datetime.now().isoformat(),
                'arbiter_model': 'gemini-3-pro-preview',
                'thinking_level': 'high',
                'blind_evaluation': True,
                'model_a_is_chatgpt': model_a_is_chatgpt,
                'note': 'SAME model assignment for ALL articles. Use model_a_is_chatgpt to decode verdicts.',
                'total_articles': len(significant_articles),
                'successful_evaluations': successful,
                'failed_evaluations': failed
            },
            'evaluations': arbiter_results
        }, f, ensure_ascii=False, indent=2)
    
    # Also save a copy for the web app
    webapp_data_dir = os.path.join(os.path.dirname(__file__), "..", 
                                    "ma-visualisation-sentiments", "static", "data")
    if os.path.exists(webapp_data_dir):
        webapp_file = os.path.join(webapp_data_dir, "iwac_arbiter_evaluations.json")
        with open(webapp_file, 'w', encoding='utf-8') as f:
            json.dump({
                'metadata': {
                    'generated': datetime.now().isoformat(),
                    'arbiter_model': 'gemini-3-pro-preview',
                    'thinking_level': 'high',
                    'blind_evaluation': True,
                    'model_a_is_chatgpt': model_a_is_chatgpt,
                    'note': 'SAME model assignment for ALL articles. Use model_a_is_chatgpt to decode verdicts.',
                    'total_articles': len(significant_articles),
                    'successful_evaluations': successful,
                    'failed_evaluations': failed
                },
                'evaluations': arbiter_results
            }, f, ensure_ascii=False, indent=2)
        print(f"\n✓ Also saved to web app: {webapp_file}")
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"ARBITER EVALUATION COMPLETE")
    print(f"{'='*60}")
    print(f"Output file: {output_file}")
    print(f"\nResults:")
    print(f"  ✓ Successful evaluations: {successful}")
    print(f"  ✗ Failed evaluations: {failed}")
    
    # Print some statistics about arbiter verdicts (decode blind assignments using GLOBAL key)
    if arbiter_results:
        model_prefs = {'chatgpt': 0, 'gemini': 0, 'both': 0, 'neither': 0}
        for result in arbiter_results:
            arbiter = result['arbiter']
            
            for dim in ['polarity', 'subjectivity', 'centrality']:
                pref = arbiter[dim].get('preferred_model', 'neither')
                
                # Decode using the GLOBAL blind assignment
                if pref == 'model_a':
                    actual_pref = 'chatgpt' if model_a_is_chatgpt else 'gemini'
                elif pref == 'model_b':
                    actual_pref = 'gemini' if model_a_is_chatgpt else 'chatgpt'
                else:
                    actual_pref = pref  # 'both' or 'neither'
                
                model_prefs[actual_pref] = model_prefs.get(actual_pref, 0) + 1
        
        total_verdicts = sum(model_prefs.values())
        print(f"\n📊 Model preference breakdown (across all dimensions):")
        print(f"  ChatGPT preferred: {model_prefs['chatgpt']} ({100*model_prefs['chatgpt']/total_verdicts:.1f}%)")
        print(f"  Gemini preferred: {model_prefs['gemini']} ({100*model_prefs['gemini']/total_verdicts:.1f}%)")
        print(f"  Both equally good: {model_prefs['both']} ({100*model_prefs['both']/total_verdicts:.1f}%)")
        print(f"  Neither accurate: {model_prefs['neither']} ({100*model_prefs['neither']/total_verdicts:.1f}%)")
        
        print(f"\n🔐 Blind evaluation key saved to: {key_path}")
        if model_a_is_chatgpt:
            print(f"   Model A = ChatGPT, Model B = Gemini")
        else:
            print(f"   Model A = Gemini, Model B = ChatGPT")


if __name__ == "__main__":
    # Set random seed - no fixed seed for true randomization of blind assignment
    random.seed()
    main()
