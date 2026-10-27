"""Contract tests for the second panel arbiter, without API calls.

Mirrors `test_arbiter_evaluation_v2.py` for a judge from another developer:
which articles the six-model frame selects, which the judge is shown, that it
never reads its own developer's model, that the Gemini request is structured
and unsampled, that a bad response is not retried, that the dry run prices both
frames without reaching a client, and that the published envelope is the one
the validator expects. The judge-comparison arithmetic is checked here too.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import date
from pathlib import Path
from types import SimpleNamespace

import pytest
from iwac_preprocess import CONTRACT_V2, arbiter_prompt, arbiter_schema, three_way_cache_fingerprint
from iwac_preprocess.arbiter_judges import (
    GEMINI_4_ARGON,
    JUDGES,
    PAID_PROVIDERS,
    TIER_FLEX,
    JudgeUsage,
    Rates,
    estimate_judge_cost,
)
from iwac_preprocess.arbiter_selection import (
    FLIP_NEGATIVE,
    FLIP_POSITIVE,
    find_three_way_conflicts,
    flip_dissenters,
    project_to_panel,
)
from iwac_preprocess.judge_comparison import (
    judge_agreement,
    own_developer_affinity,
    polarity_verdicts,
)
from validate_generated_data import (
    ContractError,
    validate_second_judge_envelope,
    validate_second_judges,
)


def load_module(filename: str, name: str):
    path = Path(__file__).with_name(filename)
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


second = load_module("arbiter-evaluation-v2-second-judge.py", "iwac_arbiter_second_judge")
JUDGE = GEMINI_4_ARGON
FRAME = list(CONTRACT_V2.model_names)
PANEL = second.judge_panel(JUDGE)
PERMUTATION = dict(zip(arbiter_prompt.BLIND_LABELS, PANEL, strict=True))


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def record(article_id: int, polarities: dict[str, str | None]) -> dict:
    """One Hugging Face row; every model not named reads `Neutre`."""
    row: dict = {
        "o:id": article_id,
        "title": f"Article {article_id}",
        "newspaper": "Le Journal",
        "country": "Bénin",
        "pub_date": "2020-01-01",
    }
    for model_id in FRAME:
        polarity = polarities.get(model_id, "Neutre")
        row[CONTRACT_V2.sentiment_column(model_id, "polarite")] = polarity
        row[CONTRACT_V2.sentiment_column(model_id, "subjectivite_score")] = "Mixte"
        row[CONTRACT_V2.sentiment_column(model_id, "centralite_islam_musulmans")] = (
            "Central" if polarity else None
        )
        for suffix in CONTRACT_V2.justification_suffixes:
            row[CONTRACT_V2.sentiment_column(model_id, suffix)] = f"MARK-{model_id} {suffix}"
    return row


# Haiku alone on the negative side: the published panel sees no flip.
HAIKU_ONLY = {"haiku": "Négatif", "luna": "Positif"}
# Mistral Small against Luna: the published panel already flips.
PUBLISHED_FLIP = {"mistral-small": "Négatif", "luna": "Positif"}
# Gemma alone on the positive side: a Google judge cannot see this flip.
GEMMA_ONLY = {"gemma": "Positif", "deepseek": "Négatif", "qwen": "Négatif"}


def frame_rows(records: list[dict]) -> list[dict]:
    return find_three_way_conflicts(records, CONTRACT_V2, rule=second.RULE_VALENCE, model_ids=FRAME)


# ---------------------------------------------------------------------------
# Recusal: the judge never reads its own developer's model
# ---------------------------------------------------------------------------


def test_the_judge_reads_the_generation_minus_its_own_developer():
    assert PANEL == ["luna", "mistral-small", "deepseek", "qwen", "haiku"]
    assert "gemma" not in PANEL


@pytest.mark.parametrize("judge", list(JUDGES.values()), ids=list(JUDGES))
def test_every_registered_judge_recuses_exactly_its_own_developer(judge):
    panel = second.judge_panel(judge)
    recused = CONTRACT_V2.recused_for(judge.developer)
    assert recused and set(recused).isdisjoint(panel)
    assert all(CONTRACT_V2.model_developers[model_id] == judge.developer for model_id in recused)
    assert len(panel) == len(arbiter_prompt.BLIND_LABELS)
    # A second judge is from another developer than the published one.
    assert judge.developer != CONTRACT_V2.arbiter_developer


def test_a_judge_whose_panel_does_not_fill_the_labels_is_refused():
    """A developer with no member would read six models under five labels."""
    contract = json.loads(json.dumps(CONTRACT_V2.contract))
    contract["developers"]["xai"] = {"displayName": "xAI"}
    widened = type(CONTRACT_V2)(contract, "v2")
    stranger = SimpleNamespace(developer="xai", display_name="Grok")
    with pytest.raises(ValueError, match="present exactly 5"):
        second.judge_panel(stranger, widened)


def test_the_second_judge_reuses_the_published_prompt_and_schema():
    """Shared, not copied: the two judges' verdicts must compare field by field."""
    opus = load_module("arbiter-evaluation-v2.py", "iwac_arbiter_evaluation_v2_for_second")
    assert second.SYSTEM_INSTRUCTION is arbiter_prompt.SYSTEM_INSTRUCTION
    assert second.create_arbiter_prompt is arbiter_prompt.create_arbiter_prompt
    assert second.ArbiterResponseV2 is arbiter_schema.ArbiterResponseV2
    assert opus.ArbiterResponseV2 is arbiter_schema.ArbiterResponseV2
    assert opus.convert_response is arbiter_schema.convert_response


