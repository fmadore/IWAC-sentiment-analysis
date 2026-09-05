/**
 * Generation-2 arbiter state — one panel-wide verdict per article.
 *
 * Deliberately a separate module from `arbiter.svelte.ts` rather than a branch
 * inside it. The v1 store is pairwise all the way down (`model_a_is_first`,
 * "first model in the pair", two-way percentages) and has to stay byte-stable
 * for the archive; a whole panel is a different question with a different
 * answer shape — and the panel has since grown from three models to five
 * without any of this needing to know how many there are.
 *
 * One file, loaded once, missing file → null. There is no pair to switch, so
 * none of v1's per-pair cache machinery is needed here.
 */

import { base } from '$app/paths';
import { parseArbiterV2EvaluationData } from '$lib/data/validation';
import { datasetIdsOf, modelDisplayName } from '$lib/domain/sentimentContract';
import { ARBITER_BLIND_LABELS } from '$lib/types/data';
import type {
	ArbiterBlindLabel,
	ArbiterV2Analysis,
	ArbiterV2EvaluationData,
	ArbiterV2Preference,
	DatasetId
} from '$lib/types/data';
import {
	ARBITER_V2_DIMENSIONS,
	blindLegend,
	buildArbiterV2Rows,
	resolvePreference,
	type ArbiterV2Dimension,
	type ArbiterV2LegendEntry,
	type ArbiterV2Row
} from '$lib/utils/arbiterV2';
// Leaf stores imported directly — going through './index' would be a cycle.
import { articleState, loadSpecificDataset } from './articles.svelte';
import { uiState } from './ui.svelte';

export {
	ARBITER_V2_DIMENSIONS,
	type ArbiterV2Dimension,
	type ArbiterV2LegendEntry,
	type ArbiterV2Row
};

// ============================================
// State
// ============================================

let _evaluations = $state<ArbiterV2EvaluationData | null>(null);

/** Panel arbiter payload, or null when the run has not been published. */
export const arbiterV2Evaluations = {
	get current() {
		return _evaluations;
	},
	set current(value: ArbiterV2EvaluationData | null) {
		_evaluations = value;
	}
};

// ============================================
// Article lookup
// ============================================

let _indexSource: ArbiterV2EvaluationData | null = null;
let _index = new Map<string, ArbiterV2Analysis>();

function getIndex(): Map<string, ArbiterV2Analysis> {
	if (_indexSource !== _evaluations) {
		_indexSource = _evaluations;
		_index = new Map(
			(_evaluations?.evaluations ?? []).map((row) => [String(row.article_id), row.arbiter])
		);
	}
	return _index;
}

/** The panel-wide verdict for one article, if it was arbitrated. */
export function getArbiterV2ForArticle(articleId: string | number): ArbiterV2Analysis | null {
	return getIndex().get(String(articleId)) ?? null;
}

// ============================================
// Statistics
// ============================================

export interface ArbiterV2ModelShare {
	modelId: DatasetId;
	/** The anonymised label this model was shown under. */
	label: ArbiterBlindLabel;
	name: string;
	/** Dimension-level verdicts naming this model, one per dimension. */
	dimensionWins: number;
	dimensionPercentage: number;
	/** Overall verdicts naming this model (1 per evaluated article). */
	overallWins: number;
	overallPercentage: number;
}

export interface ArbiterV2DimensionBreakdown {
	dimension: ArbiterV2Dimension;
	/** Model id → verdicts naming it on this dimension. */
	byModel: Record<string, number>;
	multiple: number;
	none: number;
}

export interface ArbiterV2Statistics {
	hasData: boolean;
	totalEvaluated: number;
	/** Dimension-level verdicts in total — one per dimension per evaluated article. */
	totalVerdicts: number;
	models: ArbiterV2ModelShare[];
	multiple: number;
	multiplePercentage: number;
	none: number;
	nonePercentage: number;
	overallMultiple: number;
	overallNone: number;
	dimensions: ArbiterV2DimensionBreakdown[];
	confidence: Record<'high' | 'medium' | 'low', number>;
	arbiterModel: string;
	eligibleArticles: number;
}

