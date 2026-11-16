"""The shared arbiter runner: revisions, shrink guard, paid loop, hygiene.

No network and no provider: the runner is driven with fake sources, a fake
publisher and scripted evaluation outcomes.
"""

from __future__ import annotations

import json
import random
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace

import pytest
from iwac_preprocess import CONTRACT_V2, arbiter_run, source
from iwac_preprocess.arbiter_judges import PROVIDER_ANTHROPIC, ArbiterUsage
from iwac_preprocess.arbiter_lifecycle import CACHE_FILENAME
from iwac_preprocess.arbiter_prompt import BLIND_LABELS, display_order
from iwac_preprocess.arbiter_run import (
    HEAD,
    OUTCOME_ERROR,
    OUTCOME_OK,
    OUTCOME_REFUSED,
    EvaluationResult,
    PanelRun,
    RevisionError,
    plan_revisions,
    recorded_revisions,
    require_revision,
)
from iwac_preprocess.arbiter_schema import convert_response
from iwac_preprocess.arbiter_selection import (
    TextJoinError,
    ThresholdError,
    check_text_coverage,
    resolve_threshold,
)
from test_arbiter_evaluation_v2 import valid_response

PANEL = list(CONTRACT_V2.arbiter_model_ids)

# ---------------------------------------------------------------------------
# Revisions
# ---------------------------------------------------------------------------


def test_resuming_reads_the_recorded_revisions():
    request = plan_revisions(
        source_flag=None, text_flag=None, recorded=("sha-s", "sha-t"), environ={}
    )
    assert (request.scores, request.text) == ("sha-s", "sha-t")
    assert "resuming" in request.scores_reason


def test_a_first_run_reads_head():
    request = plan_revisions(source_flag=None, text_flag=None, recorded=(None, None), environ={})
    assert (request.scores, request.text) == (None, None)


def test_head_moves_both_repositories_unless_text_is_pinned():
    request = plan_revisions(
        source_flag=HEAD, text_flag=None, recorded=("sha-s", "sha-t"), environ={}
    )
    assert (request.scores, request.text) == ("main", "main")
    pinned = plan_revisions(
        source_flag=HEAD, text_flag="sha-x", recorded=("sha-s", "sha-t"), environ={}
    )
    assert (pinned.scores, pinned.text) == ("main", "sha-x")


def test_a_sha_flag_moves_only_its_repository():
    request = plan_revisions(
        source_flag="sha-new", text_flag=None, recorded=("sha-s", "sha-t"), environ={}
    )
    assert (request.scores, request.text) == ("sha-new", "sha-t")


def test_the_environment_beats_the_recorded_revision_and_the_flag_beats_both():
    environ = {"IWAC_HF_REVISION": "env-s", "IWAC_HF_FULL_REVISION": "env-t"}
    request = plan_revisions(
        source_flag=None, text_flag=None, recorded=("sha-s", "sha-t"), environ=environ
    )
    assert (request.scores, request.text) == ("env-s", "env-t")
    flagged = plan_revisions(
        source_flag="flag-s", text_flag=None, recorded=("sha-s", "sha-t"), environ=environ
    )
    assert flagged.scores == "flag-s"


def test_recorded_revisions_come_from_the_first_populated_file(tmp_path):
    empty = tmp_path / "empty.json"
    empty.write_text(json.dumps({"metadata": {}, "evaluations": []}), encoding="utf-8")
    full = tmp_path / "full.json"
    full.write_text(
        json.dumps(
            {
                "metadata": {"source": {"scores": {"revision": "a"}, "text": {"revision": "b"}}},
                "evaluations": [{"article_id": "1", "cache_fingerprint": "f"}],
            }
        ),
        encoding="utf-8",
    )
    assert recorded_revisions(empty, full, tmp_path / "absent.json") == (("a", "b"), full)
    assert recorded_revisions(empty) == ((None, None), None)


@pytest.mark.parametrize("value", [None, ""])
def test_a_paid_run_refuses_an_unknown_revision(value):
    with pytest.raises(RevisionError, match="refusing"):
        require_revision(value, "repo")
    assert require_revision("sha", "repo") == "sha"


