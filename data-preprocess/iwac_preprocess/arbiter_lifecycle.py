"""Durable panel-arbiter cache, separate from its selected public projection.

The private cache retains every paid evaluation and its run provenance, keyed
by the existing input fingerprint. A narrower publication never deletes one.
Callers hold the dedicated arbiter run lock while loading and checkpointing;
the public export has its own shorter publication lock.
"""

from __future__ import annotations

import json
import random
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

from .arbiter_cache import CacheReconciliation
from .arbiter_prompt import BLIND_LABELS
from .serialization import safe_save_json

CACHE_FILENAME = "evaluations.json"
STORAGE_SCHEMA_VERSION = 1


class CacheUnreadableError(RuntimeError):
    """A paid cache cannot safely be interpreted or resumed."""


def resolve_blind_permutation(
    metadata: dict | None,
    model_ids: list[str],
    rng: random.Random | None = None,
    *,
    populated: bool = False,
) -> dict[str, str]:
    """Reuse a valid assignment; only an empty cache may draw a new one."""
    if len(model_ids) != len(BLIND_LABELS):
        raise ValueError(
            f"The blind permutation is a bijection: {len(BLIND_LABELS)} labels for "
            f"{len(model_ids)} models. Update the prompt and browser labels together."
        )
    stored = (metadata or {}).get("blind_permutation")
    if (
        isinstance(stored, dict)
        and set(stored) == set(BLIND_LABELS)
        and sorted(str(value) for value in stored.values()) == sorted(model_ids)
    ):
        return {label: str(stored[label]) for label in BLIND_LABELS}
    if populated:
        raise CacheUnreadableError(
            "A populated arbiter cache has a missing or invalid blind_permutation. "
            "Restore its original mapping; drawing another would reassign paid verdicts."
        )
    shuffled = list(model_ids)
    (rng or random).shuffle(shuffled)
    return dict(zip(BLIND_LABELS, shuffled, strict=True))


def load_cached_evaluations(path: str | Path) -> tuple[list[dict], dict]:
    """Read an existing cache strictly; absence alone denotes a first run."""
    path = Path(path)
    if not path.exists():
        return [], {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        evaluations = payload["evaluations"]
        metadata = payload["metadata"]
        if not isinstance(evaluations, list) or not isinstance(metadata, dict):
            raise ValueError("expected evaluations array and metadata object")
        for row in evaluations:
            if (
                not isinstance(row, dict)
                or not isinstance(row.get("article_id"), str)
                or not isinstance(row.get("cache_fingerprint"), str)
                or not row["cache_fingerprint"]
            ):
                raise ValueError("evaluation lacks an article id or input fingerprint")
        return evaluations, metadata
    except (OSError, AttributeError, KeyError, TypeError, ValueError) as error:
        raise CacheUnreadableError(
            f"{path} exists but is not a readable arbiter file ({error}). "
            "Restore the paid cache instead of starting over."
        ) from error


def _provenance(metadata: dict) -> dict:
    return {
        key: metadata.get(key)
        for key in (
            "generated",
            "source",
            "arbiter_model",
            "effort",
            "prompt_version",
            "contract_schema_version",
            "analysis_version",
            "cache_schema_version",
            "blind_permutation",
        )
    }


@dataclass
class PanelCache:
    path: Path
    metadata: dict
    evaluations: dict[str, dict] = field(default_factory=dict)
    provenance: dict[str, dict] = field(default_factory=dict)

    @classmethod
    def load(
        cls, path: Path, published_path: Path, model_ids: list[str], effort: str
    ) -> PanelCache:
        """Bootstrap from the publication, then resume the persistent cache.

        Both existing inputs must be interpretable. A populated cache binds the
        whole local run history to one effort and blind assignment; changing
        either requires a deliberately separate experiment, never relabeling.
        """
        published, public_metadata = load_cached_evaluations(published_path)
        durable, durable_metadata = load_cached_evaluations(path)
        for rows, metadata in ((published, public_metadata), (durable, durable_metadata)):
            if rows:
                resolve_blind_permutation(metadata, model_ids, populated=True)
                if metadata.get("effort") != effort:
                    raise CacheUnreadableError(
                        f"The populated arbiter cache was evaluated at effort="
                        f"{metadata.get('effort')!r}, not {effort!r}. Resume at its recorded "
                        "effort; a different effort needs a separate experiment."
                    )
        if (
            published
            and durable
            and public_metadata["blind_permutation"] != durable_metadata["blind_permutation"]
        ):
            raise CacheUnreadableError("Published and durable cache blind assignments disagree.")

        metadata = dict(durable_metadata or public_metadata)
        if published and not durable:
            metadata = dict(public_metadata)
        # A public checkpoint imported on another checkout can carry a newer
        # cost record. Never replace recorded spend with an older/empty total.
        if (public_metadata.get("usage") or {}).get("calls", 0) > (metadata.get("usage") or {}).get(
            "calls", 0
        ):
            metadata["usage"] = public_metadata["usage"]
        cache = cls(path, metadata)
        if path.exists():
            payload = json.loads(path.read_text(encoding="utf-8"))
            if payload.get("storage_schema_version") != STORAGE_SCHEMA_VERSION or not isinstance(
                payload.get("provenance"), dict
            ):
                raise CacheUnreadableError(f"{path} has an unsupported durable cache format.")
            cache.provenance = payload["provenance"]
        cache.remember(published, public_metadata)
        cache.remember(durable, durable_metadata)
        return cache

    def remember(self, evaluations: list[dict], metadata: dict) -> None:
        for evaluation in evaluations:
            fingerprint = evaluation["cache_fingerprint"]
            self.evaluations.setdefault(fingerprint, evaluation)
            self.provenance.setdefault(fingerprint, _provenance(metadata))

    def select(
        self, articles: list[dict], fingerprint: Callable[[dict], str]
    ) -> CacheReconciliation:
        selected = []
        for article in articles:
            evaluation = self.evaluations.get(fingerprint(article))
            if evaluation is not None:
                selected.append(evaluation)
        return CacheReconciliation(
            evaluations=selected,
            evaluated_ids={row["article_id"] for row in selected},
            pruned=0,
            invalidated=0,
            adopted_legacy=0,
        )

    def checkpoint(self, evaluations: list[dict], metadata: dict) -> None:
        """Save paid work first, before a public export can fail or be narrowed."""
        self.remember(evaluations, metadata)
        self.metadata = {**metadata, "successful_evaluations": len(self.evaluations)}
        safe_save_json(
            {
                "storage_schema_version": STORAGE_SCHEMA_VERSION,
                "metadata": self.metadata,
                "evaluations": list(self.evaluations.values()),
                "provenance": self.provenance,
            },
            self.path,
        )
