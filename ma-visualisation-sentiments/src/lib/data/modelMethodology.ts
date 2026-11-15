import type { Language } from '#lib/i18n/index.js';
import {
	assertCoversDatasetIds,
	modelDisplayName,
	type DatasetId
} from '#lib/domain/sentimentContract.js';
import { modelLogo } from '#lib/stores/datasets.svelte.js';
import type { AssetPath } from '$app/types';
type LocalizedText = Record<Language, string>;

interface ModelInfo {
	id: DatasetId;
	logo: AssetPath;
	logoAlt: string;
	/**
	 * Name shown on the comparison-grid card. Defaults to the contract's long
	 * name; set only where the card names the model differently.
	 */
	cardName: string;
	/**
	 * Name shown in the single-model badge link. Defaults to the dashboard's
	 * short name; set only where the badge names the underlying model rather
	 * than the label (the archived campaign's ChatGPT is GPT-5 mini).
	 */
	badgeName: string;
	docsUrl: string;
	/** First card paragraph (comparison grid) */
	cardDescription: LocalizedText;
	/**
	 * Second card paragraph (grid) / detail line (single-model view).
	 * Optional: the generation-2 cards carry the run configuration only, so
	 * a claim about a model's behaviour has somewhere to be checked.
	 */
	detail?: LocalizedText;
	/**
	 * What one full pass over the corpus cost, measured against the
	 * provider's own billing rather than inferred from a rate card — the
	 * rate cards in the pipeline's registry have been wrong by 5×. Per model
	 * rather than in one line of the configuration list because the unit
	 * differs: Mistral bills in euros, three others in dollars, and Qwen ran
	 * on university GPU hours with no invoice at all. Recorded only for the
	 * generation whose invoices were kept.
	 */
	cost?: LocalizedText;
	/** Sentence following the badge link in the single-model view */
	inlineDescription: LocalizedText;
}

/**
 * Logos come from the store's model registry and names from the contract, so
 * neither is retyped here; an entry sets a name only to depart from them.
 */
type ModelEntry = Omit<ModelInfo, 'logo' | 'cardName' | 'badgeName'> &
	Partial<Pick<ModelInfo, 'cardName' | 'badgeName'>>;

