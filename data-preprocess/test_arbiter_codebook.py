"""The arbiter judges with the codebook the annotators were given.

Prompt v2.2.0 gave the judge a short scale reference and four rules of its own,
one of which contradicted the annotation codebook (a bare proper name counted as
`Marginal`; the codebook says it does not count). The rules the two prompts
must share live in one fixture, read here against the Python prompt and the
codebook text in `prompts.ts`, and by `arbiterCodebook.test.ts` in the browser
suite, so neither copy can drift again.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from iwac_preprocess import CONTRACT_V2, arbiter_prompt

DATA = Path(__file__).resolve().parents[1] / "ma-visualisation-sentiments" / "src" / "lib" / "data"
FIXTURE = json.loads((DATA / "arbiter-codebook-fixtures.json").read_text(encoding="utf-8"))


def ts_record_literal(constant: str, key: str) -> str:
    """One language of an exported ``Record<Language, string>`` template literal."""
    source = (DATA / "prompts.ts").read_text(encoding="utf-8")
    start = source.index(f"export const {constant}")
    opening = f"\t{key}: `"
    begin = source.index(opening, start) + len(opening)
    end = begin
    while True:
        end = source.index("`", end)
        if source[end - 1] != "\\":
            break
        end += 1
    return source[begin:end].replace("\\`", "`")


CODEBOOK = ts_record_literal("SENTIMENT_ANALYSIS_PROMPT_V2", "fr")
CURRENT = arbiter_prompt.SYSTEM_INSTRUCTIONS[FIXTURE["promptVersion"]]


def test_the_fixture_names_the_default_prompt():
    assert FIXTURE["promptVersion"] == arbiter_prompt.DEFAULT_PROMPT_VERSION
    assert CONTRACT_V2.arbiter["promptVersion"] == FIXTURE["promptVersion"]
    assert len(FIXTURE["rules"]) >= 30


@pytest.mark.parametrize("rule", FIXTURE["rules"])
def test_every_shared_rule_is_in_the_annotation_codebook(rule):
    assert rule in CODEBOOK


@pytest.mark.parametrize("rule", FIXTURE["rules"])
def test_every_shared_rule_is_in_the_arbiter_prompt(rule):
    assert rule in CURRENT


@pytest.mark.parametrize("rule", FIXTURE["contradicted"])
def test_the_contradicting_rule_is_gone_from_the_new_prompt_only(rule):
    assert rule not in CURRENT
    # Kept, verbatim, in the version the published verdicts were judged under.
    assert rule in arbiter_prompt.SYSTEM_INSTRUCTIONS[arbiter_prompt.PROMPT_V2_2_0]


def test_the_key_demarcations_are_covered():
    """The rules the audit named, spelled out so a trimmed fixture fails loudly."""
    joined = "\n".join(FIXTURE["rules"])
    for marker in (
        "Une religion seulement devinable à partir d'un nom propre ne compte pas.",
        "**Propos rapportés.**",
        "**Faits négatifs ≠ polarité négative.**",
        "**Institutions et pratiques comptent.**",
        "Elle n'est donc jamais « Non abordé »",
        "**Violence armée et sécurité.**",
        "Le compte rendu neutre est le cas ordinaire de la presse d'information",
        "Les opinions **citées et attribuées**",
    ):
        assert marker in joined, marker


def test_every_registered_prompt_keeps_the_blind_contract():
    for text in arbiter_prompt.SYSTEM_INSTRUCTIONS.values():
        assert "cinq modèles d'IA (Analyse A, Analyse B, Analyse C, Analyse D et Analyse E)" in text
        assert '"a", "b", "c", "d", "e", "multiple"' in text
        assert "tiré au hasard pour chaque article" in text


def test_an_unknown_prompt_version_is_refused():
    with pytest.raises(ValueError, match="Unknown arbiter prompt version"):
        arbiter_prompt.system_instruction("v9.9.9")


def test_the_contract_accepts_exactly_the_registered_versions():
    assert set(CONTRACT_V2.arbiter["acceptedPromptVersions"]) == set(arbiter_prompt.PROMPT_VERSIONS)
