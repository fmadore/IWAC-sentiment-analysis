/** Generation-versioned agreement calculations shared by the pair and panel views. */
import type { Article } from '$lib/types/data';
import {
	getPairModels,
	pairIdsOf,
	type GenerationId,
	type ModelPair,
	type DatasetId
} from '$lib/domain/sentimentContract';
import {
	buildConfusionMatrix,
	kappaFromMatrix,
	type ConfusionMatrix,
	type KappaResult,
	type LabelPair
} from './agreement';
import { buildLabelPairs, DIMENSION_CATEGORIES, type AgreementDimension } from './agreementData';

export type WeightedAgreementMethod = 'ordinal-v1' | 'applicable-ordinal-v2';
export type AgreementMetric = 'exact' | 'kappa' | 'weighted';

export interface DimensionAgreement {
	dimension: AgreementDimension;
	categories: string[];
	matrix: ConfusionMatrix;
	/** Ordinal proximity uses the same applicable sample as weighted kappa. */
	ordinalAdjacency: { value: number; n: number };
	kappa: KappaResult;
	weightedKappa: KappaResult;
	weightedMethod: WeightedAgreementMethod;
}

/**
 * Nominal agreement retains every known label. In v2, ordinal polarity
 * calculations exclude the non-ordinal "Non applicable" verdict. Archived
 * v1 calculations deliberately retain their original category positions.
 */
export function summarizeAgreement(
	pairs: LabelPair[],
	dimension: AgreementDimension,
	generation: GenerationId
): DimensionAgreement {
	const categories = DIMENSION_CATEGORIES[dimension];
	const matrix = buildConfusionMatrix(pairs, categories);
	const applicablePolarity = generation === 'v2' && dimension === 'polarity';
	const ordinalMatrix = applicablePolarity
		? buildConfusionMatrix(
				pairs,
				categories.filter((label) => label !== 'Non applicable')
			)
		: matrix;
	return {
		dimension,
		categories,
		matrix,
		ordinalAdjacency: {
			value: ordinalMatrix.n > 0 ? ordinalMatrix.adjacentAgreement : NaN,
			n: ordinalMatrix.n
		},
		kappa: kappaFromMatrix(matrix, 'none'),
		weightedKappa: kappaFromMatrix(ordinalMatrix, 'quadratic'),
		weightedMethod: generation === 'v1' ? 'ordinal-v1' : 'applicable-ordinal-v2'
	};
}

export interface PairAgreementSummary extends DimensionAgreement {
	pair: ModelPair;
	models: [DatasetId, DatasetId];
}

/** Enumerate contract pairs, never parse hyphenated model ids. */
export function summarizeModelPairs(
	datasets: Partial<Record<DatasetId, Article[]>>,
	generation: GenerationId,
	dimension: AgreementDimension
): PairAgreementSummary[] {
	return pairIdsOf(generation).map((pair) => {
		const models = getPairModels(pair);
		return {
			pair,
			models,
			...summarizeAgreement(
				buildLabelPairs(datasets[models[0]] ?? [], datasets[models[1]] ?? [], dimension),
				dimension,
				generation
			)
		};
	});
}

/** n is metric-specific: weighted v2 polarity may use fewer articles. */
export function agreementMetricValue(
	summary: DimensionAgreement,
	metric: AgreementMetric
): { value: number; n: number } {
	if (metric === 'weighted')
		return { value: summary.weightedKappa.kappa, n: summary.weightedKappa.n };
	if (metric === 'kappa') return { value: summary.kappa.kappa, n: summary.kappa.n };
	return { value: summary.matrix.n > 0 ? summary.matrix.exactAgreement : NaN, n: summary.matrix.n };
}