# ---------------------------------------------------------------------------
# Selection: the frame is the generation's, the panel is the judge's
# ---------------------------------------------------------------------------


def test_the_published_selection_still_ignores_a_flip_only_haiku_creates():
    """Default model set: the published arbiter's panel, exactly as before."""
    records = [record(1, HAIKU_ONLY), record(2, PUBLISHED_FLIP)]
    published = find_three_way_conflicts(records, CONTRACT_V2, rule=second.RULE_VALENCE)
    assert [str(row["o:id"]) for row in published] == ["2"]
    assert set(published[0]["analyses"]) == set(CONTRACT_V2.arbiter_model_ids)


def test_the_six_model_frame_splits_off_the_flips_only_the_recused_member_creates():
    records = [
        record(1, HAIKU_ONLY),
        record(2, PUBLISHED_FLIP),
        record(3, {"haiku": "Positif", "luna": "Négatif"}),
        record(4, {}),  # no flip anywhere
    ]
    rows, recused_only, summary = second.classify_frame(frame_rows(records))
    assert [str(row["o:id"]) for row in rows] == ["1", "2", "3"]
    assert [str(row["o:id"]) for row in recused_only] == ["1", "3"]
    assert summary == second.FrameSummary(
        frame=3,
        in_published_frame=1,
        recused_only=2,
        recused_only_sole_negative=1,
        recused_only_sole_positive=1,
    )
    assert rows[0]["flip_dissenters"] == {"haiku": FLIP_NEGATIVE, "luna": FLIP_POSITIVE}


def test_a_row_the_recused_member_did_not_rate_is_outside_the_frame():
    """Haiku's 47-article gap: a missing rating is non-comparable, never a flip."""
    records = [record(1, {**PUBLISHED_FLIP, "haiku": None})]
    assert frame_rows(records) == []


def rated(polarity: str | None, centrality: str | None = "Central") -> dict:
    return {"polarite": polarity, "centralite_islam_musulmans": centrality}


