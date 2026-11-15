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
    python basemap-export.py                    # upstream `master`, unpinned
    python basemap-export.py --ref <commit-sha> # reproducible

The default ref is the mirror's moving `master` branch, so two runs can
download different geometry. Pass `--ref` with a full commit SHA of
nvkelso/natural-earth-vector to make a run reproducible, and record that SHA in
the commit that updates world-110m.geojson.
"""

import argparse
import json
import os
import re
import ssl
import urllib.request
from pathlib import Path

from iwac_preprocess.publication import publish_json_files
from shared import get_logger, get_staging_dir, get_webapp_data_dir

logger = get_logger(__name__)

# Unpinned by default: no commit SHA could be verified offline when the
# parameter was added. Prefer `--ref <sha>` for any run whose output is kept.
DEFAULT_REF = "master"
SOURCE_URL_TEMPLATE = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "{ref}/geojson/ne_110m_admin_0_countries.geojson"
)
REF_PATTERN = re.compile(r"^[A-Za-z0-9._/-]+$")


def source_url(ref: str = DEFAULT_REF) -> str:
    """The raw GeoJSON URL at ref (a branch, tag or commit SHA)."""
    if not REF_PATTERN.fullmatch(ref) or ".." in ref:
        raise ValueError(f"Not a git ref: {ref!r}")
    return SOURCE_URL_TEMPLATE.format(ref=ref)


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


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--ref",
        default=DEFAULT_REF,
        help="Branch, tag or (preferably) commit SHA of nvkelso/natural-earth-vector to "
        f"download from (default: {DEFAULT_REF}, which moves).",
    )
    args = parser.parse_args(argv)
    url = source_url(args.ref)
    if args.ref == DEFAULT_REF:
        logger.warning("Downloading from the moving %r branch; pass --ref <sha> to pin", args.ref)
    logger.info("Downloading Natural Earth 110m countries from %s", url)
    context = ssl.create_default_context()
    with urllib.request.urlopen(url, context=context, timeout=120) as response:
        raw = response.read()
    logger.info("Downloaded %.1f KB", len(raw) / 1024)

    collection = json.loads(raw)
    features = []
    for feature in collection.get("features", []):
        properties = feature.get("properties") or {}
        features.append(
            {
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
            }
        )

    logger.info("Kept %d country features", len(features))

    output_dir = get_webapp_data_dir()
    output_path = os.path.join(output_dir, OUTPUT_FILENAME)
    publish_json_files(
        Path(output_dir),
        Path(get_staging_dir()),
        {OUTPUT_FILENAME: {"type": "FeatureCollection", "features": features}},
        indent=None,
    )

    size = os.path.getsize(output_path)
    logger.info("Saved basemap to %s (%.1f KB)", output_path, size / 1024)


if __name__ == "__main__":
    main()
