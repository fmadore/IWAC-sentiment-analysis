/**
 * Arbiter State Module
 * 
 * Manages arbiter (Gemini 3 Pro) evaluation state.
 * Uses Svelte 5 runes for reactivity.
 */

import type { ArbiterEvaluationData, ArbiterAnalysis, ModelPair } from '$lib/types/data';
import { getModelsFromPair } from '$lib/types/data';
import { base } from '$app/paths';
import { datasetState, uiState } from './index';

// ============================================
// Arbiter State (Svelte 5 Runes)
// ============================================

/** Arbiter evaluation data */
let _arbiterEvaluations = $state<ArbiterEvaluationData | null>(null);

/** Currently loaded arbiter pair */
let _currentArbiterPair = $state<ModelPair | null>(null);

/** Track if reactivity is set up */
let arbiterReactivitySetUp = $state(false);

// ============================================
// Exported State Accessors
// ============================================

/** Arbiter evaluation data - exported as object for cross-module reactivity */
export const arbiterEvaluations = {
	get current() {
		return _arbiterEvaluations;
	},
	set current(value: ArbiterEvaluationData | null) {
		_arbiterEvaluations = value;
	}
};

/** Currently loaded arbiter pair - exported as object for cross-module reactivity */
export const currentArbiterPair = {
	get current() {
		return _currentArbiterPair;
	},
	set current(value: ModelPair | null) {
		_currentArbiterPair = value;
	}
};

// ============================================
// Derived Values
// ============================================

/** Check if model A is first in the pair */
export const arbiterModelAIsFirst = {
	get current() {
		return _arbiterEvaluations?.metadata?.model_a_is_first ?? true;
	}
};

/** Get arbiter analysis for a specific article */
export function getArbiterForArticle(articleId: string | number): ArbiterAnalysis | null {
	if (!_arbiterEvaluations || !_arbiterEvaluations.evaluations) {
		return null;
	}

	const evaluation = _arbiterEvaluations.evaluations.find(
		(e) => String(e.article_id) === String(articleId)
	);

	return evaluation ? evaluation.arbiter : null;
}

// ============================================
// Statistics Interface
// ============================================

export interface ArbiterStatistics {
	totalEvaluated: number;
	modelAPreferred: number;
	modelBPreferred: number;
	bothEqual: number;
	neitherAccurate: number;
	modelAPercentage: number;
	modelBPercentage: number;
	bothPercentage: number;
	neitherPercentage: number;
	modelAName: string;
	modelBName: string;
	hasData: boolean;
}

/** Compute arbiter statistics */
function computeArbiterStatistics(): ArbiterStatistics {
	const pair = datasetState.comparisonPair;
	const datasets = datasetState.availableDatasets;
	const [modelAId, modelBId] = getModelsFromPair(pair);
	const modelAName = datasets.find((d) => d.id === modelAId)?.name || modelAId;
	const modelBName = datasets.find((d) => d.id === modelBId)?.name || modelBId;

	if (
		!_arbiterEvaluations ||
		!_arbiterEvaluations.evaluations ||
		_arbiterEvaluations.evaluations.length === 0
	) {
		return {
			totalEvaluated: 0,
			modelAPreferred: 0,
			modelBPreferred: 0,
			bothEqual: 0,
			neitherAccurate: 0,
			modelAPercentage: 0,
			modelBPercentage: 0,
			bothPercentage: 0,
			neitherPercentage: 0,
			modelAName,
			modelBName,
			hasData: false
		};
	}

	const counts = {
		model_a: 0,
		model_b: 0,
		both: 0,
		neither: 0
	};

	for (const evaluation of _arbiterEvaluations.evaluations) {
		const arbiter = evaluation.arbiter;

		for (const dimension of ['polarity', 'subjectivity', 'centrality'] as const) {
			const preferredModel = arbiter[dimension]?.preferred_model as
				| 'model_a'
				| 'model_b'
				| 'both'
				| 'neither';
			if (preferredModel in counts) {
				counts[preferredModel]++;
			}
		}
	}

	const totalVerdicts = counts.model_a + counts.model_b + counts.both + counts.neither;

	return {
		totalEvaluated: _arbiterEvaluations.evaluations.length,
		modelAPreferred: counts.model_a,
		modelBPreferred: counts.model_b,
		bothEqual: counts.both,
		neitherAccurate: counts.neither,
		modelAPercentage: totalVerdicts > 0 ? (counts.model_a / totalVerdicts) * 100 : 0,
		modelBPercentage: totalVerdicts > 0 ? (counts.model_b / totalVerdicts) * 100 : 0,
		bothPercentage: totalVerdicts > 0 ? (counts.both / totalVerdicts) * 100 : 0,
		neitherPercentage: totalVerdicts > 0 ? (counts.neither / totalVerdicts) * 100 : 0,
		modelAName,
		modelBName,
		hasData: true
	};
}

