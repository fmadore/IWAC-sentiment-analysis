"""
Export the geography behind the sentiment map.

Writes a single ``iwac_places.json`` carrying two things:

  * ``places``   — the place registry: every ``index`` authority record of type
                   ``Lieux`` that has usable coordinates AND is actually cited
                   by at least one article.
  * ``articles`` — article id -> list of place ids, the edge list the webapp
                   aggregates over.

WHY AN EDGE LIST AND NOT PRE-AGGREGATED MEANS: the map has to answer to the
same country/newspaper/date filters as every other view. Shipping per-place
sentiment averages would freeze one particular filter state; shipping the
edges lets the client recompute them for whatever the user has selected. The
whole file is ~1/50th of one model's sentiment payload, so the flexibility is
free.

WHAT A POINT MEANS: ``dcterms:spatial`` is item-level tagging — a place the
article mentions, not the place the article is "about". Articles average
~3.8 places each, so one article feeds several points and the counts sum to
far more than the corpus size. The webapp must label these as *articles
mentioning X*; anything stronger is a claim the data does not support.
"""

import os
from pathlib import Path

from iwac_preprocess.places import build_place_edges, build_place_lookup, build_places_payload
from iwac_preprocess.publication import publish_json_files
from shared import (
    get_base_article_ids,
    get_logger,
    get_staging_dir,
    get_webapp_data_dir,
    load_iwac_index,
    load_iwac_records,
    restrict_to_base_articles,
)
from validate_generated_data import validate_places

logger = get_logger(__name__)
OUTPUT_FILENAME = "iwac_places.json"


def main() -> None:
    """Join articles to geocoded places and write the webapp's map payload."""
    logger.info("Loading config: places")

    lookup, place_records = build_place_lookup(load_iwac_index())

    output_dir = get_webapp_data_dir()
    base_ids = get_base_article_ids(output_dir)
    # Scope to the articles the panel processed. The live corpus keeps growing,
    # and `validate_places` rejects an edge for any article outside the base, so
    # an unscoped run would write a file the repo's own tests refuse.
    articles = restrict_to_base_articles(load_iwac_records(), base_ids, logger)
    logger.info("Resolving spatial tags for %d articles...", len(articles))

    edges = build_place_edges(articles, lookup)
    payload = build_places_payload(place_records, edges)

    logger.info(
        "Mappable articles: %d / %d (%.1f%%)",
        len(edges.edges),
        len(articles),
        100 * len(edges.edges) / max(len(articles), 1),
    )
    logger.info(
        "Cited places: %d   article-place pairs: %d",
        len(payload["places"]),
        sum(edges.mentions.values()),
    )
    logger.info(
        "Unresolved spatial labels: %d distinct, %d mentions",
        len(edges.unresolved),
        sum(edges.unresolved.values()),
    )
    for label, count in edges.unresolved.most_common(10):
        logger.info("  unresolved: %-40s %d", label[:40], count)

    logger.info("Saving place map data to: %s", os.path.join(output_dir, OUTPUT_FILENAME))
    publish_json_files(
        Path(output_dir),
        Path(get_staging_dir()),
        {OUTPUT_FILENAME: payload},
        indent=None,
        validate=lambda stage: validate_places(base_ids, data_dir=stage),
    )
    logger.info("Saved %d places and %d article edges", len(payload["places"]), len(edges.edges))


if __name__ == "__main__":
    main()
