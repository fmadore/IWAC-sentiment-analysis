#!/usr/bin/env python3
"""
Render the project's social preview card (1280x640) from the shipped data.

The card doubles as GitHub's repository social preview (Settings > General >
Social preview, which has no REST API - upload it by hand) and as the site's
Open Graph / Twitter image, so it is written into the SvelteKit `static/`
directory and served from there.

Everything on the card is derived, not hardcoded: the model list comes from the
generation's shared contract, the article counts and polarity stacks are read
out of `static/data/`, and the palette comes from the same OKLCH values as
`app.css` via `oklch-to-hex.py`. Re-run after a data refresh so the card never
claims figures the dashboard no longer shows.

`--generation` defaults to the showcased generation, unlike the pipeline
scripts, where an unflagged run would rewrite frozen data. Nothing here is at
risk: the card is a presentation asset rendered from data it only reads. Pass
`--generation v1` to re-render the archived panel's card.

Rendered at 2x and downsampled, because Pillow does not antialias shape edges.

Usage (needs Pillow, which is not a pipeline dependency):
    python scripts/social-preview.py
"""

from __future__ import annotations

import argparse
import importlib.util
import json
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "ma-visualisation-sentiments" / "static" / "data"
CONTRACT_DIR = ROOT / "ma-visualisation-sentiments" / "src" / "lib" / "data"
OUTPUT = ROOT / "ma-visualisation-sentiments" / "static" / "social-preview.png"

# The generation the dashboard shows by default, and therefore the one the
# social card should advertise.
SHOWCASED_GENERATION = "v2"

WIDTH, HEIGHT = 1280, 640
SCALE = 2  # render at 2x, downsample with LANCZOS


# --- palette ---------------------------------------------------------------
# Reuse the repo's own OKLCH -> sRGB pipeline. The module name is hyphenated,
# so it cannot be imported by name.
def _load_oklch_module():
    path = ROOT / "scripts" / "oklch-to-hex.py"
    spec = importlib.util.spec_from_file_location("oklch_to_hex", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_oklch = _load_oklch_module()


def ok(L: float, C: float, h: float) -> tuple[int, int, int]:
    return _oklch.oklch_to_srgb_bytes(L, C, h)


def ok_ramp(anchors: list[tuple[float, float, float]], t: float):
    """Sample a multi-stop ramp, blending in OKLab.

    Blending the sRGB bytes instead would drag the salmon -> steel-blue leg of
    the polarity scale through a muddy mauve; app.css mixes in oklab for the
    same reason.
    """
    pos = max(0.0, min(1.0, t)) * (len(anchors) - 1)
    low = min(int(pos), len(anchors) - 2)
    f = pos - low
    start = _oklch.oklch_to_oklab(*anchors[low])
    end = _oklch.oklch_to_oklab(*anchors[low + 1])
    L, a, b = (p + (q - p) * f for p, q in zip(start, end))
    channels = _oklch.oklab_to_linear_srgb(L, a, b)
    return tuple(max(0, min(255, round(_oklch.linear_to_srgb_channel(c) * 255))) for c in channels)


BG_TOP = ok(0.205, 0.012, 260)  # --surface-card
BG_BOTTOM = ok(0.145, 0.012, 260)  # a touch below --app-bg
TEXT_PRIMARY = ok(0.97, 0.005, 260)
TEXT_MUTED = ok(0.74, 0.005, 260)
TEXT_SUBTLE = ok(0.62, 0.005, 260)
ACCENT = ok(0.78, 0.13, 80)  # --chrome-accent (amber)
RULE = ok(0.32, 0.012, 260)

# Polarity scale, in ordinal order. Keys are the French values stored in the
# data; the card labels them in English for a mostly anglophone audience.
POLARITY = [
    ("Très négatif", "Very negative", (0.62, 0.20, 25)),
    ("Négatif", "Negative", (0.70, 0.14, 25)),
    ("Neutre", "Neutral", (0.66, 0.045, 250)),
    ("Positif", "Positive", (0.70, 0.13, 150)),
    ("Très positif", "Very positive", (0.62, 0.18, 150)),
    ("Non applicable", "Not applicable", (0.55, 0.01, 260)),
]

# Card labels are trimmed from the contract's `analysisModel`, dropping release
# dates and qualifiers that no reader needs at 17px — 172px of gutter is all a
# stacked bar leaves. Anything not listed is used verbatim, so a new model
# renders correctly before anyone thinks about width.
CARD_LABELS = {
    "Gemini 3 Flash preview": "Gemini 3 Flash",
    "Mistral Small 4 2603": "Mistral Small 4",
    "DeepSeek v4 Flash 0731": "DeepSeek v4 Flash",
}


def load_models(generation: str) -> list[tuple[str, str]]:
    """(id, card label) for one generation, in contract order.

    Read from the contract rather than hardcoded: this list went stale once
    already, when generation 2 shipped and the card kept advertising the
    archived models to every link preview.

    Keyed on `analysisModel`, not `displayName`. The card names the model that
    actually produced the annotations, and in v1 `displayName` is the vendor
    slot ("ChatGPT") while only `analysisModel` carries the model ("GPT-5 mini").
    """
    contract = json.loads((CONTRACT_DIR / f"sentiment-{generation}.json").read_text("utf-8"))
    return [
        (model_id, CARD_LABELS.get(spec["analysisModel"], spec["analysisModel"]))
        for model_id, spec in contract["models"].items()
    ]


# The three annotated dimensions, each with its scale's five steps - the same
# ramps the dashboard uses, so the card previews the legend a visitor will meet.
DIMENSIONS = [
    ("Polarity", "negative → positive", [c for _, _, c in POLARITY[:5]]),
    (
        "Subjectivity",
        "factual → subjective",
        [
            (0.72, 0.06, 220),
            (0.70, 0.085, 200),
            (0.68, 0.09, 130),
            (0.68, 0.13, 60),
            (0.70, 0.17, 35),
        ],
    ),
    (
        "Centrality",
        "marginal → central",
        [
            (0.42, 0.005, 80),
            (0.52, 0.04, 80),
            (0.62, 0.075, 80),
            (0.72, 0.115, 80),
            (0.82, 0.14, 80),
        ],
    ),
]


# --- fonts -----------------------------------------------------------------
FONT_DIR = Path("C:/Windows/Fonts")
# Mirrors the fallback chains in app.css: Source Serif 4 -> Georgia for the
# display face, Public Sans -> Segoe UI for the sans.
SERIF_BOLD = ["georgiab.ttf", "constanb.ttf", "DejaVuSerif-Bold.ttf"]
SANS = ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]
SANS_BOLD = ["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"]


