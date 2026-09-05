// Définitions TypeScript pour vos données

import {
	CENTRALITY_ORDER,
	DATASET_IDS,
	MODEL_PAIR_IDS,
	POLARITY_ORDER,
	getPairModels,
	type CentralityValue,
	type DatasetId,
	type GenerationId,
	type ModelPair,
	type PolarityValue,
	type SubjectivityScore
} from '$lib/domain/sentimentContract';

export {
	CENTRALITY_ORDER,
	DATASET_IDS,
	MODEL_PAIR_IDS,
	POLARITY_ORDER,
	type CentralityValue,
	type DatasetId,
	type GenerationId,
	type ModelPair,
	type PolarityValue,
	type SubjectivityScore
};

export interface SentimentAnalysis {
	centralite_islam_musulmans: CentralityValue | null;
	centralite_justification: string | null;
	subjectivite_score: SubjectivityScore | null;
	subjectivite_justification: string | null;
	polarite: PolarityValue | null;
	polarite_justification: string | null;
}

export type LoadState<T> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'ready'; data: T }
	| { status: 'error'; error: Error };

export interface Article {
	'o:id': number | string;
	'o:title'?: string | null;
	journal_source?: string | null;
	Newspaper?: string | null; // Field from the JSON data
	Country?: string | null; // Field from the JSON data
	publication_date?: string | null; // ISO date or partial ISO date
	hijri_year?: number | null;
	hijri_month?: number | null;
	hijri_day?: number | null;
	iiif_manifest?: string; // IIIF v3 manifest URL (e.g. https://islam.zmo.de/iiif/3/5504/manifest)
	sentiment_analysis: SentimentAnalysis | null;
	// Propriété ajoutée dynamiquement pour savoir de quel dataset vient l'article
	dataset_id: DatasetId;
}

/** Canonical view ids (sidebar navigation + `view` URL param). */
export const VIEW_IDS = [
	'charts',
	'trends',
	'correlation',
	'volume',
	'seasonality',
	'heatmap',
	'ranking',
	'map',
	'table',
	'comparison',
	'agreement',
	'extremes',
	'arbiter'
] as const;
export type ViewId = (typeof VIEW_IDS)[number];

/** Per-view layout metadata. */
export interface ViewMeta {
	/**
	 * Whether the shared filter rail is rendered for this view. Self-contained
	 * views own their internal filters and run full-width instead, so the page
	 * renders no rail and the header hides its Filters trigger.
	 */
	hasFilterRail: boolean;
}

/**
 * Single source of truth for which views carry the shared filter rail.
 *
 * Typed as a *total* `Record<ViewId, …>` on purpose: adding an id to VIEW_IDS
 * without adding it here is a compile error. That is the point — this fact used
 * to be enumerated in three places (the page's rail branch, the page's
 * `data-layout`, and AppHeader's Filters trigger) and two of them had gone
 * stale on `agreement`, leaving a visible Filters button that opened nothing.
 */
export const VIEW_META: Record<ViewId, ViewMeta> = {
	charts: { hasFilterRail: true },
	trends: { hasFilterRail: true },
	correlation: { hasFilterRail: true },
	volume: { hasFilterRail: true },
	seasonality: { hasFilterRail: true },
	heatmap: { hasFilterRail: true },
	ranking: { hasFilterRail: true },
	map: { hasFilterRail: true },
	table: { hasFilterRail: true },
	comparison: { hasFilterRail: false },
	agreement: { hasFilterRail: false },
	extremes: { hasFilterRail: true },
	arbiter: { hasFilterRail: false }
};

/** Whether `view` renders the shared filter rail. The only way to ask. */
export function hasFilterRail(view: ViewId): boolean {
	return VIEW_META[view].hasFilterRail;
}

/**
 * A geocoded place from the IWAC authority file (`index` rows of type `Lieux`).
 * Only records that carry usable coordinates AND are cited by at least one
 * article are shipped — see `data-preprocess/places-export.py`.
 */
export interface Place {
	/** Omeka `o:id` of the authority record. */
	id: number;
	title: string;
	lat: number;
	lng: number;
}

/**
 * The map payload: a place registry plus the article→places edge list.
 *
 * Edges rather than pre-computed averages, because the map answers to the same
 * country/newspaper/date filters as every other view and any aggregate baked
 * at build time would freeze one filter state.
 */
export interface PlacesPayload {
	places: Place[];
	/** Article `o:id` (as string) → ids of the places it tags. */
	articles: Record<string, number[]>;
}

