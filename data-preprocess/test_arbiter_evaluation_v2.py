"""Contract tests for the panel arbiter boundary, without API calls.

Everything the paid run depends on is exercised here: which articles are
selected, which ones a cap keeps, that the blind permutation survives an
incremental run, that the prompt stays blind, that a bad response is not
retried, and that `--dry-run` never reaches the client.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from iwac_preprocess import CONTRACT_V2
from pydantic import ValidationError


def load_module():
    path = Path(__file__).with_name("arbiter-evaluation-v2.py")
    spec = importlib.util.spec_from_file_location("iwac_arbiter_evaluation_v2", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


arbiter = load_module()
MODEL_IDS = arbiter.MODEL_IDS
# One label per contract model, in contract order. Every fixture below derives
# its labels from this rather than spelling out a/b/c, so growing the panel is a
# one-line change here instead of a rewrite.
PERMUTATION = dict(zip(arbiter.BLIND_LABELS, MODEL_IDS, strict=True))


def rotated_permutation(offset: int = 1) -> dict[str, str]:
    """A permutation that is deliberately *not* the contract order."""
    rotated = MODEL_IDS[offset:] + MODEL_IDS[:offset]
    return dict(zip(arbiter.BLIND_LABELS, rotated, strict=True))


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def record(article_id: int, analyses: dict[str, tuple[str, str, str]]) -> dict:
    """Build one Hugging Face row from (polarity, subjectivity, centrality)."""
    row: dict = {
        "o:id": article_id,
        "title": f"Article {article_id}",
        "newspaper": "Le Journal",
        "country": "Bénin",
        "pub_date": "2020-01-01",
    }
    for model_id, (polarity, subjectivity, centrality) in analyses.items():
        row[CONTRACT_V2.sentiment_column(model_id, "polarite")] = polarity
        row[CONTRACT_V2.sentiment_column(model_id, "subjectivite_score")] = subjectivity
        row[CONTRACT_V2.sentiment_column(model_id, "centralite_islam_musulmans")] = centrality
        for suffix in CONTRACT_V2.justification_suffixes:
            row[CONTRACT_V2.sentiment_column(model_id, suffix)] = f"{model_id} {suffix}"
    return row


def uniform(polarity="Neutre", subjectivity="Mixte", centrality="Central") -> dict:
    return {model_id: (polarity, subjectivity, centrality) for model_id in MODEL_IDS}


def spread_of(polarities: list[str]) -> dict:
    analyses = dict(uniform())
    for model_id, polarity in zip(MODEL_IDS, polarities, strict=True):
        analyses[model_id] = (polarity, "Mixte", "Central")
    return analyses


def selected_ids(records: list[dict]) -> set[str]:
    return {str(article["o:id"]) for article in arbiter.find_three_way_conflicts(records)}


# ---------------------------------------------------------------------------
# Selection
# ---------------------------------------------------------------------------


PANEL_AT_THRESHOLD = ["Positif", "Neutre", "Très négatif", "Neutre", "Négatif"]
PANEL_BELOW_THRESHOLD = ["Neutre", "Négatif", "Très négatif", "Neutre", "Négatif"]
PANEL_FULL_FLIP = ["Très positif", "Neutre", "Très négatif", "Neutre", "Positif"]


def test_spread_at_the_threshold_is_selected_and_below_it_is_not():
    # Positif (4) .. Très négatif (1) is a spread of exactly 3.
    at_threshold = record(1, spread_of(PANEL_AT_THRESHOLD))
    # Neutre (3) .. Très négatif (1) is 2.
    below = record(2, spread_of(PANEL_BELOW_THRESHOLD))
    assert selected_ids([at_threshold, below]) == {"1"}


def test_a_non_comparable_verdict_excludes_the_row():
    """`Non applicable` means the task does not apply, not a sixth polarity."""
    analyses = spread_of(PANEL_AT_THRESHOLD)
    analyses[MODEL_IDS[0]] = ("Non applicable", "Mixte", "Central")
    assert selected_ids([record(1, analyses)]) == set()

    analyses = spread_of(PANEL_AT_THRESHOLD)
    analyses[MODEL_IDS[1]] = ("Positif", "Mixte", "Non abordé")
    assert selected_ids([record(2, analyses)]) == set()

    # The rule is the whole panel's, not the first three models': a single
    # abstention anywhere in it excludes the row.
    analyses = spread_of(PANEL_AT_THRESHOLD)
    analyses[MODEL_IDS[-1]] = ("Non applicable", "Mixte", "Central")
    assert selected_ids([record(3, analyses)]) == set()


def test_a_declined_subjectivity_never_reads_as_agreement():
    """One missing score drops the dimension; it does not make the spread 0."""
    analyses = {
        MODEL_IDS[0]: ("Neutre", "Très objectif", "Central"),
        MODEL_IDS[1]: ("Neutre", "Très subjectif", "Central"),
        MODEL_IDS[2]: ("Neutre", "", "Central"),  # declined upstream
        MODEL_IDS[3]: ("Neutre", "Mixte", "Central"),
        MODEL_IDS[4]: ("Neutre", "Mixte", "Central"),
    }
    # Without the declined model the subjectivity spread would be 4 and the row
    # would qualify; with it the dimension contributes nothing and nothing else
    # disagrees, so the row is not selected.
    assert selected_ids([record(1, analyses)]) == set()

    scored = dict(analyses)
    scored[MODEL_IDS[2]] = ("Neutre", "Mixte", "Central")
    assert selected_ids([record(2, scored)]) == {"2"}


def test_selection_carries_the_analyses_and_spread_the_fingerprint_hashes():
    article = arbiter.find_three_way_conflicts([record(1, spread_of(PANEL_AT_THRESHOLD))])[0]
    assert set(article["analyses"]) == set(MODEL_IDS)
    assert article["spread"]["has_significant_spread"] is True
    # Subjectivity is stored as the shared 1-5 rank, not the upstream label.
    assert article["analyses"][MODEL_IDS[0]]["subjectivite_score"] == 3
    assert "OCR" not in article


# ---------------------------------------------------------------------------
# --dimensions / --threshold
# ---------------------------------------------------------------------------


def subjectivity_only_conflict(article_id: int) -> dict:
    """Models agree on polarity and centrality, disagree only on subjectivity."""
    return record(
        article_id,
        {
            MODEL_IDS[0]: ("Neutre", "Très objectif", "Central"),
            MODEL_IDS[1]: ("Neutre", "Très subjectif", "Central"),
            MODEL_IDS[2]: ("Neutre", "Mixte", "Central"),
            MODEL_IDS[3]: ("Neutre", "Plutôt objectif", "Central"),
            MODEL_IDS[4]: ("Neutre", "Mixte", "Central"),
        },
    )


def polarity_conflict(article_id: int) -> dict:
    return record(article_id, spread_of(PANEL_AT_THRESHOLD))


def test_dimensions_narrows_which_disagreements_are_worth_arbitrating():
    """Subjectivity dominates the corpus; polarity is the substantive question.

    `--dimensions` narrows the *spread* rule only, so the assertions pin
    `--rule spread`. Under the contract's default union a polarity flip is
    selected whatever dimensions are named, which is the next test.
    """
    records = [subjectivity_only_conflict(1), polarity_conflict(2)]
    spread = {"rule": arbiter.RULE_SPREAD}

    everything = arbiter.find_three_way_conflicts(records, **spread)
    assert {str(a["o:id"]) for a in everything} == {"1", "2"}

    polarity_only = arbiter.find_three_way_conflicts(records, dimensions=["polarity"], **spread)
    assert {str(a["o:id"]) for a in polarity_only} == {"2"}

    subjectivity_only = arbiter.find_three_way_conflicts(
        records, dimensions=["subjectivity"], **spread
    )
    assert {str(a["o:id"]) for a in subjectivity_only} == {"1"}


def test_the_valence_rule_ignores_the_dimension_and_threshold_narrowing():
    """A flip is a flip: neither --dimensions nor --threshold can reach it.

    This is the recommended run's rule, so its independence from the spread
    knobs is the property that has to hold.
    """
    records = [subjectivity_only_conflict(1), polarity_conflict(2)]

    for kwargs in ({}, {"dimensions": ["subjectivity"]}, {"threshold": 4}):
        selected = arbiter.find_three_way_conflicts(records, rule=arbiter.RULE_VALENCE, **kwargs)
        assert {str(a["o:id"]) for a in selected} == {"2"}, kwargs
        assert all(article["valence_flip"] for article in selected)


def test_the_union_rule_adds_flips_the_spread_rule_cannot_reach():
    """`Positif` against `Négatif` spans two ranks: eligible, never significant."""
    flip_only = record(
        3,
        {
            MODEL_IDS[0]: ("Positif", "Mixte", "Central"),
            MODEL_IDS[1]: ("Négatif", "Mixte", "Central"),
            MODEL_IDS[2]: ("Neutre", "Mixte", "Central"),
            MODEL_IDS[3]: ("Neutre", "Mixte", "Central"),
            MODEL_IDS[4]: ("Neutre", "Mixte", "Central"),
        },
    )
    assert arbiter.find_three_way_conflicts([flip_only], rule=arbiter.RULE_SPREAD) == []

    selected = arbiter.find_three_way_conflicts([flip_only], rule=arbiter.RULE_UNION)
    assert len(selected) == 1
    assert selected[0]["valence_flip"] is True
    # The dashboard's own rule must be untouched by the wider arbiter frame.
    assert selected[0]["spread"]["has_significant_spread"] is False


def test_a_narrowed_rule_does_not_change_the_stored_spread():
    """So narrowing prunes rows instead of invalidating the survivors' cache."""
    wide = arbiter.find_three_way_conflicts([polarity_conflict(1)])[0]
    narrow = arbiter.find_three_way_conflicts([polarity_conflict(1)], dimensions=["polarity"])[0]
    assert wide["spread"] == narrow["spread"]

    options = {
        "arbiter_model": "claude-opus-5",
        "source_revision": "r1",
        "text_revision": "r2",
        "max_input_chars": arbiter.ARBITER_MAX_INPUT_CHARS,
        "contract": CONTRACT_V2,
    }
    assert arbiter.three_way_cache_fingerprint(
        {**wide, "OCR": "t"}, **options
    ) == arbiter.three_way_cache_fingerprint({**narrow, "OCR": "t"}, **options)


