"""Judge registry, prices, cost estimates and usage accounting for the panel arbiter.

The published panel arbiter is Claude Opus 5 (contract `arbiter.arbiterModel`).
A second judge must come from another developer so it can read Claude Haiku
5.5's analyses, and it recuses its own developer's member in turn
(`SentimentContract.recused_for`). This module holds what differs between
judges — model id, developer, provider and published prices — the cost
estimates, the single usage-accounting type every judge records into, and the
comparison of a second judge with the published one. Nothing here decides
*what* a judge is shown.

Prices are notes, not quotes: they were read from the providers' pricing pages
on the date in `PRICES_CHECKED`, and `--dry-run` prints the rate it used.
"""

from __future__ import annotations

import json
import logging
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

from .arbiter_prompt import BLIND_LABELS, create_arbiter_prompt, system_instruction
from .contract import CONTRACT_V2, SentimentContract
from .judge_comparison import judge_agreement, own_developer_affinity, polarity_verdicts
from .source import build_model_sentiment

PRICES_CHECKED = date(2026, 10, 27)

# Measured on the published arbiter's tokenizer (1,463 tokens for the 3,540
# characters of the v2.2.0 French system instruction). Other tokenizers are
# likely to need fewer tokens for the same French prose, so applying it to
# another judge overstates the input side: conservative, never optimistic.
ESTIMATE_CHARS_PER_TOKEN = 2.42

# Output tokens per call, thinking included. `medium` is Claude Opus 5's
# measured figure on the published run (453,184 over 281 calls); nothing has
# been measured for any other rung or judge, so these are a reference, not a
# prediction — a pilot (`--limit 20`) records the real figure in
# `metadata.usage`. `usd_if_output_doubles` brackets the risk.
ESTIMATE_OUTPUT_TOKENS = {"low": 1100, "medium": 1613, "high": 2400, "xhigh": 3500, "max": 4800}

PROVIDER_ANTHROPIC = "anthropic"
PROVIDER_GOOGLE = "google"
PROVIDER_OPENAI = "openai"
# Providers with a paid-call implementation for a second judge. Any other
# registered judge is priced by `--dry-run` and refused before a paid run loads
# anything.
PAID_PROVIDERS = frozenset({PROVIDER_GOOGLE})

TIER_STANDARD = "standard"
TIER_FLEX = "flex"


@dataclass(frozen=True)
class Rates:
    """USD per million tokens. Output includes thinking tokens."""

    input: float
    output: float
    cached_input: float
    # A prompt-cache write, where the provider bills it apart (Anthropic).
    cache_write: float = 0.0


@dataclass(frozen=True)
class JudgeSpec:
    """One candidate judge. ``developer`` is a contract developer id."""

    id: str
    model: str
    display_name: str
    developer: str
    provider: str
    effort_levels: tuple[str, ...]
    default_effort: str
    # Service tier -> [(first day in force, rates)], oldest first.
    rates: Mapping[str, tuple[tuple[date, Rates], ...]] = field(default_factory=dict)
    pricing_source: str = ""

    def rates_on(self, day: date, tier: str = TIER_STANDARD) -> Rates:
        """The rates in force on ``day``; refuses a day before the first listed."""
        try:
            schedule = self.rates[tier]
        except KeyError:
            raise ValueError(
                f"{self.display_name} has no {tier!r} tier; expected one of {', '.join(self.rates)}"
            ) from None
        in_force = [rates for start, rates in schedule if start <= day]
        if not in_force:
            raise ValueError(f"No {self.display_name} {tier} rates are recorded for {day}")
        return in_force[-1]

    def next_rate_change(self, day: date, tier: str = TIER_STANDARD) -> tuple[date, Rates] | None:
        """The next scheduled change after ``day``, if the provider announced one."""
        later = [(start, rates) for start, rates in self.rates.get(tier, ()) if start > day]
        return later[0] if later else None


