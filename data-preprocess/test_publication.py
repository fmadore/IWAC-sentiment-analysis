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
