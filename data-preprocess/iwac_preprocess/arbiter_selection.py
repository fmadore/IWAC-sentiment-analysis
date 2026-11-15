"""Pure candidate selection for the panel arbiter; no provider calls or output writes."""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from tqdm import tqdm

from .contract import CONTRACT_V2 as CONTRACT
from .contract import SentimentContract
from .discrepancy import calculate_three_way_spread, has_polarity_valence_flip
from .source import build_model_sentiment, safe_str

SPREAD_KEYS = {
    "polarity": "polarity_spread",
    "subjectivity": "subjectivity_spread",
    "centrality": "centrality_spread",
}
DIMENSIONS = tuple(SPREAD_KEYS)
RULE_SPREAD = "spread"
RULE_VALENCE = "valence"
RULE_UNION = "spread-or-valence"
RULES = (RULE_SPREAD, RULE_VALENCE, RULE_UNION)
DEFAULT_RULE = RULE_UNION if CONTRACT.polarity_valence_bands else RULE_SPREAD

# How many selected articles may lack text in the private mirror before the
# join is treated as broken rather than as a few genuinely empty rows: the
# larger of this share of the frame and one article. The published run had
# none missing; a mismatched mirror revision or a key-type drift misses nearly
# all of them, and must not end in a well-formed, empty publication.
MAX_MISSING_TEXT_SHARE = 0.01


class SelectionError(ValueError):
    """A selection setting or join the arbiter refuses to run with."""


class ThresholdError(SelectionError):
    """A spread threshold looser than the contract's."""


class TextJoinError(SelectionError):
    """Too many selected articles have no text in the private mirror."""


def resolve_threshold(threshold: int | None, contract: SentimentContract = CONTRACT) -> int:
    """Validate a threshold override, defaulting to the contract's.

    A *lower* threshold is rejected rather than clamped. `validate_arbiter_three_way`
    recomputes eligibility from the contract rule and requires the published ids
    to be a subset of it, so a looser run would write a file the repo's own
    validator rejects — days after the money was spent.
    """
    floor = contract.significant_spread_threshold
    if floor is None:
        raise ThresholdError(
            f"The {contract.analysis_version} contract defines no significant spread, so it "
            "has no panel arbiter frame to select from."
        )
    if threshold is None:
        return floor
    if threshold < floor:
        raise ThresholdError(
            f"--threshold {threshold} is looser than the {contract.analysis_version} contract's "
            f"significant spread ({floor}). The published file would fail validate_generated_data. "
            "Selection can only be tightened here; loosening it is a contract change."
        )
    return threshold


def qualifies(
    spread: dict,
    dimensions: Sequence[str],
    threshold: int,
    *,
    rule: str = DEFAULT_RULE,
    valence_flip: bool = False,
) -> bool:
    """Whether one article trips the configured selection rule.

    Separate from `calculate_three_way_spread` on purpose: the stored `spread`
    dict — and therefore the cache fingerprint — is the same whatever rule
    selected the row, so narrowing the rule prunes articles instead of
    invalidating the ones that survive.

    `--dimensions` and `--threshold` narrow the *spread* half only. Under
    `--rule valence` they are inert by construction, which is why the CLI says
    so rather than silently ignoring them.
    """
    if rule not in RULES:
        # Falling through to the union would silently widen a mistyped rule to
        # the whole contract frame, which is the most expensive reading of it.
        raise ValueError(f"Unknown arbiter rule {rule!r}; expected one of {', '.join(RULES)}")
    by_spread = any(spread[SPREAD_KEYS[dimension]] >= threshold for dimension in dimensions)
    if rule == RULE_SPREAD:
        return by_spread
    if rule == RULE_VALENCE:
        return valence_flip
    return by_spread or valence_flip