GEMINI_4_ARGON = JudgeSpec(
    id="gemini-4-argon",
    model="gemini-4-argon",
    display_name="Gemini 4 Argon",
    developer="google",
    provider=PROVIDER_GOOGLE,
    # `thinking_level`; Google's default is medium.
    effort_levels=("low", "medium", "high"),
    default_effort="medium",
    # Introductory pricing until 30 November 2026, doubling on 1 December.
    # Explicit caching is not offered; implicit caching starts at 4,096 tokens.
    rates={
        TIER_STANDARD: (
            (date(2026, 10, 1), Rates(input=2.00, output=10.00, cached_input=0.10)),
            (date(2026, 12, 1), Rates(input=4.00, output=20.00, cached_input=0.20)),
        ),
        TIER_FLEX: (
            (date(2026, 10, 1), Rates(input=1.00, output=5.00, cached_input=0.05)),
            (date(2026, 12, 1), Rates(input=2.00, output=10.00, cached_input=0.10)),
        ),
    },
    pricing_source="https://ai.google.dev/gemini-api/docs/pricing",
)

GPT_6_ASTRA = JudgeSpec(
    id="gpt-6-astra",
    model="gpt-6-astra",
    display_name="GPT-6 Astra",
    developer="openai",
    provider=PROVIDER_OPENAI,
    effort_levels=("low", "medium", "high", "xhigh", "max"),
    default_effort="medium",
    rates={
        TIER_STANDARD: ((date(2026, 10, 1), Rates(input=10.00, output=50.00, cached_input=1.00)),),
    },
    pricing_source="https://developers.openai.com/api/docs/pricing",
)

GPT_6_1_SOL = JudgeSpec(
    id="gpt-6.1-sol",
    model="gpt-6.1-sol",
    display_name="GPT-6.1 Sol",
    developer="openai",
    provider=PROVIDER_OPENAI,
    effort_levels=("low", "medium", "high", "xhigh", "max"),
    default_effort="medium",
    rates={
        TIER_STANDARD: ((date(2026, 10, 1), Rates(input=2.00, output=10.00, cached_input=0.10)),),
    },
    pricing_source="https://developers.openai.com/api/docs/pricing",
)

JUDGES = {judge.id: judge for judge in (GEMINI_4_ARGON, GPT_6_ASTRA, GPT_6_1_SOL)}
DEFAULT_JUDGE = GEMINI_4_ARGON.id


def estimate_judge_cost(
    prompt_chars: list[int],
    *,
    prefix_chars: int,
    rates: Rates,
    effort: str,
) -> dict[str, Any]:
    """Estimate a second-judge run from the real prompt sizes.

    ``prompt_chars`` holds one entry per call (the user prompt); ``prefix_chars``
    is what every call repeats — the system instruction plus the response
    schema. No cache discount is assumed: the repeated prefix is below the
    4,096 tokens Gemini's implicit cache needs, and an estimate that relied on a
    discount the provider does not guarantee would read low.
    """
    calls = len(prompt_chars)
    input_tokens = (sum(prompt_chars) + calls * prefix_chars) / ESTIMATE_CHARS_PER_TOKEN
    per_call = ESTIMATE_OUTPUT_TOKENS.get(effort, ESTIMATE_OUTPUT_TOKENS["high"])
    output_tokens = calls * per_call
    input_usd = input_tokens / 1_000_000 * rates.input
    output_usd = output_tokens / 1_000_000 * rates.output
    return {
        "calls": calls,
        "input_tokens": round(input_tokens),
        "output_tokens": output_tokens,
        "assumed_output_tokens_per_call": per_call,
        "usd": round(input_usd + output_usd, 2),
        "usd_if_output_doubles": round(input_usd + 2 * output_usd, 2),
    }


def prefix_chars(prompt_version: str, schema: Mapping[str, Any]) -> int:
    """What every call repeats for a judge without prompt caching: instruction + schema."""
    return len(system_instruction(prompt_version)) + len(json.dumps(schema, ensure_ascii=False))


# ============================================================================
# The published judge: Claude Opus 5
# ============================================================================

