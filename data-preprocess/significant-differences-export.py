"""
Export articles with significant model disagreements for blind evaluation.

Identifies and exports the articles where two AI models (any pair among
ChatGPT, Gemini, and Mistral) diverge significantly (>= 3 points on at least
one dimension) in their sentiment analyses. The data is anonymised (Model A
vs Model B) for a blind test.

Output: one directory per pair under exports/ containing a CSV with the
anonymised analyses and a secret model-assignment key file.

Usage:
  python significant-differences-export.py                       # Default: chatgpt-gemini
  python significant-differences-export.py --pair gemini-mistral
  python significant-differences-export.py --all-pairs
"""

from __future__ import annotations

import argparse
import os
import random
from datetime import datetime

import pandas as pd
from shared import (
    MODEL_NAMES,
    MODEL_PAIRS,
    SIGNIFICANT_CONFLICT_THRESHOLD,
    calculate_discrepancies,
    extract_model_analysis,
    get_article_text,
    get_item_url,
    get_logger,
    get_models_from_pair,
    load_iwac_records,
)
from tqdm import tqdm

logger = get_logger(__name__)

DEFAULT_PAIR = "chatgpt-gemini"


def extract_significant_differences(
    records: list[dict], model_a_id: str, model_b_id: str
) -> tuple[list[dict], bool]:
    """Extract articles where the two models disagree significantly.

    The two models are anonymised as Model A and Model B; which real model is
    presented as Model A is randomised once for the whole export.

    Args:
        records: IWAC article rows as plain dicts.
        model_a_id: First model id of the pair (e.g. 'chatgpt').
        model_b_id: Second model id of the pair (e.g. 'gemini').

    Returns:
        Tuple of (list of anonymised article rows for the CSV,
        first_model_is_model_a flag for the secret key file).
    """
    significant_articles = []

    # Randomise the Model A/B assignment for blind evaluation.
    first_model_is_model_a = random.choice([True, False])

    logger.info("Processing %d articles for significant differences...", len(records))
    logger.info("Model assignment randomized for blind evaluation")

    for item in tqdm(records, desc="Processing articles"):
        first_analysis = extract_model_analysis(item, model_a_id)
        second_analysis = extract_model_analysis(item, model_b_id)

        discrepancies = calculate_discrepancies(first_analysis, second_analysis)

        if not (discrepancies and discrepancies["has_significant_conflict"]):
            continue

        if first_model_is_model_a:
            model_a = first_analysis
            model_b = second_analysis
        else:
            model_a = second_analysis
            model_b = first_analysis

        significant_articles.append(
            {
                "article_id": item.get("o:id"),
                "title": item.get("title"),
                "country": item.get("country"),
                "newspaper": item.get("newspaper"),
                "pub_date": item.get("pub_date"),
                "article_text": get_article_text(item),  # Full OCR text
                "url": get_item_url(item.get("o:id")),
                # Discrepancies
                "polarity_diff": discrepancies["polarity_diff"],
                "subjectivity_diff": discrepancies["subjectivity_diff"],
                "centrality_diff": discrepancies["centrality_diff"],
                "total_diff": discrepancies["total_diff"],
                # Model A (anonymized)
                "model_a_polarity": model_a["polarite"],
                "model_a_polarity_justification": model_a["polarite_justification"],
                "model_a_subjectivity": model_a["subjectivite_score"],
                "model_a_subjectivity_justification": model_a["subjectivite_justification"],
                "model_a_centrality": model_a["centralite_islam_musulmans"],
                "model_a_centrality_justification": model_a["centralite_justification"],
                # Model B (anonymized)
                "model_b_polarity": model_b["polarite"],
                "model_b_polarity_justification": model_b["polarite_justification"],
                "model_b_subjectivity": model_b["subjectivite_score"],
                "model_b_subjectivity_justification": model_b["subjectivite_justification"],
                "model_b_centrality": model_b["centralite_islam_musulmans"],
                "model_b_centrality_justification": model_b["centralite_justification"],
            }
        )

    return significant_articles, first_model_is_model_a


