"""One staged, validated, single-publication corpus refresh.

A refresh used to be five separately locked commands (``data-fetch.py`` per
generation, ``extreme-analysis.py`` per generation, ``places-export.py``), and
every intermediate state failed validation: a v1 run rewrote the base and v1
only, leaving v2's coverage, v2's manifest checksum of the base and every
extremes denominator stale until the rest had run. ``refresh_all`` stages the
whole set in one directory under one writer lock, validates it with the same
``validate_all`` the repository runs, and promotes it in a single journalled
publication. A failure anywhere leaves the published set exactly as it was.

Every safeguard of the individual commands is kept, by calling the same code:

* **v1 stays frozen unless asked.** The default refreshes v2 only; v1 (and
  with it the shared base) is regenerated only with ``include_v1``.
* **The base pins the corpus.** Each generation is scoped with
  ``scope_to_published_corpus`` against the base in the stage: v2 fails on an
  article deleted upstream, the v1 run drops it, and new upstream articles
  stay out unless ``admit_new_articles`` (which requires ``include_v1``).
* **One revision.** All loads go through ``sources``; the default resolves one
  immutable Hugging Face commit per repository for the whole process
  (``source.resolve_source_revision`` is cached), and every manifest and
  provenance block records it.

Nothing here touches the network itself: ``sources`` supplies the rows, so the
orchestration is tested with fakes.
"""

from __future__ import annotations

import logging
import shutil
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from .contract import GENERATIONS, SentimentContract, get_contract
from .extremes import build_extremes_payloads
from .generation import (
    BASE_OWNER,
    build_generation_payloads,
    owns_base,
    scope_to_published_corpus,
    stage_generation,
)
from .places import build_place_edges, build_place_lookup, build_places_payload
from .publication import publish_generation, staged_publication
from .serialization import MANIFEST_FILENAMES, provenance_block, safe_save_json
from .source import BASE_FILENAME, HF_REPO_ID

PLACES_FILENAME = "iwac_places.json"


@dataclass(frozen=True)
class RefreshSources:
    """Where a refresh reads from; the default is the pinned Hugging Face dataset."""

    load_records: Callable[[SentimentContract], list[dict]]
    load_index: Callable[[], pd.DataFrame]
    source_revision: Callable[[], str | None]
    repository: str = HF_REPO_ID


def default_sources() -> RefreshSources:
    from .source import get_source_revision, load_iwac_index, load_iwac_records

    return RefreshSources(
        load_records=load_iwac_records,
        load_index=load_iwac_index,
        source_revision=lambda: get_source_revision(HF_REPO_ID),
    )


def plan_generations(*, include_v1: bool, admit_new_articles: bool) -> tuple[str, ...]:
    """The generations a refresh regenerates, the base owner first.

    The base owner is only included on request, and including it means every
    generation is regenerated: a rewritten base invalidates every other
    generation's coverage and manifest, so a partial set could never validate.
    """
    if admit_new_articles and not include_v1:
        raise SystemExit(
            "--admit-new-articles grows the shared base, which only the v1 run writes; "
            "pass --include-v1 as well (it regenerates the frozen v1 files)."
        )
    others = tuple(generation for generation in GENERATIONS if not owns_base(generation))
    return (BASE_OWNER, *others) if include_v1 else others


def copy_published_set(target: Path, stage: Path) -> None:
    """Seed the stage with every published file, so it validates as a whole.

    Hidden entries (the journal, a recovery backup) are publication machinery,
    not data, and are never copied.
    """
    if not target.is_dir():
        return
    for path in sorted(target.iterdir()):
        if path.is_file() and not path.name.startswith("."):
            shutil.copy2(path, stage / path.name)


def _manifests_last(names: Sequence[str]) -> list[str]:
    """Deduplicated, data files first and every manifest last."""
    unique = list(dict.fromkeys(names))
    manifests = set(MANIFEST_FILENAMES.values())
    return [n for n in unique if n not in manifests] + [n for n in unique if n in manifests]


def stage_refresh(
    stage: Path,
    generations: Sequence[str],
    *,
    admit_new_articles: bool,
    sources: RefreshSources,
    logger: logging.Logger,
) -> list[str]:
    """Write every regenerated file into ``stage``; return the names to publish.

    Generations run base owner first, so every later one is scoped to, and
    verified against, the base this same refresh staged.
    """
    names: list[str] = []
    scoped: dict[str, list[dict]] = {}
    for generation in generations:
        contract = get_contract(generation)
        records = sources.load_records(contract)
        logger.info("%s: %d upstream articles", generation, len(records))
        # Only the base owner admits; the others then follow the base it staged.
        records = scope_to_published_corpus(
            records,
            generation,
            admit_new_articles and owns_base(generation),
            stage / BASE_FILENAME,
            logger,
        )
        payloads = build_generation_payloads(records, contract)
        names += stage_generation(
            stage,
            payloads,
            source_repository=sources.repository,
            source_revision=sources.source_revision(),
            logger=logger,
        )
        scoped[generation] = records

    source = provenance_block(sources.repository, sources.source_revision())
    for generation, records in scoped.items():
        contract = get_contract(generation)
        for name, payload in build_extremes_payloads(records, contract, source).items():
            safe_save_json(payload, stage / name)
            names.append(name)
        logger.info("%s: staged extremes for %d models", generation, len(contract.model_names))

    # Places are generation-independent; every generation was scoped to the
    # same base, so any generation's rows give the same edges.
    records = next(reversed(scoped.values()))
    lookup, place_records = build_place_lookup(sources.load_index())
    edges = build_place_edges(records, lookup)
    safe_save_json(
        build_places_payload(place_records, edges, source), stage / PLACES_FILENAME, indent=None
    )
    names.append(PLACES_FILENAME)
    logger.info("Staged places: %d mappable articles", len(edges.edges))
    return _manifests_last(names)


def refresh_all(
    target: Path,
    staging_dir: Path,
    *,
    validate: Callable[[Path], None],
    include_v1: bool = False,
    admit_new_articles: bool = False,
    sources: RefreshSources | None = None,
    publish: bool = True,
    logger: logging.Logger | None = None,
) -> list[str]:
    """Stage, validate and publish a corpus refresh; return the staged names.

    ``validate`` receives the complete stage — the published set with every
    regenerated file overlaid — and raises to abort; pass
    ``validate_generated_data.validate_all``. With ``publish=False`` the stage
    is validated and discarded: a dry run that still loads the source.
    """
    logger = logger or logging.getLogger(__name__)
    generations = plan_generations(include_v1=include_v1, admit_new_articles=admit_new_articles)
    sources = sources or default_sources()
    with staged_publication(target, staging_dir) as stage:
        copy_published_set(target, stage)
        names = stage_refresh(
            stage,
            generations,
            admit_new_articles=admit_new_articles,
            sources=sources,
            logger=logger,
        )
        validate(stage)
        logger.info(
            "Stage validated: %d files regenerated (%s)", len(names), ", ".join(generations)
        )
        if publish:
            publish_generation(stage, target, names)
            logger.info("Published %d files to %s", len(names), target)
        else:
            logger.info("Dry run: nothing published")
    return names
