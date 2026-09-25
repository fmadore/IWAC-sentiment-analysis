"""IWAC source loading, normalization, and row-level transformations."""

from __future__ import annotations

import json
import logging
import os
import re
import sys
from collections.abc import Sequence
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd
from huggingface_hub import HfApi, hf_hub_download
from huggingface_hub.errors import HfHubHTTPError

from .contract import CONTRACT_V1, CONTRACTS, SentimentContract

HF_REPO_ID = "fmadore/islam-west-africa-collection"
# The private mirror is a superset of the public projection: identical sentiment
# columns, but `OCR` is populated for every row instead of being masked per row
# by `OCR_is_public`. Scores and justifications are read from the public repo so
# that the published revision stays citable; only full text comes from here.
HF_FULL_REPO_ID = "fmadore/islam-west-africa-collection-full"
HF_PARQUET_FILENAME = "articles/train-00000-of-00001.parquet"
HF_INDEX_PARQUET_FILENAME = "index/train-00000-of-00001.parquet"
INDEX_TYPE_PLACE = "Lieux"
IWAC_ITEM_URL_BASE = "https://islam.zmo.de/s/afrique_ouest/item/"
_COORD_RE = re.compile(r"\s*(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)\s*$")
_last_source_revision: str | None = None
_revisions_by_repo: dict[str, str | None] = {}


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


@dataclass(frozen=True)
class SourceResult:
    data: pd.DataFrame
    repository: str
    revision: str


@lru_cache(maxsize=16)
def resolve_source_revision(repo_id: str, requested: str | None) -> str:
    # Resolve once per repository/request for a coherent multi-subset run.
    revision = HfApi().dataset_info(repo_id, revision=requested).sha
    if not revision:
        raise ValueError(f"No immutable revision returned for {repo_id}")
    return revision


def load_source(
    config: str,
    direct_filename: str,
    repo_id: str = HF_REPO_ID,
    token: str | None = None,
    revision: str | None = None,
) -> SourceResult:
    requested = revision or os.getenv(
        "IWAC_HF_FULL_REVISION" if repo_id == HF_FULL_REPO_ID else "IWAC_HF_REVISION"
    )
    resolved = resolve_source_revision(repo_id, requested)
    try:
        path = hf_hub_download(
            repo_id=repo_id,
            filename=direct_filename,
            repo_type="dataset",
            token=token,
            revision=resolved,
        )
    except HfHubHTTPError as direct_error:
        _logger.warning(
            "Direct %s download failed: %s; using pinned datasets fallback", config, direct_error
        )
        from datasets import load_dataset

        dataset = load_dataset(repo_id, name=config, revision=resolved, token=token)
        data = pd.DataFrame(dataset["train"])
    else:
        # Parsing failures are data errors, not an excuse to switch sources.
        data = pd.read_parquet(path)
    return SourceResult(data=data, repository=repo_id, revision=resolved)


def _load_subset(
    config: str,
    direct_filename: str,
    repo_id: str = HF_REPO_ID,
    token: str | None = None,
) -> pd.DataFrame:
    # Compatibility facade for existing CLI consumers; new callers can retain
    # SourceResult directly instead of consulting last-load provenance.
    global _last_source_revision
    result = load_source(config, direct_filename, repo_id, token)
    _last_source_revision = result.revision
    _revisions_by_repo[result.repository] = result.revision
    return result.data


def load_iwac_dataset(contract: SentimentContract = CONTRACT_V1) -> pd.DataFrame:
    df = contract.normalize_sentiment_columns(_load_subset("articles", HF_PARQUET_FILENAME))
    validate_columns(df, contract.sentiment_columns)
    return df


def load_iwac_full_text() -> dict[str, str]:
    """Return ``o:id -> OCR`` from the private mirror, which masks nothing.

    The public projection blanks ``OCR`` per row by ``OCR_is_public``, so about
    two fifths of articles carry no text there. Anything that reasons over the
    article itself (the arbiter) must read the full mirror instead of silently
    working from an empty string. Requires ``HF_TOKEN``.
    """
    token = os.getenv("HF_TOKEN")
    if not token:
        raise RuntimeError(
            "HF_TOKEN is required to read the private mirror "
            f"{HF_FULL_REPO_ID}; the public projection masks article text per row."
        )
    df = _load_subset("articles", HF_PARQUET_FILENAME, repo_id=HF_FULL_REPO_ID, token=token)
    validate_columns(df, ["o:id", "OCR"])
    texts: dict[str, str] = {}
    for article_id, ocr in zip(df["o:id"], df["OCR"], strict=True):
        key = safe_str(article_id)
        text = safe_str(ocr)
        if key and text:
            texts[key] = text
    return texts


def load_iwac_index() -> pd.DataFrame:
    return _load_subset("index", HF_INDEX_PARQUET_FILENAME)


def load_iwac_records(contract: SentimentContract = CONTRACT_V1) -> list[dict]:
    return load_iwac_dataset(contract).to_dict("records")


