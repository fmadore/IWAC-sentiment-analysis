from functools import partial
from types import SimpleNamespace

from iwac_preprocess import (
    CONTRACT_V2,
    cache_fingerprint,
    reconcile_cached_evaluations,
    three_way_cache_fingerprint,
)


def article(article_id: str, polarity: str = "Positif") -> dict:
    return {
        "o:id": article_id,
        "o:title": f"Article {article_id}",
        "OCR": "texte",
        "model_a_analysis": {"polarite": polarity},
        "model_b_analysis": {"polarite": "Neutre"},
        "discrepancies": {"total_diff": 1},
    }


OPTIONS = {
    "pair": "chatgpt-gemini",
    "arbiter_model": "gemini-3-pro-preview",
    "source_revision": "abc123",
    "max_input_chars": 15_000,
}


def v1_hasher(**overrides):
    return partial(cache_fingerprint, **{**OPTIONS, **overrides})


def test_reconciliation_prunes_stale_and_duplicate_rows_and_adopts_legacy():
    current = [article("1")]
    cached = [
        {"article_id": "1", "arbiter": {}},
        {"article_id": "1", "arbiter": {"duplicate": True}},
        {"article_id": "removed", "arbiter": {}},
    ]
    result = reconcile_cached_evaluations(cached, current, fingerprint=v1_hasher())
    assert result.evaluated_ids == {"1"}
    assert result.pruned == 2
    assert result.adopted_legacy == 1
    assert result.evaluations[0]["cache_fingerprint"]


def test_changed_analysis_invalidates_a_fingerprinted_row():
    original = article("1")
    fingerprint = cache_fingerprint(original, **OPTIONS)
    cached = [{"article_id": "1", "arbiter": {}, "cache_fingerprint": fingerprint}]
    result = reconcile_cached_evaluations(
        cached, [article("1", "Négatif")], fingerprint=v1_hasher()
    )
    assert result.evaluations == []
    assert result.invalidated == 1


def test_source_revision_is_part_of_the_fingerprint():
    first = cache_fingerprint(article("1"), **OPTIONS)
    second = cache_fingerprint(article("1"), **{**OPTIONS, "source_revision": "next"})
    assert first != second


# --- v1 regression pin -------------------------------------------------------
# The published v1 arbiter files store fingerprints computed by the pre-v2
# implementation. A refactor that shifts this digest silently invalidates every
# paid v1 evaluation on the next run, which is expensive and invisible.

PINNED_V1_ARTICLE = {
    "o:id": "4242",
    "o:title": "Titre de reference",
    "OCR": "Texte integral de reference.",
    "model_a_analysis": {
        "polarite": "Positif",
        "subjectivite_score": 2,
        "centralite_islam_musulmans": "Central",
    },
    "model_b_analysis": {
        "polarite": "Negatif",
        "subjectivite_score": 5,
        "centralite_islam_musulmans": "Marginal",
    },
    "discrepancies": {
        "polarity_diff": 2,
        "subjectivity_diff": 3,
        "centrality_diff": 2,
        "total_diff": 7,
        "has_significant_conflict": True,
    },
}
PINNED_V1_DIGEST = "6833e12fb4adb2f947cbb75f956ef634439d33c6655e4e153e2c09d445d2d066"


def test_v1_fingerprint_payload_is_frozen():
    assert (
        cache_fingerprint(
            PINNED_V1_ARTICLE,
            pair="chatgpt-gemini",
            arbiter_model="gemini-3-pro-preview",
            source_revision="deadbeef",
            max_input_chars=15_000,
        )
        == PINNED_V1_DIGEST
    )


# --- v2 panel ----------------------------------------------------------------

# One analysis per contract model: the fingerprint keys them by model id, so a
# panel that grows has to change the digest rather than hash a subset of itself.
PANEL_POLARITIES = ["Neutre", "Négatif", "Très négatif", "Positif", "Très positif"]


def three_way_article(article_id: str, polarity: str = "Positif") -> dict:
    """One selected article, with an analysis from every generation-2 model."""
    model_ids = list(CONTRACT_V2.model_names)
    analyses = {
        model_id: {"polarite": PANEL_POLARITIES[index % len(PANEL_POLARITIES)]}
        for index, model_id in enumerate(model_ids)
    }
    # The first model's verdict is the one the change-detection tests move.
    analyses[model_ids[0]] = {"polarite": polarity}
    return {
        "o:id": article_id,
        "o:title": f"Article {article_id}",
        "OCR": "texte",
        "analyses": analyses,
        "spread": {"total_spread": 4},
    }


def test_the_panel_fingerprint_covers_every_contract_model():
    assert set(three_way_article("1")["analyses"]) == set(CONTRACT_V2.model_names)
    assert len(CONTRACT_V2.model_names) == 5


V2_OPTIONS = {
    "arbiter_model": "claude-opus-5",
    "source_revision": "abc123",
    "text_revision": "def456",
    "max_input_chars": 15_000,
    "contract": CONTRACT_V2,
}


def test_three_way_fingerprint_ignores_analysis_ordering():
    first = three_way_article("1")
    second = three_way_article("1")
    second["analyses"] = dict(reversed(list(second["analyses"].items())))
    assert three_way_cache_fingerprint(first, **V2_OPTIONS) == three_way_cache_fingerprint(
        second, **V2_OPTIONS
    )


def test_three_way_fingerprint_tracks_both_source_revisions():
    baseline = three_way_cache_fingerprint(three_way_article("1"), **V2_OPTIONS)
    scores_moved = three_way_cache_fingerprint(
        three_way_article("1"), **{**V2_OPTIONS, "source_revision": "next"}
    )
    text_moved = three_way_cache_fingerprint(
        three_way_article("1"), **{**V2_OPTIONS, "text_revision": "next"}
    )
    assert len({baseline, scores_moved, text_moved}) == 3


def test_three_way_fingerprint_changes_with_an_analysis():
    baseline = three_way_cache_fingerprint(three_way_article("1"), **V2_OPTIONS)
    changed = three_way_cache_fingerprint(three_way_article("1", "Très négatif"), **V2_OPTIONS)
    assert baseline != changed


def test_the_panel_fingerprint_reads_its_mode_from_the_contract():
    """The mode separates this digest from the pairwise one; it is not a literal."""
    renamed = SimpleNamespace(
        schema_version=CONTRACT_V2.schema_version,
        analysis_version=CONTRACT_V2.analysis_version,
        arbiter={**CONTRACT_V2.arbiter, "mode": "three-way"},
    )
    baseline = three_way_cache_fingerprint(three_way_article("1"), **V2_OPTIONS)
    under_old_mode = three_way_cache_fingerprint(
        three_way_article("1"), **{**V2_OPTIONS, "contract": renamed}
    )
    assert baseline != under_old_mode
