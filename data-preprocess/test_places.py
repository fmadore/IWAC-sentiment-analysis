"""The map payload: place lookup, edges, and scoping to the processed articles."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pandas as pd
import pytest
from iwac_preprocess.places import build_place_edges, build_place_lookup, build_places_payload
from validate_generated_data import ContractError


def load_script():
    path = Path(__file__).with_name("places-export.py")
    spec = importlib.util.spec_from_file_location("iwac_places_export", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def index_frame() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "o:id": 10,
                "Type": "Lieux",
                "Titre": "Lomé",
                "Titre alternatif": "Lome|Bamako",
                "Coordonnées": "6.1319, 1.2228",
            },
            {
                "o:id": 11,
                "Type": "Lieux",
                "Titre": "Bamako",
                "Titre alternatif": None,
                "Coordonnées": "12.6392; -8.0029",
            },
            {
                "o:id": 12,
                "Type": "Lieux",
                "Titre": "Nowhere",
                "Titre alternatif": None,
                "Coordonnées": "not a coordinate",
            },
            {
                "o:id": 13,
                "Type": "Personnes",
                "Titre": "Somebody",
                "Titre alternatif": None,
                "Coordonnées": "1, 1",
            },
            {
                "o:id": 14,
                "Type": "Lieux",
                "Titre": "Niamey",
                "Titre alternatif": None,
                "Coordonnées": "13.5116, 2.1254",
            },
        ]
    )


def test_a_canonical_title_wins_over_another_records_alias():
    lookup, records = build_place_lookup(index_frame())
    assert lookup["Bamako"] == 11  # alias of Lomé, title of Bamako
    assert lookup["Lome"] == 10
    assert set(records) == {10, 11, 14}  # no coordinates, or not a place


def test_coordinates_are_rounded_to_the_export_precision():
    _, records = build_place_lookup(index_frame())
    assert records[11] == {"id": 11, "title": "Bamako", "lat": 12.6392, "lng": -8.0029}


def test_an_article_tagging_a_place_and_its_alias_counts_it_once():
    lookup, _ = build_place_lookup(index_frame())
    edges = build_place_edges(
        [
            {"o:id": 1, "spatial": "Lomé|Lome|Atlantis"},
            {"o:id": 2, "spatial": None},
            {"o:id": None, "spatial": "Lomé"},
        ],
        lookup,
    )
    assert edges.edges == {"1": [10]}
    assert edges.mentions[10] == 1
    assert edges.unresolved == {"Atlantis": 1}


def test_only_cited_places_ship_sorted_by_id():
    lookup, records = build_place_lookup(index_frame())
    edges = build_place_edges([{"o:id": 1, "spatial": "Niamey|Bamako"}], lookup)
    payload = build_places_payload(records, edges)
    assert [place["id"] for place in payload["places"]] == [11, 14]
    assert payload["articles"] == {"1": [14, 11]}


@pytest.fixture
def stub_export(monkeypatch, tmp_path):
    script = load_script()
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    (data_dir / "iwac_articles_base.json").write_text(
        json.dumps([{"o:id": 1}, {"o:id": 2}]), encoding="utf-8"
    )
    monkeypatch.setattr(script, "get_webapp_data_dir", lambda: str(data_dir))
    monkeypatch.setattr(script, "get_staging_dir", lambda: str(tmp_path / "staging"))
    monkeypatch.setattr(script, "load_iwac_index", index_frame)
    return script, data_dir


def test_an_article_ingested_after_the_panel_run_is_left_off_the_map(stub_export, monkeypatch):
    """The corpus grows after a panel run; its new articles carry no annotation.

    An unscoped export wrote their edges too, and `validate_places` rejects any
    edge outside the base, so the next regeneration would have failed CI.
    """
    script, data_dir = stub_export
    monkeypatch.setattr(
        script,
        "load_iwac_records",
        lambda: [
            {"o:id": 1, "spatial": "Lomé"},
            {"o:id": 2, "spatial": "Bamako"},
            {"o:id": 3, "spatial": "Niamey"},  # ingested after the run
        ],
    )
    script.main()
    payload = json.loads((data_dir / "iwac_places.json").read_text(encoding="utf-8"))
    assert payload["articles"] == {"1": [10], "2": [11]}
    assert [place["id"] for place in payload["places"]] == [10, 11]


def test_a_payload_the_validator_rejects_is_never_published(stub_export, monkeypatch):
    script, data_dir = stub_export
    previous = '{"places": [], "articles": {}}'
    (data_dir / "iwac_places.json").write_text(previous, encoding="utf-8")
    monkeypatch.setattr(
        script, "load_iwac_records", lambda: [{"o:id": 1}, {"o:id": 2, "spatial": "Lomé"}]
    )
    # A registry with a duplicate id is a contract violation.
    monkeypatch.setattr(
        script,
        "build_places_payload",
        lambda records, edges: {"places": [{"id": 1}, {"id": 1}], "articles": {}},
    )
    with pytest.raises(ContractError):
        script.main()
    assert (data_dir / "iwac_places.json").read_text(encoding="utf-8") == previous