def test_flip_dissenters_names_the_sole_reader_on_each_side():
    analyses = {"luna": rated("Positif"), "haiku": rated("Négatif"), "qwen": rated("Neutre")}
    assert flip_dissenters(analyses, CONTRACT_V2) == {
        "luna": FLIP_POSITIVE,
        "haiku": FLIP_NEGATIVE,
    }
    crowded = {**analyses, "gemma": rated("Positif"), "deepseek": rated("Négatif")}
    assert flip_dissenters(crowded, CONTRACT_V2) == {}
    calm = {"luna": rated("Positif"), "qwen": rated("Neutre")}
    assert flip_dissenters(calm, CONTRACT_V2) == {}
    # The comparability gate is the flip rule's own: no centrality, no flip.
    uncomparable = {**analyses, "qwen": rated("Neutre", None)}
    assert flip_dissenters(uncomparable, CONTRACT_V2) == {}


def test_projection_shows_the_judge_its_panel_and_rehashes_what_it_read():
    (row,) = frame_rows([record(1, GEMMA_ONLY)])
    projected = project_to_panel(row, PANEL, CONTRACT_V2)
    assert list(projected["analyses"]) == PANEL
    assert projected["valence_flip"] is True
    # Gemma was the only positive reader: the Google judge cannot see the flip.
    assert projected["panel_valence_flip"] is False
    assert projected["frame_spread"] == row["spread"]
    assert projected["spread"]["polarity_spread"] == 1
    assert row["spread"]["polarity_spread"] == 2


def test_projection_refuses_a_panel_model_outside_the_frame():
    (row,) = frame_rows([record(1, PUBLISHED_FLIP)])
    narrow = {**row, "analyses": {k: v for k, v in row["analyses"].items() if k != "haiku"}}
    with pytest.raises(ValueError, match="outside the selection frame"):
        project_to_panel(narrow, PANEL, CONTRACT_V2)


def test_the_prompt_never_shows_the_recused_member_or_any_model_name():
    (row,) = frame_rows([record(1, HAIKU_ONLY)])
    article = {**project_to_panel(row, PANEL, CONTRACT_V2), "OCR": "Texte."}
    prompt = second.create_arbiter_prompt(article, PERMUTATION, CONTRACT_V2)
    # Justification markers come from the HF row, so the recused member's own
    # prose is what would leak.
    assert "MARK-gemma" not in prompt
    for model_id in PANEL:
        assert f"MARK-{model_id}" in prompt
    for name in CONTRACT_V2.model_names.values():
        assert name not in prompt


# ---------------------------------------------------------------------------
# Fingerprints
# ---------------------------------------------------------------------------


def fingerprint_options(model: str) -> dict:
    return {
        "arbiter_model": model,
        "source_revision": "rev",
        "text_revision": "text",
        "max_input_chars": 15_000,
        "contract": CONTRACT_V2,
    }


def test_a_second_judge_fingerprint_never_collides_with_a_published_one():
    (row,) = frame_rows([record(1, PUBLISHED_FLIP)])
    article = {**project_to_panel(row, PANEL, CONTRACT_V2), "OCR": "Texte.", "o:title": "T"}
    ours = second.build_fingerprint(JUDGE, "rev", "text")(article)
    assert ours == three_way_cache_fingerprint(article, **fingerprint_options(JUDGE.model))
    assert ours != three_way_cache_fingerprint(article, **fingerprint_options("claude-opus-5"))


def test_the_rows_selected_by_the_frame_do_not_move_the_fingerprint():
    """Bookkeeping keys stay out of the digest, as `valence_flip` always has."""
    (row,) = frame_rows([record(1, PUBLISHED_FLIP)])
    article = {**project_to_panel(row, PANEL, CONTRACT_V2), "OCR": "Texte."}
    bare = {key: article[key] for key in ("o:id", "o:title", "OCR", "analyses", "spread")}
    hasher = second.build_fingerprint(JUDGE, "rev", "text")
    assert hasher(article) == hasher(bare)


# ---------------------------------------------------------------------------
# The Gemini request
# ---------------------------------------------------------------------------


