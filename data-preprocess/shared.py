"""
Shared utilities for IWAC data preprocessing scripts.

Common functions and constants used across data-fetch, extreme-analysis,
significant-differences-export, and arbiter-evaluation scripts.
"""

import json
import logging
import os
import re
import sys
import time
from collections.abc import Sequence
from typing import Any, Optional

import pandas as pd
from huggingface_hub import hf_hub_download


# ============================================================================
# Logging
# ============================================================================

def get_logger(name: str) -> logging.Logger:
    """Return a logger writing INFO-level messages to stdout with a simple format.

    Idempotent: calling twice with the same name will not duplicate handlers.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


_logger = get_logger(__name__)


# ============================================================================
# Constants
# ============================================================================

HF_REPO_ID = "fmadore/islam-west-africa-collection"
HF_PARQUET_FILENAME = "articles/train-00000-of-00001.parquet"

# The `index` subset is IWAC's authority file (persons, places, organisations,
# subjects, events). Only the ``Lieux`` rows matter here: they carry the
# ``Coordonnées`` that turn an article's ``spatial`` tags into map points.
HF_INDEX_PARQUET_FILENAME = "index/train-00000-of-00001.parquet"

# ``index.Type`` value identifying a place authority record.
INDEX_TYPE_PLACE = "Lieux"

# ``Coordonnées`` is free text; in practice always "lat, lng" but with drifting
# separators.
_COORD_RE = re.compile(r"\s*(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)\s*$")

# Base URL for IWAC items on the Omeka S instance.
IWAC_ITEM_URL_BASE = "https://islam.zmo.de/s/afrique_ouest/item/"

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

# Model id -> Hugging Face sentiment column prefix.
#
# These were the same word until 2026-07-31, which is why every script used to
# build its columns as f"{model_id}_{suffix}". On that date the dataset renamed
# its sentiment columns from a *vendor slot* (``chatgpt_``/``gemini_``/
# ``mistral_``) to the exact model that produced each annotation — nothing in
# the record had ever said which one ran.
#
# Only the READ side moved. The keys stay the pipeline's and the webapp's
# vocabulary: they are the ``dataset``/``pair`` URL parameters, the
# ``iwac_*_<model>.json`` filenames and the ``model`` key inside them. Renaming
# them would break every shared link and every path under static/data to say
# something the UI already says — AnalysisInfo.svelte names the precise models
# (GPT-5 mini, Gemini 3 Flash, Ministral 3 14B) on its cards and badges.
HF_COLUMN_PREFIXES = {
    'chatgpt': 'gpt_5_mini',
    'gemini': 'gemini_3_flash_preview',
    'mistral': 'ministral_14b_2512',
}

# Every model-pair comparison supported by the pipeline.
MODEL_PAIRS = ['chatgpt-gemini', 'chatgpt-mistral', 'gemini-mistral']

# A per-dimension score gap of at least this many points counts as a
# significant conflict between two model analyses.
SIGNIFICANT_CONFLICT_THRESHOLD = 3

# Sentiment-analysis field suffixes shared by every model; :func:`sentiment_column`
# pairs one with a prefix to name a dataset column. Order matters: it is
# preserved in the JSON written by data-fetch.py.
#
# The split matters for payload size. The three SCORE fields are what every
# chart, filter and aggregate reads; the three JUSTIFICATION fields are long
# free-text prose that only the article-detail views and the CSV exports ever
# show — and they are 86-92% of the bytes. data-fetch.py therefore writes them
# to a separate file the webapp loads on demand.
SENTIMENT_SCORE_SUFFIXES = (
    'centralite_islam_musulmans',
    'subjectivite_score',
    'polarite',
)

SENTIMENT_JUSTIFICATION_SUFFIXES = (
    'centralite_justification',
    'subjectivite_justification',
    'polarite_justification',
)

SENTIMENT_FIELD_SUFFIXES = (
    'centralite_islam_musulmans',
    'centralite_justification',
    'subjectivite_score',
    'subjectivite_justification',
    'polarite',
    'polarite_justification',
)

# Thresholds and category labels for extreme-analysis. Centralising these
# avoids the magic numbers/strings previously scattered through the script.
EXTREME_SUBJECTIVITY_HIGH = 4   # score >= this is "very subjective"
EXTREME_SUBJECTIVITY_LOW = 2    # score <= this is "very objective"
EXTREME_POLARITY_VERY_NEGATIVE = 'Très négatif'
EXTREME_POLARITY_VERY_POSITIVE = 'Très positif'
EXTREME_CENTRALITY_VERY_CENTRAL = 'Très central'
EXTREME_CENTRALITY_MARGINAL = 'Marginal'


# ============================================================================
# Data type helpers
# ============================================================================

def safe_int_convert(value: Any) -> Optional[int]:
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


def safe_str(value: Any) -> Optional[str]:
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

    Every sentiment column is verified present before the frame is returned.
    Without that check an upstream rename (as happened on 2026-07-31) sails
    straight through: each ``item.get()`` misses, each score becomes None, and
    the pipeline writes a full set of well-formed JSON files in which every
    value is null — a dashboard of empty charts, no error anywhere.

    Returns:
        pd.DataFrame with all article rows.

    Raises:
        ValueError: if any sentiment column is missing.
    """
    df = _download_iwac_articles()
    validate_columns(df, SENTIMENT_COLUMNS)
    return df


