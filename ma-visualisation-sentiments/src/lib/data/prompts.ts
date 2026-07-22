/**
 * Prompt texts displayed in the methodology prompt modals.
 *
 * These strings are moved verbatim from AnalysisInfo.svelte and
 * ArbiterMethodology.svelte — do not rewrite them.
 */
import type { Language } from '$lib/i18n';

/**
 * Full sentiment-analysis prompt shown in the AnalysisInfo prompt modal.
 * The French version is the original prompt sent to the models; the English
 * version is a translation shown for display purposes.
 */
export const SENTIMENT_ANALYSIS_PROMPT: Record<Language, string> = {
	en: `# Sentiment Analysis: Representation of Islam and Muslims in Francophone West African Media

You are an expert analyst of representations of Islam and Muslims in the media, with a particular focus on Francophone West Africa. Analyze the provided text by evaluating the centrality, subjectivity, and polarity concerning the treatment of Islam and/or Muslims.

Start by generating a concise checklist (3 to 7 points) listing the conceptual steps needed to complete the evaluation.

## Instructions
- All justifications must be in French.
- Do not complete or invent information if the text is insufficient; be cautious and respond "Not applicable" or "Not addressed" if necessary.

After generation, internally verify the consistency of the assigned values (e.g., if centrality = "Not addressed", then subjectivite_score = null and justifications indicate this, etc.). Correct any detected inconsistency before finalizing.

## Evaluation Scale with Examples
### Centrality
Evaluates the importance given to themes related to Islam and Muslims in the article.
- Very central: Islam/Muslims constitute the main subject of the article.
- Central: Important theme but shared with other subjects.
- Secondary: Mentioned significantly but secondary.
- Marginal: Mentioned briefly or anecdotally.
- Not addressed: No mention of Islam or Muslims.

### Subjectivity
Assign a subjectivity score based on the tone and presence of opinions or facts concerning Islam/Muslims in the article.
1: Very objective – Reports verifiable facts about Islam/Muslims without expressing personal opinions or feelings about them, purely informative style on this theme.
2: Rather objective – Mainly factual concerning Islam/Muslims, but may contain subtle traces of opinions or word choices suggesting a limited perspective on this theme.
3: Mixed – Contains a balanced mix of facts and personal opinions/feelings concerning Islam/Muslims, or presents multiple viewpoints on this theme.
4: Rather subjective – Clearly expresses opinions, feelings, or judgments about Islam/Muslims, even if based on some facts to support them.
5: Very subjective – Heavily biased in its representation of Islam/Muslims, expresses intense opinions and emotions about them, with little or no objective presentation of facts, editorial or opinion piece style on this theme.

### Polarity
Evaluates the general sentiment expressed in the article towards Islam and/or Muslims, or concerning their representation.
- Very positive: The portrayal of Islam/Muslims is extremely favorable, enthusiastic, laudatory.
- Positive: The portrayal of Islam/Muslims is favorable, optimistic.
- Neutral: No clear sentiment towards Islam/Muslims or balance between positive and negative aspects in their representation; factual tone without marked emotional charge towards them.
- Negative: The portrayal of Islam/Muslims is unfavorable, critical, pessimistic.
- Very negative: The portrayal of Islam/Muslims is extremely unfavorable, alarmist, very critical.
- Not applicable: The article does not deal with Islam or Muslims.

- If centrality = "Not addressed", then:
    - subjectivite_score = null
    - subjectivite_justification = "Not applicable as the subject is not addressed."
    - polarite = "Not applicable"
    - polarite_justification = "Not applicable as the subject is not addressed."`,
	fr: `# Analyse de Sentiment : représentation de l'islam et des musulmans dans les médias d'Afrique de l'Ouest francophone

Vous êtes un analyste expert des représentations de l'islam et des musulmans dans les médias, avec un focus particulier sur l'Afrique de l'Ouest francophone. Analysez le texte fourni en évaluant la centralité, la subjectivité et la polarité concernant le traitement de l'islam et/ou des musulmans.

Commencez par générer une checklist concise (3 à 7 points) listant les étapes conceptuelles nécessaires pour réaliser l'évaluation.

## Instructions
- Toutes les justifications doivent être en français.
- Ne complétez pas ou n'inventez pas d'informations si le texte est insuffisant ; soyez précautionneux et répondez « Non applicable » ou « Non abordé » si nécessaire.

Après génération, vérifiez en interne la cohérence des valeurs attribuées (ex : si centralité = « Non abordé », alors subjectivite_score = null et les justifications l'indiquent, etc.). Corrigez toute incohérence détectée avant de finaliser.

## Barème d'évaluation avec exemples
### Centralité
Évalue l'importance accordée aux thèmes liés à l'islam et aux musulmans dans l'article.
- Très central : L'islam/musulmans constituent le sujet principal de l'article.
- Central : Thème important mais partagé avec d'autres sujets.
- Secondaire : Mentionné de manière significative mais secondaire.
- Marginal : Évoqué brièvement ou de manière anecdotique.
- Non abordé : Aucune mention de l'islam ou des musulmans.

### Subjectivité
Attribuez une note de subjectivité en vous appuyant sur le ton et la présence d'opinions ou de faits concernant l'islam/les musulmans dans l'article.
1 : Très objectif – Rapporte des faits vérifiables sur l'islam/les musulmans sans exprimer d'opinions ou de sentiments personnels à leur sujet, style purement informatif sur ce thème.
2 : Plutôt objectif – Principalement factuel concernant l'islam/les musulmans, mais peut contenir des traces subtiles d'opinions ou des choix de mots suggérant une perspective limitée sur ce thème.
3 : Mixte – Contient un mélange équilibré de faits et d'opinions/sentiments personnels concernant l'islam/les musulmans, ou présente plusieurs points de vue sur ce thème.
4 : Plutôt subjectif – Exprime clairement des opinions, des sentiments ou des jugements sur l'islam/les musulmans, même s'il s'appuie sur certains faits pour les étayer.
5 : Très subjectif – Fortement biaisé dans sa représentation de l'islam/des musulmans, exprime des opinions et des émotions intenses à leur sujet, avec peu ou pas de présentation objective des faits, style éditorial ou billet d'humeur sur ce thème.

### Polarité
Évalue le sentiment général exprimé dans l'article envers l'islam et/ou les musulmans, ou concernant leur représentation.
- Très positif : Le portrait de l'islam/des musulmans est extrêmement favorable, enthousiaste, élogieux.
- Positif : Le portrait de l'islam/des musulmans est favorable, optimiste.
- Neutre : Pas de sentiment clair envers l'islam/des musulmans ou équilibre entre aspects positifs et négatifs dans leur représentation ; ton factuel sans charge émotionnelle marquée à leur égard.
- Négatif : Le portrait de l'islam/des musulmans est défavorable, critique, pessimiste.
- Très négatif : Le portrait de l'islam/des musulmans est extrêmement défavorable, alarmiste, très critique.
- Non applicable : L'article ne traite pas de l'islam ou des musulmans.

- Si centralité = « Non abordé », alors :
    - subjectivite_score = null
    - subjectivite_justification = "Non applicable car le sujet n'est pas abordé."
    - polarite = "Non applicable"
    - polarite_justification = "Non applicable car le sujet n'est pas abordé."`
};

