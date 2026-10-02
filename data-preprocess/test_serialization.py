from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import pytest
from iwac_preprocess import serialization


def test_save_json_forces_lf_newlines(tmp_path: Path, monkeypatch: Any) -> None:
    real_named_temporary_file = serialization.tempfile.NamedTemporaryFile
    captured: dict[str, object] = {}

    def named_temporary_file(**kwargs: object):
        captured.update(kwargs)
        return real_named_temporary_file(**kwargs)

    monkeypatch.setattr(serialization.tempfile, "NamedTemporaryFile", named_temporary_file)

    output = tmp_path / "payload.json"
    serialization.save_json({"rows": [{"id": 1}, {"id": 2}]}, output)

    assert captured["newline"] == "\n"
    assert b"\r\n" not in output.read_bytes()
    assert b"\n" in output.read_bytes()


def write_manifest(directory: Path, **kwargs: Any) -> dict:
    output = directory / "manifest.json"
    serialization.write_generation_manifest(
        output,
        [],
        contract_schema_version="2.1.0",
        analysis_version="v2",
        source_repository="example/corpus",
        source_revision="source-sha",
        **kwargs,
    )
    return json.loads(output.read_text(encoding="utf-8"))


def test_new_manifest_records_the_repository_runtime_lock(tmp_path: Path) -> None:
    manifest = write_manifest(tmp_path)
    assert manifest["environment"]["requirements_lock"] == {
        "file": "requirements.lock",
        "sha256": hashlib.sha256(serialization.RUNTIME_REQUIREMENTS_LOCK.read_bytes()).hexdigest(),
    }


def test_lock_identity_depends_on_exact_bytes_not_checkout_location(tmp_path: Path) -> None:
    first = tmp_path / "first" / "requirements.lock"
    second = tmp_path / "second" / "requirements.lock"
    contents = b"example==1.0 --hash=sha256:abc\n"
    for lock in (first, second):
        lock.parent.mkdir()
        lock.write_bytes(contents)

    environment = write_manifest(tmp_path, requirements_lock=first)["environment"]
    assert write_manifest(tmp_path, requirements_lock=second)["environment"] == environment
    assert environment["requirements_lock"]["sha256"] == hashlib.sha256(contents).hexdigest()
    assert str(tmp_path) not in json.dumps(environment)

    second.write_bytes(contents.replace(b"1.0", b"2.0"))
    assert write_manifest(tmp_path, requirements_lock=second)["environment"] != environment


@pytest.mark.parametrize("missing_lock", [False, True])
def test_manifest_environment_is_optional_without_a_lock(
    tmp_path: Path, missing_lock: bool
) -> None:
    lock = tmp_path / "missing.lock" if missing_lock else None
    manifest = write_manifest(tmp_path, requirements_lock=lock)
    assert "environment" not in manifest
    assert manifest["source"] == {"repository": "example/corpus", "revision": "source-sha"}
