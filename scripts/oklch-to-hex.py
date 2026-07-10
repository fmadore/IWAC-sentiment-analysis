#!/usr/bin/env python3
"""
Convert the OKLCH color values used in chartTheme.ts to hex/rgba so ECharts
(which uses zrender's CSS color parser, no modern color spaces) can read them.

Implements the OKLCH -> OKLab -> linear sRGB -> sRGB pipeline. Values out of
the sRGB gamut are clamped at the channel level (no advanced gamut mapping;
all of the colors we use are well inside sRGB so this is fine).
"""

import math


def oklch_to_oklab(L: float, C: float, h_deg: float):
    h_rad = math.radians(h_deg)
    a = C * math.cos(h_rad)
    b = C * math.sin(h_rad)
    return L, a, b


def oklab_to_linear_srgb(L: float, a: float, b: float):
    # Bjorn Ottosson's OKLab -> linear sRGB
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b

    l = l_ ** 3
    m = m_ ** 3
    s = s_ ** 3

    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return r, g, bb


def linear_to_srgb_channel(c: float) -> float:
    if c <= 0.0031308:
        return 12.92 * c
    return 1.055 * (c ** (1 / 2.4)) - 0.055


def _clamp_byte(v: float) -> int:
    return max(0, min(255, round(v * 255)))


def oklch_to_srgb_bytes(L: float, C: float, h: float) -> tuple[int, int, int]:
    """Run the full OKLCH -> OKLab -> linear sRGB -> sRGB pipeline.

    Returns the (r, g, b) channels as clamped 0-255 integers.
    """
    L_, a, b = oklch_to_oklab(L, C, h)
    r, g, bb = oklab_to_linear_srgb(L_, a, b)
    return (
        _clamp_byte(linear_to_srgb_channel(r)),
        _clamp_byte(linear_to_srgb_channel(g)),
        _clamp_byte(linear_to_srgb_channel(bb)),
    )


def oklch_to_hex(L: float, C: float, h: float) -> str:
    r, g, b = oklch_to_srgb_bytes(L, C, h)
    return "#{:02X}{:02X}{:02X}".format(r, g, b)


def oklch_to_rgba(L: float, C: float, h: float, alpha: float) -> str:
    r, g, b = oklch_to_srgb_bytes(L, C, h)
    return "rgba({}, {}, {}, {})".format(r, g, b, round(alpha, 2))


COLORS = {
    # Polarity (diverging)
    "polarity_very_negative": (0.62, 0.20, 25),
    "polarity_negative": (0.70, 0.14, 25),
    "polarity_neutral": (0.66, 0.045, 250),
    "polarity_positive": (0.70, 0.13, 150),
    "polarity_very_positive": (0.62, 0.18, 150),
    "polarity_na": (0.55, 0.01, 260),
    # Subjectivity (cool -> warm)
    "subjectivity_1": (0.72, 0.06, 220),
    "subjectivity_2": (0.70, 0.085, 200),
    "subjectivity_3": (0.68, 0.09, 130),
    "subjectivity_4": (0.68, 0.13, 60),
    "subjectivity_5": (0.66, 0.17, 35),
    # Centrality (single-hue amber sequential)
    "centrality_not_addressed": (0.42, 0.005, 80),
    "centrality_marginal": (0.52, 0.04, 80),
    "centrality_secondary": (0.62, 0.075, 80),
    "centrality_central": (0.72, 0.115, 80),
    "centrality_very_central": (0.82, 0.14, 80),
    # Arbiter
    "arbiter": (0.74, 0.16, 75),
    "arbiter_light": (0.82, 0.14, 80),
    # Comparison
    "comparison": (0.70, 0.08, 240),
    "comparison_light": (0.78, 0.06, 240),
    "comparison_accent": (0.74, 0.12, 320),
    "comparison_secondary": (0.72, 0.07, 215),
    # Categorical palette
    "cat_steel_blue": (0.72, 0.10, 245),
    "cat_teal": (0.74, 0.10, 195),
    "cat_amber": (0.78, 0.13, 80),
    "cat_magenta": (0.72, 0.11, 320),
    "cat_sea_green": (0.74, 0.10, 175),
    "cat_violet": (0.74, 0.09, 280),
    "cat_ochre": (0.78, 0.10, 60),
    "cat_slate": (0.72, 0.07, 210),
    "cat_wheat": (0.78, 0.09, 95),
    "cat_rose": (0.72, 0.10, 350),
    "cat_pale_steel": (0.74, 0.06, 230),
    "cat_sage": (0.76, 0.08, 130),
    # Chart text + chrome
    "text_primary": (0.97, 0.005, 260),
    "text_secondary": (0.88, 0.005, 260),
    "text_muted": (0.74, 0.005, 260),
    "text_subtle": (0.62, 0.005, 260),
    "text_faint": (0.42, 0.005, 260),
    "tooltip_bg": (0.20, 0.012, 260),
    "chrome_accent": (0.78, 0.13, 80),
    # Surfaces (for inline use)
    "surface_card": (0.205, 0.012, 260),
    "app_bg": (0.16, 0.012, 260),
}

if __name__ == "__main__":
    print("Hex conversions for ECharts:\n")
    for name, (L, C, h) in COLORS.items():
        hex_value = oklch_to_hex(L, C, h)
        print(f"  {name:30s} oklch({L} {C} {h})  ->  {hex_value}")

    print("\nrgba alpha helpers (text borders, accent soft fills):")
    for L, C, h, alpha in [
        (0.97, 0.005, 260, 0.08),  # border.subtle
        (0.97, 0.005, 260, 0.14),  # border.light
        (0.97, 0.005, 260, 0.22),  # border.medium
        (0.78, 0.13, 80, 0.22),  # chrome.accentSoft
        (0.78, 0.13, 80, 0.12),  # chrome.accentFaint
    ]:
        print(f"  oklch({L} {C} {h}) at {alpha} -> {oklch_to_rgba(L, C, h, alpha)}")
