/**
 * Agreement State Module
 *
 * Derives inter-model agreement statistics (confusion matrices, Cohen's kappa,
 * Krippendorff's alpha and Fleiss' kappa across every model of a generation)
 * from the loaded datasets.
 *
 * Everything here is a $derived read over `articleState.datasets` — no data of
 * its own to load, since the agreement view runs on exactly the same score
 * files the charts already use.
 *
 * One join serves the lot. `panelJoin` lines every model of the active
 * generation up row by row (see `utils/panelJoin.ts`), the corpus facets
 * filter it once to row indices, and every statistic below indexes those rows.
 * It used to rebuild an id → article Map per pair and dimension: some seventy
 * per recompute.
 */

import type { DatasetId } from '#lib/types/data.js';
import { datasetIdsOf, getPairModels } from '#lib/domain/sentimentContract.js';
import {
	AGREEMENT_DIMENSIONS,
	DIMENSION_CATEGORIES,
	buildApplicabilityColumns,
	buildLabelColumns,
	labelPairsAt,
	marginalsFromLabels,
	type AgreementDimension,
	type ModelMarginals
} from '#lib/utils/agreementData.js';
import { buildConsensusRowsFromJoin, type ConsensusRow } from '#lib/utils/consensus.js';
import {
	applicabilityAgreement,
	leaveOneOut,
	panelReliability,
	summarizeAgreement,
	summarizePanelPairs,
	type ApplicabilityAgreement,
	type DimensionAgreement,
	type LeaveOneOutRow,
	type PairAgreementSummary,
	type PanelReliability
} from '#lib/utils/agreementMetrics.js';
import { createPanelJoinCache, filterPanelRows, type PanelJoin } from '#lib/utils/panelJoin.js';
import { summarizePanelFlags, type PanelFlagBreakdown } from './derivations';
export type {
	DimensionAgreement,
	PanelReliability,
	LeaveOneOutRow,
	ApplicabilityAgreement
} from '#lib/utils/agreementMetrics.js';
export type { PanelFlagBreakdown } from './derivations';
// Leaf stores imported directly — importing from './index' would create a
// cycle (the barrel re-exports this module). Same convention as url/* and
// arbiter.svelte.
import { articleState } from './articles.svelte';
import { datasetState } from './datasets.svelte';
import { filterState } from './filters.svelte';

// Re-exported so callers have one import site for "agreement" regardless of
// whether a symbol is reactive state or a pure helper.
export { AGREEMENT_DIMENSIONS, DIMENSION_CATEGORIES, type AgreementDimension, type ModelMarginals };
export type { ConsensusRow };

type PerDimension<T> = Record<AgreementDimension, T>;

function perDimension<T>(compute: (dimension: AgreementDimension) => T): PerDimension<T> {
	return Object.fromEntries(
		AGREEMENT_DIMENSIONS.map((dimension) => [dimension, compute(dimension)])
	) as PerDimension<T>;
}

/*
 * The join is memoised on the dataset arrays themselves: `articleState.datasets`
 * is replaced whenever any dataset lands — the other generation's prefetch
 * included — and handing back the same join object keeps those arrivals from
 * invalidating every statistic below.
 */
const panelJoinCache = createPanelJoinCache();
const pairJoinCache = createPanelJoinCache();

/** Every model of the active generation, row by row; null until all are loaded. */
const panelJoin = $derived(
	panelJoinCache(articleState.datasets, datasetIdsOf(datasetState.generation))
);

/**
 * Rows passing the active country/newspaper facets.
 *
 * Deliberately NOT the full `articleState.filtered`: filtering by polarity or
 * centrality would select articles *by the very label being compared*, which
 * would make any agreement statistic computed over the result meaningless.
 * Corpus-slice filters (country, newspaper) are safe and genuinely useful —
 * "do these models agree more about the Burkinabè press?" is a real question.
 */
const panelRows = $derived(
	panelJoin ? filterPanelRows(panelJoin, filterState.countries, filterState.journals) : []
);

const panelLabels = $derived(panelJoin ? buildLabelColumns(panelJoin) : null);

/** The shared join and its filtered rows, for components that look rows up by id. */
export const panelSlice = {
	get current(): { join: PanelJoin; rows: number[] } | null {
		return panelJoin ? { join: panelJoin, rows: panelRows } : null;
	}
};

/** Per-dimension agreement for the active model pair. */
const pairJoin = $derived(pairJoinCache(articleState.datasets, getPairModels(datasetState.pair)));

