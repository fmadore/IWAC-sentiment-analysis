"""
Refresh the published corpus in one staged, validated publication.

Regenerates every generation-dependent payload — scores, prose shards and
manifest per generation, the extremes per generation, and the places map —
into one stage, runs the repository's full validator on the result, and
promotes it under one writer lock. Nothing is published unless the whole set
validates, so the dashboard never sees a half-refreshed corpus.

    # v2 scores, prose, manifest and extremes, plus places; v1 untouched
    python data-preprocess/refresh-all.py

    # also v1 and the shared base: needed when an article was deleted upstream
    python data-preprocess/refresh-all.py --include-v1

    # admit articles ingested upstream since the base was written
    python data-preprocess/refresh-all.py --include-v1 --admit-new-articles

    # stage and validate only
    python data-preprocess/refresh-all.py --dry-run

The individual commands (data-fetch.py, extreme-analysis.py, places-export.py)
still work and publish their own files; this is the preferred path for any
refresh that changes the corpus. The basemap and the arbiters are not part of
a refresh: the basemap only changes with Natural Earth, and the arbiters cost
money and are run deliberately.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from iwac_preprocess.refresh import refresh_all
from shared import get_logger, get_staging_dir, get_webapp_data_dir
from validate_generated_data import validate_all

logger = get_logger(__name__)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--include-v1",
        action="store_true",
        help="Also regenerate the frozen v1 files and the shared base they own. Required "
        "to reconcile an upstream deletion or to admit new articles.",
    )
    parser.add_argument(
        "--admit-new-articles",
        action="store_true",
        help="With --include-v1: add articles ingested upstream since the base was written, "
        "with null scores for every model that has not annotated them.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Load, stage and validate everything, then discard the stage.",
    )
    args = parser.parse_args(argv)
    refresh_all(
        Path(get_webapp_data_dir()),
        Path(get_staging_dir()),
        validate=validate_all,
        include_v1=args.include_v1,
        admit_new_articles=args.admit_new_articles,
        publish=not args.dry_run,
        logger=logger,
    )


if __name__ == "__main__":
    main()