def test_the_published_file_records_revisions_a_resume_can_read():
    published = (
        Path(__file__).resolve().parents[1]
        / "ma-visualisation-sentiments"
        / "static"
        / "data"
        / "iwac_arbiter_evaluations_v2.json"
    )
    (scores, text), where = recorded_revisions(published)
    assert where == published
    assert scores == "5629c24719d8b85bc3cb1d20edb4520647d0e37b"
    assert text == "d5c318f5c0b1451e0c9a90809e359ab4ebec5910"


# ---------------------------------------------------------------------------
# PanelRun, driven directly
# ---------------------------------------------------------------------------


def articles(*ids: int) -> list[dict]:
    return [{"o:id": article_id, "spread": {"total_spread": 3}} for article_id in ids]


def open_run(tmp_path: Path, selected: list[dict], **overrides) -> tuple[PanelRun, list]:
    saved: list = []

    def save(path, rows, metadata):
        saved.append((list(rows), dict(metadata)))
        Path(path).write_text(
            json.dumps({"metadata": metadata, "evaluations": rows}), encoding="utf-8"
        )

    holder: dict = {}
    options = {
        "cache_path": tmp_path / "staging" / CACHE_FILENAME,
        "output_path": tmp_path / "out.json",
        "panel": PANEL,
        "effort": "medium",
        "selected": selected,
        "fingerprint": lambda article: f"fp-{article['o:id']}",
        "prompt_version": "v2.3.0",
        "source": {"scores": "s", "text": "t"},
        "save_results": save,
        "build_metadata": lambda counts, usage: {
            "effort": "medium",
            "blind_permutation": holder["run"].permutation,
            "prompt_version": "v2.3.0",
            "source": {"scores": {"revision": "s"}, "text": {"revision": "t"}},
            "successful_evaluations": counts["successful"],
            "failed_evaluations": counts["failed"],
            "refused_evaluations": counts["refused"],
            "usage": usage.as_metadata(),
        },
        "usage_provider": PROVIDER_ANTHROPIC,
        "logger": arbiter_run.logging.getLogger("test-runner"),
        **overrides,
    }
    run = PanelRun.open(**options)
    holder["run"] = run
    return run, saved


def row(article, analysis, key):
    return {"article_id": str(article["o:id"]), "cache_fingerprint": key, "arbiter": {}}


def ok(article):
    return EvaluationResult(OUTCOME_OK, SimpleNamespace(article_id=str(article["o:id"])))


def test_a_failed_intermediate_export_does_not_stop_the_loop(tmp_path, caplog):
    run, _ = open_run(tmp_path, articles(1, 2, 3))
    calls = []

    def flaky(path, rows, metadata):
        calls.append(len(rows))
        if len(calls) == 1:
            raise OSError("disk briefly full")
        Path(path).write_text(json.dumps({"metadata": metadata, "evaluations": rows}))

    run.save_results = flaky
    with caplog.at_level("INFO"):
        code = run.evaluate_remaining(ok, row, desc="t", save_interval=1)
    assert code == 0
    # First export failed, the loop went on, the later ones landed.
    assert calls[0] == 1 and calls[-1] == 3
    assert "Public export failed mid-run" in caplog.text
    durable = json.loads((tmp_path / "staging" / CACHE_FILENAME).read_text())
    assert len(durable["evaluations"]) == 3


def test_a_failed_final_export_exits_non_zero_with_the_work_durable(tmp_path):
    run, _ = open_run(tmp_path, articles(1))

    def broken(path, rows, metadata):
        raise OSError("no")

    run.save_results = broken
    assert run.evaluate_remaining(ok, row, desc="t") == 1
    assert len(json.loads((tmp_path / "staging" / CACHE_FILENAME).read_text())["evaluations"]) == 1