def valid_json() -> str:
    labels = arbiter_prompt.BLIND_LABELS
    return arbiter_schema.ArbiterResponseV2.model_validate(
        {
            "polarity": {
                "arbiter_score": "Négatif",
                "justification": "j",
                "preferred": labels[-1],
                "verdict_explanation": "v",
            },
            "subjectivity": {
                "arbiter_score": "Plutôt subjectif",
                "justification": "j",
                "preferred": "multiple",
                "verdict_explanation": "v",
            },
            "centrality": {
                "arbiter_score": "Central",
                "justification": "j",
                "preferred": "none",
                "verdict_explanation": "v",
            },
            "overall_winner": labels[0],
            "overall_explanation": "o",
            "confidence_level": "medium",
        }
    ).model_dump_json()


def usage(**overrides):
    values = {
        "total_input_tokens": 7000,
        "total_cached_tokens": 0,
        "total_output_tokens": 900,
        "total_thought_tokens": 700,
        "total_tokens": 8600,
    }
    return SimpleNamespace(**{**values, **overrides})


def interaction(status="completed", text=None, **usage_overrides):
    return SimpleNamespace(
        status=status, output_text=text, usage=usage(**usage_overrides), errors=None
    )


class FakeClient:
    """Records every request; replays one canned interaction (or raises it)."""

    def __init__(self, response):
        self.calls: list[dict] = []
        self.response = response
        self.interactions = self

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


def judged_article() -> dict:
    (row,) = frame_rows([record(7, HAIKU_ONLY)])
    return {**project_to_panel(row, PANEL, CONTRACT_V2), "OCR": "Texte intégral."}


def evaluate(client, **kwargs):
    return second.evaluate_with_gemini(
        client,
        judged_article(),
        PERMUTATION,
        judge=JUDGE,
        effort="medium",
        rates=JUDGE.rates_on(date(2026, 11, 1)),
        **kwargs,
    )


def test_the_request_is_structured_unsampled_and_not_stored():
    client = FakeClient(interaction(text=valid_json()))
    evaluate(client)
    (sent,) = client.calls
    assert sent["model"] == "gemini-4-argon"
    assert sent["system_instruction"] == arbiter_prompt.SYSTEM_INSTRUCTION
    assert sent["generation_config"] == {
        "thinking_level": "medium",
        "max_output_tokens": second.JUDGE_MAX_OUTPUT_TOKENS,
    }
    assert sent["response_format"]["schema"] == second.RESPONSE_SCHEMA
    assert sent["response_format"]["mime_type"] == "application/json"
    # The private mirror's text must not be retained by the provider.
    assert sent["store"] is False
    assert not {"temperature", "top_p", "top_k"} & (set(sent) | set(sent["generation_config"]))


def test_the_schema_sent_is_flat_and_offers_exactly_the_blind_labels():
    encoded = json.dumps(second.RESPONSE_SCHEMA)
    assert "$ref" not in encoded and "$defs" not in encoded
    preferred = second.RESPONSE_SCHEMA["properties"]["polarity"]["properties"]["preferred"]
    assert preferred["enum"] == [*arbiter_prompt.BLIND_LABELS, "multiple", "none"]


def test_a_valid_response_is_stored_with_subjectivity_as_the_shared_rank():
    result = evaluate(FakeClient(interaction(text=valid_json())))
    assert result.outcome == second.OUTCOME_OK
    assert result.analysis.subjectivity.score == "4"
    assert result.analysis.polarity.score == "Négatif"


def test_a_truncated_interaction_is_a_failure_and_still_billed():
    spent = JudgeUsage()
    result = evaluate(FakeClient(interaction(status="incomplete")), usage=spent)
    assert result.outcome == second.OUTCOME_TRUNCATED
    assert spent.calls == 1 and spent.usd > 0


@pytest.mark.parametrize(
    ("response", "outcome"),
    [
        (interaction(status="failed"), "error"),
        (RuntimeError("network"), "error"),
        (interaction(text="{not json"), "invalid"),
        (interaction(text=""), "refused"),
    ],
    ids=["failed", "raised", "invalid-json", "no-text"],
)
def test_a_bad_response_is_classified_and_never_retried(response, outcome):
    client = FakeClient(response)
    assert evaluate(client).outcome == outcome
    assert len(client.calls) == 1


