// Définitions TypeScript pour vos données

/** Known centrality values from the AI models */
export type CentralityValue = 'Très central' | 'Central' | 'Secondaire' | 'Marginal' | 'Non abordé';

/** Known polarity values from the AI models */
export type PolarityValue =
	'Très positif' | 'Positif' | 'Neutre' | 'Négatif' | 'Très négatif' | 'Non applicable';

/** Subjectivity score from 1 (very objective) to 5 (very subjective) */
export type SubjectivityScore = 1 | 2 | 3 | 4 | 5;

/** Canonical sort order for polarity values (higher = more positive). */
export const POLARITY_ORDER: Record<PolarityValue, number> = {
	'Très positif': 5,
	Positif: 4,
	Neutre: 3,
	Négatif: 2,
	'Très négatif': 1,
	'Non applicable': 0
};

/** Canonical sort order for centrality values (higher = more central). */
export const CENTRALITY_ORDER: Record<CentralityValue, number> = {
	'Très central': 5,
	Central: 4,
	Secondaire: 3,
	Marginal: 2,
	'Non abordé': 1
};

export interface SentimentAnalysis {
	centralite_islam_musulmans: CentralityValue | string | null;
	centralite_justification: string | null;
	subjectivite_score: SubjectivityScore | number | null;
	subjectivite_justification: string | null;
	polarite: PolarityValue | string | null;
	polarite_justification: string | null;
}

export interface Article {
	'o:id': number | string;
	'o:title'?: string;
	journal_source?: string;
	Newspaper?: string; // Field from the JSON data
	Country?: string; // Field from the JSON data
	publication_date?: string; // YYYY-MM-DD
	iiif_manifest?: string; // IIIF v3 manifest URL (e.g. https://islam.zmo.de/iiif/3/5504/manifest)
	sentiment_analysis: SentimentAnalysis | null;
	// Propriété ajoutée dynamiquement pour savoir de quel dataset vient l'article
	dataset_id: string;
}

/** Canonical model/dataset ids — single source of truth for the union that
 *  was previously re-derived in url/constants, extreme-analysis and the
 *  dataset config. */
export const DATASET_IDS = ['chatgpt', 'gemini', 'mistral'] as const;
export type DatasetId = (typeof DATASET_IDS)[number];

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
	name: string;
	file: string;
	/** Path to SVG logo (relative to static folder, e.g., '/logo/ChatGPT_logo.svg') */
	logo?: string;
	/** Fallback icon emoji (deprecated, use logo instead) */
	icon?: string;
	color?: string;
}

// Model pair type for comparison mode
export type ModelPair = 'chatgpt-gemini' | 'chatgpt-mistral' | 'gemini-mistral';

// Helper to get model IDs from a pair
export function getModelsFromPair(pair: ModelPair): [string, string] {
	switch (pair) {
		case 'chatgpt-gemini':
			return ['chatgpt', 'gemini'];
		case 'chatgpt-mistral':
			return ['chatgpt', 'mistral'];
		case 'gemini-mistral':
			return ['gemini', 'mistral'];
	}
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
	modelAId: string;
	modelBId: string;
	discrepancies: DiscrepancyInfo;
}

export interface DiscrepancyInfo {
	polarityDiff: number;
	subjectivityDiff: number;
	centralityDiff: number;
	totalDiff: number;
	hasConflict: boolean;
}

export interface DiscrepancyFilter {
	minDifference: number;
	maxDifference: number;
	dimensions: ('polarity' | 'subjectivity' | 'centrality')[];
	excludeNonApplicable: boolean;
}

// Arbiter (Gemini 3 Pro) evaluation types
export interface ArbiterDimensionScore {
	score: string; // The arbiter's own score
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
		pair: string; // Model pair (e.g., 'chatgpt-gemini')
		pair_first_model: string; // First model in pair name (e.g., ChatGPT for chatgpt-gemini)
		pair_second_model: string; // Second model in pair name (e.g., Gemini for chatgpt-gemini)
		// Statistics
		total_articles: number;
		successful_evaluations: number;
		failed_evaluations: number;
	};
	evaluations: Array<{
		article_id: string;
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
