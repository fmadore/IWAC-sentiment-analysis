"""Versioned sentiment contracts shared with the Svelte application.

Two generations coexist. ``v1`` is the published three-model analysis whose data
files are frozen; ``v2`` adds the newer model panel. Both are loaded here, but
every legacy module-level name in this module still resolves to **v1** so that
``shared.py``'s star import and the v1 scripts keep their exact behaviour.

New code should take a :class:`SentimentContract` instance instead of reading
the module-level constants.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import pandas as pd

CONTRACT_DIR = (
    Path(__file__).resolve().parents[2] / "ma-visualisation-sentiments" / "src" / "lib" / "data"
)
CONTRACT_PATHS = {
    "v1": CONTRACT_DIR / "sentiment-v1.json",
    "v2": CONTRACT_DIR / "sentiment-v2.json",
}
GENERATIONS = tuple(CONTRACT_PATHS)
# The published v1 files are frozen, so v1 stays the implicit default for every
# helper that predates the second generation.
DEFAULT_GENERATION = "v1"

# Retained for backwards compatibility: the v1 contract path used to be the only
# one this module knew about.
CONTRACT_PATH = CONTRACT_PATHS["v1"]

# The only recusal rule: a judge never reads a model from its own developer.
SAME_DEVELOPER = "same-developer"


class SentimentContract:
    """One generation of the research contract, loaded from its JSON file."""

    def __init__(self, contract: dict[str, Any], generation: str) -> None:
        self.generation = generation
        self.contract = contract
        self.schema_version = str(contract["schemaVersion"])
        self.analysis_version = str(contract["analysisVersion"])

        self.model_names = {
            model_id: model["displayName"] for model_id, model in contract["models"].items()
        }
        self.analysis_models = {
            model_id: model["analysisModel"] for model_id, model in contract["models"].items()
        }
        self.hf_column_prefix_candidates = {
            model_id: tuple(model["hfPrefixes"]) for model_id, model in contract["models"].items()
        }
        # The first prefix is canonical for newly generated data. Remaining
        # values are read-only aliases for legacy snapshots.
        self.hf_column_prefixes = {
            model_id: prefixes[0] for model_id, prefixes in self.hf_column_prefix_candidates.items()
        }

        self.pair_models = _parse_pairs(contract["pairs"], set(self.model_names))
        self.model_pairs = list(self.pair_models)

        self.score_suffixes = tuple(contract["fields"]["scores"])
        self.justification_suffixes = tuple(contract["fields"]["justifications"])
        self.field_suffixes = self.score_suffixes + self.justification_suffixes

        self.polarity_scores = dict(contract["scales"]["polarity"]["scores"])
        self.centrality_scores = dict(contract["scales"]["centrality"]["scores"])
        self.polarity_non_comparable = frozenset(contract["scales"]["polarity"]["nonComparable"])
        self.centrality_non_comparable = frozenset(
            contract["scales"]["centrality"]["nonComparable"]
        )

        subjectivity = contract["scales"]["subjectivity"]
        self.subjectivity_minimum = int(subjectivity["minimum"])
        self.subjectivity_maximum = int(subjectivity["maximum"])
        self.subjectivity_encoding = str(subjectivity.get("encoding", "score"))
        # Only the label encoding carries a lookup table; v1 stores the rank.
        self.subjectivity_label_scores = dict(subjectivity.get("scores", {}))

        discrepancy = contract["discrepancy"]
        self.significant_conflict_threshold = int(discrepancy["significantDimensionGap"])
        self.total_discrepancy_maximum = int(discrepancy["maximumTotal"])
        three_way = discrepancy.get("threeWaySpread")
        self.significant_spread_threshold = (
            int(three_way["significantSpread"]) if three_way else None
        )

        self.arbiter = dict(contract["arbiter"])
        # Who built each model, and the registry of developer ids a judge may
        # name. The registry is what makes a typo fail: a judge whose developer
        # matched no member would otherwise recuse nobody and read its own model.
        self.developers = {
            developer_id: entry["displayName"]
            for developer_id, entry in (contract.get("developers") or {}).items()
        }
        self.model_developers = {
            model_id: model.get("developer") for model_id, model in contract["models"].items()
        }
        self.recusal_rule = (contract["arbiter"].get("recusal") or {}).get("rule")
        if self.recusal_rule not in (None, SAME_DEVELOPER):
            raise ValueError(
                f"Unknown {self.analysis_version} recusal rule {self.recusal_rule!r}; "
                f"expected {SAME_DEVELOPER!r}"
            )
        if self.recusal_rule:
            undeclared = [
                model_id
                for model_id, developer in self.model_developers.items()
                if developer not in self.developers
            ]
            if undeclared:
                raise ValueError(
                    f"The {self.analysis_version} recusal rule needs a registered developer on "
                    "every model; missing or unknown for: " + ", ".join(undeclared)
                )
        # The published judge's developer, and so the models it reads. A recused
        # model (one from the judge's own developer) stays a full member of the
        # panel everywhere else — pairs, agreement, discrepancy views — but never
        # reaches the judge: selection, prompt, blind labels and fingerprints are
        # all computed without it.
        self.arbiter_developer = contract["arbiter"].get("developer")
        self.arbiter_recused_ids = self.recused_for(self.arbiter_developer)
        self.arbiter_model_ids = self.panel_for(self.arbiter_developer)
        # What is worth *paying* to arbitrate, which is not what the dashboard
        # calls a significant disagreement. Keeping the two apart is the whole
        # point of the separate key: widening the arbiter's frame must not move
        # the discrepancy views a reader sees. `None` on a contract that
        # declares no rule, which is v1.
        eligibility = contract["arbiter"].get("eligibility") or {}
        self.arbiter_eligibility_rule = eligibility.get("rule")
        valence_flip = eligibility.get("valenceFlip")
        self.polarity_valence_bands = (
            (int(valence_flip["positiveMinimum"]), int(valence_flip["negativeMaximum"]))
            if valence_flip
            else None
        )

        self.justification_shards = int(contract["delivery"]["justificationShards"])

        self.sentiment_columns = [
            self.sentiment_column(model_id, suffix)
            for model_id in self.hf_column_prefixes
            for suffix in self.field_suffixes
        ]

    @classmethod
    def load(cls, generation: str) -> SentimentContract:
        try:
            path = CONTRACT_PATHS[generation]
        except KeyError:
            raise ValueError(
                f"Unknown contract generation {generation!r}; expected one of "
                f"{', '.join(GENERATIONS)}"
            ) from None
        with path.open(encoding="utf-8") as handle:
            contract = json.load(handle)
        declared = contract.get("analysisVersion")
        if declared != generation:
            raise ValueError(f"Expected the {generation} sentiment contract, got {declared!r}")
        return cls(contract, generation)

    def recused_for(self, developer: str | None) -> tuple[str, ...]:
        """The panel members a judge from ``developer`` must never read.

        Derived, never listed: the contract records who built each model and the
        rule, so a second judge from another developer recuses its own member
        without a contract edit. A contract with no rule (v1) recuses nobody.
        """
        if self.recusal_rule is None:
            return ()
        if developer not in self.developers:
            raise ValueError(
                f"Unknown judge developer {developer!r} for the {self.analysis_version} "
                f"recusal rule; expected one of {', '.join(sorted(self.developers))}"
            )
        return tuple(
            model_id
            for model_id, model_developer in self.model_developers.items()
            if model_developer == developer
        )

    def panel_for(self, developer: str | None) -> list[str]:
        """The models a judge from ``developer`` reads, in contract order."""
        recused = self.recused_for(developer)
        panel = [model_id for model_id in self.model_names if model_id not in recused]
        if len(panel) < 2:
            raise ValueError(
                f"The {self.analysis_version} arbiter needs at least two unrecused models"
            )
        return panel

    def sentiment_column(self, model_id: str, suffix: str) -> str:
        """Return the canonical HF column name for a stable model id."""
        try:
            prefix = self.hf_column_prefixes[model_id]
        except KeyError:
            raise KeyError(
                f"Unknown model id {model_id!r}; expected one of "
                f"{', '.join(sorted(self.hf_column_prefixes))}"
            ) from None
        return f"{prefix}_{suffix}"

    def coerce_subjectivity(self, value: Any) -> int | None:
        """Map a stored subjectivity value onto the shared 1-5 ordinal rank.

        v1 stores the rank itself. v2 stores an ordinal label and leaves the
        field empty where the model declined to score, which is a legitimate
        null. An unrecognised non-empty label is a contract violation and
        raises: silently returning ``None`` would ship a complete set of
        well-formed files full of nulls without erroring anywhere.
        """
        if value is None:
            return None
        if isinstance(value, float) and math.isnan(value):
            return None
        try:
            if pd.isna(value):
                return None
        except (ValueError, TypeError):
            pass

        if not self.subjectivity_label_scores:
            try:
                return int(float(value))
            except (ValueError, TypeError):
                return None

        label = str(value).strip()
        if not label:
            return None
        try:
            return int(self.subjectivity_label_scores[label])
        except KeyError:
            raise ValueError(
                f"Unknown {self.analysis_version} subjectivity label {label!r}; expected one of "
                f"{', '.join(sorted(self.subjectivity_label_scores))}"
            ) from None

    def normalize_sentiment_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize an exact-model or legacy HF snapshot to canonical columns.

        A model prefix is accepted only when *all* six sentiment fields are
        present. Mixing prefixes within one model would silently join analyses
        from different source generations, so it is rejected.
        """
        normalized = df.copy()
        missing_models: list[str] = []

        for model_id, candidates in self.hf_column_prefix_candidates.items():
            resolved_prefix = next(
                (
                    prefix
                    for prefix in candidates
                    if all(
                        f"{prefix}_{suffix}" in normalized.columns for suffix in self.field_suffixes
                    )
                ),
                None,
            )
            if resolved_prefix is None:
                missing_models.append(model_id)
                continue

            canonical_prefix = self.hf_column_prefixes[model_id]
            if resolved_prefix != canonical_prefix:
                for suffix in self.field_suffixes:
                    normalized[f"{canonical_prefix}_{suffix}"] = normalized[
                        f"{resolved_prefix}_{suffix}"
                    ]

        if missing_models:
            raise ValueError(
                f"Dataset has no complete {self.analysis_version} sentiment field set for "
                "model(s): " + ", ".join(missing_models)
            )
        return normalized


