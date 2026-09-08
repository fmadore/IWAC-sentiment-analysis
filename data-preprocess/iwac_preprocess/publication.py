"""Stage and validate a generation before a recoverable flat-file promotion.

The deployment build refuses a pending journal. A killed publisher is recovered
on the next run; caught failures roll back immediately. Production serving uses
immutable release directories created from the validated build artifact.
"""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

from .serialization import save_json

JOURNAL = ".generation-pending.json"
BACKUP = ".generation-backup"


def _safe_name(name: str) -> str:
    if Path(name).name != name or name in {".", ".."} or "/" in name or "\\" in name:
        raise ValueError(f"Unsafe publication filename: {name}")
    return name


def recover_publication(target: Path) -> None:
    target = target.resolve()
    journal = target / JOURNAL
    if not journal.exists():
        return
    state = json.loads(journal.read_text(encoding="utf-8"))
    backup = target / BACKUP
    for entry in state["files"]:
        name = _safe_name(entry["name"])
        if entry["existed"]:
            # Backups are complete before the journal is published.
            shutil.copy2(backup / name, target / name)
        else:
            (target / name).unlink(missing_ok=True)
    journal.unlink()
    _remove_backup(target)


def _remove_backup(target: Path) -> None:
    backup = (target / BACKUP).resolve()
    if backup.parent != target.resolve() or backup.name != BACKUP:
        raise ValueError("Backup escaped publication directory")
    if backup.exists():
        shutil.rmtree(backup)


def publish_generation(stage: Path, target: Path, names: list[str]) -> None:
    """Promote validated files with manifest last; callers hold the writer lock."""
    target = target.resolve()
    target.mkdir(parents=True, exist_ok=True)
    recover_publication(target)
    names = [_safe_name(name) for name in names]
    _remove_backup(target)
    backup = target / BACKUP
    backup.mkdir()
    entries = []
    for name in names:
        if not (stage / name).is_file():
            raise ValueError(f"Staged file missing: {name}")
        existed = (target / name).is_file()
        if existed:
            shutil.copy2(target / name, backup / name)
        entries.append({"name": name, "existed": existed})
    save_json({"files": entries}, target / JOURNAL)
    try:
        for name in names:
            os.replace(stage / name, target / name)
    except BaseException:
        recover_publication(target)
        raise
    # Once all replacements are durable enough for the normal file writer's
    # guarantees, removing the journal commits the set for the build.
    (target / JOURNAL).unlink()
    _remove_backup(target)
