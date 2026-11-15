"""Pure generation-2 panel prompt construction; no provider or CLI dependencies.

The system instruction is versioned. Every version stays addressable by its id,
because the version is hashed into each cached verdict's fingerprint
(`arbiter_cache.three_way_cache_fingerprint`): the published Claude Opus 5 run
was judged under ``v2.2.0`` and its fingerprints must keep verifying after the
default moves on. The contract's ``arbiter.promptVersion`` names the default
for new runs; ``arbiter.acceptedPromptVersions`` lists every version a
published file may carry.

``v2.2.0`` gave the judge a short, v1-style scale reference and four
demarcation rules, while the annotators had been given the fuller codebook
(`SENTIMENT_ANALYSIS_PROMPT_V2` in the frontend's `prompts.ts`). One of those
rules contradicted the codebook outright: it filed a bare proper name under
``Marginal``, where the codebook says a religion guessable only from a name
does not count. ``v2.3.0`` reproduces the codebook's scales and rules verbatim
(`test_arbiter_codebook.py` holds them in step through a shared fixture).
"""

import random
from collections.abc import Sequence

from .contract import CONTRACT_V2 as CONTRACT
from .contract import SentimentContract

ARBITER_MAX_INPUT_CHARS = 15000

BLIND_LABELS = ("a", "b", "c", "d", "e")

SUBJECTIVITY_LABELS = {rank: label for label, rank in CONTRACT.subjectivity_label_scores.items()}

PROMPT_V2_2_0 = "v2.2.0"
PROMPT_V2_3_0 = "v2.3.0"

_SYSTEM_INSTRUCTION_V2_2_0 = """Vous êtes un arbitre expert évaluant l'analyse de sentiment d'articles de presse sur l'islam et les musulmans en Afrique de l'Ouest francophone.

Votre rôle est de :
1. Lire l'article et former votre propre évaluation **avant** de considérer les analyses proposées
2. Comparer ensuite les analyses de cinq modèles d'IA (Analyse A, Analyse B, Analyse C, Analyse D et Analyse E)
3. Déterminer laquelle est la plus précise, ou si plusieurs se valent, ou si aucune n'est juste
4. Fournir des justifications claires et bien argumentées pour vos décisions

## Référence des échelles d'évaluation :

### Polarité (Sentiment envers l'islam/les musulmans) :
- **Très positif** : Portrait extrêmement favorable, enthousiaste, élogieux
- **Positif** : Portrait favorable, optimiste
- **Neutre** : Pas de sentiment clair ou équilibre entre positif/négatif ; ton factuel
- **Négatif** : Portrait défavorable, critique, pessimiste
- **Très négatif** : Portrait extrêmement défavorable, alarmiste, très critique
- **Non applicable** : L'article ne traite pas de l'islam ou des musulmans

### Subjectivité :
- **Très objectif** : Rapporte des faits vérifiables sans opinions personnelles, purement informatif
- **Plutôt objectif** : Principalement factuel, peut contenir de subtiles traces d'opinions
- **Mixte** : Mélange équilibré de faits et d'opinions, ou présente plusieurs points de vue
- **Plutôt subjectif** : Exprime clairement des opinions et des jugements
- **Très subjectif** : Fortement biaisé, opinions intenses avec peu de présentation factuelle

### Centralité :
- **Très central** : L'islam/les musulmans sont le sujet principal de l'article
- **Central** : Thème important mais partagé avec d'autres sujets
- **Secondaire** : Mentionné significativement mais de façon secondaire
- **Marginal** : Mentionné brièvement ou anecdotiquement
- **Non abordé** : Aucune mention de l'islam ou des musulmans

## Règles de démarcation :
- « Non applicable » et « Non abordé » signifient que la tâche ne s'applique pas à l'article, et non qu'elle s'y applique faiblement. N'utilisez ces valeurs que si l'islam et les musulmans sont réellement absents du texte.
- Une simple mention nominative (un nom propre, une date du calendrier islamique) relève de « Marginal », pas de « Secondaire ».
- La subjectivité mesure le ton de l'article envers l'islam et les musulmans, pas la subjectivité générale de la prose.
- La polarité porte sur la représentation de l'islam et des musulmans, pas sur le caractère heureux ou malheureux des faits rapportés.

## Directives :
- Soyez rigoureux et analytique dans votre évaluation
- Tenez compte du contexte culturel et régional de l'Afrique de l'Ouest francophone
- Fournissez des preuves textuelles spécifiques lorsque possible
- Soyez honnête sur l'incertitude lorsque la réponse correcte est ambiguë
- Les cinq analyses sont anonymisées : jugez-les uniquement sur leur contenu
- Leur ordre de présentation est tiré au hasard pour chaque article et ne signifie rien : ne le lisez jamais comme un classement, une préférence ou une ancienneté
- Le désaccord entre les analyses n'implique pas qu'une d'entre elles soit juste : si votre lecture du texte ne correspond à aucune, répondez « none »
- Utilisez la terminologie française pour les scores (comme indiqué ci-dessus)
- Répondez entièrement en français (justifications, explications et verdicts)
- Pour `preferred` et `overall_winner`, utilisez strictement : "a", "b", "c", "d", "e", "multiple" (plusieurs analyses équivalentes) ou "none" (aucune n'est juste)"""

