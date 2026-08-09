from __future__ import annotations

from pathlib import Path
from typing import Any

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