const pairSummary = $derived.by(() => {
	const join = pairJoin;
	if (!join) return null;
	const rows = filterPanelRows(join, filterState.countries, filterState.journals);
	const columns = buildLabelColumns(join);
	const generation = datasetState.generation;
	return perDimension((dimension) =>
		summarizeAgreement(
			labelPairsAt(columns[dimension][0], columns[dimension][1], rows),
			dimension,
			generation
		)
	);
});

export const pairAgreement = {
	get current(): PerDimension<DimensionAgreement> | null {
		return pairSummary;
	}
};

/**
 * Panel reliability across every model of the active generation, per
 * dimension: Krippendorff's alpha (nominal and ordinal, every article at least
 * two models rated) beside Fleiss' kappa (complete cases only).
 *
 * Scoped to one generation: the two panels annotated the corpus under different
 * prompts, so pooling them into one eight-rater statistic would measure the
 * prompt change as if it were disagreement between models.
 */
const panelSummary = $derived.by(() => {
	if (!panelLabels) return null;
	const labels = panelLabels;
	const generation = datasetState.generation;
	return perDimension((dimension) =>
		panelReliability(labels[dimension], panelRows, dimension, generation)
	);
});

export const panelAgreement = {
	get current(): PerDimension<PanelReliability> | null {
		return panelSummary;
	}
};

/** The panel statistics with each model left out in turn. */
const leaveOneOutSummary = $derived.by(() => {
	if (!panelJoin || !panelLabels) return null;
	const labels = panelLabels;
	const modelIds = panelJoin.modelIds as readonly DatasetId[];
	const generation = datasetState.generation;
	return perDimension((dimension) =>
		leaveOneOut(labels[dimension], modelIds, panelRows, dimension, generation)
	);
});

export const panelLeaveOneOut = {
	get current(): PerDimension<LeaveOneOutRow[]> | null {
		return leaveOneOutSummary;
	}
};

/** Agreement on whether each article is about Islam at all. */
const applicabilitySummary = $derived.by(() => {
	if (!panelJoin) return null;
	return applicabilityAgreement(
		buildApplicabilityColumns(panelJoin),
		panelJoin.modelIds as readonly DatasetId[],
		panelRows,
		datasetState.generation
	);
});

export const panelApplicability = {
	get current(): ApplicabilityAgreement | null {
		return applicabilitySummary;
	}
};

/** Which dimensions trip the panel's discrepancy flag, over the filtered rows. */
const flagSummary = $derived.by(() => {
	const join = panelJoin;
	if (!join) return null;
	return summarizePanelFlags(panelRows.map((i) => join.analyses.map((column) => column[i])));
});

export const panelFlags = {
	get current(): PanelFlagBreakdown | null {
		return flagSummary;
	}
};

/**
 * Every article's ordinals from every model of the active generation.
 *
 * One join, shared by every consensus chart. The charts then run the pure
 * aggregations in `utils/consensus.ts` over these rows with their own local UI
 * state (dimension, declined-ratings toggle, threshold) — which is why this is
 * a parameter-free accessor rather than a family of them.
 *
 * Generation-scoped for the same reason `panelAgreement` is: a spread taken
 * over both panels at once would measure the v2 prompt rewrite as if it were
 * disagreement between models.
 */
const consensus = $derived(panelJoin ? buildConsensusRowsFromJoin(panelJoin, panelRows) : []);

export const consensusRows = {
	get current(): ConsensusRow[] {
		return consensus;
	}
};

/** The active generation's model ids, in contract order — the consensus axis.
 * Three for the archive, six for the current panel; every consumer reads the
 * length from here rather than assuming one. */
export const consensusModels = {
	get current(): readonly DatasetId[] {
		return datasetIdsOf(datasetState.generation);
	}
};

/** Marginal distributions for every model of the active generation. */
const marginals = $derived.by(() => {
	if (!panelJoin || !panelLabels) return null;
	const labels = panelLabels;
	const modelIds = panelJoin.modelIds;
	return perDimension((dimension) =>
		modelIds.map((id, m) => marginalsFromLabels(labels[dimension][m], panelRows, dimension, id))
	);
});

export const modelMarginals = {
	get current(): PerDimension<ModelMarginals[]> | null {
		return marginals;
	}
};

/** Cached panel pair summaries; switching the displayed metric does not repeat joins. */
const allPairSummaries = $derived.by(() => {
	if (!panelJoin || !panelLabels) return null;
	const labels = panelLabels;
	const modelIds = panelJoin.modelIds as readonly DatasetId[];
	const generation = datasetState.generation;
	return perDimension((dimension) =>
		summarizePanelPairs(labels[dimension], modelIds, panelRows, generation, dimension)
	);
});

export const modelPairAgreements = {
	get current(): PerDimension<PairAgreementSummary[]> | null {
		return allPairSummaries;
	}
};
