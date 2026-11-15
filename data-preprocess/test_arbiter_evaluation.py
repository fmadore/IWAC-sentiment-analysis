"""Contract tests for the paid arbiter boundary without making API calls."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pytest
from iwac_preprocess.arbiter_lifecycle import CacheUnreadableError
from pydantic import ValidationError


def load_module():
    path = Path(__file__).with_name("arbiter-evaluation.py")
    spec = importlib.util.spec_from_file_location("iwac_arbiter_evaluation", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


arbiter = load_module()


def valid_response() -> dict:
    verdict = {
        "arbiter_score": "Positif",
        "justification": "Justification",
        "preferred_model": "model_a",
        "verdict_explanation": "Explication",
    }
    return {
        "polarity": verdict,
        "subjectivity": {**verdict, "arbiter_score": 3},
        "centrality": {**verdict, "arbiter_score": "Central"},
        "overall_winner": "model_a",
        "overall_explanation": "Explication générale",
        "confidence_level": "high",
    }


def test_structured_response_rejects_out_of_contract_scores():
    payload = valid_response()
    payload["subjectivity"]["arbiter_score"] = 6
    with pytest.raises(ValidationError):
        arbiter.ArbiterResponse.model_validate(payload)


def test_only_transport_and_server_errors_are_retryable():
    class ApiError(Exception):
        def __init__(self, status_code: int):
            self.status_code = status_code

    assert arbiter.is_transient_api_error(ApiError(429))
    assert arbiter.is_transient_api_error(ApiError(503))
    assert arbiter.is_transient_api_error(TimeoutError("timed out"))
    assert not arbiter.is_transient_api_error(ApiError(400))
    assert not arbiter.is_transient_api_error(ValueError("invalid schema"))


def test_retry_after_takes_precedence_over_backoff():
    error = RuntimeError("rate limit")
    error.retry_after = "7.5"
    assert arbiter.retry_delay(error, attempt=0) == 7.5


def test_prompt_truncates_article_text_to_the_paid_input_limit():
    marker = "end-marker"
    text = "a" * (arbiter.ARBITER_MAX_INPUT_CHARS + 10) + marker
    prompt = arbiter.create_arbiter_prompt(text, "Title", {}, {})
    assert marker not in prompt
    assert "a" * arbiter.ARBITER_MAX_INPUT_CHARS in prompt


def test_main_returns_nonzero_when_source_loading_fails(monkeypatch, tmp_path):
    def fail_load(revision=None):
        raise OSError("offline")

    monkeypatch.setattr(arbiter, "load_dataset_with_text_info", fail_load)
    monkeypatch.setattr(arbiter, "get_webapp_data_dir", lambda: str(tmp_path))
    assert arbiter.main(pairs=["chatgpt-gemini"], prune_cache_only=True, unfreeze=True) == 2


# ---------------------------------------------------------------------------
# The frozen archive
# ---------------------------------------------------------------------------


def test_main_refuses_any_work_without_unfreeze(monkeypatch):
    def fail(*args, **kwargs):
        raise AssertionError("a frozen archive must not load, write or call anything")

    monkeypatch.setattr(arbiter, "load_dataset_with_text_info", fail)
    monkeypatch.setattr(arbiter, "save_results", fail)
    monkeypatch.setattr(arbiter, "create_genai_client", fail)
    assert arbiter.main(pairs=["chatgpt-gemini"], prune_cache_only=True) == 2
    assert arbiter.main(pairs=["chatgpt-gemini"], assume_yes=True) == 2


def write_published(path, rows, **metadata):
    path.write_text(
        json.dumps({"metadata": {"source_revision": "rev-1", **metadata}, "evaluations": rows}),
        encoding="utf-8",
    )


def test_an_unreadable_cache_fails_instead_of_redrawing(tmp_path):
    path = tmp_path / "iwac_arbiter_evaluations_chatgpt-gemini.json"
    path.write_text("{not json", encoding="utf-8")
    with pytest.raises(CacheUnreadableError, match="not a readable arbiter file"):
        arbiter.load_cached_evaluations(str(path))
    assert path.read_text(encoding="utf-8") == "{not json"


def test_a_populated_cache_without_a_blind_assignment_fails(tmp_path):
    path = tmp_path / "iwac_arbiter_evaluations_chatgpt-gemini.json"
    write_published(path, [{"article_id": "1"}])
    with pytest.raises(CacheUnreadableError, match="no blind assignment"):
        arbiter.load_cached_evaluations(str(path))
    # Only an absent file is a first run.
    assert arbiter.load_cached_evaluations(str(tmp_path / "absent.json")) == ([], set(), None)


def test_a_legacy_assignment_is_still_derived_rather_than_redrawn(tmp_path):
    path = tmp_path / "iwac_arbiter_evaluations_chatgpt-gemini.json"
    write_published(
        path, [{"article_id": "1"}], arbiter_model_a="ChatGPT", pair_first_model="ChatGPT"
    )
    assert arbiter.load_cached_evaluations(str(path))[2] is True


def test_a_prune_that_would_empty_a_published_pair_is_refused(tmp_path, monkeypatch):
    path = tmp_path / "iwac_arbiter_evaluations_chatgpt-gemini.json"
    write_published(path, [{"article_id": "1"}, {"article_id": "2"}], model_a_is_first=True)
    before = path.read_bytes()

    def fail(*args, **kwargs):
        raise AssertionError("the shrink guard must stop the write")

    monkeypatch.setattr(arbiter, "save_results", fail)
    stats = arbiter.process_pair(None, [], "chatgpt-gemini", str(tmp_path), evaluate_missing=False)
    assert stats["refused"] is True
    assert path.read_bytes() == before


def test_the_shrink_guard_names_what_would_be_lost():
    message = arbiter.shrink_refusal("x.json", 10, 4, allow_shrink=False, pruned=2, invalidated=4)
    assert "6 lost; 2 no longer selected, 4 invalidated" in message
    assert arbiter.shrink_refusal("x.json", 10, 4, allow_shrink=True) is None
    assert arbiter.shrink_refusal("x.json", 4, 10, allow_shrink=False) is None


def test_pairs_published_at_different_revisions_must_be_run_apart(tmp_path):
    write_published(
        tmp_path / "iwac_arbiter_evaluations_chatgpt-gemini.json",
        [{"article_id": "1"}],
        model_a_is_first=True,
    )
    write_published(
        tmp_path / "iwac_arbiter_evaluations_chatgpt-mistral.json",
        [{"article_id": "1"}],
        model_a_is_first=True,
        source_revision="rev-2",
    )
    assert arbiter.recorded_source_revision(["chatgpt-gemini"], str(tmp_path)) == "rev-1"
    with pytest.raises(CacheUnreadableError, match="different source revisions"):
        arbiter.recorded_source_revision(["chatgpt-gemini", "chatgpt-mistral"], str(tmp_path))