def test_threshold_can_be_raised():
    # Positif (4) .. Très négatif (1) is a spread of exactly 3, so a threshold
    # of 4 must drop it.
    records = [polarity_conflict(1)]
    spread = {"rule": arbiter.RULE_SPREAD}
    assert len(arbiter.find_three_way_conflicts(records, threshold=3, **spread)) == 1
    assert arbiter.find_three_way_conflicts(records, threshold=4, **spread) == []


def test_threshold_cannot_be_lowered_below_the_contract():
    """A looser run would write a file validate_generated_data rejects."""
    with pytest.raises(SystemExit, match="looser than"):
        arbiter.resolve_threshold(2)
    assert arbiter.resolve_threshold(None) == CONTRACT_V2.significant_spread_threshold
    assert arbiter.resolve_threshold(4) == 4


# ---------------------------------------------------------------------------
# --limit
# ---------------------------------------------------------------------------


def articles_with_spread(pairs: list[tuple[str, int]], dimension: str = "polarity") -> list[dict]:
    """Articles carrying their whole disagreement on one dimension."""
    spreads = dict.fromkeys(arbiter.SPREAD_KEYS.values(), 0)
    return [
        {
            "o:id": article_id,
            "spread": {
                **spreads,
                arbiter.SPREAD_KEYS[dimension]: total,
                "total_spread": total,
            },
        }
        for article_id, total in pairs
    ]