const EMPTY_STATISTICS: ArbiterV2Statistics = {
	hasData: false,
	totalEvaluated: 0,
	totalVerdicts: 0,
	models: [],
	multiple: 0,
	multiplePercentage: 0,
	none: 0,
	nonePercentage: 0,
	overallMultiple: 0,
	overallNone: 0,
	dimensions: ARBITER_V2_DIMENSIONS.map((dimension) => ({
		dimension,
		byModel: {},
		multiple: 0,
		none: 0
	})),
	confidence: { high: 0, medium: 0, low: 0 },
	arbiterModel: '',
	eligibleArticles: 0
};

function share(count: number, total: number): number {
	return total > 0 ? (count / total) * 100 : 0;
}

/**
 * Aggregate the panel verdicts, resolving every anonymised label back to a
 * model through the file's own permutation.
 *
 * Pure, and exported so tests exercise the exact function the view ships —
 * the label→model resolution is the one place a silent mis-attribution could
 * hide, and it is not visible in the rendered output.
 */
export function computeArbiterV2Statistics(
	data: ArbiterV2EvaluationData | null
): ArbiterV2Statistics {
	const evaluations = data?.evaluations ?? [];
	const metadata = data?.metadata;
	if (!metadata || evaluations.length === 0) return EMPTY_STATISTICS;

	const permutation = metadata.blind_permutation;
	// Plain object rather than a Map: this runs inside a `.svelte.ts` module, and
	// a Map here would be flagged as a candidate for SvelteMap even though it is
	// a local in a pure function that nothing reads reactively.
	const labelOf: Partial<Record<DatasetId, ArbiterBlindLabel>> = {};
	for (const label of ARBITER_BLIND_LABELS) {
		labelOf[permutation[label]] = label;
	}
	const modelIds = metadata.models;

	const zeroed = () => Object.fromEntries(modelIds.map((id) => [id, 0])) as Record<string, number>;
	const dimensionWins = zeroed();
	const overallWins = zeroed();
	const dimensions: ArbiterV2DimensionBreakdown[] = ARBITER_V2_DIMENSIONS.map((dimension) => ({
		dimension,
		byModel: zeroed(),
		multiple: 0,
		none: 0
	}));
	const confidence = { high: 0, medium: 0, low: 0 };
	let multiple = 0;
	let none = 0;
	let overallMultiple = 0;
	let overallNone = 0;

	const resolve = (preference: ArbiterV2Preference) => resolvePreference(data, preference);

	for (const evaluation of evaluations) {
		const arbiter = evaluation.arbiter;

		for (const breakdown of dimensions) {
			const preference = arbiter[breakdown.dimension]?.preferred;
			if (preference === undefined) continue;
			const modelId = resolve(preference);
			if (modelId && modelId in dimensionWins) {
				dimensionWins[modelId] += 1;
				breakdown.byModel[modelId] += 1;
			} else if (preference === 'multiple') {
				multiple += 1;
				breakdown.multiple += 1;
			} else if (preference === 'none') {
				none += 1;
				breakdown.none += 1;
			}
		}

		const winner = resolve(arbiter.overall_winner);
		if (winner && winner in overallWins) {
			overallWins[winner] += 1;
		} else if (arbiter.overall_winner === 'multiple') {
			overallMultiple += 1;
		} else {
			overallNone += 1;
		}

		if (arbiter.confidence_level in confidence) {
			confidence[arbiter.confidence_level] += 1;
		}
	}

	const totalVerdicts = modelIds.reduce((sum, id) => sum + dimensionWins[id], 0) + multiple + none;

	return {
		hasData: true,
		totalEvaluated: evaluations.length,
		totalVerdicts,
		models: modelIds.map((modelId) => ({
			modelId,
			label: labelOf[modelId] ?? 'a',
			name: metadata.model_names?.[modelId] ?? modelDisplayName(modelId),
			dimensionWins: dimensionWins[modelId],
			dimensionPercentage: share(dimensionWins[modelId], totalVerdicts),
			overallWins: overallWins[modelId],
			overallPercentage: share(overallWins[modelId], evaluations.length)
		})),
		multiple,
		multiplePercentage: share(multiple, totalVerdicts),
		none,
		nonePercentage: share(none, totalVerdicts),
		overallMultiple,
		overallNone,
		dimensions,
		confidence,
		arbiterModel: metadata.arbiter_model,
		eligibleArticles: metadata.selection?.eligible_articles ?? 0
	};
}