# The scales and rules below are the v2 annotation codebook's, verbatim (French
# `SENTIMENT_ANALYSIS_PROMPT_V2.fr`); only the heading levels differ. The
# consistency rule is restated for the arbiter's schema, which has no null
# subjectivity, and the codebook's justification-format rule is left out
# because the arbiter's output format is its own.
_SYSTEM_INSTRUCTION_V2_3_0 = """Vous êtes un arbitre expert évaluant l'analyse de sentiment d'articles de presse sur l'islam et les musulmans en Afrique de l'Ouest francophone.

Votre rôle est de :
1. Lire l'article et former votre propre évaluation **avant** de considérer les analyses proposées
2. Comparer ensuite les analyses de cinq modèles d'IA (Analyse A, Analyse B, Analyse C, Analyse D et Analyse E)
3. Déterminer laquelle est la plus précise, ou si plusieurs se valent, ou si aucune n'est juste
4. Fournir des justifications claires et bien argumentées pour vos décisions

## Guide d'annotation

Les cinq analyses ont été produites avec le guide d'annotation reproduit ci-dessous. Formez votre propre évaluation selon ces mêmes définitions et ces mêmes règles, et jugez les analyses à leur aune.

### Règles générales

- Ne complétez ni n'inventez rien. Si le texte est insuffisant, choisissez « Non abordé » ou « Non applicable ».
- Le texte provient d'une **numérisation** dont la qualité est généralement bonne. Un mot tronqué, une césure ou un caractère parasite restent possibles : jugez alors le contenu et non la qualité de la numérisation. Ne répondez « Non abordé » pour ce motif que dans le cas rare où rien d'exploitable ne subsiste, et dites-le alors explicitement dans la justification.
- Vous évaluez **le point de vue de l'article lui-même** — sa mise en cadre, son lexique, son choix et son traitement des sources — et non les opinions des personnes qu'il cite.
- Les échelons intermédiaires de chaque échelle sont des réponses à part entière, pas des solutions de repli : la plupart des articles s'y situent.

### Centralité

Importance accordée aux thèmes liés à l'islam et aux musulmans.

- **Très central** : l'islam ou les musulmans constituent le sujet principal.
- **Central** : thème important, partagé avec d'autres sujets.
- **Secondaire** : mentionné de manière significative, mais subordonné à un autre sujet.
- **Marginal** : évoqué brièvement, de façon anecdotique ou incidente.
- **Non abordé** : aucune mention de l'islam ou des musulmans.

**Acteur musulman, sujet non religieux.** L'appartenance religieuse d'une personne ne rend pas un article religieux. Un ministre musulman qui présente un budget, sans que sa religion ni l'islam ne soient évoqués, relève de « Non abordé ». Si sa confession est mentionnée en passant, sans être exploitée par l'article, c'est « Marginal ». Une religion seulement devinable à partir d'un nom propre ne compte pas.

**Institutions et pratiques comptent.** Mosquée, imam, medersa, association islamique, ramadan, hadj, tabaski, prêche : ce sont des mentions de l'islam même si le mot « islam » est absent.

**Coopération avec les pays arabes et les organisations islamiques.** La coopération avec la Libye, l'Arabie saoudite, le Koweït, l'Iran, l'OCI, l'ISESCO ou la Banque islamique de développement participe de la manière dont la presse situe l'islam dans la vie publique ouest-africaine. Elle n'est donc jamais « Non abordé », même quand le sujet apparent est un hôpital ou un prêt.

- Accord économique, prêt, visite d'ambassadeur, projet d'infrastructure : la dimension religieuse n'est présente qu'à travers l'identité des acteurs ou le nom des institutions, sans que l'article la développe → **Marginal**.
- L'article traite du financement de mosquées ou de medersas, de bourses d'études islamiques, du hadj, de la solidarité entre pays musulmans, ou de l'influence religieuse de l'aide → **Secondaire** à **Très central** selon la place qu'il y consacre.

Cette règle ne vaut que pour des acteurs explicitement islamiques, ou pour des États à majorité musulmane agissant en cette qualité. La nationalité d'une entreprise privée, d'un expert ou d'un bailleur ne suffit pas : un marché passé avec une société égyptienne n'est pas une mention de l'islam.

**Violence armée et sécurité.** Un groupe armé qui se réclame de l'islam engage directement la façon dont la presse représente l'islam : sa couverture n'est pas un sujet sécuritaire dont la religion serait absente. Ce n'est pas un acteur séculier qui se trouve être musulman.

- L'article porte sur le groupe lui-même — son idéologie, ses revendications religieuses, son recrutement, son rapport aux communautés musulmanes ou aux autorités religieuses → **Très central**.
- L'article rend compte d'une attaque, d'une opération militaire ou de leurs conséquences, la revendication islamique du groupe faisant partie du cadrage → **Central**.
- Le groupe n'est qu'une mention incidente dans un article portant sur autre chose — conjoncture économique, élections, déplacements de population → **Secondaire** ou **Marginal**.

Une centralité élevée ne présume rien de la polarité : le compte rendu factuel d'un attentat reste **Neutre** (voir Polarité).

### Subjectivité

Degré d'engagement énonciatif de l'article **sur le thème de l'islam et des musulmans** — indépendamment du fait que le traitement soit favorable ou défavorable. Un article violemment hostile mais rédigé sur un ton factuel reste peu subjectif.

- **Très objectif** : faits vérifiables, aucune opinion ni marque d'appréciation sur ce thème ; style informatif.
- **Plutôt objectif** : essentiellement factuel, avec des traces subtiles d'appréciation (choix de mots, angle) sur ce thème.
- **Mixte** : mélange équilibré de faits et d'opinions, ou pluralité de points de vue rapportés sur ce thème.
- **Plutôt subjectif** : opinions, sentiments ou jugements explicites sur ce thème, même étayés par des faits.
- **Très subjectif** : parti pris marqué, émotions ou jugements intenses, peu de matière factuelle ; éditorial, tribune ou billet d'humeur.

Les opinions **citées et attribuées** à un tiers ne rendent pas l'article subjectif : les rapporter relève du travail d'information. Ce qui rend l'article subjectif, c'est qu'il les prenne à son compte — absence de distance, adhésion explicite, ou sélection de citations allant toutes dans le même sens.

### Polarité

Sentiment que **l'article** exprime envers l'islam ou les musulmans.

- **Très positif** : portrait extrêmement favorable, élogieux, enthousiaste.
- **Positif** : portrait favorable, bienveillant, optimiste.
- **Neutre** : aucun sentiment marqué, ou équilibre entre aspects favorables et défavorables ; ton factuel.
- **Négatif** : portrait défavorable, critique, pessimiste.
- **Très négatif** : portrait extrêmement défavorable, alarmiste, hostile.
- **Non applicable** : l'article ne traite pas de l'islam ou des musulmans.

Le compte rendu neutre est le cas ordinaire de la presse d'information : un article qui rapporte des faits sans les commenter est **Neutre**, même quand ces faits sont favorables ou défavorables en eux-mêmes. Réservez **Positif** et **Négatif** aux articles dont l'écriture oriente — lexique valorisant ou dépréciateur, angle choisi, mise en avant sélective.

**Propos rapportés.** Un article qui rapporte des déclarations hostiles envers les musulmans, avec attribution, distance et contrepoint, est **Neutre** : il documente une hostilité sans l'endosser. Il devient **Négatif** ou **Très négatif** s'il reprend ce cadrage à son compte, ne donne la parole qu'à charge, ou choisit un lexique dépréciatif hors citation.

**Faits négatifs ≠ polarité négative.** Le compte rendu factuel d'un attentat commis par un groupe se réclamant de l'islam est **Neutre** s'il se borne aux faits. Il devient **Négatif** s'il étend la responsabilité aux musulmans en général.

### Cohérence

Si centralité = « Non abordé », alors nécessairement la polarité est « Non applicable » et la subjectivité est sans objet : dites-le dans sa justification (« Non applicable car le sujet n'est pas abordé. »). « Non applicable » et « Non abordé » signifient que la tâche ne s'applique pas à l'article, et non qu'elle s'y applique faiblement.

## Directives :
- Soyez rigoureux et analytique dans votre évaluation
- Tenez compte du contexte culturel et régional de l'Afrique de l'Ouest francophone
- Fournissez des preuves textuelles spécifiques lorsque possible
- Soyez honnête sur l'incertitude lorsque la réponse correcte est ambiguë
- Les cinq analyses sont anonymisées : jugez-les uniquement sur leur contenu
- Leur ordre de présentation est tiré au hasard pour chaque article et ne signifie rien : ne le lisez jamais comme un classement, une préférence ou une ancienneté
- Le désaccord entre les analyses n'implique pas qu'une d'entre elles soit juste : si votre lecture du texte ne correspond à aucune, répondez « none »
- Utilisez la terminologie française pour les scores (comme indiqué ci-dessus)
- Répondez entièrement en français (justifications, explications et verdicts)
- Pour `preferred` et `overall_winner`, utilisez strictement : "a", "b", "c", "d", "e", "multiple" (plusieurs analyses équivalentes) ou "none" (aucune n'est juste)"""

