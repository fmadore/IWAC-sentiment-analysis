// Définitions TypeScript pour vos données

/** Known centrality values from the AI models */
export type CentralityValue = 'Très central' | 'Central' | 'Secondaire' | 'Marginal' | 'Non abordé';

/** Known polarity values from the AI models */
export type PolarityValue =
	'Très positif' | 'Positif' | 'Neutre' | 'Négatif' | 'Très négatif' | 'Non applicable';

/** Subjectivity score from 1 (very objective) to 5 (very subjective) */
export type SubjectivityScore = 1 | 2 | 3 | 4 | 5;

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

// New types for multi-dataset support
export interface DatasetOption {
	id: string;
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
