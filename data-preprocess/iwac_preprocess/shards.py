"""Which justification shard an article's prose lives in.

The browser fetches exactly one shard per article detail, computed by
``justificationShard`` in ``src/lib/domain/sentimentContract.ts``; the pipeline
places each row with this function; the validator checks every row against it.
The three must agree byte for byte, which is why both languages are held to the
same cases in ``src/lib/data/justification-shard-fixtures.json``.

Canonical decimal ids (ASCII digits only) take the exact decimal remainder, which
is every Omeka id. Anything else — a sign, an exponent, a hex or underscore
literal, whitespace, an empty string — is hashed with 32-bit FNV-1a over its
UTF-8 bytes. The two languages' number parsers disagree on every one of those
inputs, so neither parser is trusted with them.
"""

from __future__ import annotations

import re

_CANONICAL_ID = re.compile(r"[0-9]+")
_FNV_OFFSET = 2166136261
_FNV_PRIME = 16777619


def justification_shard(article_id: str | int, shard_count: int) -> int:
    """Return the shard holding ``article_id``'s justification prose."""
    if shard_count < 1:
        raise ValueError(f"shard_count must be positive, got {shard_count}")
    text = str(article_id)
    if _CANONICAL_ID.fullmatch(text):
        return int(text) % shard_count
    value = _FNV_OFFSET
    for byte in text.encode("utf-8"):
        value ^= byte
        value = (value * _FNV_PRIME) & 0xFFFFFFFF
    return value % shard_count