def test_limit_keeps_the_widest_disagreements():
    articles = articles_with_spread([("a", 3), ("b", 9), ("c", 5)])
    assert [a["o:id"] for a in arbiter.apply_limit(articles, 2)] == ["b", "c"]


def test_limit_breaks_ties_by_article_id_so_a_capped_run_is_reproducible():
    forward = articles_with_spread([("30", 5), ("10", 5), ("20", 5)])
    reversed_order = list(reversed(forward))
    assert [a["o:id"] for a in arbiter.apply_limit(forward, 2)] == ["10", "20"]
    assert [a["o:id"] for a in arbiter.apply_limit(reversed_order, 2)] == ["10", "20"]


def test_limit_ranks_on_the_selected_dimensions_not_the_total():
    """Otherwise a capped, narrowed run spends its budget on subjectivity.

    `total_spread` sums all three dimensions, so ranking by it under
    `--dimensions polarity` front-loads the articles whose disagreement is
    almost entirely subjectivity — the panel's least reliable dimension, and
    precisely what the narrowed run excluded.
    """
    loud_subjectivity = articles_with_spread([("noisy", 4)], dimension="subjectivity")
    real_polarity = articles_with_spread([("real", 3)], dimension="polarity")
    articles = loud_subjectivity + real_polarity

    assert [a["o:id"] for a in arbiter.apply_limit(articles, 1, ["polarity"])] == ["real"]
    assert [a["o:id"] for a in arbiter.apply_limit(articles, 1, ["subjectivity"])] == ["noisy"]


def test_no_limit_and_a_limit_above_the_count_keep_everything_in_corpus_order():
    articles = articles_with_spread([("a", 3), ("b", 9)])
    assert arbiter.apply_limit(articles, None) == articles
    assert arbiter.apply_limit(articles, 5) == articles


# ---------------------------------------------------------------------------
# Blind permutation
# ---------------------------------------------------------------------------