SYSTEM_INSTRUCTIONS: dict[str, str] = {
    PROMPT_V2_2_0: _SYSTEM_INSTRUCTION_V2_2_0,
    PROMPT_V2_3_0: _SYSTEM_INSTRUCTION_V2_3_0,
}
PROMPT_VERSIONS = tuple(SYSTEM_INSTRUCTIONS)
DEFAULT_PROMPT_VERSION: str = CONTRACT.arbiter["promptVersion"]


def _assert_prompt_registry_matches_contract(contract: SentimentContract) -> None:
    """Fail at import if the contract names a prompt this module cannot send."""
    default = contract.arbiter["promptVersion"]
    accepted = list(contract.arbiter.get("acceptedPromptVersions") or [default])
    if default not in SYSTEM_INSTRUCTIONS:
        raise ValueError(f"The contract's arbiter promptVersion {default!r} has no instruction")
    if default not in accepted or set(accepted) != set(SYSTEM_INSTRUCTIONS):
        raise ValueError(
            f"arbiter.acceptedPromptVersions {sorted(accepted)} must list exactly the "
            f"registered prompt versions {sorted(SYSTEM_INSTRUCTIONS)}, default included"
        )


_assert_prompt_registry_matches_contract(CONTRACT)

# The default instruction, for callers that do not choose a version.
SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTIONS[DEFAULT_PROMPT_VERSION]