def test_an_article_without_text_is_never_sent():
    client = FakeClient(interaction(text=valid_json()))
    result = second.evaluate_with_gemini(
        client,
        {**judged_article(), "OCR": ""},
        PERMUTATION,
        judge=JUDGE,
        effort="medium",
    )
    assert result.outcome == second.OUTCOME_NO_TEXT
    assert client.calls == []


# ---------------------------------------------------------------------------
# Prices, estimate and usage
# ---------------------------------------------------------------------------


def test_the_rates_follow_the_announced_schedule():
    assert JUDGE.rates_on(date(2026, 11, 30)) == Rates(2.00, 10.00, 0.10)
    assert JUDGE.rates_on(date(2026, 12, 1)) == Rates(4.00, 20.00, 0.20)
    assert JUDGE.rates_on(date(2026, 11, 1), TIER_FLEX).output == 5.00
    assert JUDGE.next_rate_change(date(2026, 10, 27))[0] == date(2026, 12, 1)
    assert JUDGE.next_rate_change(date(2026, 12, 2)) is None
    with pytest.raises(ValueError, match="no 'priority' tier"):
        JUDGE.rates_on(date(2026, 11, 1), "priority")


def test_only_judges_with_an_adapter_can_spend():
    assert set(second.EVALUATORS) == set(PAID_PROVIDERS) == set(second.CLIENT_FACTORIES)
    assert JUDGES["gemini-4-argon"].provider in PAID_PROVIDERS
    assert JUDGES["gpt-6-astra"].provider not in PAID_PROVIDERS


def test_the_estimate_counts_every_call_and_brackets_the_output():
    rates = Rates(input=2.0, output=10.0, cached_input=0.1)
    estimate = estimate_judge_cost([2420, 2420], prefix_chars=2420, rates=rates, effort="medium")
    assert estimate["calls"] == 2
    assert estimate["input_tokens"] == 4000
    assert estimate["output_tokens"] == 2 * 1613
    assert estimate["usd_if_output_doubles"] > estimate["usd"] > 0
    empty = estimate_judge_cost([], prefix_chars=2420, rates=rates, effort="medium")
    assert empty["calls"] == 0 and empty["usd"] == 0


def test_usage_bills_thinking_once_whether_or_not_it_is_reported_apart():
    rates = Rates(input=1.0, output=1.0, cached_input=0.0)
    with_total, without_total = JudgeUsage(), JudgeUsage()
    with_total.add_gemini(usage(), rates)
    without_total.add_gemini(usage(total_tokens=None), rates)
    assert with_total.generated_tokens == without_total.generated_tokens == 1600
    cached = JudgeUsage()
    cached.add_gemini(usage(total_cached_tokens=5000), Rates(1.0, 0.0, 0.0))
    assert cached.usd == pytest.approx(2000 / 1_000_000)


def test_usage_resumes_from_the_recorded_metadata():
    spent = JudgeUsage()
    spent.add_gemini(usage(), JUDGE.rates_on(date(2026, 11, 1)))
    resumed = JudgeUsage.from_metadata(spent.as_metadata())
    assert resumed.calls == 1
    assert resumed.usd == pytest.approx(round(spent.usd, 2))
    assert JudgeUsage.from_metadata(None).calls == 0
    assert JudgeUsage().as_metadata() == {}


# ---------------------------------------------------------------------------
# Judge comparison
# ---------------------------------------------------------------------------


def test_judge_agreement_counts_exact_within_one_and_sign():
    first = {"1": "Positif", "2": "Négatif", "3": "Neutre", "4": "Non applicable"}
    second_judge = {
        "1": "Positif",
        "2": "Très négatif",
        "3": "Positif",
        "4": "Non applicable",
        "9": "Neutre",
    }
    agreement = judge_agreement(first, second_judge, CONTRACT_V2)
    assert agreement["articles"] == 4
    assert agreement["exact"] == 2
    assert agreement["comparable"] == 3
    assert agreement["within_one"] == 3
    assert agreement["same_sign"] == 2


