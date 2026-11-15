/** Generation-versioned agreement calculations shared by the pair and panel views. */
import type { Article } from '#lib/types/data.js';
import {
	datasetIdsOf,
	getPairModels,
	pairIdsOf,
	type GenerationId,
	type ModelPair,
	type DatasetId
} from '#lib/domain/sentimentContract.js';
import {
	buildConfusionMatrix,
	fleissKappa,
	kappaFromMatrix,
	type ConfusionMatrix,
	type FleissResult,
	type KappaResult,
	type LabelPair
} from './agreement';
import {
	APPLICABILITY_CATEGORIES,
	analysisLabel,
	buildLabelPairs,
	labelPairsAt,
	raterItemsAt,
	unitsAt,
	DIMENSION_CATEGORIES,
	type AgreementDimension,
	type ApplicabilityLabel
} from './agreementData';
import {
	alphaFromMatrix,
	coincidenceMatrix,
	krippendorffAlpha,
	type AlphaResult
} from './krippendorff';
import { allRows, buildPanelJoin } from './panelJoin';

export type WeightedAgreementMethod = 'ordinal-v1' | 'applicable-ordinal-v2';
export type AgreementMetric = 'exact' | 'kappa' | 'weighted';

export interface DimensionAgreement {
	dimension: AgreementDimension;
	categories: string[];
	matrix: ConfusionMatrix;
	/**
	 * Ordinal proximity uses the same applicable sample as weighted kappa.
	 * `expected` is the within-one share two independent raters with these
	 * marginals would reach by chance: the baseline the observed value has to
	 * beat before it says anything.
	 */
	ordinalAdjacency: { value: number; expected: number; n: number };
	kappa: KappaResult;
	weightedKappa: KappaResult;
	weightedMethod: WeightedAgreementMethod;
}

/**
 * Nominal agreement retains every known label. In v2, ordinal polarity
 * calculations exclude the non-ordinal "Non applicable" verdict. Archived
 * v1 calculations deliberately retain their original category positions.
 */
/**
 * The ordered categories an ordinal statistic runs over: v2 polarity drops the
 * non-ordinal "Non applicable" verdict; everything else (and all of v1, for
 * reproducibility) keeps the full category list in its historical order.
 */
export function ordinalCategories(
	dimension: AgreementDimension,
	generation: GenerationId
): string[] {
	const categories = DIMENSION_CATEGORIES[dimension];
	return generation === 'v2' && dimension === 'polarity'
		? categories.filter((label) => label !== 'Non applicable')
		: categories;
}

/** Chance-expected share within one ordinal step, from the two marginals. */
export function expectedAdjacentAgreement(matrix: ConfusionMatrix): number {
	const { n, rowTotals, columnTotals } = matrix;
	if (n === 0) return NaN;
	let expected = 0;
	for (let i = 0; i < rowTotals.length; i++) {
		for (let j = Math.max(0, i - 1); j <= Math.min(columnTotals.length - 1, i + 1); j++) {
			expected += rowTotals[i] * columnTotals[j];
		}
	}
	return expected / (n * n);
}