# Published Claude Opus 5 rates. Cache reads are 0.1x the input rate, 5-minute
# writes 1.25x.
USD_PER_MTOK_INPUT = 5.0
USD_PER_MTOK_OUTPUT = 25.0
CACHE_WRITE_MULTIPLIER = 1.25
CACHE_READ_MULTIPLIER = 0.1
OPUS_5_RATES = Rates(
    input=USD_PER_MTOK_INPUT,
    output=USD_PER_MTOK_OUTPUT,
    cached_input=USD_PER_MTOK_INPUT * CACHE_READ_MULTIPLIER,
    cache_write=USD_PER_MTOK_INPUT * CACHE_WRITE_MULTIPLIER,
)
# Measured at 3,565 tokens/call over the published run, against 1,463 for the
# v2.2.0 system instruction alone. The difference is the structured-output
# schema: the API renders `output_format` ahead of `system`, and a breakpoint
# on the system block caches everything before it too. The v2.3.0 instruction
# is longer, so this understates its cached prefix and the estimate's cached
# half; a pilot's `metadata.usage` gives the real figure.
CACHED_PREFIX_TOKENS = 3565


def estimate_opus_cost(prompt_chars: Sequence[int], *, effort: str) -> dict[str, Any]:
    """Estimate a Claude Opus 5 run from the real user-prompt sizes.

    The input side is measured (one entry per call); the output side is an
    assumption, printed beside the number so nobody reads the total as a quote.
    The cached prefix — schema plus system instruction — is billed once at the
    write rate and at a tenth of the base rate thereafter; back-to-back calls
    keep the entry warm (the published run wrote it once and read it 281 times).
    """
    calls = len(prompt_chars)
    fresh_tokens = sum(prompt_chars) / ESTIMATE_CHARS_PER_TOKEN
    cached_tokens = (
        CACHED_PREFIX_TOKENS * CACHE_WRITE_MULTIPLIER
        + max(calls - 1, 0) * CACHED_PREFIX_TOKENS * CACHE_READ_MULTIPLIER
        if calls
        else 0.0
    )
    billable_input = fresh_tokens + cached_tokens
    # What the same run would have cost with no breakpoint.
    uncached_input = fresh_tokens + calls * CACHED_PREFIX_TOKENS
    per_call = ESTIMATE_OUTPUT_TOKENS.get(effort, 3000)
    output_tokens = calls * per_call
    return {
        "calls": calls,
        "input_tokens": round(uncached_input),
        "billable_input_tokens": round(billable_input),
        "cache_saving_usd": round(
            (uncached_input - billable_input) / 1_000_000 * USD_PER_MTOK_INPUT, 2
        ),
        "output_tokens": output_tokens,
        "assumed_output_tokens_per_call": per_call,
        "usd": round(
            billable_input / 1_000_000 * USD_PER_MTOK_INPUT
            + output_tokens / 1_000_000 * USD_PER_MTOK_OUTPUT,
            2,
        ),
    }


def estimate_panel_cost(
    articles: Sequence[dict],
    permutation: dict[str, str],
    effort: str,
    contract: SentimentContract = CONTRACT_V2,
) -> dict[str, Any]:
    """`estimate_opus_cost` over the prompts the published judge would be sent."""
    return estimate_opus_cost(
        [len(create_arbiter_prompt(article, permutation, contract)) for article in articles],
        effort=effort,
    )


# ============================================================================
# Usage: one accounting type for every provider
# ============================================================================

_TOKEN_FIELDS = {
    PROVIDER_ANTHROPIC: (
        "input_tokens",
        "output_tokens",
        "cache_creation_input_tokens",
        "cache_read_input_tokens",
    ),
    PROVIDER_GOOGLE: (
        "input_tokens",
        "cached_input_tokens",
        "output_tokens",
        "thought_tokens",
        "generated_tokens",
    ),
}


def _anthropic_usd(
    fresh: int, output: int, cache_write: int, cache_read: int, rates: Rates
) -> float:
    return (
        fresh / 1_000_000 * rates.input
        + cache_write / 1_000_000 * rates.cache_write
        + cache_read / 1_000_000 * rates.cached_input
        + output / 1_000_000 * rates.output
    )