def test_there_is_one_blind_label_per_panel_model():
    assert len(arbiter.BLIND_LABELS) == len(MODEL_IDS)
    assert arbiter.PREFERENCE_VALUES == (*arbiter.BLIND_LABELS, "multiple", "none")


def test_a_stored_permutation_is_reused_verbatim():
    stored = {"blind_permutation": rotated_permutation()}
    assert arbiter.resolve_blind_permutation(stored, MODEL_IDS) == stored["blind_permutation"]


def test_a_malformed_or_stale_permutation_is_redrawn():
    short = dict(list(PERMUTATION.items())[:-1])
    duplicated = {**PERMUTATION, arbiter.BLIND_LABELS[-1]: MODEL_IDS[0]}
    foreign = {**PERMUTATION, arbiter.BLIND_LABELS[-1]: "chatgpt"}
    for metadata in (
        {},
        {"blind_permutation": short},
        {"blind_permutation": duplicated},
        {"blind_permutation": foreign},
    ):
        drawn = arbiter.resolve_blind_permutation(metadata, MODEL_IDS)
        assert set(drawn) == set(arbiter.BLIND_LABELS)
        assert sorted(drawn.values()) == sorted(MODEL_IDS)


def test_a_panel_that_does_not_fill_the_labels_is_refused_with_a_readable_error():
    """`zip(..., strict=True)` fails here cryptically; the panel size is the bug."""
    with pytest.raises(ValueError, match="bijection"):
        arbiter.resolve_blind_permutation({}, MODEL_IDS[:-1])
    with pytest.raises(ValueError, match="bijection"):
        arbiter.resolve_blind_permutation({}, [*MODEL_IDS, "sixth-model"])


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------


# Justifications carry an opaque per-model marker, never the model's own name:
# the prompt must be checkable for order *and* for blindness at the same time.
MARKERS = {model_id: f"MARKER{index}" for index, model_id in enumerate(MODEL_IDS)}


def prompt_article(text: str = "Texte intégral.") -> dict:
    return {
        "o:id": 1,
        "o:title": "Titre",
        "OCR": text,
        "analyses": {
            model_id: {
                "polarite": "Positif",
                "polarite_justification": f"pol-{MARKERS[model_id]}",
                "subjectivite_score": 3,
                "subjectivite_justification": f"subj-{MARKERS[model_id]}",
                "centralite_islam_musulmans": "Central",
                "centralite_justification": f"cent-{MARKERS[model_id]}",
            }
            for model_id in MODEL_IDS
        },
    }


def test_prompt_binds_each_label_to_its_permuted_analysis():
    """The label is what gets published, so the binding is what must hold.

    The blocks are laid out in `display_order`, not alphabetically, so this
    checks the pairing rather than the sequence: every label appears exactly
    once, carrying the justification of the model the permutation assigned it.
    """
    permutation = rotated_permutation(2)
    prompt = arbiter.create_arbiter_prompt(prompt_article(), permutation)

    for label in arbiter.BLIND_LABELS:
        heading = f"## Analyse {label.upper()} :"
        assert prompt.count(heading) == 1
        block = prompt.split(heading, 1)[1].split("## Analyse", 1)[0]
        assert f"pol-{MARKERS[permutation[label]]}" in block


def test_prompt_order_varies_by_article_so_position_bias_is_not_a_model_effect():
    """A fixed layout would confound the judge's position bias with identity.

    The label -> model map is stable for the whole run, so if the presentation
    order were stable too, one model would hold the first slot on every article
    and no comparison could ever separate the two effects.
    """
    orders = {
        article_id: arbiter.display_order(article_id) for article_id in ("1", "2", "3", "4", "5")
    }
    assert any(order != list(arbiter.BLIND_LABELS) for order in orders.values())
    assert len({tuple(order) for order in orders.values()}) > 1
    for order in orders.values():
        assert sorted(order) == sorted(arbiter.BLIND_LABELS)


def test_prompt_order_is_stable_for_one_article_so_a_rerun_reproduces_it():
    assert arbiter.display_order("2231") == arbiter.display_order("2231")


def test_prompt_says_so_when_the_article_text_is_cut():
    """A silently truncated article is an arbiter scoring an absent conclusion."""
    short = arbiter.create_arbiter_prompt(prompt_article("court"), PERMUTATION)
    assert "Texte tronqué" not in short

    long = arbiter.create_arbiter_prompt(
        prompt_article("a" * (arbiter.ARBITER_MAX_INPUT_CHARS + 1)), PERMUTATION
    )
    assert "Texte tronqué" in long