// New types for multi-dataset support
export interface DatasetOption {
	id: DatasetId;
	/** Which analysis generation the model belongs to. Derived from `id`. */
	generation: GenerationId;
	name: string;
	file: string;
	/** Path to SVG logo (relative to static folder, e.g., '/logo/ChatGPT_logo.svg') */
	logo?: string;
	/** Fallback icon emoji (deprecated, use logo instead) */
	icon?: string;
	color?: string;
}

/**
 * Helper to get model IDs from a pair.
 *
 * Delegates to the contract registry rather than splitting the id: a v2 model
 * id contains a hyphen, so `mistral-small-deepseek` cannot be parsed positionally.
 */
export function getModelsFromPair(pair: ModelPair): [DatasetId, DatasetId] {
	return getPairModels(pair);
}

/**
 * Resolve the display names for both models in a comparison pair.
 * Falls back to the model id when no matching dataset is found.
 */
export function getPairModelNames(
	pair: ModelPair,
	datasets: { id: string; name: string }[]
): { modelAName: string; modelBName: string } {
	const [modelAId, modelBId] = getModelsFromPair(pair);
	return {
		modelAName: datasets.find((d) => d.id === modelAId)?.name || modelAId,
		modelBName: datasets.find((d) => d.id === modelBId)?.name || modelBId
	};
}

export interface ComparisonData {
	article: Article;
	/** Model A sentiment analysis (first model in pair) */
	modelA: SentimentAnalysis | null;
	/** Model B sentiment analysis (second model in pair) */
	modelB: SentimentAnalysis | null;
	/** IDs of the models being compared */
	modelAId: DatasetId;
	modelBId: DatasetId;
	discrepancies: DiscrepancyInfo;
}

export interface DiscrepancyInfo {
	polarityDiff: number;
	subjectivityDiff: number;
	centralityDiff: number;
	totalDiff: number;
	hasConflict: boolean;
	/** False when either v1 analysis marks the sentiment task non-applicable. */
	isComparable: boolean;
}

export interface DiscrepancyFilter {
	minDifference: number;
	maxDifference: number;
	dimensions: ('polarity' | 'subjectivity' | 'centrality')[];
	excludeNonApplicable: boolean;
}

// Arbiter (Gemini 3 Pro) evaluation types
export interface ArbiterDimensionScore {
	score: string; // Dimension-specific score (subjectivity is serialized as "1"-"5")
	justification: string; // Why the arbiter chose this score
	preferred_model: 'model_a' | 'model_b' | 'both' | 'neither'; // Blind assignment
	verdict_explanation: string; // Why one model is preferred
}

export interface ArbiterAnalysis {
	article_id: string;
	polarity: ArbiterDimensionScore;
	subjectivity: ArbiterDimensionScore;
	centrality: ArbiterDimensionScore;
	overall_winner: 'model_a' | 'model_b' | 'both' | 'neither'; // Strict winner value
	overall_explanation: string; // Detailed explanation of the verdict
	confidence_level: 'high' | 'medium' | 'low';
	timestamp: string;
}

export interface ArbiterEvaluationData {
	metadata: {
		generated: string;
		arbiter_model: string;
		blind_evaluation: boolean;
		// What the arbiter ACTUALLY saw (blind evaluation labels → real model names)
		arbiter_model_a: string; // Model name that arbiter saw as "Model A"
		arbiter_model_b: string; // Model name that arbiter saw as "Model B"
		// Pair reference info
		pair: ModelPair;
		pair_first_model: string; // First model in pair name (e.g., ChatGPT for chatgpt-gemini)
		pair_second_model: string; // Second model in pair name (e.g., Gemini for chatgpt-gemini)
		// Statistics
		total_articles: number;
		successful_evaluations: number;
		failed_evaluations: number;
		contract_schema_version: string;
		analysis_version: 'v1';
		cache_schema_version: number;
		prompt_version: string;
		source_revision?: string | null;
	};
	evaluations: Array<{
		article_id: string;
		cache_fingerprint: string;
		arbiter: ArbiterAnalysis;
		discrepancies: {
			polarity_diff: number;
			subjectivity_diff: number;
			centrality_diff: number;
			total_diff: number;
			has_significant_conflict: boolean;
		};
	}>;
}

// ---------------------------------------------------------------------------
// Generation-2 arbiter: one panel-wide verdict per article
//
// v1 asks a pairwise question once per pair; v2 asks it once for the whole
// panel, so the shapes are deliberately separate rather than one union.
// `preferred` names an anonymised analysis label — only
// `metadata.blind_permutation` resolves a label back to a model, and nothing
// else in the payload may.
// ---------------------------------------------------------------------------

