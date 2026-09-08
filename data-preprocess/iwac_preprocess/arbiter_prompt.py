"""Pure generation-2 panel prompt construction; no provider or CLI dependencies."""

import random
from collections.abc import Sequence

from .contract import CONTRACT_V2 as CONTRACT
from .contract import SentimentContract

ARBITER_MAX_INPUT_CHARS = 15000

BLIND_LABELS = ("a", "b", "c", "d", "e")

SUBJECTIVITY_LABELS = {rank: label for label, rank in CONTRACT.subjectivity_label_scores.items()}

SYSTEM_INSTRUCTION = """Vous êtes un arbitre expert évaluant l'analyse de sentiment d'articles de presse sur l'islam et les musulmans en Afrique de l'Ouest francophone.

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


def format_analysis(label: str, analysis: dict, contract: SentimentContract) -> str:
    """Render one anonymised analysis block for the user prompt."""
    rank = analysis.get("subjectivite_score")
    subjectivity = (
        SUBJECTIVITY_LABELS.get(rank, "Non renseigné") if rank is not None else "Non renseigné"
    )
    return f"""## Analyse {label.upper()} :
- **Polarité (sentiment envers l'islam/les musulmans) :** {analysis.get("polarite") or "N/A"}
  - Justification : {analysis.get("polarite_justification") or "N/A"}
- **Subjectivité :** {subjectivity}
  - Justification : {analysis.get("subjectivite_justification") or "N/A"}
- **Centralité de l'islam/des musulmans :** {analysis.get("centralite_islam_musulmans") or "N/A"}
  - Justification : {analysis.get("centralite_justification") or "N/A"}"""


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
    """
    order = list(labels)
    random.Random(str(article_id)).shuffle(order)
    return order


def create_arbiter_prompt(
    article: dict, permutation: dict[str, str], contract: SentimentContract = CONTRACT
) -> str:
    """Build the user prompt: the article, then the five analyses.

    The system instruction already carries the scales and the guidelines, so
    this prompt is only the case at hand. The analyses are laid out in
    `display_order`, not alphabetically — see there for why.
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
