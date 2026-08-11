/**
 * Agreement State Module
 *
 * Derives inter-model agreement statistics (confusion matrices, Cohen's kappa,
 * Fleiss' kappa across all three models) from the loaded datasets.
 *
 * Everything here is a $derived read over `articleState.datasets` — no data of
 * its own to load, since the agreement view runs on exactly the same score
 * files the charts already use.
 */

import type { Article, DatasetId, ModelPair } from '$lib/types/data';
import { getModelsFromPair } from '$lib/types/data';
import { datasetIdsOf } from '$lib/domain/sentimentContract';
import {
	buildConfusionMatrix,
	cohensKappa,
	fleissKappa,
	type ConfusionMatrix,
	type FleissResult,
	type KappaResult
} from '$lib/utils/agreement';
import {
	AGREEMENT_DIMENSIONS,
	DIMENSION_CATEGORIES,
	buildLabelPairs,
	buildRaterItems,
	computeMarginals,
	type AgreementDimension,
	type ModelMarginals
} from '$lib/utils/agreementData';
import { buildConsensusRows, type ConsensusRow } from '$lib/utils/consensus';
// Leaf stores imported directly — importing from './index' would create a
// cycle (the barrel re-exports this module). Same convention as url/* and
// arbiter.svelte.
import { articleState } from './articles.svelte';
import { datasetState } from './datasets.svelte';
import { filterState } from './filters.svelte';
import { getJournalName } from '$lib/utils/format';

/**
 * Apply the active country/journal filters to a dataset.
 *
 * Deliberately NOT the full `articleState.filtered`: filtering by polarity or
 * centrality would select articles *by the very label being compared*, which
 * would make any agreement statistic computed over the result meaningless.
 * Corpus-slice filters (country, newspaper) are safe and genuinely useful —
 * "do these models agree more about the Burkinabè press?" is a real question.
 */
function applyCorpusFilters(articles: Article[]): Article[] {
	const { countries, journals } = filterState;
	if (countries.length === 0 && journals.length === 0) return articles;

	return articles.filter((article) => {
		if (countries.length > 0 && !countries.includes(article.Country || '')) return false;
		if (journals.length > 0 && !journals.includes(getJournalName(article))) return false;
		return true;
	});
}

export interface DimensionAgreement {
	dimension: AgreementDimension;
	categories: string[];
	matrix: ConfusionMatrix;
	/** Classic all-or-nothing kappa. */
	kappa: KappaResult;
	/** Quadratic-weighted kappa: credits near-misses on an ordinal scale. */
	weightedKappa: KappaResult;
}

// Re-exported so callers have one import site for "agreement" regardless of
// whether a symbol is reactive state or a pure helper.
export { AGREEMENT_DIMENSIONS, DIMENSION_CATEGORIES, type AgreementDimension, type ModelMarginals };
export type { ConsensusRow };

/** Per-dimension agreement for the active model pair. */
export const pairAgreement = {
	get current(): Record<AgreementDimension, DimensionAgreement> | null {
		const pair: ModelPair = datasetState.pair;
		const [modelAId, modelBId] = getModelsFromPair(pair);

		const articlesA = articleState.datasets[modelAId];
		const articlesB = articleState.datasets[modelBId];
		if (!articlesA?.length || !articlesB?.length) return null;

		const filteredA = applyCorpusFilters(articlesA);
		const filteredB = applyCorpusFilters(articlesB);

		return Object.fromEntries(
			AGREEMENT_DIMENSIONS.map((dimension) => {
				const categories = DIMENSION_CATEGORIES[dimension];
				const pairs = buildLabelPairs(filteredA, filteredB, dimension);

				return [
					dimension,
					{
						dimension,
						categories,
						matrix: buildConfusionMatrix(pairs, categories),
						kappa: cohensKappa(pairs, categories, 'none'),
						weightedKappa: cohensKappa(pairs, categories, 'quadratic')
					} satisfies DimensionAgreement
				];
			})
		) as Record<AgreementDimension, DimensionAgreement>;
	}
};

/**
 * Fleiss' kappa across all three models of the active generation, per dimension.
 *
 * Scoped to one generation: the two panels annotated the corpus under different
 * prompts, so a six-rater kappa would measure prompt change as if it were
 * disagreement between models.
 */
export const threeWayAgreement = {
	get current(): Record<AgreementDimension, FleissResult> | null {
		const datasets = articleState.datasets;
		const generationIds = datasetIdsOf(datasetState.generation);
		const allLoaded = generationIds.every((id: DatasetId) => datasets[id]?.length);
		if (!allLoaded) return null;

		const filtered = Object.fromEntries(
			generationIds.map((id) => [id, applyCorpusFilters(datasets[id])])
		) as Record<string, Article[]>;

		return Object.fromEntries(
			AGREEMENT_DIMENSIONS.map((dimension) => [
				dimension,
				fleissKappa(
					buildRaterItems(filtered, generationIds, dimension),
					DIMENSION_CATEGORIES[dimension]
				)
			])
		) as Record<AgreementDimension, FleissResult>;
	}
};

/**
 * Every article's ordinals from all three models of the active generation.
 *
 * One join, shared by every consensus chart. The charts then run the pure
 * aggregations in `utils/consensus.ts` over these rows with their own local UI
 * state (dimension, declined-ratings toggle, threshold) — which is why this is
 * a parameter-free accessor rather than a family of them.
 *
 * Generation-scoped for the same reason `threeWayAgreement` is: a six-model
 * spread would measure the v2 prompt rewrite as if it were disagreement between
 * models.
 */
export const consensusRows = {
	get current(): ConsensusRow[] {
		const datasets = articleState.datasets;
		const generationIds = datasetIdsOf(datasetState.generation);
		if (!generationIds.every((id: DatasetId) => datasets[id]?.length)) return [];

		const filtered = Object.fromEntries(
			generationIds.map((id) => [id, applyCorpusFilters(datasets[id])])
		) as Record<string, Article[]>;

		return buildConsensusRows(filtered, generationIds);
	}
};

/** The active generation's model ids, in contract order — the consensus axis. */
export const consensusModels = {
	get current(): readonly DatasetId[] {
		return datasetIdsOf(datasetState.generation);
	}
};

/** Marginal distributions for every loaded model of the active generation. */
export const modelMarginals = {
	get current(): Record<AgreementDimension, ModelMarginals[]> | null {
		const datasets = articleState.datasets;
		const loadedIds = datasetIdsOf(datasetState.generation).filter(
			(id: DatasetId) => datasets[id]?.length
		);
		if (loadedIds.length === 0) return null;

		return Object.fromEntries(
			AGREEMENT_DIMENSIONS.map((dimension) => [
				dimension,
				loadedIds.map((id) => computeMarginals(applyCorpusFilters(datasets[id]), dimension, id))
			])
		) as Record<AgreementDimension, ModelMarginals[]>;
	}
};