def _download_iwac_articles() -> pd.DataFrame:
    """Fetch the articles subset: direct parquet download, then datasets lib."""
    try:
        _logger.info("Downloading dataset from Hugging Face...")
        parquet_path = hf_hub_download(
            repo_id=HF_REPO_ID,
            filename=HF_PARQUET_FILENAME,
            repo_type="dataset"
        )
        df = pd.read_parquet(parquet_path)
        _logger.info("Successfully loaded %d rows with %d columns", len(df), len(df.columns))
        return df

    except Exception as e:
        _logger.warning("Direct download failed: %s", e)
        _logger.info("Trying datasets library fallback...")
        from datasets import load_dataset
        dataset = load_dataset(HF_REPO_ID, "articles", verification_mode="no_checks")
        df = pd.DataFrame(dataset['train'])
        _logger.info("Loaded %d rows via datasets library", len(df))
        return df


def load_iwac_index() -> pd.DataFrame:
    """Load the IWAC ``index`` (authority-file) subset from Hugging Face.

    Same two-step strategy as :func:`load_iwac_dataset` — direct parquet
    download, falling back to the ``datasets`` library.

    Returns:
        pd.DataFrame with all authority rows (persons, places, organisations,
        subjects, events). Filter on ``Type`` for one kind.
    """
    try:
        _logger.info("Downloading index subset from Hugging Face...")
        parquet_path = hf_hub_download(
            repo_id=HF_REPO_ID,
            filename=HF_INDEX_PARQUET_FILENAME,
            repo_type="dataset"
        )
        df = pd.read_parquet(parquet_path)
        _logger.info("Loaded %d index rows with %d columns", len(df), len(df.columns))
        return df

    except Exception as e:
        _logger.warning("Direct index download failed: %s", e)
        _logger.info("Trying datasets library fallback...")
        from datasets import load_dataset
        dataset = load_dataset(HF_REPO_ID, "index", verification_mode="no_checks")
        df = pd.DataFrame(dataset['train'])
        _logger.info("Loaded %d index rows via datasets library", len(df))
        return df


def split_pipe_field(value: Any) -> list[str]:
    """Split a pipe-joined multi-value field into stripped, non-empty parts.

    IWAC joins every repeatable field (``spatial``, ``subject``, ``author``…)
    with ``|``. Substring-matching such a field is a bug; always split first.
    """
    text = safe_str(value)
    if not text:
        return []
    return [part.strip() for part in text.split('|') if part.strip()]


