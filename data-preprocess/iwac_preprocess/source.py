"""IWAC source loading, normalization, and row-level transformations."""

from __future__ import annotations

import logging
import os
import re
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import pandas as pd
from huggingface_hub import hf_hub_download

from .contract import (
    SENTIMENT_COLUMNS,
    SENTIMENT_FIELD_SUFFIXES,
    SENTIMENT_JUSTIFICATION_SUFFIXES,
    SENTIMENT_SCORE_SUFFIXES,
    normalize_sentiment_columns,
    sentiment_column,
)

HF_REPO_ID = "fmadore/islam-west-africa-collection"
HF_PARQUET_FILENAME = "articles/train-00000-of-00001.parquet"
HF_INDEX_PARQUET_FILENAME = "index/train-00000-of-00001.parquet"
INDEX_TYPE_PLACE = "Lieux"
IWAC_ITEM_URL_BASE = "https://islam.zmo.de/s/afrique_ouest/item/"
_COORD_RE = re.compile(r"\s*(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)\s*$")
_last_source_revision: str | None = None


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


_logger = get_logger(__name__)


def safe_int_convert(value: Any) -> int | None:
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


def safe_str(value: Any) -> str | None:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (ValueError, TypeError):
        pass
    text = str(value)
    return text if text else None


def validate_columns(df: pd.DataFrame, required: list[str]) -> None:
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(
            f"Dataset is missing required column(s): {', '.join(missing)}. "
            f"Available columns: {', '.join(df.columns)}"
        )


def _load_subset(config: str, direct_filename: str) -> pd.DataFrame:
    global _last_source_revision
    try:
        path = hf_hub_download(repo_id=HF_REPO_ID, filename=direct_filename, repo_type="dataset")
        parts = Path(path).parts
        if "snapshots" in parts:
            snapshot_index = parts.index("snapshots")
            if snapshot_index + 1 < len(parts):
                _last_source_revision = parts[snapshot_index + 1]
        return pd.read_parquet(path)
    except Exception as direct_error:
        _logger.warning(
            "Direct %s download failed: %s; using datasets fallback", config, direct_error
        )
        from datasets import load_dataset

        dataset = load_dataset(HF_REPO_ID, name=config, verification_mode="no_checks")
        _last_source_revision = os.getenv("IWAC_HF_REVISION")
        return pd.DataFrame(dataset["train"])


def load_iwac_dataset() -> pd.DataFrame:
    df = normalize_sentiment_columns(_load_subset("articles", HF_PARQUET_FILENAME))
    validate_columns(df, SENTIMENT_COLUMNS)
    return df


def load_iwac_index() -> pd.DataFrame:
    return _load_subset("index", HF_INDEX_PARQUET_FILENAME)


def load_iwac_records() -> list[dict]:
    return load_iwac_dataset().to_dict("records")


def get_source_revision() -> str | None:
    """Return the immutable HF snapshot revision used by the latest load."""
    return _last_source_revision


def split_pipe_field(value: Any) -> list[str]:
    text = safe_str(value)
    return [part.strip() for part in text.split("|") if part.strip()] if text else []


def parse_coordinates(value: Any) -> tuple[float, float] | None:
    text = safe_str(value)
    match = _COORD_RE.match(text) if text else None
    if not match:
        return None
    lat, lng = float(match.group(1)), float(match.group(2))
    return (lat, lng) if -90 <= lat <= 90 and -180 <= lng <= 180 else None


def get_article_text(item: dict) -> str | None:
    return item.get("OCR")


def get_item_url(o_id: Any) -> str | None:
    return f"{IWAC_ITEM_URL_BASE}{o_id}" if o_id else None


def get_models_from_pair(pair: str) -> tuple[str, str]:
    return tuple(pair.split("-", 1))  # type: ignore[return-value]


def extract_model_analysis(item: dict, model_id: str) -> dict:
    return {
        suffix: item.get(sentiment_column(model_id, suffix)) for suffix in SENTIMENT_FIELD_SUFFIXES
    }


def _build_model_fields(item: dict, model_id: str, suffixes: Sequence[str]) -> dict:
    return {
        suffix: (
            safe_int_convert(item.get(sentiment_column(model_id, suffix)))
            if suffix == "subjectivite_score"
            else safe_str(item.get(sentiment_column(model_id, suffix)))
        )
        for suffix in suffixes
    }


def build_model_sentiment(item: dict, model_id: str) -> dict:
    return _build_model_fields(item, model_id, SENTIMENT_FIELD_SUFFIXES)


def build_model_scores(item: dict, model_id: str) -> dict:
    return _build_model_fields(item, model_id, SENTIMENT_SCORE_SUFFIXES)


def build_model_justifications(item: dict, model_id: str) -> dict:
    return _build_model_fields(item, model_id, SENTIMENT_JUSTIFICATION_SUFFIXES)


def build_base_article(item: dict) -> dict:
    """Map one HF article row to the shared browser metadata record."""
    iiif = safe_str(item.get("iiif_manifest"))
    return {
        "o:id": safe_int_convert(item.get("o:id")),
        "o:title": safe_str(item.get("title")),
        "Newspaper": safe_str(item.get("newspaper")),
        "Country": safe_str(item.get("country")),
        "dcterms:date": safe_str(item.get("pub_date")),
        "hijri_year": safe_int_convert(item.get("hijri_year")),
        "hijri_month": safe_int_convert(item.get("hijri_month")),
        "hijri_day": safe_int_convert(item.get("hijri_day")),
        **({"iiif_manifest": iiif} if iiif else {}),
    }


def get_webapp_data_dir() -> str:
    output = Path(__file__).resolve().parents[2] / "ma-visualisation-sentiments" / "static" / "data"
    output.mkdir(parents=True, exist_ok=True)
    return os.fspath(output)
