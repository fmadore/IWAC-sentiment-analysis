"""Pure candidate selection for the panel arbiter; no provider calls or output writes."""

from collections.abc import Sequence

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


def resolve_threshold(threshold: int | None, contract: SentimentContract = CONTRACT) -> int:
    """Validate a threshold override, defaulting to the contract's.

    A *lower* threshold is rejected rather than clamped. `validate_arbiter_three_way`
    recomputes eligibility from the contract rule and requires the published ids
    to be a subset of it, so a looser run would write a file the repo's own
    validator rejects — days after the money was spent.
    """
    floor = contract.significant_spread_threshold
    if threshold is None:
        return floor
    if threshold < floor:
        raise SystemExit(
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
    """
    model_ids = list(contract.model_names)
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
    if limit is None or limit >= len(articles):
        return articles
    ordered = sorted(
        articles,
        key=lambda article: (-selection_magnitude(article, dimensions), str(article["o:id"])),
    )
    return ordered[:limit]
