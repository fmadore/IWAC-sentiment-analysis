/**
 * Arbiter State Module
 *
 * Manages arbiter (Gemini 3 Pro) evaluation state.
 * Uses Svelte 5 runes for reactivity.
 */

import type { ArbiterEvaluationData, ArbiterAnalysis, ModelPair } from '$lib/types/data';
import { getPairModelNames } from '$lib/types/data';
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

/**
 * Check if arbiter's "Model A" corresponds to the first model in the pair name.
 * This is used to correctly map arbiter verdicts to UI display.
 *
 * Example: For pair "chatgpt-gemini"
 * - If arbiter_model_a = "ChatGPT", then arbiterModelAIsFirst = true
 * - If arbiter_model_a = "Gemini", then arbiterModelAIsFirst = false
 */
export const arbiterModelAIsFirst = {
	get current() {
		const meta = _arbiterEvaluations?.metadata;
		if (!meta?.arbiter_model_a || !meta?.pair_first_model) {
			return true; // Default assumption
		}
		return meta.arbiter_model_a === meta.pair_first_model;
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
	// Overall verdict counts (per article, not per dimension)
	overallModelAWins: number;
	overallModelBWins: number;
	overallTies: number;
	modelAName: string;
	modelBName: string;
	hasData: boolean;
}

/** Compute arbiter statistics */
function computeArbiterStatistics(): ArbiterStatistics {
	const { modelAName, modelBName } = getPairModelNames(datasetState.pair, datasetState.available);

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
			overallModelAWins: 0,
			overallModelBWins: 0,
			overallTies: 0,
			modelAName,
			modelBName,
			hasData: false
		};
	}

	// Dimension-level counts
	const counts = {
		model_a: 0,
		model_b: 0,
		both: 0,
		neither: 0
	};

	// Overall verdict counts (per article)
	const overallCounts = {
		model_a: 0,
		model_b: 0,
		tie: 0
	};

	for (const evaluation of _arbiterEvaluations.evaluations) {
		const arbiter = evaluation.arbiter;

		// Count dimension-level preferences
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

		// Count overall verdict using the structured field
		const winner = arbiter.overall_winner;
		if (winner === 'model_a') {
			overallCounts.model_a++;
		} else if (winner === 'model_b') {
			overallCounts.model_b++;
		} else {
			// 'both' or 'neither' = tie
			overallCounts.tie++;
		}
	}

	const totalVerdicts = counts.model_a + counts.model_b + counts.both + counts.neither;

	// BLIND EVALUATION MAPPING:
	// - arbiter_model_a: The ACTUAL model name that arbiter saw as "Model A"
	// - arbiter_model_b: The ACTUAL model name that arbiter saw as "Model B"
	// - Verdicts' "model_a"/"model_b" directly refer to these model names
	//
	// We want modelAPreferred to always mean "first model in pair" for consistent UI display
	const meta = _arbiterEvaluations?.metadata;
	const modelAIsFirst = meta?.arbiter_model_a === meta?.pair_first_model;

	// Map arbiter verdicts to pair order (first/second model in pair name)
	const firstModelPreferred = modelAIsFirst ? counts.model_a : counts.model_b;
	const secondModelPreferred = modelAIsFirst ? counts.model_b : counts.model_a;

	// Map overall verdicts to pair order
	const overallFirstWins = modelAIsFirst ? overallCounts.model_a : overallCounts.model_b;
	const overallSecondWins = modelAIsFirst ? overallCounts.model_b : overallCounts.model_a;

	return {
		totalEvaluated: _arbiterEvaluations.evaluations.length,
		modelAPreferred: firstModelPreferred,
		modelBPreferred: secondModelPreferred,
		bothEqual: counts.both,
		neitherAccurate: counts.neither,
		modelAPercentage: totalVerdicts > 0 ? (firstModelPreferred / totalVerdicts) * 100 : 0,
		modelBPercentage: totalVerdicts > 0 ? (secondModelPreferred / totalVerdicts) * 100 : 0,
		bothPercentage: totalVerdicts > 0 ? (counts.both / totalVerdicts) * 100 : 0,
		neitherPercentage: totalVerdicts > 0 ? (counts.neither / totalVerdicts) * 100 : 0,
		overallModelAWins: overallFirstWins,
		overallModelBWins: overallSecondWins,
		overallTies: overallCounts.tie,
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

/**
 * Get the actual model name for a preferred_model value from the arbiter JSON.
 * Uses arbiter_model_a/arbiter_model_b from metadata to directly map to real model names.
 *
 * @param preferredModel - The raw preference from arbiter JSON ('model_a', 'model_b', 'both', 'neither')
 * @returns The display-ready model name or special label
 */
export function getActualModelName(
	preferredModel: 'model_a' | 'model_b' | 'both' | 'neither'
): string {
	if (preferredModel === 'both' || preferredModel === 'neither') {
		return preferredModel;
	}

	const meta = _arbiterEvaluations?.metadata;

	if (preferredModel === 'model_a') {
		return meta?.arbiter_model_a ?? 'Model A';
	} else {
		return meta?.arbiter_model_b ?? 'Model B';
	}
}

// ============================================
// Data Loading
// ============================================

/** Load arbiter evaluations for a specific model pair */
export const loadArbiterEvaluations = async (
	fetchFunction: typeof fetch,
	pair?: ModelPair
): Promise<void> => {
	uiState.isLoadingArbiter = true;

	const targetPair: ModelPair = pair || datasetState.pair;

	try {
		const pairSpecificPath = `${base}/data/iwac_arbiter_evaluations_${targetPair}.json`;
		const response = await fetchFunction(pairSpecificPath);

		if (!response.ok) {
			console.log(`[Arbiter] Evaluations not found for pair ${targetPair} (this is optional data)`);
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
		uiState.isLoadingArbiter = false;
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
			const newPair = datasetState.pair;
			const isInComparisonMode = datasetState.isComparisonMode;

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