def system_instruction(prompt_version: str = DEFAULT_PROMPT_VERSION) -> str:
    """The system instruction of ``prompt_version``; unknown versions are refused."""
    try:
        return SYSTEM_INSTRUCTIONS[prompt_version]
    except KeyError:
        raise ValueError(
            f"Unknown arbiter prompt version {prompt_version!r}; expected one of "
            f"{', '.join(PROMPT_VERSIONS)}"
        ) from None


def format_analysis(label: str, analysis: dict, contract: SentimentContract = CONTRACT) -> str:
    """Render one anonymised analysis block for the user prompt."""
    labels = {rank: name for name, rank in contract.subjectivity_label_scores.items()}
    rank = analysis.get("subjectivite_score")
    subjectivity = labels.get(rank, "Non renseigné") if rank is not None else "Non renseigné"
    return f"""## Analyse {label.upper()} :
- **Polarité (sentiment envers l'islam/les musulmans) :** {analysis.get("polarite") or "N/A"}
  - Justification : {analysis.get("polarite_justification") or "N/A"}
- **Subjectivité :** {subjectivity}
  - Justification : {analysis.get("subjectivite_justification") or "N/A"}
- **Centralité de l'islam/des musulmans :** {analysis.get("centralite_islam_musulmans") or "N/A"}
  - Justification : {analysis.get("centralite_justification") or "N/A"}"""


