"""Paid-cache regressions: no network, provider calls, or shipped-file writes."""

import json

import pytest
from iwac_preprocess.arbiter_lifecycle import CACHE_FILENAME
from iwac_preprocess.publication import publication_lock
from test_arbiter_evaluation_v2 import arbiter, paid_run
from test_arbiter_evaluation_v2 import stub_pipeline as stub_pipeline  # shared isolated CLI fixture


def cache_path(directory):
    return directory / ".staging" / "arbiter-v2" / CACHE_FILENAME


def forbid_paid_calls(monkeypatch):
    def fail(*args, **kwargs):
        raise AssertionError("cached work must not construct an API client")

    monkeypatch.setattr(arbiter, "create_anthropic_client", fail)


def complete_run(monkeypatch):
    paid_run(monkeypatch, [arbiter.OUTCOME_OK, arbiter.OUTCOME_OK])
    assert arbiter.main(["--yes"]) == 0


@pytest.mark.parametrize("value", ["0", "-1", "not-an-integer"])
def test_bad_limits_fail_before_loading_sources_or_touching_the_cache(monkeypatch, value):
    def fail(*args, **kwargs):
        raise AssertionError("invalid CLI must fail before I/O")

    monkeypatch.setattr(arbiter, "load_dataset_records", fail)
    monkeypatch.setattr(arbiter, "get_staging_dir", fail)
    with pytest.raises(SystemExit) as error:
        arbiter.main(["--limit", value])
    assert error.value.code == 2


@pytest.mark.parametrize("limit", [0, -1])
def test_programmatic_limits_cannot_apply_negative_slicing(limit):
    with pytest.raises(ValueError, match="positive integer"):
        arbiter.apply_limit([], limit)


@pytest.mark.parametrize("mapping", [None, {"a": "luna"}, dict.fromkeys("abcde", "luna")])
@pytest.mark.parametrize("target", ["public", "durable"])
def test_populated_cache_with_bad_mapping_fails_without_reassigning_verdicts(
    stub_pipeline, monkeypatch, mapping, target
):
    complete_run(monkeypatch)
    path = stub_pipeline / arbiter.OUTPUT_FILENAME
    broken = path if target == "public" else cache_path(stub_pipeline)
    payload = json.loads(broken.read_text())
    if mapping is None:
        del payload["metadata"]["blind_permutation"]
    else:
        payload["metadata"]["blind_permutation"] = mapping
    broken.write_text(json.dumps(payload))
    before_public = path.read_bytes()
    before_cache = cache_path(stub_pipeline).read_bytes()
    forbid_paid_calls(monkeypatch)

    assert arbiter.main(["--prune-cache-only"]) == 2
    assert path.read_bytes() == before_public
    assert cache_path(stub_pipeline).read_bytes() == before_cache


def test_different_effort_cannot_relabel_populated_cache(stub_pipeline, monkeypatch):
    complete_run(monkeypatch)
    path = stub_pipeline / arbiter.OUTPUT_FILENAME
    before_public = path.read_bytes()
    before_cache = cache_path(stub_pipeline).read_bytes()
    forbid_paid_calls(monkeypatch)

    assert arbiter.main(["--effort", "high", "--prune-cache-only"]) == 2
    assert path.read_bytes() == before_public
    assert cache_path(stub_pipeline).read_bytes() == before_cache
    assert json.loads(before_public)["metadata"]["effort"] == "medium"


@pytest.mark.parametrize("bootstrap_from_publication", [False, True])
def test_narrowing_then_expanding_reuses_every_paid_evaluation(
    stub_pipeline, monkeypatch, bootstrap_from_publication
):
    complete_run(monkeypatch)
    path = stub_pipeline / arbiter.OUTPUT_FILENAME
    original = json.loads(path.read_text())
    if bootstrap_from_publication:
        # Existing installations have only the checked-in public envelope.
        cache_path(stub_pipeline).unlink()
    forbid_paid_calls(monkeypatch)

    assert arbiter.main(["--limit", "1"]) == 0
    assert len(json.loads(path.read_text())["evaluations"]) == 1
    durable = json.loads(cache_path(stub_pipeline).read_text())
    assert len(durable["evaluations"]) == len(durable["provenance"]) == 2
    assert arbiter.main([]) == 0
    expanded = json.loads(path.read_text())
    assert expanded["evaluations"] == original["evaluations"]
    assert expanded["metadata"]["blind_permutation"] == original["metadata"]["blind_permutation"]


def test_other_snapshot_does_not_overwrite_old_reusable_verdicts(stub_pipeline, monkeypatch):
    complete_run(monkeypatch)
    path = stub_pipeline / arbiter.OUTPUT_FILENAME
    original = json.loads(path.read_text())["evaluations"]
    monkeypatch.setattr(arbiter, "get_source_revision", lambda repo=None: "new-snapshot")
    complete_run(monkeypatch)
    durable = json.loads(cache_path(stub_pipeline).read_text())
    assert len(durable["evaluations"]) == 4
    assert {entry["source"]["scores"]["revision"] for entry in durable["provenance"].values()} == {
        "rev-scores",
        "new-snapshot",
    }

    monkeypatch.setattr(arbiter, "get_source_revision", lambda repo=None: "rev-scores")
    forbid_paid_calls(monkeypatch)
    assert arbiter.main([]) == 0
    assert json.loads(path.read_text())["evaluations"] == original


def test_publication_failure_still_checkpoints_paid_work(stub_pipeline, monkeypatch):
    original_save = arbiter.save_results

    def fail(*args, **kwargs):
        raise OSError("public export failed")

    monkeypatch.setattr(arbiter, "save_results", fail)
    paid_run(monkeypatch, [arbiter.OUTCOME_OK, arbiter.OUTCOME_OK])
    with pytest.raises(OSError, match="public export failed"):
        arbiter.main(["--yes"])
    assert len(json.loads(cache_path(stub_pipeline).read_text())["evaluations"]) == 2

    monkeypatch.setattr(arbiter, "save_results", original_save)
    forbid_paid_calls(monkeypatch)
    assert arbiter.main([]) == 0
    assert (
        len(json.loads((stub_pipeline / arbiter.OUTPUT_FILENAME).read_text())["evaluations"]) == 2
    )


def test_second_arbiter_session_fails_before_loading_or_spending(stub_pipeline, monkeypatch):
    def fail():
        raise AssertionError("a concurrent arbiter must not load its own stale cache")

    monkeypatch.setattr(arbiter, "load_dataset_records", fail)
    with publication_lock(stub_pipeline / ".staging" / "arbiter-v2"):
        assert arbiter.main(["--yes"]) == 2


def test_dry_run_does_not_write_a_durable_cache(stub_pipeline):
    assert arbiter.main(["--dry-run"]) == 0
    assert not cache_path(stub_pipeline).exists()
