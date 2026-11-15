"""Argument handling of the side scripts, without running anything networked."""

from __future__ import annotations

import importlib.util
import random
import sys
from pathlib import Path

import pytest


def load(filename: str, name: str):
    path = Path(__file__).with_name(filename)
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def basemap():
    return load("basemap-export.py", "iwac_basemap_export")


@pytest.fixture(scope="module")
def differences():
    return load("significant-differences-export.py", "iwac_significant_differences")


def test_basemap_downloads_from_the_requested_ref(basemap):
    sha = "0123456789abcdef0123456789abcdef01234567"
    assert f"/natural-earth-vector/{sha}/geojson/" in basemap.source_url(sha)
    assert "/master/" in basemap.source_url()


@pytest.mark.parametrize("ref", ["", "../etc", "a b", "x?y=1"])
def test_basemap_refuses_something_that_is_not_a_ref(basemap, ref):
    with pytest.raises(ValueError):
        basemap.source_url(ref)


def test_differences_parse_their_own_arguments(differences):
    args = differences.parse_args([])
    assert args.seed == differences.DEFAULT_SEED == 42
    assert not args.all_pairs and args.pairs is None
    args = differences.parse_args(["--pair", "gemini-mistral", "--seed", "913"])
    assert args.pairs == ["gemini-mistral"] and args.seed == 913


def test_differences_draw_the_assignment_from_the_seeded_generator(differences):
    """The draw is reproducible for a seed, and only the seed decides it."""

    def draw(seed):
        _, first_is_a = differences.extract_significant_differences(
            [], "chatgpt", "gemini", random.Random(seed)
        )
        return first_is_a

    assert draw(42) == draw(42)
    assert {draw(seed) for seed in range(20)} == {True, False}
