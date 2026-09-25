"""Pure construction of the map payload: a place registry plus an edge list.

``places-export.py`` is the CLI around these functions; everything here is
importable and tested without the network.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Iterable
from dataclasses import dataclass, field

import pandas as pd

from .source import (
    INDEX_TYPE_PLACE,
    get_logger,
    parse_coordinates,
    safe_int_convert,
    safe_str,
    split_pipe_field,
)

_logger = get_logger(__name__)

# Coordinates are rounded before export: five decimals is ~1 m, far beyond what
# a city-level authority record means, and trimming the tail is a third of the
# file size.
COORD_PRECISION = 4


def build_place_lookup(index_df: pd.DataFrame) -> tuple[dict[str, int], dict[int, dict]]:
    """Map every place label (and alias) to its authority id.

    Returns:
        (label -> place id, place id -> place record).
        Canonical ``Titre`` values win over ``Titre alternatif`` aliases, so a
        title that doubles as another record's alias still resolves to itself.
    """
    places = index_df[index_df["Type"] == INDEX_TYPE_PLACE]
    _logger.info("Index rows of type %r: %d", INDEX_TYPE_PLACE, len(places))

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

    _logger.info("Places with usable coordinates: %d (skipped %d)", len(records), skipped)

    # Canonical titles take precedence over aliases.
    lookup = {**aliases, **by_title}
    return lookup, records


@dataclass
class PlaceEdges:
    """Article -> place edges, plus the tallies the CLI reports."""

    edges: dict[str, list[int]] = field(default_factory=dict)
    mentions: Counter = field(default_factory=Counter)
    unresolved: Counter = field(default_factory=Counter)


def build_place_edges(records: Iterable[dict], lookup: dict[str, int]) -> PlaceEdges:
    """Resolve each article's ``spatial`` tags to place ids.

    An article can tag a title and its own alias; each place is counted once
    per article. Articles with no resolvable place carry no edge at all.
    """
    result = PlaceEdges()
    for item in records:
        article_id = safe_int_convert(item.get("o:id"))
        if article_id is None:
            continue

        place_ids: list[int] = []
        for label in split_pipe_field(item.get("spatial")):
            place_id = lookup.get(label)
            if place_id is None:
                result.unresolved[label] += 1
                continue
            if place_id not in place_ids:
                place_ids.append(place_id)
                result.mentions[place_id] += 1

        if place_ids:
            result.edges[str(article_id)] = place_ids
    return result


def build_places_payload(place_records: dict[int, dict], edges: PlaceEdges) -> dict:
    """The published ``iwac_places.json`` shape.

    Only places something actually points at are shipped — the registry is
    otherwise ~20 dead entries the client would filter out on every render.
    """
    cited = [record for pid, record in place_records.items() if edges.mentions[pid] > 0]
    return {
        "places": sorted(cited, key=lambda place: place["id"]),
        "articles": edges.edges,
    }