def _parse_pairs(pairs: Any, model_ids: set[str]) -> dict[str, tuple[str, str]]:
    """Build the pair id -> member ids map, accepting both contract shapes.

    v1 lists pair ids as plain strings; v2 lists ``{"id", "models"}`` objects
    because a model id may itself contain a hyphen (``mistral-small``), which
    makes splitting a pair id on ``-`` ambiguous. Never split a pair id.
    """
    parsed: dict[str, tuple[str, str]] = {}
    for entry in pairs:
        if isinstance(entry, str):
            first, _, second = entry.partition("-")
            pair_id, members = entry, (first, second)
        else:
            pair_id = str(entry["id"])
            members = tuple(entry["models"])  # type: ignore[assignment]

        if len(members) != 2:
            raise ValueError(f"Pair {pair_id!r} must name exactly two models, got {members!r}")
        unknown = [model_id for model_id in members if model_id not in model_ids]
        if unknown:
            raise ValueError(f"Pair {pair_id!r} names unknown model(s): {', '.join(unknown)}")
        if "-".join(members) != pair_id:
            raise ValueError(
                f"Pair id {pair_id!r} does not match its members {members!r}; the id must be "
                "the member ids joined with '-'"
            )
        parsed[pair_id] = members  # type: ignore[assignment]
    return parsed