def test_prompt_never_names_a_model():
    """Blindness is the whole point: a leaked id would bias every verdict."""
    prompt = arbiter.create_arbiter_prompt(prompt_article(), PERMUTATION)
    for model_id in MODEL_IDS:
        assert model_id not in prompt
        assert CONTRACT_V2.model_names[model_id] not in prompt
        assert CONTRACT_V2.analysis_models[model_id] not in prompt


def test_prompt_renders_subjectivity_with_the_v2_label_wording():
    prompt = arbiter.create_arbiter_prompt(prompt_article(), PERMUTATION)
    assert "**Subjectivité :** Mixte" in prompt
    assert "**Subjectivité :** 3" not in prompt


def test_prompt_truncates_article_text_to_the_paid_input_limit():
    marker = "end-marker"
    text = "a" * (arbiter.ARBITER_MAX_INPUT_CHARS + 10) + marker
    prompt = arbiter.create_arbiter_prompt(prompt_article(text), PERMUTATION)
    assert marker not in prompt
    assert "a" * arbiter.ARBITER_MAX_INPUT_CHARS in prompt


# ---------------------------------------------------------------------------
# The paid call
# ---------------------------------------------------------------------------


class StubClient:
    """Minimal stand-in for `anthropic.Anthropic` recording every call."""

    def __init__(self, outcome):
        self.outcome = outcome
        self.calls: list[dict] = []
        self.messages = self

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        if isinstance(self.outcome, Exception):
            raise self.outcome
        return self.outcome


def valid_response() -> arbiter.ArbiterResponseV2:
    verdict = {
        "justification": "Justification",
        "preferred": "b",
        "verdict_explanation": "Explication",
    }
    return arbiter.ArbiterResponseV2.model_validate(
        {
            "polarity": {**verdict, "arbiter_score": "Positif"},
            "subjectivity": {**verdict, "arbiter_score": "Plutôt subjectif"},
            "centrality": {**verdict, "arbiter_score": "Central"},
            "overall_winner": "b",
            "overall_explanation": "Explication générale",
            "confidence_level": "high",
        }
    )


def message(parsed, stop_reason="end_turn", **extra):
    return SimpleNamespace(parsed_output=parsed, stop_reason=stop_reason, **extra)


def test_every_blind_label_is_an_accepted_preference():
    """A verdict naming Analyse D or E must parse, or the panel is unusable."""
    for label in arbiter.BLIND_LABELS:
        verdict = {
            "justification": "Justification",
            "preferred": label,
            "verdict_explanation": "Explication",
        }
        parsed = arbiter.ArbiterResponseV2.model_validate(
            {
                "polarity": {**verdict, "arbiter_score": "Positif"},
                "subjectivity": {**verdict, "arbiter_score": "Mixte"},
                "centrality": {**verdict, "arbiter_score": "Central"},
                "overall_winner": label,
                "overall_explanation": "Explication générale",
                "confidence_level": "high",
            }
        )
        assert parsed.overall_winner == label


def test_response_schema_rejects_a_label_no_analysis_carries():
    with pytest.raises(ValidationError):
        arbiter.ArbiterResponseV2.model_validate(
            {
                "polarity": {
                    "arbiter_score": "Positif",
                    "justification": "j",
                    "preferred": "f",
                    "verdict_explanation": "e",
                },
                "subjectivity": {
                    "arbiter_score": "Mixte",
                    "justification": "j",
                    "preferred": "a",
                    "verdict_explanation": "e",
                },
                "centrality": {
                    "arbiter_score": "Central",
                    "justification": "j",
                    "preferred": "a",
                    "verdict_explanation": "e",
                },
                "overall_winner": "a",
                "overall_explanation": "e",
                "confidence_level": "high",
            }
        )


def test_response_schema_rejects_an_out_of_contract_score():
    with pytest.raises(ValidationError):
        arbiter.ArbiterResponseV2.model_validate(
            {
                "polarity": {
                    "arbiter_score": "Assez positif",
                    "justification": "j",
                    "preferred": "a",
                    "verdict_explanation": "e",
                },
                "subjectivity": {
                    "arbiter_score": "Mixte",
                    "justification": "j",
                    "preferred": "a",
                    "verdict_explanation": "e",
                },
                "centrality": {
                    "arbiter_score": "Central",
                    "justification": "j",
                    "preferred": "a",
                    "verdict_explanation": "e",
                },
                "overall_winner": "a",
                "overall_explanation": "e",
                "confidence_level": "high",
            }
        )