def test_the_breaker_counts_only_consecutive_errors(tmp_path):
    outcomes = iter([OUTCOME_ERROR, OUTCOME_OK, OUTCOME_ERROR, OUTCOME_ERROR, OUTCOME_OK])

    def scripted(article):
        outcome = next(outcomes)
        return ok(article) if outcome == OUTCOME_OK else EvaluationResult(outcome)

    run, _ = open_run(tmp_path, articles(1, 2, 3, 4, 5))
    assert run.evaluate_remaining(scripted, row, desc="t", max_consecutive_errors=2) == 1
    # Stopped at the second error in a row; the fifth article was never sent.
    assert len(run.evaluations) == 1
    assert run.counts()["failed"] == 3


def test_a_refusal_is_remembered_and_counted_apart(tmp_path):
    run, _ = open_run(tmp_path, articles(1, 2))
    outcomes = iter([EvaluationResult(OUTCOME_REFUSED), None])
    run.evaluate_remaining(lambda a: next(outcomes) or ok(a), row, desc="t")
    assert run.counts() == {
        "total": 2,
        "successful": 1,
        "failed": 0,
        "refused": 1,
        "missing_text": 0,
    }
    again, _ = open_run(tmp_path, articles(1, 2))
    assert again.remaining == [] and again.skipped_failures == 1
    assert again.counts()["refused"] == 1
    retry, _ = open_run(tmp_path, articles(1, 2), retry_failed=True)
    assert [article["o:id"] for article in retry.remaining] == [1]


def test_a_no_op_republish_keeps_generated_and_does_not_rewrite(tmp_path):
    run, saved = open_run(tmp_path, articles(1))
    run.evaluate_remaining(ok, row, desc="t")
    first = json.loads((tmp_path / "out.json").read_text())
    stamp = datetime.fromisoformat(first["metadata"]["generated"])
    assert stamp.tzinfo is not None  # UTC-aware for new writes

    again, saved_again = open_run(tmp_path, articles(1))
    assert again.publish() == 0
    assert saved_again == []
    assert json.loads((tmp_path / "out.json").read_text()) == first


def test_a_republish_keeps_the_published_order_not_the_selection_order(tmp_path):
    # The published v2 file lists verdicts in judging order, not by id; a
    # --prune-cache-only republish must leave it byte-identical.
    run, _ = open_run(tmp_path, articles(3, 1, 2))
    run.evaluate_remaining(ok, row, desc="t")
    first = (tmp_path / "out.json").read_text()

    again, saved_again = open_run(tmp_path, articles(1, 2, 3))
    assert [r["article_id"] for r in again.evaluations] == ["3", "1", "2"]
    assert again.publish() == 0
    assert saved_again == []
    assert (tmp_path / "out.json").read_text() == first

    wider, saved_wider = open_run(tmp_path, articles(4, 1, 2, 3))
    wider.evaluate_remaining(ok, row, desc="t")
    # Extending the published set keeps its rows in place; the new verdict follows.
    assert [r["article_id"] for r in saved_wider[-1][0]] == ["3", "1", "2", "4"]


def test_the_sdk_version_is_recorded_only_by_a_run_that_spent(tmp_path, monkeypatch):
    monkeypatch.setattr(arbiter_run, "installed_version", lambda package: "9.9.9")
    run, _ = open_run(tmp_path, articles(1), sdk_package="anthropic")
    assert "sdk_versions" not in run.metadata()
    run.usage.add_anthropic({"input_tokens": 10, "output_tokens": 5})
    assert run.metadata()["sdk_versions"] == {"anthropic": ["9.9.9"]}


def test_an_unmetered_call_is_counted_without_changing_the_published_shape():
    usage = ArbiterUsage(PROVIDER_ANTHROPIC)
    usage.add_unmetered()
    assert usage.as_metadata()["unmetered_calls"] == 1
    assert (
        "unmetered_calls"
        not in ArbiterUsage.from_metadata(
            {"calls": 1, "input_tokens": 1, "output_tokens": 1, "usd": 0.0}, PROVIDER_ANTHROPIC
        ).as_metadata()
    )


# ---------------------------------------------------------------------------
# Library hygiene
# ---------------------------------------------------------------------------


def test_a_text_join_miss_above_the_tolerance_is_an_error():
    check_text_coverage(["1"], 2)  # one article may genuinely be empty
    check_text_coverage(["1", "2", "3"], 301)
    with pytest.raises(TextJoinError, match="no text in the private mirror"):
        check_text_coverage([str(i) for i in range(10)], 301)