def parse_coordinates(value: Any) -> Optional[tuple[float, float]]:
    """Parse an index ``Coordonnées`` string into ``(lat, lng)``.

    The field is free text of the form ``"12.3657, -1.5339"``. Returns None
    when absent or unparseable — roughly 19% of place records have no usable
    coordinates and are simply not mappable.
    """
    text = safe_str(value)
    if not text:
        return None
    match = _COORD_RE.match(text)
    if not match:
        return None
    lat, lng = float(match.group(1)), float(match.group(2))
    # Guard against transposed or garbage values rather than silently plotting
    # a point in the wrong hemisphere.
    if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
        return None
    return lat, lng


def load_iwac_records() -> list[dict]:
    """Load the IWAC articles dataset as a list of plain dicts.

    Preferred over iterating a DataFrame with ``df.iterrows()`` (its slowest
    access pattern) when row-wise dict access is all a consumer needs.
    """
    return load_iwac_dataset().to_dict('records')


def validate_columns(df: pd.DataFrame, required: list[str]) -> None:
    """Fail loudly if any required column is missing from the dataset.

    Raises:
        ValueError: naming the missing columns and listing what is available.
    """
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(
            f"Dataset is missing required column(s): {', '.join(missing)}. "
            f"Available columns: {', '.join(df.columns)}"
        )


# ============================================================================
# Row/item accessors
# ============================================================================

def get_article_text(item: dict) -> Optional[str]:
    """Return an article's full OCR text.

    The dataset column is uppercase ``OCR`` (confirmed against the HuggingFace
    dataset); centralising the lookup prevents lowercase-``ocr`` regressions.
    """
    return item.get('OCR')


def get_item_url(o_id: Any) -> Optional[str]:
    """Return the public IWAC item URL for an ``o:id``, or None if missing."""
    if not o_id:
        return None
    return f"{IWAC_ITEM_URL_BASE}{o_id}"


# ============================================================================
# Model pairs
# ============================================================================

def get_models_from_pair(pair: str) -> tuple[str, str]:
    """Split a pair string like ``chatgpt-gemini`` into its two model IDs."""
    model_a, model_b = pair.split('-', 1)
    return model_a, model_b


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

    # Skip the subjectivity dimension when either score is missing — coercing a
    # missing score to 0 would manufacture a spurious 4-5 point gap against a
    # present score, inflating the "significant conflict" set sent to the paid
    # arbiter (mirrors the 'Non applicable' handling on the other axes).
    subj_a = safe_int_convert(analysis_a.get('subjectivite_score'))
    subj_b = safe_int_convert(analysis_b.get('subjectivite_score'))
    subjectivity_diff = abs(subj_a - subj_b) if subj_a is not None and subj_b is not None else 0

    centrality_diff = abs(
        CENTRALITY_SCORES.get(analysis_a.get('centralite_islam_musulmans', 'Non applicable'), 0) -
        CENTRALITY_SCORES.get(analysis_b.get('centralite_islam_musulmans', 'Non applicable'), 0)
    )

    has_significant_conflict = (
        polarity_diff >= SIGNIFICANT_CONFLICT_THRESHOLD or
        subjectivity_diff >= SIGNIFICANT_CONFLICT_THRESHOLD or
        centrality_diff >= SIGNIFICANT_CONFLICT_THRESHOLD
    )

    return {
        "polarity_diff": polarity_diff,
        "subjectivity_diff": subjectivity_diff,
        "centrality_diff": centrality_diff,
        "total_diff": polarity_diff + subjectivity_diff + centrality_diff,
        "has_significant_conflict": has_significant_conflict
    }


# ============================================================================
# Model field extraction
# ============================================================================