CONTRACTS = {generation: SentimentContract.load(generation) for generation in GENERATIONS}
CONTRACT_V1 = CONTRACTS["v1"]
CONTRACT_V2 = CONTRACTS["v2"]


def get_contract(generation: str = DEFAULT_GENERATION) -> SentimentContract:
    """Return the loaded contract for one generation."""
    try:
        return CONTRACTS[generation]
    except KeyError:
        raise ValueError(
            f"Unknown contract generation {generation!r}; expected one of {', '.join(GENERATIONS)}"
        ) from None


# --- v1 module-level surface -------------------------------------------------
# Every name below is the v1 contract's value. `shared.py` star-imports these
# and the v1 scripts read them directly, so they must keep resolving to v1.

CONTRACT = CONTRACT_V1.contract
CONTRACT_SCHEMA_VERSION = CONTRACT_V1.schema_version
ANALYSIS_VERSION = CONTRACT_V1.analysis_version

MODEL_NAMES = CONTRACT_V1.model_names
HF_COLUMN_PREFIX_CANDIDATES = CONTRACT_V1.hf_column_prefix_candidates
HF_COLUMN_PREFIXES = CONTRACT_V1.hf_column_prefixes
MODEL_PAIRS = CONTRACT_V1.model_pairs

SENTIMENT_SCORE_SUFFIXES = CONTRACT_V1.score_suffixes
SENTIMENT_JUSTIFICATION_SUFFIXES = CONTRACT_V1.justification_suffixes
SENTIMENT_FIELD_SUFFIXES = CONTRACT_V1.field_suffixes

POLARITY_SCORES = CONTRACT_V1.polarity_scores
CENTRALITY_SCORES = CONTRACT_V1.centrality_scores
POLARITY_NON_COMPARABLE = CONTRACT_V1.polarity_non_comparable
CENTRALITY_NON_COMPARABLE = CONTRACT_V1.centrality_non_comparable
SIGNIFICANT_CONFLICT_THRESHOLD = CONTRACT_V1.significant_conflict_threshold
TOTAL_DISCREPANCY_MAXIMUM = CONTRACT_V1.total_discrepancy_maximum

SENTIMENT_COLUMNS = CONTRACT_V1.sentiment_columns


def sentiment_column(model_id: str, suffix: str) -> str:
    """Return the canonical HF column name for a stable v1 model id."""
    return CONTRACT_V1.sentiment_column(model_id, suffix)


def normalize_sentiment_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize an exact-model or legacy v1 HF snapshot to canonical columns."""
    return CONTRACT_V1.normalize_sentiment_columns(df)
