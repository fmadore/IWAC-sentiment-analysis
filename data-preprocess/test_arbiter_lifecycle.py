"""Paid-cache regressions: no network, provider calls, or shipped-file writes."""

import json

import pytest
from iwac_preprocess.arbiter_lifecycle import CACHE_FILENAME
from iwac_preprocess.publication import publication_lock
from test_arbiter_evaluation_v2 import SOURCES, arbiter, paid_run
from test_arbiter_evaluation_v2 import stub_pipeline as stub_pipeline  # shared isolated CLI fixture


def cache_path(directory):
    return directory / ".staging" / "arbiter-v2" / CACHE_FILENAME


def forbid_paid_calls(monkeypatch):
    def fail(*args, **kwargs):
        raise AssertionError("cached work must not construct an API client")

    monkeypatch.setattr(arbiter, "create_anthropic_client", fail)


def complete_run(monkeypatch, *argv):
    paid_run(monkeypatch, [arbiter.OUTCOME_OK, arbiter.OUTCOME_OK])
    assert arbiter.main(["--yes", *argv]) == 0


def published(directory) -> dict:
    return json.loads((directory / arbiter.OUTPUT_FILENAME).read_text(encoding="utf-8"))


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

    # Narrowing the public file is a deliberate act now.
    assert arbiter.main(["--limit", "1", "--allow-shrink"]) == 0
    assert len(json.loads(path.read_text())["evaluations"]) == 1
    durable = json.loads(cache_path(stub_pipeline).read_text())
    assert len(durable["evaluations"]) == len(durable["provenance"]) == 2
    assert arbiter.main([]) == 0
    expanded = json.loads(path.read_text())
    assert expanded["evaluations"] == original["evaluations"]
    assert expanded["metadata"]["blind_permutation"] == original["metadata"]["blind_permutation"]


def test_a_narrower_selection_never_shrinks_the_public_file_unasked(
    stub_pipeline, monkeypatch, caplog
):
    complete_run(monkeypatch)
    path = stub_pipeline / arbiter.OUTPUT_FILENAME
    before = path.read_bytes()
    forbid_paid_calls(monkeypatch)
    with caplog.at_level("INFO"):
        assert arbiter.main(["--limit", "1", "--prune-cache-only"]) == 1
    assert path.read_bytes() == before
    assert "holds 2 evaluations and this run has 1, so 1 would be lost" in caplog.text
    assert "1 are outside this run's selection" in caplog.text
    # The durable history is untouched by the refusal.
    assert len(json.loads(cache_path(stub_pipeline).read_text())["evaluations"]) == 2


def test_head_moved_without_a_flag_keeps_every_published_row_and_calls_nothing(
    stub_pipeline, monkeypatch, caplog
):
    """The revision trap: resuming must read the revisions the file records."""
    complete_run(monkeypatch)
    original = published(stub_pipeline)
    assert original["metadata"]["source"]["scores"]["revision"] == "rev-scores"
    # New commits upstream: HEAD is no longer what the verdicts were hashed at.
    monkeypatch.setitem(SOURCES, "scores_head", "head-moved")
    monkeypatch.setitem(SOURCES, "text_head", "text-moved")
    forbid_paid_calls(monkeypatch)

    with caplog.at_level("INFO"):
        assert arbiter.main(["--prune-cache-only"]) == 0
    republished = published(stub_pipeline)
    assert republished["evaluations"] == original["evaluations"]
    assert republished["metadata"]["source"] == original["metadata"]["source"]
    assert "recorded in iwac_arbiter_evaluations_v2.json" in caplog.text
    # Nothing changed, so the file was not rewritten and keeps its timestamp.
    assert republished["metadata"]["generated"] == original["metadata"]["generated"]

    # Moving is explicit, and the shrink guard keeps the public rows meanwhile.
    caplog.clear()
    with caplog.at_level("INFO"):
        assert arbiter.main(["--source-revision", "head", "--prune-cache-only"]) == 1
    assert published(stub_pipeline) == republished
    assert "fingerprinted against source revisions rev-scores/rev-text" in caplog.text


def test_an_explicit_environment_revision_still_wins(stub_pipeline, monkeypatch):
    complete_run(monkeypatch)
    monkeypatch.setenv("IWAC_HF_REVISION", "pinned-by-env")
    monkeypatch.setenv("IWAC_HF_FULL_REVISION", "pinned-text")
    forbid_paid_calls(monkeypatch)
    # Nothing matches at the requested revisions; the public file is protected.
    assert arbiter.main(["--prune-cache-only"]) == 1
    assert published(stub_pipeline)["metadata"]["source"]["scores"]["revision"] == "rev-scores"


def test_other_snapshot_does_not_overwrite_old_reusable_verdicts(stub_pipeline, monkeypatch):
    complete_run(monkeypatch)
    path = stub_pipeline / arbiter.OUTPUT_FILENAME
    original = json.loads(path.read_text())["evaluations"]
    monkeypatch.setitem(SOURCES, "scores_head", "new-snapshot")
    complete_run(monkeypatch, "--source-revision", "head")
    durable = json.loads(cache_path(stub_pipeline).read_text())
    assert len(durable["evaluations"]) == 4
    assert {entry["source"]["scores"]["revision"] for entry in durable["provenance"].values()} == {
        "rev-scores",
        "new-snapshot",
    }

    forbid_paid_calls(monkeypatch)
    assert (
        arbiter.main(
            ["--source-revision", "rev-scores", "--text-revision", "rev-text", "--prune-cache-only"]
        )
        == 0
    )
    assert json.loads(path.read_text())["evaluations"] == original