def test_polarity_verdicts_read_the_published_shape():
    rows = [{"article_id": 5, "arbiter": {"polarity": {"score": "Neutre"}}}, {"article_id": 6}]
    assert polarity_verdicts(rows) == {"5": "Neutre"}


def test_own_developer_affinity_differences_away_general_agreement():
    """Google's judge matches Gemma more than Opus does; both match controls alike."""
    ids = [str(index) for index in range(10)]
    verdict = dict.fromkeys(ids, "Positif")
    ratings = {model_id: dict.fromkeys(ids, "Positif") for model_id in FRAME}
    # Gemma reads half the articles as negative, and only the Google judge agrees.
    for article_id in ids[:5]:
        ratings["gemma"][article_id] = "Négatif"
    google = {**verdict, **dict.fromkeys(ids[:5], "Négatif")}
    # Haiku likewise splits, and only Opus agrees — the symmetric affinity.
    for article_id in ids[5:]:
        ratings["haiku"][article_id] = "Négatif"
    opus = {**verdict, **dict.fromkeys(ids[5:], "Négatif")}
    result = own_developer_affinity(
        {"claude-opus-5": ("anthropic", opus), "gemini-4-argon": ("google", google)},
        ratings,
        CONTRACT_V2,
    )
    assert result["articles"] == 10
    assert result["controls"] == ["luna", "mistral-small", "deepseek", "qwen"]
    google_affinity = result["affinity"]["gemini-4-argon"]
    assert google_affinity["own_models"] == ["gemma"]
    # Own gap +1.0 (Gemma matched on 10 of 10 against 0 of 10); both judges
    # match the controls on five articles each, so the control gap cancels.
    assert google_affinity["control_gap"] == pytest.approx(0.0)
    assert google_affinity["difference_in_differences"] == pytest.approx(1.0)
    assert result["affinity"]["claude-opus-5"]["difference_in_differences"] == pytest.approx(1.0)


def test_affinity_needs_two_judges_from_two_developers():
    with pytest.raises(ValueError, match="exactly two"):
        own_developer_affinity({"a": ("google", {})}, {}, CONTRACT_V2)
    with pytest.raises(ValueError, match="one developer"):
        own_developer_affinity({"a": ("google", {}), "b": ("google", {})}, {}, CONTRACT_V2)


# ---------------------------------------------------------------------------
# main(): dry run, refusals and the published envelope
# ---------------------------------------------------------------------------


STUB_RECORDS = [
    record(1, HAIKU_ONLY),
    record(2, PUBLISHED_FLIP),
    record(3, GEMMA_ONLY),
    record(4, {}),  # not framed
]


@pytest.fixture
def stub_pipeline(monkeypatch, tmp_path):
    monkeypatch.setattr(second, "load_iwac_dataset", lambda contract: _frame(STUB_RECORDS))
    monkeypatch.setattr(
        second, "get_base_article_ids", lambda: {str(row["o:id"]) for row in STUB_RECORDS}
    )
    monkeypatch.setattr(
        second,
        "load_iwac_full_text",
        lambda: {"1": "Texte un.", "2": "Texte deux.", "3": "Texte trois."},
    )
    monkeypatch.setattr(second, "get_webapp_data_dir", lambda: str(tmp_path))
    monkeypatch.setattr(second, "get_staging_dir", lambda: str(tmp_path / ".staging"))
    monkeypatch.setattr(
        second, "get_source_revision", lambda repo=None: "rev-scores" if repo else None
    )

    def refuse_client(api_key):
        raise AssertionError("no client may be constructed without an explicit paid run")

    monkeypatch.setitem(second.CLIENT_FACTORIES, "google", refuse_client)
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    return tmp_path


def _frame(records):
    import pandas as pd

    return pd.DataFrame(records)


