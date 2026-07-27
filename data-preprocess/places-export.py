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
from collections import Counter

from tqdm import tqdm

from shared import (
    INDEX_TYPE_PLACE,
    get_logger,
    get_webapp_data_dir,
    load_iwac_index,
    load_iwac_records,
    parse_coordinates,
    safe_int_convert,
    safe_save_json,
    safe_str,
    split_pipe_field,
)

logger = get_logger(__name__)

# Coordinates are rounded before export: five decimals is ~1 m, far beyond what
# a city-level authority record means, and trimming the tail is a third of the
# file size.
COORD_PRECISION = 4


def build_place_lookup(index_df) -> tuple[dict[str, int], dict[int, dict]]:
    """Map every place label (and alias) to its authority id.

    Returns:
        (label -> place id, place id -> place record).
        Canonical ``Titre`` values win over ``Titre alternatif`` aliases, so a
        title that doubles as another record's alias still resolves to itself.
    """
    places = index_df[index_df["Type"] == INDEX_TYPE_PLACE]
    logger.info("Index rows of type %r: %d", INDEX_TYPE_PLACE, len(places))

    records: dict[int, dict] = {}
    by_title: dict[str, int] = {}
    aliases: dict[str, int] = {}
    skipped = 0

    for row in places.to_dict("records"):
        place_id = safe_int_convert(row.get("o:id"))
        title = safe_str(row.get("Titre"))
        coords = parse_coordinates(row.get("Coordonnées"))
        if place_id is None or not title or coords is None:
            skipped += 1
            continue

        lat, lng = coords
        records[place_id] = {
            "id": place_id,
            "title": title,
            "lat": round(lat, COORD_PRECISION),
            "lng": round(lng, COORD_PRECISION),
        }
        by_title[title] = place_id
        for alias in split_pipe_field(row.get("Titre alternatif")):
            aliases.setdefault(alias, place_id)

    logger.info("Places with usable coordinates: %d (skipped %d)", len(records), skipped)

    # Canonical titles take precedence over aliases.
    lookup = {**aliases, **by_title}
    return lookup, records


def main() -> None:
    """Join articles to geocoded places and write the webapp's map payload."""
    logger.info("Loading config: places")

    lookup, records = build_place_lookup(load_iwac_index())

    articles = load_iwac_records()
    logger.info("Resolving spatial tags for %d articles...", len(articles))

    edges: dict[str, list[int]] = {}
    mentions = Counter()
    unresolved = Counter()

    for item in tqdm(articles, desc="Mapping articles"):
        article_id = safe_int_convert(item.get("o:id"))
        if article_id is None:
            continue

        place_ids: list[int] = []
        for label in split_pipe_field(item.get("spatial")):
            place_id = lookup.get(label)
            if place_id is None:
                unresolved[label] += 1
                continue
            # An article can tag a title and its own alias; count each place once.
            if place_id not in place_ids:
                place_ids.append(place_id)
                mentions[place_id] += 1

        if place_ids:
            edges[str(article_id)] = place_ids

    # Only ship places something actually points at — the registry is otherwise
    # ~20 dead entries the client would filter out on every render.
    cited = {pid: rec for pid, rec in records.items() if mentions[pid] > 0}

    total_pairs = sum(mentions.values())
    logger.info("Mappable articles: %d / %d (%.1f%%)",
                len(edges), len(articles), 100 * len(edges) / max(len(articles), 1))
    logger.info("Cited places: %d   article-place pairs: %d", len(cited), total_pairs)
    logger.info("Unresolved spatial labels: %d distinct, %d mentions",
                len(unresolved), sum(unresolved.values()))
    for label, count in unresolved.most_common(10):
        logger.info("  unresolved: %-40s %d", label[:40], count)

    payload = {
        "places": sorted(cited.values(), key=lambda p: p["id"]),
        "articles": edges,
    }

    output_path = os.path.join(get_webapp_data_dir(), "iwac_places.json")
    logger.info("Saving place map data to: %s", output_path)
    safe_save_json(payload, output_path, indent=None)
    logger.info("Saved %d places and %d article edges", len(cited), len(edges))


if __name__ == "__main__":
    main()
