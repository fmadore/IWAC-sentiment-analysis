"""Extreme-keyword analysis, tested on a hand-built corpus."""

from __future__ import annotations

import pytest
from iwac_preprocess import CONTRACT_V1, CONTRACT_V2
from iwac_preprocess.extremes import (
    CATEGORIES,
    analyze_extreme_keywords,
    clean_and_split_keywords,
)
from validate_generated_data import EXTREME_CATEGORIES


def v1_row(article_id, *, polarity, subjectivity, centrality, **extra):
    prefix = CONTRACT_V1.hf_column_prefixes["chatgpt"]
    return {
        "o:id": article_id,
        "title": f"Article {article_id}",
        "country": "Togo",
        "newspaper": "Togo-Presse",
        "pub_date": "2001-05-12",
        f"{prefix}_polarite": polarity,
        f"{prefix}_subjectivite_score": subjectivity,
        f"{prefix}_centralite_islam_musulmans": centrality,
        **extra,
    }


def test_keywords_are_split_trimmed_and_short_ones_dropped():
    assert clean_and_split_keywords(" islam | ok |musulman||") == ["islam", "musulman"]
    assert clean_and_split_keywords(None) == []
    assert clean_and_split_keywords(float("nan")) == []


def test_the_category_keys_are_the_ones_the_validator_and_webapp_read():
    assert {category.key for category in CATEGORIES} == EXTREME_CATEGORIES


def test_an_article_counts_in_every_category_it_matches():
    records = [
        v1_row(
            1,
            polarity="Très négatif",
            subjectivity=5,
            centrality="Très central",
            subject="islam|mosquée",
            spatial="Lomé",
        ),
        v1_row(2, polarity="Neutre", subjectivity=3, centrality="Secondaire"),
        v1_row(3, polarity=None, subjectivity=None, centrality=None),
    ]
    result = analyze_extreme_keywords(records, "chatgpt", contract=CONTRACT_V1)

    analysis = result["analysis"]
    assert analysis["polarity_very_negative"]["article_ids"] == ["1"]
    assert analysis["subjectivity_extreme_high"]["article_ids"] == ["1"]
    assert analysis["centrality_very_central"]["article_ids"] == ["1"]
    assert analysis["polarity_very_positive"]["article_ids"] == []
    assert analysis["polarity_very_negative"]["subject"] == {"islam": 1, "mosquée": 1}
    assert analysis["polarity_very_negative"]["by_country"] == {"Togo": 1}
    # Stored once, referenced from every category it belongs to.
    assert set(result["articles_index"]) == {"1"}
    # Every processed article is in the denominator, annotated or not.
    assert result["statistics"]["total_articles"] == 3
    assert result["statistics"]["polarity_very_negative_count"] == 1


def test_the_payload_is_stamped_with_its_generation():
    result = analyze_extreme_keywords([], "luna", contract=CONTRACT_V2)
    assert result["schema_version"] == CONTRACT_V2.schema_version
    assert result["analysis_version"] == "v2"
    assert result["model"] == "luna"


def test_v2_subjectivity_labels_are_decoded_before_matching():
    prefix = CONTRACT_V2.hf_column_prefixes["luna"]
    record = {
        "o:id": 1,
        f"{prefix}_polarite": "Neutre",
        f"{prefix}_subjectivite_score": "Très objectif",
        f"{prefix}_centralite_islam_musulmans": "Central",
    }
    result = analyze_extreme_keywords([record], "luna", contract=CONTRACT_V2)
    assert result["analysis"]["subjectivity_extreme_low"]["article_ids"] == ["1"]


def test_an_unknown_v2_subjectivity_label_fails_loudly():
    prefix = CONTRACT_V2.hf_column_prefixes["luna"]
    record = {"o:id": 1, f"{prefix}_subjectivite_score": "Assez subjectif"}
    with pytest.raises(ValueError):
        analyze_extreme_keywords([record], "luna", contract=CONTRACT_V2)
