"""Crash-safe serialization for generated web assets."""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


def save_json(data: Any, filepath: str | os.PathLike[str], indent: int | None = 2) -> None:
    """Atomically serialize JSON to ``filepath`` using a sibling temp file."""
    target = Path(filepath)
    target.parent.mkdir(parents=True, exist_ok=True)
    separators = (",", ":") if indent is None else None
    temp_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=target.parent,
            prefix=f".{target.name}.",
            suffix=".tmp",
            delete=False,
        ) as handle:
            temp_path = Path(handle.name)
            json.dump(data, handle, ensure_ascii=False, indent=indent, separators=separators)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, target)
    except Exception:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
        raise


def safe_save_json(
    data: Any,
    filepath: str | os.PathLike[str],
    max_retries: int = 3,
    indent: int | None = 2,
) -> None:
    """Retry transient filesystem failures around the atomic JSON writer."""
    for attempt in range(1, max_retries + 1):
        try:
            save_json(data, filepath, indent=indent)
            return
        except OSError:
            if attempt == max_retries:
                raise
            time.sleep(2**attempt)


def write_generation_manifest(
    filepath: str | os.PathLike[str],
    generated_files: list[str | os.PathLike[str]],
    *,
    contract_schema_version: str,
    analysis_version: str,
    source_repository: str,
    source_revision: str | None,
) -> None:
    """Publish checksums and provenance after every data file is complete."""
    target = Path(filepath)
    entries: dict[str, dict[str, int | str]] = {}
    for generated_file in generated_files:
        path = Path(generated_file)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        entries[path.name] = {"bytes": path.stat().st_size, "sha256": digest}

    safe_save_json(
        {
            "schema_version": contract_schema_version,
            "analysis_version": analysis_version,
            "generated": datetime.now(UTC).isoformat(),
            "source": {"repository": source_repository, "revision": source_revision},
            "files": entries,
        },
        target,
    )