/** Arbiter statistics - exported as getter for reactivity */
export const arbiterStatistics = {
	get current(): ArbiterStatistics {
		return computeArbiterStatistics();
	}
};

// ============================================
// Helper Functions
// ============================================

/** Decode preferred model (kept for API compatibility) */
export const decodePreferredModel = (
	preferredModel: 'model_a' | 'model_b' | 'both' | 'neither',
	_unused?: boolean
): 'model_a' | 'model_b' | 'both' | 'neither' => {
	return preferredModel;
};

// ============================================
// Data Loading
// ============================================

/** Load arbiter evaluations for a specific model pair */
export const loadArbiterEvaluations = async (
	fetchFunction: typeof fetch,
	pair?: ModelPair
): Promise<void> => {
	uiState.setIsLoadingArbiter(true);

	const targetPair: ModelPair = pair || datasetState.comparisonPair;

	try {
		const pairSpecificPath = `${base}/data/iwac_arbiter_evaluations_${targetPair}.json`;
		let response = await fetchFunction(pairSpecificPath);

		// Fallback to legacy file for chatgpt-gemini
		if (!response.ok && targetPair === 'chatgpt-gemini') {
			const legacyPath = `${base}/data/iwac_arbiter_evaluations.json`;
			response = await fetchFunction(legacyPath);
		}

		if (!response.ok) {
			console.log(
				`[Arbiter] Evaluations not found for pair ${targetPair} (this is optional data)`
			);
			_arbiterEvaluations = null;
			_currentArbiterPair = targetPair;
			return;
		}

		const data = (await response.json()) as ArbiterEvaluationData;
		_arbiterEvaluations = data;
		_currentArbiterPair = targetPair;
		console.log(`[Arbiter] Loaded ${data.evaluations?.length || 0} evaluations for ${targetPair}`);
	} catch (error) {
		console.log('[Arbiter] Evaluations not available:', error);
		_arbiterEvaluations = null;
		_currentArbiterPair = targetPair;
	} finally {
		uiState.setIsLoadingArbiter(false);
	}
};

/** Setup reactive arbiter data reloading when comparison pair changes */
export const setupArbiterPairReactivity = (fetchFunction: typeof fetch): (() => void) => {
	if (arbiterReactivitySetUp) {
		console.log('[Arbiter] Reactivity already set up, skipping');
		return () => {};
	}

	arbiterReactivitySetUp = true;
	console.log('[Arbiter] Setting up pair change reactivity');

	// Use $effect.root to create an effect that can be manually cleaned up
	const cleanup = $effect.root(() => {
		let previousPair = _currentArbiterPair;

		$effect(() => {
			const newPair = datasetState.comparisonPair;
			const isInComparisonMode = datasetState.comparisonMode;

			if (isInComparisonMode && previousPair !== null && previousPair !== newPair) {
				console.log(`[Arbiter] Pair changed from ${previousPair} to ${newPair}, reloading data...`);
				loadArbiterEvaluations(fetchFunction, newPair);
			}
			previousPair = newPair;
		});
	});

	return () => {
		cleanup();
		arbiterReactivitySetUp = false;
	};
};

// ============================================
// Modern State Accessors (for gradual migration)
// ============================================

export const arbiterState = {
	get arbiterEvaluations() {
		return _arbiterEvaluations;
	},
	set arbiterEvaluations(value: ArbiterEvaluationData | null) {
		_arbiterEvaluations = value;
	},
	get currentArbiterPair() {
		return _currentArbiterPair;
	},
	set currentArbiterPair(value: ModelPair | null) {
		_currentArbiterPair = value;
	},
	get modelAIsFirst() {
		return _arbiterEvaluations?.metadata?.model_a_is_first ?? true;
	},
	get statistics(): ArbiterStatistics {
		return computeArbiterStatistics();
	},
	getForArticle(articleId: string | number): ArbiterAnalysis | null {
		return getArbiterForArticle(articleId);
	}
};
