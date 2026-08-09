from iwac_preprocess import cache_fingerprint, reconcile_cached_evaluations


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


def test_reconciliation_prunes_stale_and_duplicate_rows_and_adopts_legacy():
    current = [article("1")]
    cached = [
        {"article_id": "1", "arbiter": {}},
        {"article_id": "1", "arbiter": {"duplicate": True}},
        {"article_id": "removed", "arbiter": {}},
    ]
    result = reconcile_cached_evaluations(cached, current, **OPTIONS)
    assert result.evaluated_ids == {"1"}
    assert result.pruned == 2
    assert result.adopted_legacy == 1
    assert result.evaluations[0]["cache_fingerprint"]


def test_changed_analysis_invalidates_a_fingerprinted_row():
    original = article("1")
    fingerprint = cache_fingerprint(original, **OPTIONS)
    cached = [{"article_id": "1", "arbiter": {}, "cache_fingerprint": fingerprint}]
    result = reconcile_cached_evaluations(cached, [article("1", "Négatif")], **OPTIONS)
    assert result.evaluations == []
    assert result.invalidated == 1


def test_source_revision_is_part_of_the_fingerprint():
    first = cache_fingerprint(article("1"), **OPTIONS)
    second = cache_fingerprint(article("1"), **{**OPTIONS, "source_revision": "next"})
    assert first != second
