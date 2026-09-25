/**
 * Arbiter State Module
 *
 * Manages the **generation-1** pairwise arbiter (Gemini 3 Pro) evaluation state.
 * Generation 2 arbitrates its whole model panel at once and lives in `arbiterV2`.
 * Uses Svelte 5 runes for reactivity.
 */

import type { ArbiterEvaluationData, ArbiterAnalysis, ModelPair } from '$lib/types/data';
import { getPairModelNames } from '$lib/types/data';
import { parseArbiterEvaluationData } from '$lib/data/validation';
import { fetchOptionalJSON } from '$lib/data/articleRepository';
import { ABSENT, createResource, type ResourceState } from '$lib/data/resource.svelte';
import { generationOf } from '$lib/domain/sentimentContract';
// Import the leaf stores directly — importing from './index' would create a
// cycle (the barrel re-exports this module). Same convention as url/*.
import { datasetState } from './datasets.svelte';

// ============================================
// Arbiter State (Svelte 5 Runes)
// ============================================

/**
 * One file per generation-1 pair. A 404 is an absent file (cached); any other
 * failure — a 5xx, a network error, a file that fails validation — is an error
 * the view shows with a Retry action, not the "no arbiter data" empty state.
 */
const arbiterResource = createResource<ModelPair, ArbiterEvaluationData>(
	async (pair, fetchFunction) => {
		const data = await fetchOptionalJSON(
			`/data/iwac_arbiter_evaluations_${pair}.json`,
			fetchFunction
		);
		return data === ABSENT ? ABSENT : parseArbiterEvaluationData(data, pair);
	}
);

/**
 * The selected pair's evaluations. Derived from the pair rather than set by
 * whichever load finished last, so a slow response for a pair the reader has
 * left can never be shown under another pair.
 */
const _arbiterEvaluations = $derived(
	generationOf(datasetState.pair) === 'v1' ? arbiterResource.data(datasetState.pair) : null
);

// ============================================
// Exported State Accessors
// ============================================

/** The selected pair's arbiter evaluations, or null (absent, loading, failed, or v2). */
export const arbiterEvaluations = {
	get current() {
		return _arbiterEvaluations;
	}
};

/** Load state of the selected pair's file; `absent` for a generation-2 pair. */
export const arbiterLoadState = {
	get current(): ResourceState<ArbiterEvaluationData> {
		return generationOf(datasetState.pair) === 'v1'
			? arbiterResource.state(datasetState.pair)
			: { status: 'absent' };
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

/**
 * Article id -> arbiter analysis, built once per loaded evaluation set.
 *
 * The lookup used to linear-scan the evaluations array. Harmless at today's
 * 61-176 evaluations, but ArbiterArticleTable calls it once per rendered row,
 * so it is quadratic in the size of the arbiter sample — and that sample is
 * expected to grow. The index rebuilds only when the underlying object
 * changes identity, which happens once per pair load.
 */
let _arbiterIndexSource: ArbiterEvaluationData | null = null;
let _arbiterIndex = new Map<string, ArbiterAnalysis>();

function getArbiterIndex(): Map<string, ArbiterAnalysis> {
	if (_arbiterIndexSource !== _arbiterEvaluations) {
		_arbiterIndexSource = _arbiterEvaluations;
		_arbiterIndex = new Map(
			(_arbiterEvaluations?.evaluations ?? []).map((e) => [String(e.article_id), e.arbiter])
		);
	}
	return _arbiterIndex;
}

/** Get arbiter analysis for a specific article */
export function getArbiterForArticle(articleId: string | number): ArbiterAnalysis | null {
	return getArbiterIndex().get(String(articleId)) ?? null;
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

/**
 * Compute arbiter statistics from evaluation data. Pure — exported so tests
 * exercise the exact function the store ships instead of re-implementing the
 * blind-evaluation verdict mapping.
 */
export function computeArbiterStatistics(
	evaluationData: ArbiterEvaluationData | null,
	modelAName: string,
	modelBName: string
): ArbiterStatistics {
	if (!evaluationData || !evaluationData.evaluations || evaluationData.evaluations.length === 0) {
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

	for (const evaluation of evaluationData.evaluations) {
		const arbiter = evaluation.arbiter;

		// Count dimension-level preferences
		for (const dimension of ['polarity', 'subjectivity', 'centrality'] as const) {
			const preferredModel = arbiter[dimension]?.preferred_model as
				'model_a' | 'model_b' | 'both' | 'neither';
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
	const meta = evaluationData.metadata;
	const modelAIsFirst = meta?.arbiter_model_a === meta?.pair_first_model;

	// Map arbiter verdicts to pair order (first/second model in pair name)
	const firstModelPreferred = modelAIsFirst ? counts.model_a : counts.model_b;
	const secondModelPreferred = modelAIsFirst ? counts.model_b : counts.model_a;

	// Map overall verdicts to pair order
	const overallFirstWins = modelAIsFirst ? overallCounts.model_a : overallCounts.model_b;
	const overallSecondWins = modelAIsFirst ? overallCounts.model_b : overallCounts.model_a;

	return {
		totalEvaluated: evaluationData.evaluations.length,
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
		const { modelAName, modelBName } = getPairModelNames(datasetState.pair, datasetState.available);
		return computeArbiterStatistics(_arbiterEvaluations, modelAName, modelBName);
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

/**
 * Load a pair's arbiter file (default: the selected pair). Idempotent, deduped
 * in flight, and never retries a failure unasked.
 *
 * Only generation 1 has a per-pair arbiter file. A v2 pair would build a
 * filename that cannot exist (`iwac_arbiter_evaluations_luna-mistral-small.json`)
 * and 404 on every comparison mount and every pair switch — ten times over, now
 * that the v2 panel has ten pairs. The v2 arbiter judges the whole panel at once
 * and is loaded by `arbiterV2` from a single file.
 */
export const loadArbiterEvaluations = async (
	fetchFunction: typeof fetch,
	pair: ModelPair = datasetState.pair
): Promise<void> => {
	if (generationOf(pair) !== 'v1') return;
	await arbiterResource.ensure(pair, fetchFunction);
};

/** Load the selected pair's arbiter file again after a failure. */
export const retryArbiterEvaluations = async (
	fetchFunction: typeof fetch = fetch
): Promise<void> => {
	const pair = datasetState.pair;
	if (generationOf(pair) !== 'v1') return;
	await arbiterResource.retry(pair, fetchFunction);
};