def test_a_valid_response_is_stored_with_subjectivity_as_the_shared_rank():
    client = StubClient(message(valid_response()))
    result = arbiter.evaluate_with_arbiter(client, prompt_article(), PERMUTATION)
    assert result is not None
    assert result.subjectivity.score == "4"  # "Plutôt subjectif"
    assert result.polarity.score == "Positif"
    assert result.overall_winner == "b"


def test_the_request_carries_no_sampling_parameters_and_no_thinking_block():
    """Both are rejected on Opus 5; depth is controlled with effort instead."""
    client = StubClient(message(valid_response()))
    arbiter.evaluate_with_arbiter(client, prompt_article(), PERMUTATION, effort="low")
    (sent,) = client.calls
    assert sent["model"] == arbiter.ARBITER_MODEL
    assert sent["output_config"] == {"effort": "low"}
    assert "temperature" not in sent
    assert "thinking" not in sent
    assert sent["output_format"] is arbiter.ArbiterResponseV2


def test_the_system_prefix_is_sent_as_one_cached_block():
    """It is identical on every call and above Opus 5's 512-token minimum.

    Sent as a bare string it would be re-billed in full 301 times; the marker is
    what turns it into one write and 300 reads at a tenth of the price.
    """
    client = StubClient(message(valid_response()))
    arbiter.evaluate_with_arbiter(client, prompt_article(), PERMUTATION)
    (sent,) = client.calls
    assert sent["system"] == [
        {
            "type": "text",
            "text": arbiter.SYSTEM_INSTRUCTION,
            "cache_control": {"type": "ephemeral"},
        }
    ]


def test_the_estimate_prices_the_cached_prefix_once():
    """A run that ignored the cache would quote a third more input than it costs."""
    articles = [prompt_article() for _ in range(10)]
    estimate = arbiter.estimate_cost(articles, PERMUTATION, "medium")

    assert estimate["billable_input_tokens"] < estimate["input_tokens"]
    assert estimate["cache_saving_usd"] > 0
    # One write plus nine reads, never ten full copies. The prefix is the
    # measured one — schema included — not just the system instruction, which is
    # what the run's `cache_read_input_tokens` showed it to be.
    prefix = arbiter.CACHED_PREFIX_TOKENS
    assert prefix > len(arbiter.SYSTEM_INSTRUCTION) / arbiter.ESTIMATE_CHARS_PER_TOKEN
    saved = estimate["input_tokens"] - estimate["billable_input_tokens"]
    assert saved == pytest.approx(
        10 * prefix
        - prefix * arbiter.CACHE_WRITE_MULTIPLIER
        - 9 * prefix * arbiter.CACHE_READ_MULTIPLIER,
        rel=0.01,
    )


def test_the_estimate_handles_an_empty_selection():
    assert arbiter.estimate_cost([], {}, "medium")["usd"] == 0


def test_usage_is_recorded_so_the_estimate_can_be_checked_against_reality():
    """Thinking tokens leave no trace in the published verdicts.

    Without `response.usage` the file records what the model *said* and nothing
    about what it cost, so the dry-run assumption could never be falsified.
    """
    usage = SimpleNamespace(
        input_tokens=100,
        output_tokens=2000,
        cache_creation_input_tokens=1463,
        cache_read_input_tokens=0,
    )
    client = StubClient(message(valid_response(), usage=usage))
    totals = arbiter.UsageTotals()
    arbiter.evaluate_with_arbiter(client, prompt_article(), PERMUTATION, usage=totals)

    assert totals.calls == 1
    assert totals.output_tokens == 2000
    assert totals.cache_creation_input_tokens == 1463
    assert totals.as_metadata()["output_tokens_per_call"] == 2000


def test_a_failed_call_is_still_billed_and_still_counted():
    """A refusal costs money; accounting that skipped it would understate the run."""
    usage = SimpleNamespace(
        input_tokens=100,
        output_tokens=50,
        cache_creation_input_tokens=0,
        cache_read_input_tokens=1463,
    )
    client = StubClient(message(valid_response(), stop_reason="refusal", usage=usage))
    totals = arbiter.UsageTotals()
    assert (
        arbiter.evaluate_with_arbiter(client, prompt_article(), PERMUTATION, usage=totals) is None
    )
    assert totals.calls == 1
    assert totals.cache_read_input_tokens == 1463


def test_usage_metadata_is_empty_when_nothing_was_spent():
    assert arbiter.UsageTotals().as_metadata() == {}


def test_a_schema_violation_is_not_retried():
    try:
        arbiter.ArbiterResponseV2.model_validate({})
    except ValidationError as error:
        client = StubClient(error)
    assert arbiter.evaluate_with_arbiter(client, prompt_article(), PERMUTATION) is None
    assert len(client.calls) == 1


