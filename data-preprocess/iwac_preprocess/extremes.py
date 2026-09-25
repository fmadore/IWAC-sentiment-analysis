"""Pure extreme-keyword analysis behind ``extreme-analysis.py``.

Importable and tested without the network; the script is the CLI around it.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from collections.abc import Callable
from typing import Any, NamedTuple

import pandas as pd
from tqdm import tqdm

from .contract import CONTRACT_V1, SentimentContract
from .source import get_logger, safe_int_convert, safe_str

logger = get_logger(__name__)

# Extreme-analysis thresholds are presentation categories rather than part of
# the cross-language sentiment contract.
EXTREME_SUBJECTIVITY_HIGH = 4
EXTREME_SUBJECTIVITY_LOW = 2
EXTREME_POLARITY_VERY_NEGATIVE = "Très négatif"
EXTREME_POLARITY_VERY_POSITIVE = "Très positif"
EXTREME_CENTRALITY_VERY_CENTRAL = "Très central"
EXTREME_CENTRALITY_MARGINAL = "Marginal"

# Number of top keywords kept in the global per-category analysis.
TOP_KEYWORDS = 50
# Number of top keywords kept per facet (country/newspaper).
FACET_TOP_KEYWORDS = 20
# Keywords shorter than this many characters are discarded as noise.
MIN_KEYWORD_LENGTH = 3


class ExtremeCategory(NamedTuple):
    """One extreme-sentiment category.

    Attributes:
        key: Key used in the output JSON under ``analysis`` (do not rename —
            the webapp depends on these names).
        stat_key: Prefix of the category's counter in ``statistics``
            (``"<stat_key>_count"``).
        matches: Predicate over ``(subjectivity_score, polarity, centrality)``
            deciding whether an article belongs to the category.
    """

    key: str
    stat_key: str
    matches: Callable[[int | None, Any, Any], bool]


# The 6 extreme categories. Order matters: it is preserved in the output JSON
# ``analysis`` and ``statistics`` blocks.
CATEGORIES: list[ExtremeCategory] = [
    ExtremeCategory(
        "subjectivity_extreme_high",
        "subjectivity_high",
        lambda subj, pol, cen: bool(subj) and subj >= EXTREME_SUBJECTIVITY_HIGH,
    ),
    ExtremeCategory(
        "subjectivity_extreme_low",
        "subjectivity_low",
        lambda subj, pol, cen: bool(subj) and subj <= EXTREME_SUBJECTIVITY_LOW,
    ),
    ExtremeCategory(
        "polarity_very_negative",
        "polarity_very_negative",
        lambda subj, pol, cen: pol == EXTREME_POLARITY_VERY_NEGATIVE,
    ),
    ExtremeCategory(
        "polarity_very_positive",
        "polarity_very_positive",
        lambda subj, pol, cen: pol == EXTREME_POLARITY_VERY_POSITIVE,
    ),
    ExtremeCategory(
        "centrality_very_central",
        "centrality_very_central",
        lambda subj, pol, cen: cen == EXTREME_CENTRALITY_VERY_CENTRAL,
    ),
    ExtremeCategory(
        "centrality_not_central",
        "centrality_not_central",
        lambda subj, pol, cen: cen == EXTREME_CENTRALITY_MARGINAL,
    ),
]


def clean_and_split_keywords(text: Any) -> list[str]:
    """Clean and split ``|``-separated keywords.

    Args:
        text: Raw keyword string (``subject`` or ``spatial`` column value).

    Returns:
        List of cleaned keywords, dropping empties and keywords shorter than
        ``MIN_KEYWORD_LENGTH`` characters.

    Example:
        >>> clean_and_split_keywords("islam|musulman|religion")
        ['islam', 'musulman', 'religion']
    """
    if not text or pd.isna(text):
        return []

    keywords = [kw.strip() for kw in str(text).split("|") if kw.strip()]
    return [kw for kw in keywords if len(kw) >= MIN_KEYWORD_LENGTH]


def convert_keywords_by_facet(keywords_dict: dict, top_n: int = FACET_TOP_KEYWORDS) -> dict:
    """Convert per-facet keyword Counters into plain dicts of top keywords.

    Args:
        keywords_dict: Mapping of facet name to ``{"subject": Counter,
            "spatial": Counter}``.
        top_n: Number of most frequent keywords to keep per facet.

    Returns:
        Mapping of facet name to ``{"subject": {kw: count}, "spatial": {...}}``.
    """
    return {
        facet_name: {
            "subject": dict(counters["subject"].most_common(top_n)),
            "spatial": dict(counters["spatial"].most_common(top_n)),
        }
        for facet_name, counters in keywords_dict.items()
    }


def _new_category_accumulator() -> dict:
    """Create the empty per-category accumulator used during the article scan."""
    return {
        "subject": Counter(),
        "spatial": Counter(),
        "by_country": Counter(),
        "by_newspaper": Counter(),
        "keywords_by_country": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "keywords_by_newspaper": defaultdict(lambda: {"subject": Counter(), "spatial": Counter()}),
        "article_ids": [],
    }


def analyze_extreme_keywords(
    records: list[dict],
    model_id: str,
    top_n: int = TOP_KEYWORDS,
    contract: SentimentContract = CONTRACT_V1,
) -> dict:
    """Analyse keywords associated with sentiment extremes for one model.

    Identifies articles with extreme scores (subjectivity, polarity,
    centrality) per the ``CATEGORIES`` config and aggregates the associated
    keywords globally and per facet (country, newspaper).

    Args:
        records: IWAC article rows as plain dicts.
        model_id: Which model's scores to read. Not the dataset column prefix
            — see ``SentimentContract.hf_column_prefixes``.
        top_n: Number of most frequent keywords to keep globally per category.
        contract: Analysis generation the model id belongs to. It also decides
            how subjectivity is decoded: v1 stores the 1-5 rank, v2 a label.

    Returns:
        dict with the exact structure consumed by the webapp::

            {
                "model": "<model_id>",
                "analysis": {
                    "<category>": {
                        "subject": {keyword: count},
                        "spatial": {keyword: count},
                        "by_country": {country: article_count},
                        "by_newspaper": {newspaper: article_count},
                        "keywords_by_country": {country: {"subject": {}, "spatial": {}}},
                        "keywords_by_newspaper": {newspaper: {"subject": {}, "spatial": {}}},
                        "article_ids": ["<id>", ...]
                    },
                    ...
                },
                "articles_index": {"<id>": article_info, ...},
                "statistics": {...},
                "facets": {"countries": {...}, "newspapers": {...}}
            }

    Article payloads are stored once in ``articles_index`` and referenced by
    id from each category — an article can belong to several categories, and
    embedding it per category duplicated ~7MB per output file. The webapp
    denormalizes at load time (utils/extremeAnalysis.ts).
    """
    accumulators = {category.key: _new_category_accumulator() for category in CATEGORIES}

    stats: dict[str, int] = {"total_articles": 0}
    for category in CATEGORIES:
        stats[f"{category.stat_key}_count"] = 0

    all_countries: Counter = Counter()
    all_newspapers: Counter = Counter()
    articles_index: dict[str, dict] = {}

    logger.info("Analyzing extreme keywords for %s (%d articles)...", model_id, len(records))

    for item in tqdm(records, desc=f"Processing {model_id} data"):
        stats["total_articles"] += 1

        # Model scores for this article
        subj_score = contract.coerce_subjectivity(
            item.get(contract.sentiment_column(model_id, "subjectivite_score"))
        )
        polarity = item.get(contract.sentiment_column(model_id, "polarite"))
        centrality = item.get(contract.sentiment_column(model_id, "centralite_islam_musulmans"))

        # Metadata + facets
        country = safe_str(item.get("country"))
        newspaper = safe_str(item.get("newspaper"))
        if country:
            all_countries[country] += 1
        if newspaper:
            all_newspapers[newspaper] += 1

        subject_keywords = clean_and_split_keywords(item.get("subject"))
        spatial_keywords = clean_and_split_keywords(item.get("spatial"))

        raw_article_id = safe_int_convert(item.get("o:id"))
        if raw_article_id is None:
            continue
        article_id = str(raw_article_id)
        article_info = {
            "id": raw_article_id,
            "title": safe_str(item.get("title")),
            "country": country,
            "newspaper": newspaper,
            "pub_date": safe_str(item.get("pub_date")),
            "subject_keywords": subject_keywords,
            "spatial_keywords": spatial_keywords,
        }

        for category in CATEGORIES:
            if not category.matches(subj_score, polarity, centrality):
                continue

            bucket = accumulators[category.key]
            stats[f"{category.stat_key}_count"] += 1
            bucket["subject"].update(subject_keywords)
            bucket["spatial"].update(spatial_keywords)
            if country:
                bucket["by_country"][country] += 1
                bucket["keywords_by_country"][country]["subject"].update(subject_keywords)
                bucket["keywords_by_country"][country]["spatial"].update(spatial_keywords)
            if newspaper:
                bucket["by_newspaper"][newspaper] += 1
                bucket["keywords_by_newspaper"][newspaper]["subject"].update(subject_keywords)
                bucket["keywords_by_newspaper"][newspaper]["spatial"].update(spatial_keywords)
            articles_index[article_id] = article_info
            bucket["article_ids"].append(article_id)

    logger.info("Compiling results and generating keyword analysis by facets...")

    analysis = {}
    for category in CATEGORIES:
        bucket = accumulators[category.key]
        analysis[category.key] = {
            "subject": dict(bucket["subject"].most_common(top_n)),
            "spatial": dict(bucket["spatial"].most_common(top_n)),
            "by_country": dict(bucket["by_country"].most_common()),
            "by_newspaper": dict(bucket["by_newspaper"].most_common()),
            "keywords_by_country": convert_keywords_by_facet(bucket["keywords_by_country"]),
            "keywords_by_newspaper": convert_keywords_by_facet(bucket["keywords_by_newspaper"]),
            "article_ids": bucket["article_ids"],
        }

    return {
        # Stamped like every other generated file, so the validator can bind
        # each extremes payload to the generation that produced it.
        "schema_version": contract.schema_version,
        "analysis_version": contract.analysis_version,
        "model": model_id,
        "articles_index": articles_index,
        "analysis": analysis,
        "statistics": stats,
        "facets": {
            "countries": dict(all_countries.most_common()),
            "newspapers": dict(all_newspapers.most_common()),
        },
    }