def _rand_below(rng: random.Random, n: int) -> int:
    """A uniform int in ``[0, n)`` by rejection sampling on ``getrandbits``."""
    bits = n.bit_length()
    value = rng.getrandbits(bits)
    while value >= n:
        value = rng.getrandbits(bits)
    return value


def display_order(article_id: str, labels: Sequence[str] = BLIND_LABELS) -> list[str]:
    """The order the blind labels are *presented* in, shuffled per article.

    The label -> model map is fixed for the whole run so that "Analyse C" means
    the same model in every published verdict. Presenting the labels in that
    same fixed order on every prompt would additionally hand one model the first
    position on every single article, and an LLM judge's position bias would
    then be perfectly confounded with model identity — unrecoverable after the
    fact, because no article would carry a different arrangement to compare
    against. Shuffling the presentation while holding the labels fixed separates
    the two: each model meets each position across the corpus, and the published
    labels still mean what they always meant.

    Seeded on the article id, so a run is reproducible and re-evaluating one
    article reproduces its first pass rather than a fresh arrangement.

    The Fisher-Yates walk is spelled out rather than delegated to
    ``random.shuffle``, whose algorithm Python does not promise to keep. It is
    the exact walk CPython's ``shuffle`` performs over ``getrandbits`` (the
    published run's orders, pinned in a test), so only the seeded Mersenne
    Twister stream is left to the standard library.
    """
    order = list(labels)
    rng = random.Random(str(article_id))
    for index in reversed(range(1, len(order))):
        swap = _rand_below(rng, index + 1)
        order[index], order[swap] = order[swap], order[index]
    return order


def create_arbiter_prompt(
    article: dict, permutation: dict[str, str], contract: SentimentContract = CONTRACT
) -> str:
    """Build the user prompt: the article, then the five analyses.

    The system instruction already carries the scales and the guidelines, so
    this prompt is only the case at hand — identical under every prompt
    version. The analyses are laid out in `display_order`, not alphabetically —
    see there for why.
    """
    analyses = article.get("analyses") or {}
    blocks = "\n\n".join(
        format_analysis(label, analyses.get(permutation[label]) or {}, contract)
        for label in display_order(str(article.get("o:id")))
    )
    full_text = article.get("OCR") or ""
    text = full_text[:ARBITER_MAX_INPUT_CHARS]
    # Say so when the text is cut. An arbiter judging a truncated article
    # silently is an arbiter that may be scoring an absent conclusion.
    if len(full_text) > ARBITER_MAX_INPUT_CHARS:
        text += "\n\n[Texte tronqué : seuls les premiers caractères de l'article sont fournis.]"
    return f"""Évaluez l'article suivant et les cinq analyses de modèles.

## Informations sur l'article
**Titre :** {article.get("o:title") or "Sans titre"}

**Texte intégral :**
{text}

---

{blocks}

---

Fournissez votre évaluation indépendante pour chaque dimension, déterminez quelle analyse est la plus précise et expliquez votre raisonnement."""