def write_assignment_key(
    key_path: str,
    first_model_is_model_a: bool,
    first_model_name: str,
    second_model_name: str,
    total_articles: int,
) -> None:
    """Write the secret Model A/B assignment key file for one export."""
    model_a_name = first_model_name if first_model_is_model_a else second_model_name
    model_b_name = second_model_name if first_model_is_model_a else first_model_name

    with open(key_path, "w", encoding="utf-8") as f:
        f.write("BLIND TEST MODEL ASSIGNMENT\n")
        f.write("========================\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        f.write(f"Total articles: {total_articles}\n\n")
        f.write(f"Model A = {model_a_name}\n")
        f.write(f"Model B = {model_b_name}\n")
        f.write("\nDO NOT REVEAL UNTIL EVALUATION IS COMPLETE!\n")


def export_pair(records: list[dict], pair: str) -> None:
    """Export the blind-evaluation dataset for one model pair.

    Args:
        records: IWAC article rows as plain dicts.
        pair: Model pair string (e.g. 'chatgpt-gemini').
    """
    model_a_id, model_b_id = get_models_from_pair(pair)
    first_model_name = MODEL_NAMES.get(model_a_id, model_a_id)
    second_model_name = MODEL_NAMES.get(model_b_id, model_b_id)

    logger.info(
        "Exporting significant differences for %s vs %s", first_model_name, second_model_name
    )

    significant_articles, first_model_is_model_a = extract_significant_differences(
        records, model_a_id, model_b_id
    )

    if not significant_articles:
        logger.warning("No articles with significant differences found for %s!", pair)
        return

    # Output directory. The default pair keeps the historical name
    # (blind_test_<timestamp>); other pairs include the pair in the name.
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dir_name = (
        f"blind_test_{timestamp}" if pair == DEFAULT_PAIR else f"blind_test_{pair}_{timestamp}"
    )
    output_dir = os.path.join(os.path.dirname(__file__), "..", "exports", dir_name)
    os.makedirs(output_dir, exist_ok=True)

    # CSV export
    df_export = pd.DataFrame(significant_articles)
    csv_path = os.path.join(output_dir, "blind_evaluation_dataset.csv")
    df_export.to_csv(csv_path, index=False, encoding="utf-8")

    # Secret assignment key (keep unopened until the evaluation is complete)
    key_path = os.path.join(output_dir, "model_assignment_key.txt")
    write_assignment_key(
        key_path,
        first_model_is_model_a,
        first_model_name,
        second_model_name,
        len(significant_articles),
    )

    logger.info("EXPORT COMPLETE")
    logger.info("Output directory: %s", output_dir)
    logger.info("Blind evaluation dataset (Model A vs Model B): %s", csv_path)
    logger.info("Model assignment key (KEEP SECRET!): %s", key_path)
    logger.info("Total articles with significant conflicts: %d", len(significant_articles))

    # Show a few examples without revealing model identity
    logger.info("Example conflicts (anonymized):")
    for i, article in enumerate(significant_articles[:3], 1):
        logger.info("  Article %d: %.80s...", i, article["title"])
        logger.info("    Total difference: %d points", article["total_diff"])
        if article["polarity_diff"] >= SIGNIFICANT_CONFLICT_THRESHOLD:
            logger.info(
                "    Polarity: Model A='%s' vs Model B='%s'",
                article["model_a_polarity"],
                article["model_b_polarity"],
            )
        if article["subjectivity_diff"] >= SIGNIFICANT_CONFLICT_THRESHOLD:
            logger.info(
                "    Subjectivity: Model A=%s vs Model B=%s",
                article["model_a_subjectivity"],
                article["model_b_subjectivity"],
            )
        if article["centrality_diff"] >= SIGNIFICANT_CONFLICT_THRESHOLD:
            logger.info(
                "    Centrality: Model A='%s' vs Model B='%s'",
                article["model_a_centrality"],
                article["model_b_centrality"],
            )

    logger.info("IMPORTANT: the model assignment is randomized and stored in %s", key_path)
    logger.info("Do NOT open this file until your evaluation is complete!")


def main(pairs: list[str]) -> int:
    """Run the blind-test export for each requested model pair."""
    logger.info("IWAC Significant Differences Export - BLIND TEST")
    logger.info("Processing %d model pair(s): %s", len(pairs), ", ".join(pairs))

    try:
        records = load_iwac_records()
    except Exception as e:
        logger.error("Failed to load dataset: %s", e)
        return 2

    for pair in pairs:
        export_pair(records, pair)
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Export articles with significant model disagreements for blind evaluation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python significant-differences-export.py                       # Default: chatgpt-gemini
  python significant-differences-export.py --pair gemini-mistral
  python significant-differences-export.py --all-pairs
""",
    )
    parser.add_argument(
        "--pair",
        "-p",
        type=str,
        choices=MODEL_PAIRS,
        action="append",
        dest="pairs",
        help=f"Model pair(s) to export. Can be specified multiple times. Default: {DEFAULT_PAIR}",
    )
    parser.add_argument(
        "--all-pairs",
        action="store_true",
        help="Export every model pair",
    )

    args = parser.parse_args()

    if args.all_pairs:
        pairs_to_process = MODEL_PAIRS
    else:
        pairs_to_process = args.pairs if args.pairs else [DEFAULT_PAIR]

    # Set random seed for reproducible model assignment
    random.seed(42)
    raise SystemExit(main(pairs_to_process))