/**
 * The anonymised labels the panel's analyses are presented under, one per
 * generation-2 model. `parseArbiterV2EvaluationData` asserts the permutation is
 * a bijection onto the contract's models, so this list and the contract cannot
 * silently drift apart: a mismatch fails the parse rather than mis-attributing
 * verdicts.
 */
export const ARBITER_BLIND_LABELS = ['a', 'b', 'c', 'd', 'e'] as const;
export type ArbiterBlindLabel = (typeof ARBITER_BLIND_LABELS)[number];

/** A verdict names one analysis, several of them, or none. */
export type ArbiterV2Preference = ArbiterBlindLabel | 'multiple' | 'none';

/**
 * The selection rules `arbiter-evaluation-v2.py` accepts. `spread` is the
 * dashboard's significant-spread rule narrowed by `--dimensions`/`--threshold`;
 * `valence` is the polarity sign disagreement; `spread-or-valence` is the
 * contract's whole arbiter frame.
 */
export type ArbiterV2SelectionRule = 'spread' | 'valence' | 'spread-or-valence';

export interface ArbiterV2DimensionScore {
	/** The arbiter's own score (subjectivity is serialized as "1"-"5"). */
	score: string;
	justification: string;
	preferred: ArbiterV2Preference;
	verdict_explanation: string;
}

export interface ArbiterV2Analysis {
	article_id: string;
	polarity: ArbiterV2DimensionScore;
	subjectivity: ArbiterV2DimensionScore;
	centrality: ArbiterV2DimensionScore;
	overall_winner: ArbiterV2Preference;
	overall_explanation: string;
	confidence_level: 'high' | 'medium' | 'low';
	timestamp: string;
}

export interface ArbiterV2Spread {
	polarity_spread: number;
	subjectivity_spread: number;
	centrality_spread: number;
	total_spread: number;
	has_significant_spread: boolean;
}

export interface ArbiterV2EvaluationData {
	metadata: {
		generated: string;
		arbiter_model: string;
		/**
		 * Deliberately not narrowed to a literal. The run mode is the contract's
		 * to declare (`arbiter.mode` in sentiment-v2.json) and it has already
		 * changed once, from the three-model shape to the panel one; a literal
		 * here would have to be edited in lockstep or the payload would stop
		 * type-checking against a file it actually matches. The parser compares
		 * this against the contract at runtime.
		 */
		mode: string;
		/** Reasoning effort the run was made at — the cost/depth lever. */
		effort?: string;
		blind_evaluation: boolean;
		/** The models judged, in contract order. */
		models: DatasetId[];
		model_names: Record<string, string>;
		/** Label → model id. The only place a verdict can be de-anonymised. */
		blind_permutation: Record<ArbiterBlindLabel, DatasetId>;
		selection: {
			/** The contract's spread rule, quoted verbatim. */
			rule: string;
			/**
			 * Which of the contract's arbiter rules this run selected on:
			 * `spread`, `valence` or `spread-or-valence`. Absent from files written
			 * before the valence rule existed, which selected on spread alone.
			 */
			arbiter_rule?: ArbiterV2SelectionRule;
			contract_arbiter_rule?: string;
			dimensions?: string[];
			threshold: number;
			contract_threshold?: number;
			limit: number | null;
			eligible_articles: number;
			selected_articles: number;
			valence_flips_selected?: number;
		};
		/**
		 * What the run actually cost, accumulated over its paid calls. Empty on a
		 * file republished without spending; absent from files written before it
		 * was recorded.
		 */
		usage?: {
			calls: number;
			input_tokens: number;
			output_tokens: number;
			cache_creation_input_tokens: number;
			cache_read_input_tokens: number;
			output_tokens_per_call: number;
			input_tokens_per_call: number;
			usd: number;
		};
		total_articles: number;
		successful_evaluations: number;
		failed_evaluations: number;
		refused_evaluations?: number;
		articles_without_text?: number;
		contract_schema_version: string;
		analysis_version: 'v2';
		cache_schema_version: number;
		prompt_version: string;
		/**
		 * Two repositories: the scores come from the public projection, the
		 * article text from the private mirror that masks nothing.
		 */
		source: {
			scores: { repository: string; revision: string | null };
			text: { repository: string; revision: string | null };
		};
	};
	evaluations: ArbiterV2Evaluation[];
}

/** One arbitrated article: the panel's spread and the judge's verdict. */
export interface ArbiterV2Evaluation {
	article_id: string;
	cache_fingerprint: string;
	spread: ArbiterV2Spread;
	arbiter: ArbiterV2Analysis;
}