def find_three_way_conflicts(
    records: list[dict],
    contract: SentimentContract = CONTRACT,
    *,
    dimensions: Sequence[str] = DIMENSIONS,
    threshold: int | None = None,
    rule: str = DEFAULT_RULE,
    model_ids: Sequence[str] | None = None,
) -> list[dict]:
    """Select every article the configured rule says is worth arbitrating.

    Comparability is the contract's: one non-comparable polarity or centrality
    excludes the row, because the models are then disagreeing about whether the
    task applies rather than about the answer.

    `rule`, `dimensions` and `threshold` narrow *which* disagreements are worth
    paying to arbitrate. They can only ever tighten the contract's arbiter
    frame — see `resolve_threshold` and `is_arbiter_eligible`.

    `valence_flip` is stored beside `spread` rather than inside it: the spread
    dict is hashed into the cache fingerprint, and a row's identity must not
    depend on which rule happened to select it.

    By default the panel is the published arbiter's, not the generation's: a
    recused model's ratings neither put an article in the frame nor reach the
    judge. ``model_ids`` names another set — the second judge selects over the
    whole generation, then shows each row to its own panel through
    `project_to_panel`.
    """
    model_ids = list(contract.arbiter_model_ids if model_ids is None else model_ids)
    threshold = resolve_threshold(threshold, contract)
    selected: list[dict] = []

    for item in tqdm(records, total=len(records), desc="Finding panel conflicts"):
        analyses = {
            model_id: build_model_sentiment(item, model_id, contract) for model_id in model_ids
        }
        ordered = [analyses[model_id] for model_id in model_ids]
        spread = calculate_three_way_spread(ordered, contract)
        if not spread:
            continue
        valence_flip = has_polarity_valence_flip(ordered, contract)
        if not qualifies(spread, dimensions, threshold, rule=rule, valence_flip=valence_flip):
            continue
        selected.append(
            {
                "o:id": item.get("o:id"),
                "o:title": safe_str(item.get("title")),
                "newspaper": safe_str(item.get("newspaper")),
                "country": safe_str(item.get("country")),
                "pub_date": safe_str(item.get("pub_date")),
                "analyses": analyses,
                "spread": spread,
                "valence_flip": valence_flip,
            }
        )

    return selected


FLIP_NEGATIVE = "negative"
FLIP_POSITIVE = "positive"


def flip_dissenters(
    analyses: Mapping[str, dict], contract: SentimentContract = CONTRACT
) -> dict[str, str]:
    """The models a valence flip exists *only* because of, with their side.

    A flip needs one model at or above the positive band and one at or below the
    negative band. Removing a model kills it exactly when that model is alone on
    its side, so these are the sole positive and the sole negative readers. A
    row can have two (one alone on each side) or none (several on both).
    Returns an empty dict for a row with no flip at all.
    """
    bands = contract.polarity_valence_bands
    if bands is None or not has_polarity_valence_flip(list(analyses.values()), contract):
        return {}
    positive_minimum, negative_maximum = bands
    ranks = {
        model_id: contract.polarity_scores[analysis.get("polarite")]
        for model_id, analysis in analyses.items()
    }
    positive = [model_id for model_id, rank in ranks.items() if rank >= positive_minimum]
    negative = [model_id for model_id, rank in ranks.items() if rank <= negative_maximum]
    dissenters: dict[str, str] = {}
    if len(positive) == 1:
        dissenters[positive[0]] = FLIP_POSITIVE
    if len(negative) == 1:
        dissenters[negative[0]] = FLIP_NEGATIVE
    return dissenters


@dataclass(frozen=True)
class FrameSummary:
    """What the second judge's dry run reports about its frame before any spend."""

    frame: int
    in_published_frame: int
    recused_only: int
    recused_only_sole_negative: int
    recused_only_sole_positive: int


def flips_over(row: dict, model_ids: Sequence[str], contract: SentimentContract = CONTRACT) -> bool:
    """Whether ``model_ids`` alone, out of a frame row's analyses, show a valence flip."""
    return has_polarity_valence_flip(
        [row["analyses"][model_id] for model_id in model_ids], contract
    )


def classify_frame(
    rows: list[dict], contract: SentimentContract = CONTRACT
) -> tuple[list[dict], list[dict], FrameSummary]:
    """Mark each frame row with its flip's sole dissenters; split off the recused-only rows.

    A row is *recused-only* when it flips over the whole generation but not over
    the published arbiter's panel: the flip exists only because of a model that
    arbiter recused (for the Opus run, Haiku alone on its side of the line).
    Those are the flips the published run structurally could not reach. The
    sole-negative/positive split says which side the recused model was on.
    """
    published_recused = set(contract.arbiter_recused_ids)
    published_panel = list(contract.arbiter_model_ids)
    marked: list[dict] = []
    recused_only: list[dict] = []
    sole_negative = sole_positive = 0
    for row in rows:
        row = {**row, "flip_dissenters": flip_dissenters(row["analyses"], contract)}
        marked.append(row)
        if flips_over(row, published_panel, contract):
            continue
        recused_only.append(row)
        sides = {row["flip_dissenters"].get(model_id) for model_id in published_recused}
        sole_negative += FLIP_NEGATIVE in sides
        sole_positive += FLIP_POSITIVE in sides
    return (
        marked,
        recused_only,
        FrameSummary(
            frame=len(marked),
            in_published_frame=len(marked) - len(recused_only),
            recused_only=len(recused_only),
            recused_only_sole_negative=sole_negative,
            recused_only_sole_positive=sole_positive,
        ),
    )