def output_of(tmp_path: Path) -> dict:
    return json.loads(
        (tmp_path / second.output_filename(JUDGE)).read_text(encoding="utf-8"),
    )


def test_dry_run_reports_the_frame_and_prices_both_frames(stub_pipeline, caplog):
    with caplog.at_level("INFO"):
        assert second.main(["--dry-run"]) == 0
    assert not (stub_pipeline / second.output_filename(JUDGE)).exists()
    assert not (stub_pipeline / ".staging").exists()
    text = caplog.text
    assert "3 six-model valence flips; 2 also flip over the published arbiter's panel" in text
    assert "1 exist only because of haiku (1 as the sole negative reader, 0 as the sole" in text
    assert "sees no flip on 1 of the 3 framed articles" in text
    assert "(a) --frame recused: 1 call(s)" in text
    assert "(b) --frame full: 3 call(s)" in text
    assert "No API call was made" in text


def test_dry_run_prices_a_judge_that_cannot_spend_yet(stub_pipeline, caplog):
    with caplog.at_level("INFO"):
        assert second.main(["--dry-run", "--judge", "gpt-6.1-sol"]) == 0
    assert "recuses luna" in caplog.text


def test_a_judge_without_an_adapter_is_refused_before_anything_loads(stub_pipeline, monkeypatch):
    def no_loading(*args, **kwargs):
        raise AssertionError("refused runs must not load the corpus")

    monkeypatch.setattr(second, "load_iwac_dataset", no_loading)
    assert second.main(["--judge", "gpt-6-astra", "--yes"]) == 2


@pytest.mark.parametrize(
    "argv", [["--effort", "max"], ["--service-tier", "priority"]], ids=["effort", "tier"]
)
def test_an_unsupported_setting_is_refused_before_spending(stub_pipeline, argv):
    assert second.main(["--dry-run", *argv]) == 2


def test_prune_cache_only_publishes_the_envelope_the_validator_expects(stub_pipeline):
    assert second.main(["--prune-cache-only"]) == 0
    payload = output_of(stub_pipeline)
    metadata = payload["metadata"]
    assert payload["evaluations"] == []
    assert metadata["arbiter_model"] == "gemini-4-argon"
    assert metadata["arbiter_developer"] == "google"
    assert metadata["models"] == PANEL
    assert metadata["recused_models"] == ["gemma"]
    assert metadata["published_arbiter"]["recused_models"] == ["haiku"]
    assert metadata["mode"] == CONTRACT_V2.arbiter["mode"]
    assert metadata["prompt_version"] == CONTRACT_V2.arbiter["promptVersion"]
    assert metadata["selection"]["frame"] == "full"
    assert metadata["selection"]["frame_models"] == FRAME
    assert metadata["selection"]["recused_only_articles"] == 1
    assert sorted(metadata["blind_permutation"].values()) == sorted(PANEL)
    validate_second_judge_envelope(CONTRACT_V2, payload)
    assert "Texte un." not in json.dumps(payload, ensure_ascii=False)


def test_a_paid_run_saves_each_verdict_with_its_frame_bookkeeping(stub_pipeline, monkeypatch):
    client = FakeClient(interaction(text=valid_json()))
    monkeypatch.setitem(second.CLIENT_FACTORIES, "google", lambda api_key: client)
    assert second.main(["--frame", "recused", "--yes"]) == 0

    assert len(client.calls) == 1
    payload = output_of(stub_pipeline)
    (row,) = payload["evaluations"]
    assert row["article_id"] == "1"
    assert row["flip_dissenters"] == {"haiku": FLIP_NEGATIVE, "luna": FLIP_POSITIVE}
    assert row["panel_valence_flip"] is True
    assert payload["metadata"]["usage"]["calls"] == 1
    validate_second_judge_envelope(CONTRACT_V2, payload)

    # The durable cache answers a rerun without another call.
    assert second.main(["--frame", "recused", "--yes"]) == 0
    assert len(client.calls) == 1