def font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    for name in candidates:
        for path in (FONT_DIR / name, Path(name)):
            try:
                return ImageFont.truetype(str(path), size * SCALE)
            except OSError:
                continue
    raise SystemExit(f"none of {candidates} could be loaded")


# --- data ------------------------------------------------------------------
def load_stats(models: list[tuple[str, str]]) -> dict:
    articles = json.loads((DATA_DIR / "iwac_articles_base.json").read_text("utf-8"))
    years = sorted(str(a["dcterms:date"])[:4] for a in articles if a.get("dcterms:date"))
    stacks = {}
    for model_id, _ in models:
        payload = json.loads((DATA_DIR / f"iwac_sentiment_{model_id}.json").read_text("utf-8"))
        stacks[model_id] = Counter(
            entry.get("polarite") for entry in payload["sentiments"].values()
        )
    return {
        "articles": len(articles),
        "newspapers": len({a.get("Newspaper") for a in articles if a.get("Newspaper")}),
        "countries": len({a.get("Country") for a in articles if a.get("Country")}),
        "year_min": years[0],
        "year_max": years[-1],
        "stacks": stacks,
    }


# --- drawing helpers -------------------------------------------------------
def px(value: float) -> int:
    return round(value * SCALE)


def text(draw, xy, string, fnt, fill, anchor="la", spacing=0.0):
    """Draw text, optionally letter-spaced (Pillow has no tracking control)."""
    x, y = px(xy[0]), px(xy[1])
    if not spacing:
        draw.text((x, y), string, font=fnt, fill=fill, anchor=anchor)
        return
    for char in string:
        draw.text((x, y), char, font=fnt, fill=fill, anchor=anchor)
        x += round(draw.textlength(char, font=fnt) + spacing * SCALE)


def stacked_bar(image, xy, size, counts, radius=6):
    """Paint one polarity stack, rounded at both ends via an alpha mask."""
    x, y = px(xy[0]), px(xy[1])
    w, h = px(size[0]), px(size[1])
    # Denominator is the *annotated* rows, not every row in the file. Generation
    # 2 carries 51 all-null articles by design (the prompt is French; those are
    # neither French nor English), and counting them would leave each bar
    # visibly short of its right edge with nothing to explain the gap.
    total = sum(counts.get(key, 0) for key, _, _ in POLARITY) or 1

    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(layer)
    cursor = 0
    for key, _, colour in POLARITY:
        share = counts.get(key, 0) / total
        end = cursor + share * w
        # Round outward so hairline gaps never open between segments.
        layer_draw.rectangle([round(cursor), 0, round(end), h], fill=ok(*colour))
        cursor = end

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], px(radius), fill=255)
    image.paste(layer, (x, y), mask)