export function summarizeAgreement(
	pairs: LabelPair[],
	dimension: AgreementDimension,
	generation: GenerationId
): DimensionAgreement {
	const categories = DIMENSION_CATEGORIES[dimension];
	const matrix = buildConfusionMatrix(pairs, categories);
	const ordinal = ordinalCategories(dimension, generation);
	const ordinalMatrix =
		ordinal.length === categories.length ? matrix : buildConfusionMatrix(pairs, ordinal);
	return {
		dimension,
		categories,
		matrix,
		ordinalAdjacency: {
			value: ordinalMatrix.n > 0 ? ordinalMatrix.adjacentAgreement : NaN,
			expected: expectedAdjacentAgreement(ordinalMatrix),
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

/**
 * Every contract pair of a generation over the panel join's label columns.
 * Enumerates contract pairs, never parses hyphenated model ids.
 */
export function summarizePanelPairs(
	columns: readonly (readonly (string | null)[])[],
	modelIds: readonly DatasetId[],
	rows: readonly number[],
	generation: GenerationId,
	dimension: AgreementDimension
): PairAgreementSummary[] {
	return pairIdsOf(generation).map((pair) => {
		const models = getPairModels(pair);
		const a = modelIds.indexOf(models[0]);
		const b = modelIds.indexOf(models[1]);
		const pairs = a < 0 || b < 0 ? [] : labelPairsAt(columns[a], columns[b], rows);
		return { pair, models, ...summarizeAgreement(pairs, dimension, generation) };
	});
}

/** The same summaries straight from datasets (one join; for callers without one). */
export function summarizeModelPairs(
	datasets: Partial<Record<DatasetId, Article[]>>,
	generation: GenerationId,
	dimension: AgreementDimension
): PairAgreementSummary[] {
	const modelIds = datasetIdsOf(generation);
	const join = buildPanelJoin(datasets, modelIds);
	if (!join) {
		// Part of the panel is missing: pair whatever is there, one join per pair.
		return pairIdsOf(generation).map((pair) => {
			const models = getPairModels(pair);
			const pairs = buildLabelPairs(
				datasets[models[0]] ?? [],
				datasets[models[1]] ?? [],
				dimension
			);
			return { pair, models, ...summarizeAgreement(pairs, dimension, generation) };
		});
	}
	const columns = join.analyses.map((column) =>
		column.map((analysis) => analysisLabel(analysis, dimension))
	);
	return summarizePanelPairs(columns, modelIds, allRows(join), generation, dimension);
}

/**
 * Panel-wide reliability on one dimension.
 *
 * Alpha keeps every article at least two models rated; Fleiss' kappa keeps
 * only the articles every model rated (complete cases), so a model with thin,
 * non-random coverage narrows and skews its base. Nominal alpha and Fleiss
 * run over the full category list (the nominal matrix); ordinal alpha over
 * `ordinalCategories`, the same sample rule weighted kappa uses.
 */
export interface PanelReliability {
	fleiss: FleissResult;
	nominalAlpha: AlphaResult;
	ordinalAlpha: AlphaResult;
}

export function panelReliability(
	columns: readonly (readonly (string | null)[])[],
	rows: readonly number[],
	dimension: AgreementDimension,
	generation: GenerationId
): PanelReliability {
	const categories = DIMENSION_CATEGORIES[dimension];
	const ordinal = ordinalCategories(dimension, generation);
	const nominalMatrix = coincidenceMatrix(unitsAt(columns, rows), categories);
	return {
		fleiss: fleissKappa(raterItemsAt(columns, rows), categories),
		nominalAlpha: alphaFromMatrix(nominalMatrix, 'nominal'),
		ordinalAlpha:
			ordinal.length === categories.length
				? alphaFromMatrix(nominalMatrix, 'ordinal')
				: krippendorffAlpha(unitsAt(columns, rows), ordinal, 'ordinal')
	};
}

export interface LeaveOneOutRow {
	/** The model removed from the panel. */
	leftOut: DatasetId;
	reliability: PanelReliability;
}

/**
 * The panel statistics recomputed with each model left out in turn. Generic
 * over the generation's own model list: a panel coefficient is a property of
 * which models were chosen, and this makes that dependence visible.
 */
export function leaveOneOut(
	columns: readonly (readonly (string | null)[])[],
	modelIds: readonly DatasetId[],
	rows: readonly number[],
	dimension: AgreementDimension,
	generation: GenerationId
): LeaveOneOutRow[] {
	if (modelIds.length < 3) return [];
	return modelIds.map((leftOut, m) => ({
		leftOut,
		reliability: panelReliability(
			columns.filter((_, index) => index !== m),
			rows,
			dimension,
			generation
		)
	}));
}

export interface ApplicabilityPair {
	pair: ModelPair;
	models: [DatasetId, DatasetId];
	kappa: KappaResult;
	/** Rows where the two models give opposite verdicts. */
	disagreements: number;
}

export interface ApplicabilityModelCount {
	modelId: DatasetId;
	addressed: number;
	notAddressed: number;
	missing: number;
}

export interface ApplicabilityAgreement {
	pairs: ApplicabilityPair[];
	/** Nominal alpha over the binary verdicts, missing ratings left out. */
	alpha: AlphaResult;
	perModel: ApplicabilityModelCount[];
	/** Rows with at least one verdict of each kind among the models that gave one. */
	mixed: number;
	/** Rows (two or more verdicts) where every verdict is addressed / not addressed. */
	allAddressed: number;
	allNotAddressed: number;
	/** Rows with at least two verdicts: alpha's units. */
	rated: number;
}

/**
 * Agreement on whether an article is about Islam at all. Kept apart from the
 * three scales: the discrepancy flags and the arbiter frame exclude these rows
 * by a documented rule, and that rule stays; this measures what it excludes.
 */
export function applicabilityAgreement(
	columns: readonly (readonly (ApplicabilityLabel | null)[])[],
	modelIds: readonly DatasetId[],
	rows: readonly number[],
	generation: GenerationId
): ApplicabilityAgreement {
	const categories = [...APPLICABILITY_CATEGORIES];
	const pairs = pairIdsOf(generation).map((pair) => {
		const models = getPairModels(pair);
		const a = modelIds.indexOf(models[0]);
		const b = modelIds.indexOf(models[1]);
		const labelPairs = a < 0 || b < 0 ? [] : labelPairsAt(columns[a], columns[b], rows);
		return {
			pair,
			models,
			kappa: kappaFromMatrix(buildConfusionMatrix(labelPairs, categories), 'none'),
			disagreements: labelPairs.filter(({ a: x, b: y }) => x !== y).length
		};
	});

	const perModel = modelIds.map((modelId, m) => {
		let addressed = 0;
		let notAddressed = 0;
		let missing = 0;
		for (const i of rows) {
			const label = columns[m][i];
			if (label === 'addressed') addressed++;
			else if (label === 'not-addressed') notAddressed++;
			else missing++;
		}
		return { modelId, addressed, notAddressed, missing };
	});

	let mixed = 0;
	let allAddressed = 0;
	let allNotAddressed = 0;
	let rated = 0;
	for (const i of rows) {
		let yes = 0;
		let no = 0;
		for (const column of columns) {
			const label = column[i];
			if (label === 'addressed') yes++;
			else if (label === 'not-addressed') no++;
		}
		if (yes + no < 2) continue;
		rated++;
		if (yes > 0 && no > 0) mixed++;
		else if (yes > 0) allAddressed++;
		else allNotAddressed++;
	}

	return {
		pairs,
		alpha: krippendorffAlpha(unitsAt(columns, rows), categories, 'nominal'),
		perModel,
		mixed,
		allAddressed,
		allNotAddressed,
		rated
	};
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