def test_selection_errors_are_domain_exceptions_not_exits():
    with pytest.raises(ThresholdError) as error:
        resolve_threshold(1)
    assert not isinstance(error.value, SystemExit)


def test_source_scope_errors_are_catchable_and_still_exit_legacy_scripts(tmp_path):
    with pytest.raises(ValueError, match="iwac_articles_base.json is missing"):
        source.get_base_article_ids(str(tmp_path))
    assert issubclass(source.SourceScopeError, SystemExit)


def test_loaders_return_their_revision_with_the_data(monkeypatch):
    import pandas as pd

    monkeypatch.setattr(
        source,
        "load_source",
        lambda *args, **kwargs: source.SourceResult(
            data=pd.DataFrame(
                {"o:id": [1, 2], "OCR": ["texte", None]},
            ),
            repository=kwargs.get("repo_id", "public"),
            revision=f"sha-of-{kwargs.get('revision')}",
        ),
    )
    monkeypatch.setenv("HF_TOKEN", "test")
    text = source.load_iwac_full_text_source("abc")
    assert text.revision == "sha-of-abc"
    assert text.texts == {"1": "texte"}


def test_records_are_scoped_to_the_published_base(monkeypatch):
    import pandas as pd

    rows = [
        {"o:id": 1, "title": "t", "newspaper": "n", "country": "c", "pub_date": "d"},
        {"o:id": 2, "title": "t", "newspaper": "n", "country": "c", "pub_date": "d"},
    ]
    monkeypatch.setattr(
        arbiter_run,
        "load_iwac_dataset_source",
        lambda contract, revision, model_ids=None: source.SourceResult(
            pd.DataFrame(rows), "public", "sha"
        ),
    )
    records, revision = arbiter_run.load_panel_records(
        CONTRACT_V2, None, arbiter_run.logging.getLogger("t"), base_ids={"1"}
    )
    assert [record["o:id"] for record in records] == [1]
    assert revision == "sha"


def test_the_arbiter_panel_reaches_the_column_check(monkeypatch):
    """The Opus arbiter must resume a revision older than the member it recuses."""
    import pandas as pd

    seen = {}

    def fake_source(contract, revision, model_ids=None):
        seen["model_ids"] = model_ids
        return source.SourceResult(pd.DataFrame([], columns=["o:id"]), "public", "sha")

    monkeypatch.setattr(arbiter_run, "load_iwac_dataset_source", fake_source)
    monkeypatch.setattr(arbiter_run, "validate_columns", lambda df, columns: None)
    panel = list(CONTRACT_V2.arbiter_model_ids)
    arbiter_run.load_panel_records(
        CONTRACT_V2, "abc", arbiter_run.logging.getLogger("t"), base_ids=set(), model_ids=panel
    )
    assert seen["model_ids"] == panel
    assert "haiku" not in panel


# ---------------------------------------------------------------------------
# Presentation order and timestamps
# ---------------------------------------------------------------------------


def test_two_presentation_orders_are_pinned_literally():
    """The published run's orders; a change here re-orders every future prompt."""
    assert display_order("2285") == ["c", "e", "b", "a", "d"]
    assert display_order("4242") == ["a", "b", "d", "e", "c"]


def test_the_explicit_shuffle_is_the_one_cpython_performed():
    published = (
        Path(__file__).resolve().parents[1]
        / "ma-visualisation-sentiments"
        / "static"
        / "data"
        / "iwac_arbiter_evaluations_v2.json"
    )
    ids = [row["article_id"] for row in json.loads(published.read_text("utf-8"))["evaluations"]]
    for article_id in ids:
        expected = list(BLIND_LABELS)
        random.Random(str(article_id)).shuffle(expected)
        assert display_order(article_id) == expected


def test_new_verdicts_carry_a_utc_timestamp():
    analysis = convert_response(valid_response(), "1")
    assert datetime.fromisoformat(analysis.timestamp).tzinfo is not None