def project_to_panel(
    article: dict, panel: Sequence[str], contract: SentimentContract = CONTRACT
) -> dict:
    """Show a row selected over a wider frame to the judge's own panel.

    The analyses are cut to ``panel`` and the spread recomputed over it, because
    both are hashed into the cache fingerprint and both must describe what the
    judge actually read. ``valence_flip`` keeps the frame's answer — it is why
    the row was selected — and ``panel_valence_flip`` records whether the judge
    can see the flip at all: when the only reader across the line is the
    judge's own recused member, it cannot.

    Comparability is inherited: a row comparable over the frame is comparable
    over any subset of it.
    """
    missing = [model_id for model_id in panel if model_id not in article["analyses"]]
    if missing:
        raise ValueError(f"Panel model(s) outside the selection frame: {', '.join(missing)}")
    analyses = {model_id: article["analyses"][model_id] for model_id in panel}
    ordered = list(analyses.values())
    return {
        **article,
        "analyses": analyses,
        "spread": calculate_three_way_spread(ordered, contract),
        "frame_spread": article["spread"],
        "panel_valence_flip": has_polarity_valence_flip(ordered, contract),
    }


def attach_full_text(articles: list[dict], texts: dict[str, str]) -> tuple[list[dict], list[str]]:
    """Join the private mirror's unmasked OCR onto the selected articles.

    An article with no text even in the mirror is dropped rather than sent: the
    arbiter would be judging five analyses of nothing.
    """
    kept: list[dict] = []
    missing: list[str] = []
    for article in articles:
        text = texts.get(str(article.get("o:id")))
        if not text:
            missing.append(str(article.get("o:id")))
            continue
        kept.append({**article, "OCR": text})
    return kept, missing


def check_text_coverage(missing: Sequence[str], framed: int) -> None:
    """Refuse a text join that missed more than a handful of articles.

    A few articles may genuinely be empty in the mirror; they are dropped and
    reported. A miss above ``MAX_MISSING_TEXT_SHARE`` of the frame means the two
    sources do not line up (wrong revision, id type drift) and is an error, not
    a warning followed by a publication with the frame silently emptied.
    """
    allowed = max(1, int(framed * MAX_MISSING_TEXT_SHARE))
    if len(missing) > allowed:
        raise TextJoinError(
            f"{len(missing)} of {framed} selected articles have no text in the private mirror "
            f"(at most {allowed} tolerated; e.g. {', '.join(list(missing)[:5])}). Check that the "
            "score and text revisions belong together before spending or publishing."
        )


def selection_magnitude(article: dict, dimensions: Sequence[str]) -> int:
    """How wide this article's disagreement is *on the dimensions in play*.

    `total_spread` sums all three dimensions, so ranking by it under
    `--dimensions polarity` puts the articles with the largest **subjectivity**
    disagreement at the front — the noisiest dimension in the panel, and the one
    the narrowed run had just excluded. A cap would then spend the budget on
    exactly what the rule was written to avoid.
    """
    return sum(article["spread"][SPREAD_KEYS[dimension]] for dimension in dimensions)


def apply_limit(
    articles: list[dict], limit: int | None, dimensions: Sequence[str] = DIMENSIONS
) -> list[dict]:
    """Keep the ``limit`` widest disagreements, deterministically.

    Width is measured on the selected dimensions only (see
    `selection_magnitude`). Ties are broken by article id so that two runs with
    the same corpus and the same cap select the same articles.
    """
    if limit is not None and limit <= 0:
        raise ValueError("limit must be a positive integer")
    if limit is None or limit >= len(articles):
        return articles
    ordered = sorted(
        articles,
        key=lambda article: (-selection_magnitude(article, dimensions), str(article["o:id"])),
    )
    return ordered[:limit]