def render(models: list[tuple[str, str]]) -> Image.Image:
    stats = load_stats(models)
    image = Image.new("RGB", (WIDTH * SCALE, HEIGHT * SCALE), BG_TOP)
    draw = ImageDraw.Draw(image)

    # Vertical gradient background.
    for row in range(HEIGHT * SCALE):
        t = row / (HEIGHT * SCALE - 1)
        draw.line(
            [(0, row), (WIDTH * SCALE, row)],
            fill=tuple(round(a + (b - a) * t) for a, b in zip(BG_TOP, BG_BOTTOM)),
        )

    # Top rule: the polarity scale as a continuous diverging ramp.
    ramp = [c for _, _, c in POLARITY[:5]]
    for column in range(WIDTH * SCALE):
        draw.line(
            [(column, 0), (column, px(5))],
            fill=ok_ramp(ramp, column / (WIDTH * SCALE - 1)),
        )

    m = 72  # margin

    text(draw, (m, 58), "ISLAM WEST AFRICA COLLECTION", font(SANS_BOLD, 15), ACCENT, spacing=2.6)
    text(draw, (m, 88), "Sentiment Analysis", font(SERIF_BOLD, 58), TEXT_PRIMARY)
    text(
        draw,
        (m, 168),
        "How the francophone West African press writes about Islam \u2014",
        font(SANS, 21),
        TEXT_MUTED,
    )
    text(
        draw,
        (m, 198),
        "three LLM annotations, compared and arbitrated.",
        font(SANS, 21),
        TEXT_MUTED,
    )

    facts = "  ·  ".join(
        [
            f"{stats['articles']:,} articles",
            f"{stats['newspapers']} newspapers",
            f"{stats['countries']} countries",
            f"{stats['year_min']}\u2013{stats['year_max']}",
        ]
    )
    text(draw, (m, 246), facts, font(SANS_BOLD, 18), TEXT_SUBTLE)

    # Right column: the three annotated dimensions and their colour ramps.
    dim_label = font(SANS_BOLD, 15)
    dim_note = font(SANS, 14)
    swatch_w, swatch_gap = 26, 4
    strip_w = 5 * swatch_w + 4 * swatch_gap
    for i, (name, note, ramp_colours) in enumerate(DIMENSIONS):
        y = 76 + i * 62
        text(draw, (WIDTH - m, y), name, dim_label, TEXT_PRIMARY, anchor="ra")
        text(draw, (WIDTH - m - strip_w - 16, y + 1), note, dim_note, TEXT_SUBTLE, anchor="ra")
        for j, colour in enumerate(ramp_colours):
            left = WIDTH - m - strip_w + j * (swatch_w + swatch_gap)
            draw.rounded_rectangle(
                [px(left), px(y + 26), px(left + swatch_w), px(y + 36)],
                px(3),
                fill=ok(*colour),
            )

    draw.line([(px(m), px(288)), (px(WIDTH - m), px(288))], fill=RULE, width=SCALE)

    # One stacked polarity bar per model.
    label_font = font(SANS_BOLD, 17)
    bar_x, bar_w, bar_h = m + 172, WIDTH - m - (m + 172), 30
    for i, (model_id, label) in enumerate(models):
        y = 322 + i * 52
        text(draw, (m, y + bar_h / 2), label, label_font, TEXT_PRIMARY, anchor="lm")
        stacked_bar(image, (bar_x, y), (bar_w, bar_h), stats["stacks"][model_id])

    # Legend.
    legend_font = font(SANS, 15)
    x = float(m)
    for _, label, colour in POLARITY:
        draw.rounded_rectangle([px(x), px(508), px(x + 12), px(520)], px(3), fill=ok(*colour))
        text(draw, (x + 20, 514), label, legend_font, TEXT_MUTED, anchor="lm")
        x += 20 + draw.textlength(label, font=legend_font) / SCALE + 26

    draw.line([(px(m), px(556)), (px(WIDTH - m), px(556))], fill=RULE, width=SCALE)

    text(draw, (m, 590), "iwac.frederickmadore.com/sentiment-analysis", font(SANS_BOLD, 18), ACCENT)
    text(
        draw,
        (WIDTH - m, 590),
        "Frédérick Madore  ·  University of Bayreuth",
        font(SANS, 18),
        TEXT_SUBTLE,
        anchor="ra",
    )

    return image.resize((WIDTH, HEIGHT), Image.LANCZOS)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--generation",
        choices=["v1", "v2"],
        default=SHOWCASED_GENERATION,
        help=f"Analysis generation to advertise (default: {SHOWCASED_GENERATION}).",
    )
    args = parser.parse_args()

    models = load_models(args.generation)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    render(models).save(OUTPUT, "PNG", optimize=True)
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size / 1024:.0f} kB)")
    print(f"generation {args.generation}: {', '.join(label for _, label in models)}")
