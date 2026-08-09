"""Contract tests for the paid arbiter boundary without making API calls."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest
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


def test_main_returns_nonzero_when_source_loading_fails(monkeypatch):
    def fail_load():
        raise OSError("offline")

    monkeypatch.setattr(arbiter, "load_dataset_with_text_info", fail_load)
    assert arbiter.main(pairs=["chatgpt-gemini"], prune_cache_only=True) == 2
