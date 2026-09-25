import json
from pathlib import Path

import pytest
from iwac_preprocess import publication


def test_failed_promotion_restores_previous_release(tmp_path, monkeypatch):
    target, stage = tmp_path / "data", tmp_path / "stage"
    target.mkdir()
    stage.mkdir()
    (target / "scores.json").write_text("old")
    (stage / "scores.json").write_text("new")
    (stage / "manifest.json").write_text("new manifest")
    replace = publication.os.replace

    def fail_manifest(src, dst):
        if Path(src).name == "manifest.json":
            raise OSError("interrupted")
        return replace(src, dst)

    monkeypatch.setattr(publication.os, "replace", fail_manifest)
    with pytest.raises(OSError):
        publication.publish_generation(stage, target, ["scores.json", "manifest.json"])
    assert (target / "scores.json").read_text() == "old"
    assert not (target / "manifest.json").exists()
    assert not (target / publication.JOURNAL).exists()


def test_promotes_complete_set_with_manifest_last(tmp_path):
    stage, target = tmp_path / "stage", tmp_path / "data"
    stage.mkdir()
    for name in ["scores.json", "manifest.json"]:
        (stage / name).write_text(name)
    publication.publish_generation(stage, target, ["scores.json", "manifest.json"])
    assert (target / "scores.json").read_text() == "scores.json"
    assert not (target / publication.JOURNAL).exists()


def test_next_run_recovers_an_uncaught_process_interruption(tmp_path):
    # State left on disk by a killed process after the first replacement.
    target = tmp_path / "data"
    backup = target / publication.BACKUP
    backup.mkdir(parents=True)
    (backup / "scores.json").write_text("old scores")
    (target / "scores.json").write_text("new scores")
    (target / "new-shard.json").write_text("partial new shard")
    (target / publication.JOURNAL).write_text(
        json.dumps(
            {
                "files": [
                    {"name": "scores.json", "existed": True},
                    {"name": "new-shard.json", "existed": False},
                ]
            }
        )
    )
    publication.recover_publication(target)
    assert (target / "scores.json").read_text() == "old scores"
    assert not (target / "new-shard.json").exists()
    assert not backup.exists()
    publication.recover_publication(target)  # Recovery is idempotent.


def test_a_rejected_stage_leaves_the_published_set_untouched(tmp_path):
    target, staging = tmp_path / "data", tmp_path / "staging"
    target.mkdir()
    (target / "places.json").write_text("published")

    def reject(stage):
        assert json.loads((stage / "places.json").read_text()) == {"new": True}
        raise ValueError("invalid payload")

    with pytest.raises(ValueError):
        publication.publish_json_files(
            target, staging, {"places.json": {"new": True}}, validate=reject
        )
    assert (target / "places.json").read_text() == "published"
    assert not (target / publication.JOURNAL).exists()
    # The stage is cleaned up; only the lock remains in the staging directory.
    assert [path.name for path in staging.iterdir()] == [publication.LOCK]


def test_published_files_land_in_the_target_and_nothing_else_does(tmp_path):
    target, staging = tmp_path / "data", tmp_path / "staging"
    publication.publish_json_files(target, staging, {"a.json": [1], "b.json": [2]}, indent=None)
    assert sorted(path.name for path in target.iterdir()) == ["a.json", "b.json"]
    assert (target / "a.json").read_text() == "[1]"
    assert not (target / publication.LOCK).exists()


def test_a_second_writer_is_refused_while_the_lock_is_held(tmp_path):
    staging = tmp_path / "staging"
    with publication.publication_lock(staging):
        with pytest.raises(BlockingIOError):
            with publication.publication_lock(staging):
                pass
    # Released on exit: the next writer proceeds.
    with publication.publication_lock(staging):
        pass


def test_an_unsafe_payload_name_is_refused_before_anything_is_written(tmp_path):
    with pytest.raises(ValueError):
        publication.publish_json_files(tmp_path / "data", tmp_path / "staging", {"../x.json": 1})
    assert not (tmp_path / "x.json").exists()
