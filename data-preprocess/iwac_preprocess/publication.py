"""Stage and validate a generation before a recoverable flat-file promotion.

The deployment build refuses a pending journal. A killed publisher is recovered
on the next run; caught failures roll back immediately. Production serving uses
immutable release directories created from the validated build artifact.

Every writer of ``static/data/`` goes through here: ``data-fetch.py`` with its
whole generation, and the extreme-analysis, places, basemap and panel-arbiter
exports with their own files. They share one writer lock, so two exports can
never interleave a mixed set, and each validates what it staged before any byte
of the published set changes.

The lock and the stage live in a *staging directory* beside ``static/``, never
inside it. Everything under ``static/`` is copied verbatim into the Pages
artifact, so a lock file there was published with the site, and a stage left
behind by a killed run would have shipped a second copy of the generation.
The staging directory must sit on the same filesystem as the target so that
``os.replace`` stays an atomic rename.
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from collections.abc import Callable, Iterator, Mapping
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from .serialization import safe_save_json, save_json

JOURNAL = ".generation-pending.json"
BACKUP = ".generation-backup"
LOCK = ".iwac-generation.lock"


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


@contextmanager
def publication_lock(staging_dir: Path, *, blocking: bool = False) -> Iterator[None]:
    """Hold the exclusive writer lock; the OS releases it even if the run is killed.

    Non-blocking by default, so a second export fails at once rather than
    queueing behind a long one. The panel arbiter saves every few paid
    evaluations and must not lose them to a concurrent export, so it waits.
    """
    staging_dir.mkdir(parents=True, exist_ok=True)
    path = staging_dir / LOCK
    with path.open("a+b") as lock:
        lock.seek(0)
        if not lock.read(1):
            lock.write(b"0")
            lock.flush()
        lock.seek(0)
        if os.name == "nt":
            import msvcrt

            mode = msvcrt.LK_LOCK if blocking else msvcrt.LK_NBLCK
            msvcrt.locking(lock.fileno(), mode, 1)
        else:
            import fcntl

            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | (0 if blocking else fcntl.LOCK_NB))
        try:
            yield
        finally:
            lock.seek(0)
            if os.name == "nt":
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


@contextmanager
def staged_publication(
    target: Path, staging_dir: Path, *, blocking: bool = False
) -> Iterator[Path]:
    """Lock, recover any interrupted publication, and yield an empty stage.

    The stage is a fresh directory inside ``staging_dir`` and is removed on the
    way out, whether or not the caller published it.
    """
    with publication_lock(staging_dir, blocking=blocking):
        recover_publication(target)
        with tempfile.TemporaryDirectory(prefix="stage-", dir=staging_dir) as stage:
            yield Path(stage)


def publish_json_files(
    target: Path,
    staging_dir: Path,
    payloads: Mapping[str, Any],
    *,
    indent: int | None = 2,
    validate: Callable[[Path], None] | None = None,
    blocking: bool = False,
) -> None:
    """Write ``payloads`` to a stage, validate it, then promote them together.

    ``validate`` receives the stage directory holding only these files; it
    raises to abort, and the published set is left exactly as it was.
    """
    names = [_safe_name(name) for name in payloads]
    with staged_publication(target, staging_dir, blocking=blocking) as stage:
        for name in names:
            safe_save_json(payloads[name], stage / name, indent=indent)
        if validate is not None:
            validate(stage)
        publish_generation(stage, target, names)