def test_the_new_prompt_never_empties_the_published_old_prompt_run(
    stub_pipeline, monkeypatch, caplog
):
    """Re-judging under v2.3.0 replaces the v2.2.0 file only once it is complete."""
    complete_run(monkeypatch, "--prompt-version", "v2.2.0")
    old = published(stub_pipeline)
    assert old["metadata"]["prompt_version"] == "v2.2.0"
    forbid_paid_calls(monkeypatch)

    # The default (new) prompt matches nothing: a no-call republish is refused.
    with caplog.at_level("INFO"):
        assert arbiter.main(["--prune-cache-only"]) == 1
    assert published(stub_pipeline) == old
    assert "judged under prompt v2.2.0 and this run uses v2.3.0" in caplog.text
    assert "--prompt-version v2.2.0" in caplog.text

    # The old run stays republishable under its own version.
    assert arbiter.main(["--prompt-version", "v2.2.0", "--prune-cache-only"]) == 0

    # A paid re-run says what it supersedes, then replaces the file when complete.
    caplog.clear()
    with caplog.at_level("INFO"):
        complete_run(monkeypatch)
    assert "2 published verdicts were judged under prompt v2.2.0" in caplog.text
    new = published(stub_pipeline)
    assert new["metadata"]["prompt_version"] == "v2.3.0"
    assert {row["cache_fingerprint"] for row in new["evaluations"]}.isdisjoint(
        row["cache_fingerprint"] for row in old["evaluations"]
    )


def test_a_partial_new_prompt_run_leaves_the_old_file_in_place(stub_pipeline, monkeypatch):
    complete_run(monkeypatch, "--prompt-version", "v2.2.0")
    old = published(stub_pipeline)
    paid_run(monkeypatch, [arbiter.OUTCOME_OK, arbiter.OUTCOME_ERROR])
    assert arbiter.main(["--yes"]) == 1
    assert published(stub_pipeline) == old
    # The new verdict is durable, so finishing the run costs one call.
    durable = json.loads(cache_path(stub_pipeline).read_text())
    assert len(durable["evaluations"]) == 3


def test_publication_failure_still_checkpoints_paid_work(stub_pipeline, monkeypatch):
    """A failed final export exits non-zero instead of raising.

    Deliberate change: the run used to propagate the OSError. The verdicts are
    durable before the export, so the run reports the failure as its exit code
    and a rerun publishes them without a paid call.
    """
    original_save = arbiter.save_results

    def fail(*args, **kwargs):
        raise OSError("public export failed")

    monkeypatch.setattr(arbiter, "save_results", fail)
    paid_run(monkeypatch, [arbiter.OUTCOME_OK, arbiter.OUTCOME_OK])
    assert arbiter.main(["--yes"]) == 1
    assert len(json.loads(cache_path(stub_pipeline).read_text())["evaluations"]) == 2

    monkeypatch.setattr(arbiter, "save_results", original_save)
    forbid_paid_calls(monkeypatch)
    assert arbiter.main([]) == 0
    assert (
        len(json.loads((stub_pipeline / arbiter.OUTPUT_FILENAME).read_text())["evaluations"]) == 2
    )


def test_a_deterministic_failure_is_not_billed_twice(stub_pipeline, monkeypatch):
    paid_run(monkeypatch, [arbiter.OUTCOME_OK, arbiter.OUTCOME_INVALID])
    assert arbiter.main(["--yes"]) == 0
    durable = json.loads(cache_path(stub_pipeline).read_text())
    assert [entry["outcome"] for entry in durable["failures"].values()] == ["invalid"]

    # A rerun has nothing to call: the invalid article is remembered.
    forbid_paid_calls(monkeypatch)
    assert arbiter.main(["--yes"]) == 0
    metadata = published(stub_pipeline)["metadata"]
    # The count survives a run that made no call, and is never a verdict.
    assert metadata["failed_evaluations"] == 1
    assert metadata["successful_evaluations"] == 1

    # --retry-failed re-attempts it; a verdict clears the failure.
    paid_run(monkeypatch, [arbiter.OUTCOME_OK])
    assert arbiter.main(["--yes", "--retry-failed"]) == 0
    assert published(stub_pipeline)["metadata"]["failed_evaluations"] == 0
    assert "failures" not in json.loads(cache_path(stub_pipeline).read_text())


def test_consecutive_api_errors_stop_the_run_after_a_checkpoint(stub_pipeline, monkeypatch):
    paid_run(monkeypatch, [arbiter.OUTCOME_ERROR, arbiter.OUTCOME_ERROR])
    assert arbiter.main(["--yes", "--max-consecutive-errors", "1"]) == 1
    # One call, then the breaker; transport errors are not remembered.
    assert "failures" not in json.loads(cache_path(stub_pipeline).read_text())


def test_second_arbiter_session_fails_before_loading_or_spending(stub_pipeline, monkeypatch):
    def fail(revision=None):
        raise AssertionError("a concurrent arbiter must not load its own stale cache")

    monkeypatch.setattr(arbiter, "load_dataset_records", fail)
    with publication_lock(stub_pipeline / ".staging" / "arbiter-v2"):
        assert arbiter.main(["--yes"]) == 2


def test_dry_run_does_not_write_a_durable_cache(stub_pipeline):
    assert arbiter.main(["--dry-run"]) == 0
    assert not cache_path(stub_pipeline).exists()


def test_the_published_cost_record_carries_the_sdk_that_spent_it(stub_pipeline, monkeypatch):
    complete_run(monkeypatch)
    # paid_run's stub records no usage, so no call is billed and no SDK stamped.
    assert "sdk_versions" not in published(stub_pipeline)["metadata"]