/** System instruction given to the arbiter model (shown in ArbiterMethodology). */
export const ARBITER_SYSTEM_INSTRUCTION = `You are an expert arbiter evaluating sentiment analysis of news articles about Islam and Muslims in Francophone West Africa.

Your role is to:
1. Analyze articles independently and provide your own assessment
2. Compare the analyses from two AI models (Model A and Model B)
3. Determine which model's analysis is more accurate
4. Provide clear, well-reasoned justifications for your decisions

## Evaluation Scales Reference:

### Polarity (Sentiment toward Islam/Muslims):
- **Très positif**: Extremely favorable, enthusiastic, praising portrait
- **Positif**: Favorable, optimistic portrait
- **Neutre**: No clear sentiment or balance between positive/negative; factual tone
- **Négatif**: Unfavorable, critical, pessimistic portrait
- **Très négatif**: Extremely unfavorable, alarmist, very critical portrait

### Subjectivity Score (1-5):
- **1 (Very Objective)**: Reports verifiable facts without personal opinions, purely informative
- **2 (Rather Objective)**: Mainly factual, may contain subtle traces of opinions
- **3 (Mixed)**: Balanced mix of facts and opinions, or presents multiple viewpoints
- **4 (Rather Subjective)**: Clearly expresses opinions and judgments
- **5 (Very Subjective)**: Heavily biased, intense opinions with little factual presentation

### Centrality:
- **Très central**: Islam/Muslims are the main subject of the article
- **Central**: Important theme but shared with other subjects
- **Secondaire**: Mentioned significantly but secondarily
- **Marginal**: Briefly or anecdotally mentioned
- **Non abordé**: No mention of Islam or Muslims

## Guidelines:
- Be thorough and analytical in your evaluation
- Consider the cultural and regional context of Francophone West Africa
- Provide specific textual evidence when possible
- Be honest about uncertainty when the correct answer is ambiguous
- Use French terminology for scores (as shown above)`;

/** User prompt template given to the arbiter model (shown in ArbiterMethodology). */
export const ARBITER_USER_PROMPT_TEMPLATE = `Evaluate the following article and the two model analyses.

## Article Information
**Title:** {title}

**Full Text:**
{article_text}

---

## Model A Analysis:
- **Polarity (sentiment toward Islam/Muslims):** {model_a.polarite}
  - Justification: {model_a.polarite_justification}
- **Subjectivity Score (1=very objective, 5=very subjective):** {model_a.subjectivite_score}
  - Justification: {model_a.subjectivite_justification}
- **Centrality of Islam/Muslims:** {model_a.centralite_islam_musulmans}
  - Justification: {model_a.centralite_justification}

## Model B Analysis:
- **Polarity:** {model_b.polarite}
  - Justification: {model_b.polarite_justification}
- **Subjectivity Score:** {model_b.subjectivite_score}
  - Justification: {model_b.subjectivite_justification}
- **Centrality:** {model_b.centralite_islam_musulmans}
  - Justification: {model_b.centralite_justification}

---

Provide your independent evaluation for each dimension, determine which model is more accurate, and explain your reasoning.`;