def test_a_rerun_with_another_effort_is_refused_rather_than_relabelled(stub_pipeline, monkeypatch):
    client = FakeClient(interaction(text=valid_json()))
    monkeypatch.setitem(second.CLIENT_FACTORIES, "google", lambda api_key: client)
    assert second.main(["--frame", "recused", "--yes"]) == 0
    assert second.main(["--frame", "recused", "--effort", "high", "--yes"]) == 2


def test_the_comparison_runs_against_the_published_arbiter(stub_pipeline, monkeypatch, caplog):
    client = FakeClient(interaction(text=valid_json()))
    monkeypatch.setitem(second.CLIENT_FACTORIES, "google", lambda api_key: client)
    published = {
        "metadata": {},
        "evaluations": [
            {"article_id": "2", "arbiter": {"polarity": {"score": "Négatif"}}},
            {"article_id": "3", "arbiter": {"polarity": {"score": "Positif"}}},
        ],
    }
    (stub_pipeline / second.ARBITER_V2_FILENAME).write_text(json.dumps(published), encoding="utf-8")
    with caplog.at_level("INFO"):
        assert second.main(["--yes"]) == 0
    assert "Judge agreement on 2 shared articles: exact 1" in caplog.text
    assert "own-developer affinity" in caplog.text


# ---------------------------------------------------------------------------
# The validator
# ---------------------------------------------------------------------------


def envelope(**metadata_overrides) -> dict:
    metadata = {
        "arbiter_developer": "google",
        "recused_models": ["gemma"],
        "models": PANEL,
        "blind_permutation": PERMUTATION,
        "contract_schema_version": CONTRACT_V2.schema_version,
        "analysis_version": "v2",
        "mode": CONTRACT_V2.arbiter["mode"],
        "successful_evaluations": 1,
    }
    return {
        "metadata": {**metadata, **metadata_overrides},
        "evaluations": [{"article_id": "2", "cache_fingerprint": "f"}],
    }


def test_the_validator_accepts_a_well_formed_second_judge():
    validate_second_judge_envelope(CONTRACT_V2, envelope())


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"arbiter_developer": "gogle"}, "unregistered developer"),
        ({"recused_models": []}, "own developer's recusal"),
        (
            {
                "models": ["luna", "mistral-small", "deepseek", "gemma", "haiku"],
                "blind_permutation": dict(
                    zip(
                        arbiter_prompt.BLIND_LABELS,
                        ["luna", "mistral-small", "deepseek", "gemma", "haiku"],
                        strict=True,
                    )
                ),
            },
            "arbiter panel",
        ),
    ],
    ids=["typo", "no-recusal", "reads-its-own-model"],
)
def test_the_validator_rejects_a_judge_that_could_have_read_its_own_model(overrides, message):
    with pytest.raises(ContractError, match=message):
        validate_second_judge_envelope(CONTRACT_V2, envelope(**overrides))


def test_the_validator_recomputes_the_frame_over_the_whole_generation(tmp_path):
    """Article 1's flip exists only because of Haiku, so only a six-model frame admits it."""
    from iwac_preprocess import build_model_sentiment

    sentiments = {
        model_id: {
            str(row["o:id"]): build_model_sentiment(row, model_id, CONTRACT_V2)
            for row in STUB_RECORDS
        }
        for model_id in FRAME
    }
    base_ids = {str(row["o:id"]) for row in STUB_RECORDS}
    payload = envelope()
    payload["evaluations"] = [{"article_id": "1", "cache_fingerprint": "f"}]
    (tmp_path / second.output_filename(JUDGE)).write_text(json.dumps(payload), encoding="utf-8")
    validate_second_judges(CONTRACT_V2, base_ids, sentiments, tmp_path)

    payload["evaluations"] = [{"article_id": "4", "cache_fingerprint": "f"}]
    (tmp_path / second.output_filename(JUDGE)).write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(ContractError, match="stale/non-eligible"):
        validate_second_judges(CONTRACT_V2, base_ids, sentiments, tmp_path)
