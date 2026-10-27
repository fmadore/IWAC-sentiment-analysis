"""The panel arbiter's structured verdict, shared by every generation-2 judge.

One schema, whichever judge fills it: the published Claude Opus 5 run and a
second judge from another developer must return the same shape, or their
verdicts could not be compared article by article. Provider-neutral on
purpose — Anthropic's SDK takes the Pydantic class, Gemini's Interactions API
takes `inline_json_schema()` of it.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal, get_args

from pydantic import BaseModel, ConfigDict, Field

from .arbiter_prompt import BLIND_LABELS
from .contract import CONTRACT_V2, SentimentContract

# The anonymised labels the arbiter's panel is presented under come from
# `arbiter_prompt.BLIND_LABELS`. `resolve_blind_permutation` refuses to run if
# the label and model counts ever disagree.
PREFERENCE_VALUES = (*BLIND_LABELS, "multiple", "none")


class DimensionVerdict(BaseModel):
    """Verdict fields shared by each independently constrained dimension."""

    model_config = ConfigDict(extra="forbid")

    justification: str = Field(description="Raisonnement pour ce score")
    preferred: Literal["a", "b", "c", "d", "e", "multiple", "none"] = Field(
        description="Quelle analyse est la plus juste: 'a', 'b', 'c', 'd', 'e', "
        "'multiple' (plusieurs sont équivalentes) ou 'none' (aucune)"
    )
    verdict_explanation: str = Field(description="Pourquoi cette analyse est préférée")


class PolarityVerdict(DimensionVerdict):
    arbiter_score: Literal[
        "Très positif", "Positif", "Neutre", "Négatif", "Très négatif", "Non applicable"
    ]


class SubjectivityVerdict(DimensionVerdict):
    arbiter_score: Literal[
        "Très objectif", "Plutôt objectif", "Mixte", "Plutôt subjectif", "Très subjectif"
    ]


class CentralityVerdict(DimensionVerdict):
    arbiter_score: Literal["Très central", "Central", "Secondaire", "Marginal", "Non abordé"]


class ArbiterResponseV2(BaseModel):
    """Complete structured response from the panel arbiter."""

    model_config = ConfigDict(extra="forbid")

    polarity: PolarityVerdict = Field(description="Évaluation de la polarité/sentiment")
    subjectivity: SubjectivityVerdict = Field(description="Évaluation de la subjectivité")
    centrality: CentralityVerdict = Field(
        description="Évaluation de la centralité de l'islam/des musulmans"
    )
    overall_winner: Literal["a", "b", "c", "d", "e", "multiple", "none"] = Field(
        description="Quelle analyse est globalement la meilleure"
    )
    overall_explanation: str = Field(description="Explication détaillée du verdict global")
    confidence_level: Literal["high", "medium", "low"] = Field(
        description="Niveau de confiance dans l'évaluation"
    )


def assert_schema_matches_contract(contract: SentimentContract) -> None:
    """Fail at import if the response literals drift from the contract scales.

    Pydantic needs static literals, so the scales are spelled out twice. A
    silent divergence would let the arbiter return a score the dashboard cannot
    map, one paid article at a time.
    """
    expected = {
        "polarity": set(contract.polarity_scores),
        "centrality": set(contract.centrality_scores),
        "subjectivity": set(contract.subjectivity_label_scores),
    }
    declared = {
        "polarity": set(get_args(PolarityVerdict.model_fields["arbiter_score"].annotation)),
        "centrality": set(get_args(CentralityVerdict.model_fields["arbiter_score"].annotation)),
        "subjectivity": set(get_args(SubjectivityVerdict.model_fields["arbiter_score"].annotation)),
    }
    for dimension, values in expected.items():
        # Centrality's "Non applicable" is a v1 legacy key the arbiter is never
        # asked to produce; every other value must round-trip.
        if not declared[dimension] <= values:
            raise ValueError(
                f"Arbiter {dimension} literals are not a subset of the "
                f"{contract.analysis_version} contract scale: "
                f"{sorted(declared[dimension] - values)}"
            )


assert_schema_matches_contract(CONTRACT_V2)


def inline_json_schema(model: type[BaseModel] = ArbiterResponseV2) -> dict[str, Any]:
    """The JSON Schema of ``model`` with every ``$ref`` resolved in place.

    Pydantic emits nested models as ``$defs`` + ``$ref``. Providers support
    different subsets of JSON Schema, and a reference one of them cannot follow
    fails on the first paid call rather than here, so the schema is flattened
    before it is sent. The verdict schema has no recursion to resolve.
    """
    schema = model.model_json_schema()
    definitions = schema.pop("$defs", {})

    def resolve(node: Any) -> Any:
        if isinstance(node, dict):
            reference = node.get("$ref")
            if reference is not None:
                target = definitions[reference.rsplit("/", 1)[-1]]
                merged = {**target, **{k: v for k, v in node.items() if k != "$ref"}}
                return resolve(merged)
            return {key: resolve(value) for key, value in node.items()}
        if isinstance(node, list):
            return [resolve(item) for item in node]
        return node

    return resolve(schema)


# ============================================================================
# Serialized shapes (mirrored by the frontend types)
# ============================================================================


@dataclass
class ArbiterScoreV2:
    """The arbiter's own score for one dimension, plus its preference."""

    score: str
    justification: str
    preferred: str
    verdict_explanation: str


@dataclass
class ArbiterAnalysisV2:
    article_id: str
    polarity: ArbiterScoreV2
    subjectivity: ArbiterScoreV2
    centrality: ArbiterScoreV2
    overall_winner: str
    overall_explanation: str
    confidence_level: str
    timestamp: str
    # The label -> model mapping is stored once in metadata, not per article.


def convert_response(
    response: ArbiterResponseV2, article_id: str, contract: SentimentContract = CONTRACT_V2
) -> ArbiterAnalysisV2:
    """Map the validated response onto the published shape.

    Subjectivity is stored as the shared 1-5 rank, like every other v2 file, so
    the browser's numeric code paths keep working; the label is recoverable from
    the contract.
    """
    return ArbiterAnalysisV2(
        article_id=article_id,
        polarity=ArbiterScoreV2(
            score=response.polarity.arbiter_score,
            justification=response.polarity.justification,
            preferred=response.polarity.preferred,
            verdict_explanation=response.polarity.verdict_explanation,
        ),
        subjectivity=ArbiterScoreV2(
            score=str(contract.subjectivity_label_scores[response.subjectivity.arbiter_score]),
            justification=response.subjectivity.justification,
            preferred=response.subjectivity.preferred,
            verdict_explanation=response.subjectivity.verdict_explanation,
        ),
        centrality=ArbiterScoreV2(
            score=response.centrality.arbiter_score,
            justification=response.centrality.justification,
            preferred=response.centrality.preferred,
            verdict_explanation=response.centrality.verdict_explanation,
        ),
        overall_winner=response.overall_winner,
        overall_explanation=response.overall_explanation,
        confidence_level=response.confidence_level,
        timestamp=datetime.now().isoformat(),
    )