/** Panel arbiter statistics for the loaded file. */
export const arbiterV2Statistics = {
	get current(): ArbiterV2Statistics {
		return computeArbiterV2Statistics(_evaluations);
	}
};

// ============================================
// Articles behind the verdicts
// ============================================

/**
 * Every verdict joined to its article and to the panel's ratings.
 *
 * Recomputed only when the arbiter file or a dataset lands: `articleState.datasets`
 * is replaced wholesale on each load, and the join reads nothing finer than
 * that. The rows hold the store's own `sentiment_analysis` objects, so the
 * justification prose appears in place once `loadJustifications` merges it —
 * the same property the comparison detail relies on.
 */
const _rows = $derived.by(() =>
	buildArbiterV2Rows(_evaluations, articleState.datasets, datasetIdsOf('v2'))
);

/** The arbitrated articles, in file order (widest disagreement first). */
export const arbiterV2Rows = {
	get current(): ArbiterV2Row[] {
		return _rows;
	}
};

/** The joined row for one article, if it was arbitrated. */
export function getArbiterV2RowForArticle(articleId: string | number): ArbiterV2Row | null {
	const id = String(articleId);
	return _rows.find((row) => row.articleId === id) ?? null;
}

/** Label → model, in label order, for the loaded file. */
export const arbiterV2Legend = {
	get current(): ArbiterV2LegendEntry[] {
		return blindLegend(_evaluations);
	}
};

/**
 * Make sure every panel model's scores are in the store.
 *
 * The arbiter view is entered in comparison mode, which loads only the pair's
 * two datasets; a verdict on five analyses needs all five. Background loads,
 * so the view keeps rendering the metadata it already has while the rest of
 * the panel arrives — the page-level spinner would otherwise replace the
 * whole view mid-read. Idempotent: `loadSpecificDataset` dedups in flight.
 */
export const loadArbiterV2Panel = async (fetchFunction: typeof fetch): Promise<void> => {
	await Promise.all(
		datasetIdsOf('v2').map((modelId) =>
			loadSpecificDataset(modelId, fetchFunction, { showLoading: false })
		)
	);
};

// ============================================
// Loading
// ============================================

/**
 * Result cache and in-flight dedup. A missing file is a legitimate, permanent
 * answer (the paid run is user-gated), so a 404 is cached as `null` and never
 * refetched; a network failure is not cached, so a later call can retry.
 */
let attempted = false;
let inFlight: Promise<void> | null = null;

/** Load the panel arbiter file. Idempotent; safe to call from any view. */
export const loadArbiterV2Evaluations = async (fetchFunction: typeof fetch): Promise<void> => {
	if (attempted) return;
	if (inFlight) return inFlight;

	const load = fetchArbiterV2(fetchFunction).finally(() => {
		inFlight = null;
	});
	inFlight = load;
	return load;
};

const fetchArbiterV2 = async (fetchFunction: typeof fetch): Promise<void> => {
	uiState.isLoadingArbiter = true;
	try {
		const response = await fetchFunction(`${base}/data/iwac_arbiter_evaluations_v2.json`);
		if (!response.ok) {
			// Optional data: the panel arbiter run is paid and user-gated.
			attempted = true;
			_evaluations = null;
			return;
		}
		_evaluations = parseArbiterV2EvaluationData(await response.json());
		attempted = true;
	} catch (error) {
		console.log('[ArbiterV2] Evaluations not available:', error);
		_evaluations = null;
	} finally {
		uiState.isLoadingArbiter = false;
	}
};