const MODEL_ENTRIES: ModelEntry[] = [
	{
		id: 'chatgpt',
		logoAlt: 'ChatGPT logo',
		cardName: 'ChatGPT (GPT-5 mini)',
		badgeName: 'GPT-5 mini',
		docsUrl: 'https://platform.openai.com/docs/models/gpt-5-mini',
		cardDescription: {
			en: 'A smaller, cheaper version of GPT-5 from OpenAI, released in August 2025, with a 400,000-token context window.',
			fr: 'Une version plus petite et moins chère de GPT-5, publiée par OpenAI en août 2025, avec une fenêtre de contexte de 400 000 tokens.'
		},
		detail: {
			en: 'It is faster and cheaper to run than GPT-5, and is meant for narrowly defined tasks.',
			fr: 'Il tourne plus vite et coûte moins cher que GPT-5, et vise des tâches étroitement définies.'
		},
		inlineDescription: {
			en: ', OpenAI’s smaller GPT-5 variant, released in August 2025, with a 400,000-token context window.',
			fr: ', la déclinaison réduite de GPT-5 chez OpenAI, publiée en août 2025, avec une fenêtre de contexte de 400 000 tokens.'
		}
	},
	{
		id: 'gemini',
		logoAlt: 'Gemini logo',
		cardName: 'Gemini 3 Flash',
		badgeName: 'Gemini 3 Flash',
		docsUrl: 'https://ai.google.dev/gemini-api/docs/models#gemini-3-flash',
		cardDescription: {
			en: 'Google’s speed-oriented model, released in December 2025, with a one-million-token context window.',
			fr: 'Le modèle rapide de Google, publié en décembre 2025, avec une fenêtre de contexte d’un million de tokens.'
		},
		detail: {
			en: 'It is the fast member of the Gemini 3 family, tuned for throughput rather than depth.',
			fr: 'C’est le membre rapide de la famille Gemini 3, réglé pour le débit plutôt que pour la profondeur.'
		},
		inlineDescription: {
			en: ', Google’s speed-oriented model, released in December 2025, with a one-million-token context window.',
			fr: ', le modèle rapide de Google, publié en décembre 2025, avec une fenêtre de contexte d’un million de tokens.'
		}
	},
	{
		id: 'mistral',
		logoAlt: 'Mistral logo',
		cardName: 'Ministral 3 14B',
		badgeName: 'Ministral 3 14B',
		docsUrl: 'https://docs.mistral.ai/models/ministral-3-14b-25-12',
		cardDescription: {
			en: 'The largest model in Mistral’s Ministral 3 family, released in December 2025. Mistral rates it as comparable to its own Small 3.2 24B.',
			fr: 'Le plus grand modèle de la famille Ministral 3 de Mistral, publié en décembre 2025. Mistral le juge comparable à son propre Small 3.2 24B.'
		},
		detail: {
			en: 'It is small enough to run on modest hardware, including locally.',
			fr: 'Il est assez léger pour tourner sur un matériel modeste, y compris en local.'
		},
		inlineDescription: {
			en: ', the largest model in Mistral’s Ministral 3 family, released in December 2025 and rated by Mistral as comparable to its own Small 3.2 24B.',
			fr: ', le plus grand modèle de la famille Ministral 3 de Mistral, publié en décembre 2025 et jugé par Mistral comparable à son propre Small 3.2 24B.'
		}
	},
	{
		id: 'luna',
		logoAlt: 'OpenAI logo',
		docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna',
		cardDescription: {
			en: 'OpenAI’s reasoning model, run at medium reasoning effort, which is the reference setting for this panel.',
			fr: "Le modèle de raisonnement d'OpenAI, exécuté avec un effort de raisonnement moyen, réglage qui sert de référence à ce panel."
		},
		cost: {
			en: 'Full corpus pass: US$9.48',
			fr: 'Passage sur le corpus complet : 9,48 $ US'
		},
		inlineDescription: {
			en: ', OpenAI’s reasoning model, run at medium reasoning effort for the second annotation campaign.',
			fr: ", le modèle de raisonnement d'OpenAI, exécuté avec un effort de raisonnement moyen pour la seconde campagne d'annotation."
		}
	},
	{
		id: 'mistral-small',
		logoAlt: 'Mistral logo',
		docsUrl: 'https://docs.mistral.ai/models/model-cards/mistral-small-4-0-26-03',
		cardDescription: {
			en: 'Mistral’s small reasoning model, with open weights under an Apache 2.0 licence. It ran at high reasoning effort because its API refuses the lower settings.',
			fr: 'Le petit modèle de raisonnement de Mistral, à poids ouverts sous licence Apache 2.0. Il a tourné avec un effort de raisonnement élevé, son API refusant les réglages inférieurs.'
		},
		cost: {
			en: 'Full corpus pass: €6.48',
			fr: 'Passage sur le corpus complet : 6,48 €'
		},
		inlineDescription: {
			en: ', Mistral’s small reasoning model, run at high reasoning effort for the second annotation campaign.',
			fr: ', le petit modèle de raisonnement de Mistral, exécuté avec un effort de raisonnement élevé pour la seconde campagne.'
		}
	},
	{
		id: 'deepseek',
		logoAlt: 'DeepSeek logo',
		cardName: 'DeepSeek v4 Flash (0731)',
		docsUrl: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731',
		cardDescription: {
			en: 'A reasoning model with open weights under an MIT licence, served through OpenRouter rather than by its maker. It ran at high reasoning effort because it offers no middle setting.',
			fr: 'Un modèle de raisonnement à poids ouverts sous licence MIT, servi via OpenRouter plutôt que par son concepteur. Il a tourné avec un effort de raisonnement élevé, faute de réglage intermédiaire.'
		},
		cost: {
			en: 'Full corpus pass: US$10.96',
			fr: 'Passage sur le corpus complet : 10,96 $ US'
		},
		inlineDescription: {
			en: ', a reasoning model with open weights, served through a third party rather than by its maker.',
			fr: ', un modèle de raisonnement à poids ouverts, servi par un tiers plutôt que par son concepteur.'
		}
	},
	{
		id: 'gemma',
		logoAlt: 'Gemma logo',
		docsUrl: 'https://huggingface.co/google/gemma-4-31b-it',
		cardDescription: {
			en: 'Google’s open-weights model, served through OpenRouter rather than by Google’s own API, whose free tier may use submitted content to improve its products — which whole archival articles cannot go through.',
			fr: 'Le modèle à poids ouverts de Google, servi via OpenRouter plutôt que par l’API de Google, dont l’offre gratuite peut exploiter les contenus soumis pour améliorer ses produits — ce à quoi des articles d’archives entiers ne peuvent être soumis.'
		},
		detail: {
			en: 'Its OpenRouter route collapses the reasoning-effort ladder: medium and high are indistinguishable. It is also the slowest member of the panel, at roughly 72 seconds per call.',
			fr: 'Sa route OpenRouter écrase l’échelle d’effort de raisonnement : moyen et élevé y sont indiscernables. C’est aussi le membre le plus lent du panel, à environ 72 secondes par appel.'
		},
		cost: {
			en: 'Full corpus pass: US$9.51',
			fr: 'Passage sur le corpus complet : 9,51 $ US'
		},
		inlineDescription: {
			en: ', Google’s open-weights model, served through OpenRouter rather than by Google’s own API.',
			fr: ', le modèle à poids ouverts de Google, servi via OpenRouter plutôt que par l’API de Google.'
		}
	},
	{
		id: 'qwen',
		logoAlt: 'Qwen logo',
		docsUrl: 'https://huggingface.co/Qwen/Qwen3.8-27B',
		cardDescription: {
			en: 'Alibaba’s open-weights model, and the only member of the panel run on hardware the project controls: self-hosted with vLLM on the University of Bayreuth’s Festus cluster.',
			fr: 'Le modèle à poids ouverts d’Alibaba, et le seul membre du panel exécuté sur du matériel que le projet maîtrise : auto-hébergé avec vLLM sur le cluster Festus de l’université de Bayreuth.'
		},
		detail: {
			en: 'It is also the only member with a verified reasoning-effort ladder, so it genuinely ran at medium. Its coverage is 200 articles short of the rest of the panel, and that gap is permanent — see the limitations.',
			fr: 'C’est aussi le seul dont l’échelle d’effort de raisonnement a été vérifiée : il a réellement tourné à un niveau moyen. Sa couverture accuse 200 articles de moins que le reste du panel, et ce manque est définitif — voir les limites.'
		},
		cost: {
			en: 'No API fee: run on University of Bayreuth GPU hours.',
			fr: 'Aucun frais d’API : exécuté sur des heures GPU de l’université de Bayreuth.'
		},
		inlineDescription: {
			en: ', Alibaba’s open-weights model, self-hosted with vLLM on the University of Bayreuth’s Festus cluster.',
			fr: ', le modèle à poids ouverts d’Alibaba, auto-hébergé avec vLLM sur le cluster Festus de l’université de Bayreuth.'
		}
	},
	{
		id: 'haiku',
		logoAlt: 'Claude logo',
		docsUrl: 'https://www.anthropic.com/claude/haiku',
		cardDescription: {
			en: 'Anthropic’s smallest model, called through Anthropic’s own API at medium reasoning effort — a genuine middle step on a ladder that runs from low to max. It joined the panel in October 2026 without a pilot.',
			fr: 'Le plus petit modèle d’Anthropic, appelé par l’API d’Anthropic avec un effort de raisonnement moyen — un véritable échelon intermédiaire sur une échelle allant de low à max. Il a rejoint le panel en octobre 2026 sans pilote.'
		},
		detail: {
			en: 'It comes from the same developer as the panel arbiter, Claude Opus 5, so its analyses are never shown to the arbiter. Its coverage is 47 articles short of the other API members, which its pass found without text.',
			fr: 'Il vient du même concepteur que l’arbitre du panel, Claude Opus 5 : ses analyses ne sont donc jamais soumises à l’arbitre. Sa couverture compte 47 articles de moins que celle des autres membres appelés par API, que son passage a trouvés sans texte.'
		},
		inlineDescription: {
			en: ', Anthropic’s smallest model, called through Anthropic’s own API at medium reasoning effort; it joined the panel in October 2026 without a pilot.',
			fr: ', le plus petit modèle d’Anthropic, appelé par l’API d’Anthropic avec un effort de raisonnement moyen ; il a rejoint le panel en octobre 2026 sans pilote.'
		}
	}
];

export const MODELS: ModelInfo[] = MODEL_ENTRIES.map((entry) => ({
	...entry,
	logo: modelLogo(entry.id),
	cardName: entry.cardName ?? modelDisplayName(entry.id, 'long'),
	badgeName: entry.badgeName ?? modelDisplayName(entry.id, 'short')
}));

assertCoversDatasetIds(
	'MODELS (modelMethodology.ts)',
	MODELS.map((model) => model.id)
);