def sentiment_column(model_id: str, suffix: str) -> str:
    """Return the dataset column holding ``suffix`` for model ``model_id``.

    The only place a sentiment column name is assembled. ``model_id`` is the
    pipeline's own id (``chatgpt``/``gemini``/``mistral``); the dataset names
    its columns after the model that produced them, so the two differ — see
    :data:`HF_COLUMN_PREFIXES`.

    Raises:
        KeyError: on an unknown model id. Falling back to ``model_id`` as the
            prefix would name a column that does not exist, and every lookup
            against it returns None — a dashboard of empty charts with no
            error anywhere, which is exactly the failure this indirection
            exists to prevent.
    """
    try:
        prefix = HF_COLUMN_PREFIXES[model_id]
    except KeyError:
        raise KeyError(
            f"Unknown model id {model_id!r}; expected one of "
            f"{', '.join(sorted(HF_COLUMN_PREFIXES))}"
        ) from None
    return f'{prefix}_{suffix}'


# Every sentiment column the pipeline reads, checked at load time so an
# upstream rename fails loudly instead of silently nulling every score.
SENTIMENT_COLUMNS = [
    sentiment_column(model_id, suffix)
    for model_id in HF_COLUMN_PREFIXES
    for suffix in SENTIMENT_FIELD_SUFFIXES
]


def extract_model_analysis(item: dict, model_id: str) -> dict:
    """Build a model's sentiment-analysis dict from a raw dataset row.

    Values are returned as-is, matching the behaviour previously duplicated in
    significant-differences-export.py and arbiter-evaluation.py.
    """
    return {
        suffix: item.get(sentiment_column(model_id, suffix))
        for suffix in SENTIMENT_FIELD_SUFFIXES
    }


def _build_model_fields(item: dict, model_id: str, suffixes: Sequence[str]) -> dict:
    """Extract a model's fields for ``suffixes``, applying the safe converters."""
    return {
        suffix: (
            safe_int_convert(item.get(sentiment_column(model_id, suffix)))
            if suffix == 'subjectivite_score'
            else safe_str(item.get(sentiment_column(model_id, suffix)))
        )
        for suffix in suffixes
    }


def build_model_sentiment(item: dict, model_id: str) -> dict:
    """Build a model's full ``sentiment_analysis`` block (scores + justifications).

    Applies the safe converters (string fields via :func:`safe_str`, the
    subjectivity score via :func:`safe_int_convert`) and preserves the key
    order expected by the webapp data files.
    """
    return _build_model_fields(item, model_id, SENTIMENT_FIELD_SUFFIXES)


def build_model_scores(item: dict, model_id: str) -> dict:
    """Build the score-only block written to ``iwac_sentiment_<model>.json``."""
    return _build_model_fields(item, model_id, SENTIMENT_SCORE_SUFFIXES)


def build_model_justifications(item: dict, model_id: str) -> dict:
    """Build the prose block written to ``iwac_justifications_<model>.json``."""
    return _build_model_fields(item, model_id, SENTIMENT_JUSTIFICATION_SUFFIXES)


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


def save_json(data: Any, filepath: str, indent: Optional[int] = 2) -> None:
    """Save data as JSON with UTF-8 encoding.

    Args:
        indent: 2 (the default) keeps the record-shaped payloads diffable.
            Pass None for coordinate-heavy files — pretty-printing the basemap
            geometry costs ~700 kB of pure whitespace.
    """
    separators = (',', ':') if indent is None else None
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=indent, separators=separators)


def safe_save_json(data: Any, filepath: str, max_retries: int = 3,
                   indent: Optional[int] = 2) -> None:
    """Save JSON, retrying transient I/O errors with exponential backoff.

    Raises the last error if every attempt fails, so callers still fail
    loudly on a genuinely unwritable destination.
    """
    for attempt in range(1, max_retries + 1):
        try:
            save_json(data, filepath, indent=indent)
            return
        except OSError as exc:
            if attempt == max_retries:
                _logger.error("Failed to write %s after %d attempts: %s", filepath, max_retries, exc)
                raise
            wait = 2 ** attempt
            _logger.warning("Write to %s failed (%s); retrying in %ds...", filepath, exc, wait)
            time.sleep(wait)
