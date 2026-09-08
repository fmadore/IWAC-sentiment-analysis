"""Both source paths must load the revision that provenance names."""

import sys
from types import SimpleNamespace

import httpx
import pandas as pd
import pytest
from huggingface_hub.errors import HfHubHTTPError
from iwac_preprocess import source


def test_direct_source_pins_revision_and_does_not_mask_bad_parquet(monkeypatch):
    monkeypatch.setattr(source, "resolve_source_revision", lambda *args: "immutable-sha")
    calls = []
    monkeypatch.setattr(source, "hf_hub_download", lambda **kw: calls.append(kw) or "file.parquet")
    monkeypatch.setattr(source.pd, "read_parquet", lambda p: pd.DataFrame({"id": [1]}))
    result = source.load_source("articles", "file.parquet", revision="old-tag")
    assert calls[0]["revision"] == result.revision == "immutable-sha"

    def malformed(path):
        raise ValueError("bad parquet")

    monkeypatch.setattr(source.pd, "read_parquet", malformed)
    with pytest.raises(ValueError, match="bad parquet"):
        source.load_source("articles", "file.parquet")


def test_fallback_uses_resolved_revision_not_environment_claim(monkeypatch):
    monkeypatch.setenv("IWAC_HF_REVISION", "requested-tag")
    monkeypatch.setattr(source, "resolve_source_revision", lambda repo, requested: "resolved-sha")

    def missing(**kwargs):
        assert kwargs["revision"] == "resolved-sha"
        raise HfHubHTTPError(
            "missing",
            response=httpx.Response(404, request=httpx.Request("GET", "https://example.test")),
        )

    calls = []
    monkeypatch.setattr(source, "hf_hub_download", missing)
    monkeypatch.setitem(
        sys.modules,
        "datasets",
        SimpleNamespace(load_dataset=lambda *a, **kw: calls.append(kw) or {"train": [{"id": 1}]}),
    )
    result = source.load_source("articles", "missing.parquet")
    assert calls[0]["revision"] == result.revision == "resolved-sha"


def test_revision_resolved_once_per_repository(monkeypatch):
    source.resolve_source_revision.cache_clear()
    calls = []
    monkeypatch.setattr(
        source,
        "HfApi",
        lambda: SimpleNamespace(
            dataset_info=lambda repo, **kw: calls.append(repo) or SimpleNamespace(sha=repo + "-sha")
        ),
    )
    assert source.resolve_source_revision("public", None) == "public-sha"
    assert source.resolve_source_revision("public", None) == "public-sha"
    assert source.resolve_source_revision("private", None) == "private-sha"
    assert calls == ["public", "private"]
    source.resolve_source_revision.cache_clear()
