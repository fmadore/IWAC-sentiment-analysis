"""Second-judge registry, prices and usage accounting for the panel arbiter.

The published panel arbiter is Claude Opus 5 (contract `arbiter.arbiterModel`).
A second judge must come from another developer so it can read Claude Haiku
5.5's analyses, and it recuses its own developer's member in turn
(`SentimentContract.recused_for`). This module holds what differs between
candidate judges — model id, developer, provider and published prices — and
nothing that decides *what* they are shown.

Prices are notes, not quotes: they were read from the providers' pricing pages
on the date in `PRICES_CHECKED`, and `--dry-run` prints the rate it used.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Any

PRICES_CHECKED = date(2026, 10, 27)

# Measured on the published arbiter's tokenizer (1,463 tokens for the 3,540
# characters of the French system instruction). Other tokenizers are likely to
# need fewer tokens for the same French prose, so applying it to another judge
# overstates the input side: conservative, never optimistic.
ESTIMATE_CHARS_PER_TOKEN = 2.42

# Output tokens per call, thinking included. `medium` is Claude Opus 5's
# measured figure on the published run (453,184 over 281 calls); nothing has
# been measured for any other judge, so these are a reference, not a
# prediction — a pilot (`--limit 20`) records the real figure in
# `metadata.usage`. `usd_if_output_doubles` brackets the risk.
ESTIMATE_OUTPUT_TOKENS = {"low": 1100, "medium": 1613, "high": 2400, "xhigh": 3500, "max": 4800}

PROVIDER_GOOGLE = "google"
PROVIDER_OPENAI = "openai"
# Providers with a paid-call implementation. Any other registered judge is
# priced by `--dry-run` and refused before a paid run loads anything.
PAID_PROVIDERS = frozenset({PROVIDER_GOOGLE})

TIER_STANDARD = "standard"
TIER_FLEX = "flex"


@dataclass(frozen=True)
class Rates:
    """USD per million tokens. Output includes thinking tokens."""

    input: float
    output: float
    cached_input: float


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
    """Estimate a run from the real prompt sizes.

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


@dataclass
class JudgeUsage:
    """What a second-judge run actually cost, accumulated across calls.

    ``generated_tokens`` is what is billed at the output rate. Gemini reports
    thinking apart from the answer (``total_thought_tokens`` beside
    ``total_output_tokens``); where it also reports ``total_tokens``, the
    generated count is everything that is not input, which bills thinking once
    whether or not the two fields overlap. The raw fields are kept so the figure
    can be audited against the invoice.
    """

    calls: int = 0
    input_tokens: int = 0
    cached_input_tokens: int = 0
    output_tokens: int = 0
    thought_tokens: int = 0
    generated_tokens: int = 0
    usd: float = 0.0

    @classmethod
    def from_metadata(cls, stored: Any) -> JudgeUsage:
        """Resume the totals a previous run recorded; a run that spends nothing keeps them."""
        if not isinstance(stored, dict):
            return cls()
        values: dict[str, Any] = {}
        for name in (
            "calls",
            "input_tokens",
            "cached_input_tokens",
            "output_tokens",
            "thought_tokens",
            "generated_tokens",
        ):
            value = stored.get(name, 0)
            values[name] = int(value) if isinstance(value, int | float) else 0
        usd = stored.get("usd", 0.0)
        values["usd"] = float(usd) if isinstance(usd, int | float) else 0.0
        return cls(**values)

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

    def as_metadata(self) -> dict[str, Any]:
        if not self.calls:
            return {}
        return {
            **asdict(self),
            "usd": round(self.usd, 2),
            "generated_tokens_per_call": round(self.generated_tokens / self.calls),
            "input_tokens_per_call": round(self.input_tokens / self.calls),
        }