def test_a_refusal_is_recorded_as_a_failure_and_not_retried():
    client = StubClient(
        message(None, stop_reason="refusal", stop_details=SimpleNamespace(category="cyber"))
    )
    assert arbiter.evaluate_with_arbiter(client, prompt_article(), PERMUTATION) is None
    assert len(client.calls) == 1


def test_a_truncated_response_is_a_failure_rather_than_a_partial_verdict():
    client = StubClient(message(None, stop_reason="max_tokens"))
    assert arbiter.evaluate_with_arbiter(client, prompt_article(), PERMUTATION) is None


def test_an_article_without_text_is_never_sent():
    client = StubClient(message(valid_response()))
    article = {**prompt_article(), "OCR": ""}
    assert arbiter.evaluate_with_arbiter(client, article, PERMUTATION) is None
    assert client.calls == []


# ---------------------------------------------------------------------------
# main(): dry run and the published envelope
# ---------------------------------------------------------------------------


@pytest.fixture
def stub_pipeline(monkeypatch, tmp_path):
    records = [
        record(1, spread_of(PANEL_AT_THRESHOLD)),
        record(2, spread_of(PANEL_FULL_FLIP)),
        record(3, spread_of(["Neutre"] * len(MODEL_IDS))),  # not eligible
    ]
    monkeypatch.setattr(arbiter, "load_dataset_records", lambda *a, **k: records)
    monkeypatch.setattr(
        arbiter, "load_iwac_full_text", lambda: {"1": "Texte un.", "2": "Texte deux."}
    )
    monkeypatch.setattr(arbiter, "get_webapp_data_dir", lambda: str(tmp_path))
    monkeypatch.setattr(
        arbiter, "get_source_revision", lambda repo=None: "rev-scores" if repo else None
    )

    def refuse_client(api_key):
        raise AssertionError("no client may be constructed without an explicit paid run")

    monkeypatch.setattr(arbiter, "create_anthropic_client", refuse_client)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    return tmp_path


def test_dry_run_makes_no_api_call_and_writes_nothing(stub_pipeline, caplog):
    with caplog.at_level("INFO"):
        assert arbiter.main(["--dry-run"]) == 0
    assert not (stub_pipeline / arbiter.OUTPUT_FILENAME).exists()
    assert "2 selected" in caplog.text


def test_dry_run_honours_the_limit(stub_pipeline, caplog):
    with caplog.at_level("INFO"):
        assert arbiter.main(["--dry-run", "--limit", "1"]) == 0
    assert "1 selected" in caplog.text


def test_dry_run_honours_the_dimension_filter(stub_pipeline, caplog):
    """Both stub articles disagree on polarity only, so subjectivity selects none.

    Pinned to `--rule spread`: the dimension filter narrows that rule alone, and
    a polarity flip stays eligible under the contract's default union.
    """
    with caplog.at_level("INFO"):
        assert arbiter.main(["--dry-run", "--rule", "spread", "--dimensions", "subjectivity"]) == 0
    assert "0 selected" in caplog.text


def test_a_threshold_below_the_contract_exits_nonzero_before_spending(stub_pipeline):
    assert arbiter.main(["--dry-run", "--threshold", "1"]) == 2


def test_prune_cache_only_publishes_the_envelope_the_validator_expects(stub_pipeline):
    assert arbiter.main(["--prune-cache-only"]) == 0

    payload = json.loads((stub_pipeline / arbiter.OUTPUT_FILENAME).read_text(encoding="utf-8"))
    metadata = payload["metadata"]
    assert payload["evaluations"] == []
    assert metadata["successful_evaluations"] == 0
    # The mode is the contract's, not a literal the script owns: the browser
    # reads the same key to pick its arbiter view.
    assert metadata["mode"] == CONTRACT_V2.arbiter["mode"] == "panel"
    assert metadata["models"] == MODEL_IDS
    assert len(metadata["models"]) == 5
    assert metadata["arbiter_model"] == arbiter.ARBITER_MODEL
    # The five-model prompt is not the three-model one, and v2.2.0 is not
    # v2.1.0: the analyses are now laid out in a per-article order and the
    # instruction says so. A cached verdict from older wording must not be
    # adopted silently, which is what makes this literal worth spelling out.
    assert metadata["prompt_version"] == CONTRACT_V2.arbiter["promptVersion"] == "v2.2.0"
    assert metadata["contract_schema_version"] == CONTRACT_V2.schema_version
    assert metadata["analysis_version"] == "v2"
    assert sorted(metadata["blind_permutation"].values()) == sorted(MODEL_IDS)
    assert set(metadata["blind_permutation"]) == set(arbiter.BLIND_LABELS)
    assert metadata["selection"]["eligible_articles"] == 2
    # The published file has to document the rule this run actually used, not
    # just the contract's.
    assert metadata["selection"]["dimensions"] == list(arbiter.DIMENSIONS)
    assert metadata["selection"]["threshold"] == CONTRACT_V2.significant_spread_threshold
    assert metadata["source"]["scores"]["repository"] == arbiter.HF_REPO_ID
    assert metadata["source"]["text"]["repository"] == arbiter.HF_FULL_REPO_ID
    # No OCR is ever serialised — the mirror's text stays private.
    assert "Texte un." not in json.dumps(payload, ensure_ascii=False)