@dataclass
class ArbiterUsage:
    """What a run actually cost, accumulated across calls, for any provider.

    Without this the dry-run estimate could never be checked against reality:
    the published verdicts show only the JSON the model returned, and thinking
    tokens leave no trace in the file. ``cache_read_input_tokens`` is also the
    only proof that Anthropic's cached prefix is being read rather than
    silently re-billed. The published shape differs per provider (the Opus file
    records Anthropic's cache fields, a Gemini file Google's thinking fields),
    so ``provider`` selects which counters are serialised.

    Gemini's ``generated_tokens`` is what is billed at the output rate. Gemini
    reports thinking apart from the answer; where it also reports
    ``total_tokens``, the generated count is everything that is not input, which
    bills thinking once whether or not the two fields overlap.

    ``unmetered_calls`` counts billed calls whose usage the SDK did not expose;
    it appears in the metadata only when non-zero, so existing records keep
    their exact shape.
    """

    provider: str
    calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_creation_input_tokens: int = 0
    cache_read_input_tokens: int = 0
    cached_input_tokens: int = 0
    thought_tokens: int = 0
    generated_tokens: int = 0
    usd: float = 0.0
    unmetered_calls: int = 0

    @classmethod
    def from_metadata(cls, stored: Any, provider: str) -> ArbiterUsage:
        """Resume the totals a previous run recorded; a run that spends nothing keeps them."""
        usage = cls(provider=provider)
        if not isinstance(stored, dict):
            return usage
        for name in ("calls", "unmetered_calls", *_TOKEN_FIELDS[provider]):
            value = stored.get(name, 0)
            setattr(usage, name, int(value) if isinstance(value, int | float) else 0)
        usd = stored.get("usd")
        if isinstance(usd, int | float):
            usage.usd = float(usd)
        elif provider == PROVIDER_ANTHROPIC:
            usage.usd = _anthropic_usd(
                usage.input_tokens,
                usage.output_tokens,
                usage.cache_creation_input_tokens,
                usage.cache_read_input_tokens,
                OPUS_5_RATES,
            )
        return usage

    def add_anthropic(self, usage: Any, rates: Rates = OPUS_5_RATES) -> None:
        """Record one Messages API call. ``usage`` is the SDK's object or a dict."""
        if usage is None:
            return

        def count(name: str) -> int:
            value = usage.get(name) if isinstance(usage, dict) else getattr(usage, name, 0)
            return int(value or 0)

        fresh, output = count("input_tokens"), count("output_tokens")
        write, read = count("cache_creation_input_tokens"), count("cache_read_input_tokens")
        self.calls += 1
        self.input_tokens += fresh
        self.output_tokens += output
        self.cache_creation_input_tokens += write
        self.cache_read_input_tokens += read
        self.usd += _anthropic_usd(fresh, output, write, read, rates)

    def add_gemini(self, usage: Any, rates: Rates) -> None:
        """Record one Interactions API call, priced at the rates of the day."""
        if usage is None:
            return

        def count(name: str) -> int:
            return int(getattr(usage, name, 0) or 0)

        total_input = count("total_input_tokens")
        cached = min(count("total_cached_tokens"), total_input)
        output = count("total_output_tokens")
        thought = count("total_thought_tokens")
        total = count("total_tokens")
        generated = total - total_input if total > total_input else output + thought

        self.calls += 1
        self.input_tokens += total_input
        self.cached_input_tokens += cached
        self.output_tokens += output
        self.thought_tokens += thought
        self.generated_tokens += generated
        self.usd += (
            (total_input - cached) / 1_000_000 * rates.input
            + cached / 1_000_000 * rates.cached_input
            + generated / 1_000_000 * rates.output
        )

    def add_unmetered(self) -> None:
        """A billed call whose token counts the SDK did not expose."""
        self.unmetered_calls += 1

    def as_metadata(self) -> dict[str, Any]:
        """Serialisable totals in the provider's published shape, plus per-call averages."""
        if not self.calls and not self.unmetered_calls:
            return {}
        calls = max(self.calls, 1)
        record: dict[str, Any] = {"calls": self.calls}
        if self.provider == PROVIDER_ANTHROPIC:
            record.update(
                input_tokens=self.input_tokens,
                output_tokens=self.output_tokens,
                cache_creation_input_tokens=self.cache_creation_input_tokens,
                cache_read_input_tokens=self.cache_read_input_tokens,
                output_tokens_per_call=round(self.output_tokens / calls),
                input_tokens_per_call=round(self.input_tokens / calls),
                usd=round(self.usd, 2),
            )
        else:
            record.update(
                input_tokens=self.input_tokens,
                cached_input_tokens=self.cached_input_tokens,
                output_tokens=self.output_tokens,
                thought_tokens=self.thought_tokens,
                generated_tokens=self.generated_tokens,
                usd=round(self.usd, 2),
                generated_tokens_per_call=round(self.generated_tokens / calls),
                input_tokens_per_call=round(self.input_tokens / calls),
            )
        if self.unmetered_calls:
            record["unmetered_calls"] = self.unmetered_calls
        return record