def get_source_revision(repo_id: str | None = None) -> str | None:
    """Return the immutable HF snapshot revision used by the latest load.

    Without an argument this reports the most recent load of any repository,
    which is what the single-source v1 scripts expect. Pass ``repo_id`` when a
    run reads from more than one repository and each revision must be recorded.
    """
    if repo_id is None:
        return _last_source_revision
    return _revisions_by_repo.get(repo_id)


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
    """Resolve a pair id to its two model ids.

    Never split the id on ``-``: a model id may contain a hyphen
    (``mistral-small``), so ``mistral-small-deepseek`` would split into a model
    that does not exist. The contract carries the mapping explicitly.
    """
    for contract in CONTRACTS.values():
        members = contract.pair_models.get(pair)
        if members is not None:
            return members
    known = sorted(name for contract in CONTRACTS.values() for name in contract.pair_models)
    raise KeyError(f"Unknown model pair {pair!r}; expected one of {', '.join(known)}")


def extract_model_analysis(
    item: dict, model_id: str, contract: SentimentContract = CONTRACT_V1
) -> dict:
    return {
        suffix: item.get(contract.sentiment_column(model_id, suffix))
        for suffix in contract.field_suffixes
    }


def _build_model_fields(
    item: dict, model_id: str, suffixes: Sequence[str], contract: SentimentContract = CONTRACT_V1
) -> dict:
    return {
        suffix: (
            contract.coerce_subjectivity(item.get(contract.sentiment_column(model_id, suffix)))
            if suffix == "subjectivite_score"
            else safe_str(item.get(contract.sentiment_column(model_id, suffix)))
        )
        for suffix in suffixes
    }


def build_model_sentiment(
    item: dict, model_id: str, contract: SentimentContract = CONTRACT_V1
) -> dict:
    return _build_model_fields(item, model_id, contract.field_suffixes, contract)


def build_model_scores(
    item: dict, model_id: str, contract: SentimentContract = CONTRACT_V1
) -> dict:
    return _build_model_fields(item, model_id, contract.score_suffixes, contract)


def build_model_justifications(
    item: dict, model_id: str, contract: SentimentContract = CONTRACT_V1
) -> dict:
    return _build_model_fields(item, model_id, contract.justification_suffixes, contract)


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


WEBAPP_DIR = Path(__file__).resolve().parents[2] / "ma-visualisation-sentiments"


def get_webapp_data_dir() -> str:
    output = WEBAPP_DIR / "static" / "data"
    output.mkdir(parents=True, exist_ok=True)
    return os.fspath(output)


def get_staging_dir() -> str:
    """Scratch space for staged exports and the writer lock, beside ``static/``.

    Never inside ``static/``: everything there is copied into the Pages
    artifact. It shares the data directory's filesystem, which keeps promotion
    an atomic rename (see ``iwac_preprocess.publication``).
    """
    output = WEBAPP_DIR / ".data-staging"
    output.mkdir(parents=True, exist_ok=True)
    return os.fspath(output)


BASE_FILENAME = "iwac_articles_base.json"


def read_base_article_ids(base_path: str) -> set[str]:
    """Return the article ids recorded in the shared base metadata file."""
    with open(base_path, encoding="utf-8") as handle:
        base_items = json.load(handle)
    return {str(item["o:id"]) for item in base_items}


def get_base_article_ids(output_dir: str | None = None) -> set[str]:
    """Read the published base article ids from the webapp's data directory."""
    directory = output_dir if output_dir is not None else get_webapp_data_dir()
    base_path = os.path.join(directory, BASE_FILENAME)
    if not os.path.exists(base_path):
        raise SystemExit(
            f"{BASE_FILENAME} is missing from {directory}. Generate it with "
            "`data-fetch.py --generation v1` before running this analysis."
        )
    return read_base_article_ids(base_path)


def restrict_to_base_articles(
    records: list[dict], base_ids: set[str], logger: logging.Logger
) -> list[dict]:
    """Drop live articles the sentiment panel never processed.

    The Hugging Face corpus keeps growing, but a panel run is a discrete event:
    articles ingested after it carry no scores at all. Counting them would put
    a corpus-wide denominator beside annotation-scoped numerators, which is the
    same half-updated state ``assert_base_matches`` refuses in ``data-fetch``.
    Here the extra rows are genuinely out of frame rather than a drifted
    snapshot, so they are excluded and reported instead of aborting the run.

    An article present in the base but absent from the live corpus is the
    opposite problem — the published metadata would reference a row nothing can
    supply — so that still fails loudly.
    """
    live_ids = {str(record.get("o:id")) for record in records}
    vanished = base_ids - live_ids
    if vanished:
        sample = sorted(vanished)[:5]
        raise SystemExit(
            f"{len(vanished)} article(s) in {BASE_FILENAME} are gone from the Hugging "
            f"Face corpus (e.g. {sample}). The base metadata is shared with the frozen "
            "v1 files, so reconciling it is a deliberate cross-generation decision "
            "rather than a side effect of this run."
        )

    kept = [record for record in records if str(record.get("o:id")) in base_ids]
    unprocessed = len(records) - len(kept)
    if unprocessed:
        logger.info(
            "Excluding %d article(s) ingested after the panel run: the corpus holds "
            "%d rows, the panel processed %d.",
            unprocessed,
            len(records),
            len(kept),
        )
    return kept