def test_an_incremental_run_reuses_the_permutation_it_published(stub_pipeline):
    assert arbiter.main(["--prune-cache-only"]) == 0
    published = json.loads((stub_pipeline / arbiter.OUTPUT_FILENAME).read_text(encoding="utf-8"))
    first = published["metadata"]["blind_permutation"]

    assert arbiter.main(["--prune-cache-only"]) == 0
    republished = json.loads((stub_pipeline / arbiter.OUTPUT_FILENAME).read_text(encoding="utf-8"))
    assert republished["metadata"]["blind_permutation"] == first


def test_missing_article_text_is_reported_and_the_article_is_dropped(
    stub_pipeline, monkeypatch, caplog
):
    monkeypatch.setattr(arbiter, "load_iwac_full_text", lambda: {"1": "Texte un."})
    with caplog.at_level("INFO"):
        assert arbiter.main(["--prune-cache-only"]) == 0
    payload = json.loads((stub_pipeline / arbiter.OUTPUT_FILENAME).read_text(encoding="utf-8"))
    assert payload["metadata"]["articles_without_text"] == 1
    assert payload["metadata"]["selection"]["selected_articles"] == 1


# ---------------------------------------------------------------------------
# The methodology card must show the prompt that was actually sent
# ---------------------------------------------------------------------------

PROMPTS_TS = (
    Path(__file__).resolve().parents[1]
    / "ma-visualisation-sentiments"
    / "src"
    / "lib"
    / "data"
    / "prompts.ts"
)


def read_ts_template(name: str) -> str:
    """Extract one exported TypeScript template literal, unescaped."""
    source = PROMPTS_TS.read_text(encoding="utf-8")
    opening = f"export const {name} = `"
    start = source.index(opening) + len(opening)
    end = start
    while True:
        end = source.index("`", end)
        if source[end - 1] != "\\":
            break
        end += 1
    return source[start:end].replace("\\`", "`")


def test_the_published_system_instruction_is_the_one_that_is_sent():
    """A methodology card that paraphrases the prompt is worse than none.

    The card claims to show the exact instruction. Nothing else keeps the two
    copies in step, and a drift is invisible in both languages.
    """
    assert read_ts_template("ARBITER_SYSTEM_INSTRUCTION_V2") == arbiter.SYSTEM_INSTRUCTION


def test_the_published_user_template_matches_the_prompt_the_script_assembles():
    """The template carries placeholders, so compare its fixed scaffolding."""
    template = read_ts_template("ARBITER_USER_PROMPT_TEMPLATE_V2")
    rendered = arbiter.create_arbiter_prompt(prompt_article(), PERMUTATION)

    for label in arbiter.BLIND_LABELS:
        assert f"## Analyse {label.upper()} :" in template
        assert f"## Analyse {label.upper()} :" in rendered

    for line in template.splitlines():
        stripped = line.strip()
        # Skip lines that are only placeholders or carry a substituted value.
        if not stripped or "{" in stripped:
            continue
        assert stripped in rendered, f"template line not produced by the script: {stripped!r}"


def test_main_returns_nonzero_when_the_source_cannot_be_loaded(monkeypatch):
    def fail():
        raise OSError("offline")

    monkeypatch.setattr(arbiter, "load_dataset_records", fail)
    assert arbiter.main(["--dry-run"]) == 2


def test_main_returns_nonzero_when_the_private_mirror_is_unavailable(monkeypatch, tmp_path):
    monkeypatch.setattr(arbiter, "load_dataset_records", lambda *a, **k: [])
    monkeypatch.setattr(arbiter, "get_webapp_data_dir", lambda: str(tmp_path))

    def fail():
        raise RuntimeError("HF_TOKEN is required")

    monkeypatch.setattr(arbiter, "load_iwac_full_text", fail)
    assert arbiter.main(["--dry-run"]) == 2
