"""
Build the world basemap the sentiment map draws on.

WHY A BUNDLED GEOJSON RATHER THAN TILES: the webapp is a static PWA on GitHub
Pages with a service worker and, apart from Google Fonts, no third-party
runtime dependency at all. Pointing MapLibre at a hosted tile provider would
add one — plus an API key to manage, a privacy surface, and a map that stops
working offline. The corpus needs country outlines to orient 539 points, not
roads and labels, so ~100 kB of Natural Earth geometry does the whole job and
ships inside the existing cache.

Source: Natural Earth 1:110m Admin 0 – Countries (public domain), via the
nvkelso/natural-earth-vector mirror. Re-run only when that upstream changes.

Usage:
    python basemap-export.py
"""

import json
import os
import ssl
import urllib.request

from shared import get_logger, get_webapp_data_dir, safe_save_json

logger = get_logger(__name__)

SOURCE_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_110m_admin_0_countries.geojson"
)

# 1:110m geometry is already generalised to roughly 1 km; two decimals of
# longitude is ~1 km at the equator, so rounding there is lossless in practice
# and roughly halves the payload.
COORD_PRECISION = 2

# Everything else in Natural Earth's 100+ property columns is dead weight here.
KEEP_PROPERTIES = ("NAME", "ISO_A3")

OUTPUT_FILENAME = "world-110m.geojson"


def round_coords(node):
    """Recursively round every coordinate pair in a GeoJSON geometry."""
    if isinstance(node, (int, float)):
        return round(node, COORD_PRECISION)
    return [round_coords(child) for child in node]


def main() -> None:
    logger.info("Downloading Natural Earth 110m countries...")
    context = ssl.create_default_context()
    with urllib.request.urlopen(SOURCE_URL, context=context, timeout=120) as response:
        raw = response.read()
    logger.info("Downloaded %.1f KB", len(raw) / 1024)

    collection = json.loads(raw)
    features = []
    for feature in collection.get("features", []):
        properties = feature.get("properties") or {}
        features.append({
            "type": "Feature",
            "properties": {
                key.lower(): properties[key]
                for key in KEEP_PROPERTIES
                if properties.get(key) is not None
            },
            "geometry": {
                "type": feature["geometry"]["type"],
                "coordinates": round_coords(feature["geometry"]["coordinates"]),
            },
        })

    logger.info("Kept %d country features", len(features))

    output_path = os.path.join(get_webapp_data_dir(), OUTPUT_FILENAME)
    safe_save_json({"type": "FeatureCollection", "features": features}, output_path, indent=None)

    size = os.path.getsize(output_path)
    logger.info("Saved basemap to %s (%.1f KB)", output_path, size / 1024)


if __name__ == "__main__":
    main()