# ============================================================================
# Second judges: panel and comparison with the published arbiter
# ============================================================================


def judge_panel(judge: JudgeSpec, contract: SentimentContract = CONTRACT_V2) -> list[str]:
    """The models ``judge`` reads: the generation minus its own developer's members."""
    panel = contract.panel_for(judge.developer)
    if len(panel) != len(BLIND_LABELS):
        # The prompt says "cinq analyses" and the schema accepts a-e: a judge
        # whose developer has no member (or two) needs a prompt version, not a
        # silently mislabelled run.
        raise ValueError(
            f"{judge.display_name} would read {len(panel)} models, but the prompt and the "
            f"schema present exactly {len(BLIND_LABELS)}"
        )
    return panel


def model_polarities(
    records: list[dict], article_ids: set[str], contract: SentimentContract = CONTRACT_V2
) -> dict[str, dict[str, Any]]:
    """Every generation model's polarity on ``article_ids``, recused or not."""
    model_ids = list(contract.model_names)
    ratings: dict[str, dict[str, Any]] = {model_id: {} for model_id in model_ids}
    for item in records:
        article_id = str(item.get("o:id"))
        if article_id not in article_ids:
            continue
        for model_id in model_ids:
            ratings[model_id][article_id] = build_model_sentiment(item, model_id, contract).get(
                "polarite"
            )
    return ratings


def compare_with_published(
    records: list[dict],
    evaluations: list[dict],
    judge: JudgeSpec,
    published_path: Path,
    logger: logging.Logger,
    contract: SentimentContract = CONTRACT_V2,
) -> dict | None:
    """Judge agreement and own-developer affinity against the published arbiter.

    Logged, not published: the figures are only as good as the overlap, and the
    affinity estimate carries the exposure confound `judge_comparison` explains.
    """
    if not evaluations or not published_path.exists():
        return None
    published = json.loads(published_path.read_text(encoding="utf-8"))
    first = polarity_verdicts(published.get("evaluations", []))
    second = polarity_verdicts(evaluations)
    shared = set(first) & set(second)
    if not shared:
        logger.info("No article is judged by both arbiters yet; nothing to compare")
        return None
    agreement = judge_agreement(first, second, contract)
    published_name = contract.arbiter["arbiterModel"]
    affinity = own_developer_affinity(
        {
            published_name: (contract.arbiter_developer, first),
            judge.model: (judge.developer, second),
        },
        model_polarities(records, shared, contract),
        contract,
    )
    logger.info(
        "Judge agreement on %d shared articles: exact %d (%.1f%%); of %d comparable, "
        "within one step %d, same sign %d",
        agreement["articles"],
        agreement["exact"],
        100 * (agreement["exact_rate"] or 0),
        agreement["comparable"],
        agreement["within_one"],
        agreement["same_sign"],
    )
    for name, entry in affinity["affinity"].items():
        did = entry["difference_in_differences"]
        logger.info(
            "  %s own-developer affinity (%s vs controls %s): %s",
            name,
            ", ".join(entry["own_models"]) or "none",
            ", ".join(affinity["controls"]),
            "n/a" if did is None else f"{did:+.3f}",
        )
    logger.info(
        "  Conservative by construction: each judge never read its own developer's "
        "model, while the other judge did."
    )
    return {"agreement": agreement, "affinity": affinity}
