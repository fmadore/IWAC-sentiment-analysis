/**
 * Agreement data shaping.
 *
 * Turns the app's Article records into the label pairs / rater items /
 * marginal counts that `utils/agreement.ts` computes statistics over. Kept
 * separate from both: the statistics module knows nothing about Articles, and
 * the store module (agreement.svelte.ts) only wires these into runes.
 */

import type { Article, SentimentAnalysis } from '#lib/types/data.js';
import type { LabelPair } from './agreement';
import { buildPanelJoin, type PanelJoin } from './panelJoin';
import {
	CENTRALITY_NON_COMPARABLE,
	POLARITY_NON_COMPARABLE,
	type CentralityValue,
	type PolarityValue
} from '#lib/domain/sentimentContract.js';

/** The three analysis dimensions, with their ordered category scales. */
export type AgreementDimension = 'polarity' | 'subjectivity' | 'centrality';

export const AGREEMENT_DIMENSIONS: AgreementDimension[] = [
	'polarity',
	'subjectivity',
	'centrality'
];

/**
 * Complete category sets for the nominal matrix and legacy adjacency band.
 * Their historical order is preserved for archived v1 calculations. In v2,
 * agreementMetrics excludes the non-ordinal polarity verdict 'Non applicable'
 * from weighted agreement, while this full categorical matrix retains it.
 * 'Non abordé' remains the genuine bottom of the centrality scale.
 */
export const DIMENSION_CATEGORIES: Record<AgreementDimension, string[]> = {
	polarity: ['Non applicable', 'Très négatif', 'Négatif', 'Neutre', 'Positif', 'Très positif'],
	subjectivity: ['1', '2', '3', '4', '5'],
	centrality: ['Non abordé', 'Marginal', 'Secondaire', 'Central', 'Très central']
};

/** Read an article's label for a dimension, or null when it wasn't analysed. */
export function getDimensionLabel(article: Article, dimension: AgreementDimension): string | null {
	return analysisLabel(article.sentiment_analysis, dimension);
}

/** The same read over a bare analysis, as the panel join stores them. */
export function analysisLabel(
	analysis: SentimentAnalysis | null | undefined,
	dimension: AgreementDimension
): string | null {
	if (!analysis) return null;

	switch (dimension) {
		case 'polarity':
			return analysis.polarite ?? null;
		case 'centrality':
			return analysis.centralite_islam_musulmans ?? null;
		case 'subjectivity':
			return analysis.subjectivite_score == null ? null : String(analysis.subjectivite_score);
	}
}

/**
 * One label column per model and dimension, read once from the panel join:
 * columns[dimension][m][i] is model m's label for row i, or null. Every
 * agreement statistic then indexes these arrays rather than re-joining.
 */
export type LabelColumns = Record<AgreementDimension, (string | null)[][]>;

export function buildLabelColumns(join: PanelJoin): LabelColumns {
	return Object.fromEntries(
		AGREEMENT_DIMENSIONS.map((dimension) => [
			dimension,
			join.analyses.map((column) => column.map((analysis) => analysisLabel(analysis, dimension)))
		])
	) as LabelColumns;
}

/**
 * Two models' labels on the given rows, dropping any row either left
 * unlabelled, so n is the genuine complete-case count.
 */
export function labelPairsAt(
	columnA: readonly (string | null)[],
	columnB: readonly (string | null)[],
	rows: readonly number[]
): LabelPair[] {
	const pairs: LabelPair[] = [];
	for (const i of rows) {
		const a = columnA[i];
		const b = columnB[i];
		if (a === null || b === null) continue;
		pairs.push({ a, b });
	}
	return pairs;
}

/** Every model's label on the given rows, complete cases only (see fleissKappa). */
export function raterItemsAt(
	columns: readonly (readonly (string | null)[])[],
	rows: readonly number[]
): string[][] {
	const items: string[][] = [];
	if (columns.length === 0) return items;
	for (const i of rows) {
		const labels: string[] = [];
		let complete = true;
		for (const column of columns) {
			const label = column[i];
			if (label === null) {
				complete = false;
				break;
			}
			labels.push(label);
		}
		if (complete) items.push(labels);
	}
	return items;
}

/** Every model's label on the given rows, missing ones kept as null (for alpha). */
export function* unitsAt(
	columns: readonly (readonly (string | null)[])[],
	rows: readonly number[]
): Generator<(string | null)[]> {
	for (const i of rows) yield columns.map((column) => column[i]);
}

/**
 * Pair up two models' labels for the same articles (exported for tests).
 *
 * Joins on article id and drops any article either model left unanalysed, so
 * the resulting n is the genuine complete-case count rather than a total that
 * quietly includes half-missing rows.
 */
export function buildLabelPairs(
	articlesA: Article[],
	articlesB: Article[],
	dimension: AgreementDimension
): LabelPair[] {
	const join = buildPanelJoin({ a: articlesA, b: articlesB }, ['a', 'b']);
	if (!join) return [];
	const [columnA, columnB] = join.analyses.map((column) =>
		column.map((analysis) => analysisLabel(analysis, dimension))
	);
	return labelPairsAt(
		columnA,
		columnB,
		join.articles.map((_, i) => i)
	);
}

/**
 * Group every model's label for the same article (exported for tests).
 * Only articles all models analysed contribute — see fleissKappa.
 */
export function buildRaterItems(
	datasets: Record<string, Article[]>,
	modelIds: readonly string[],
	dimension: AgreementDimension
): string[][] {
	const join = buildPanelJoin(datasets, modelIds);
	if (!join) return [];
	const columns = join.analyses.map((column) =>
		column.map((analysis) => analysisLabel(analysis, dimension))
	);
	return raterItemsAt(
		columns,
		join.articles.map((_, i) => i)
	);
}

/**
 * Applicability: did the model treat the article as being about Islam at all?
 *
 * The binary beneath the three scales. A model that answers `Non applicable`
 * (polarity) or `Non abordé` / `Non applicable` (centrality) says "not
 * addressed" — the same non-comparable verdicts that remove a row from the
 * discrepancy flags and the arbiter frame. Any other pair of ratings says
 * "addressed". A missing rating is neither: null stays null, as everywhere
 * else in the app, so a declined row never counts as a verdict either way.
 */
export const APPLICABILITY_CATEGORIES = ['addressed', 'not-addressed'] as const;
export type ApplicabilityLabel = (typeof APPLICABILITY_CATEGORIES)[number];

export function applicabilityLabel(
	analysis: SentimentAnalysis | null | undefined
): ApplicabilityLabel | null {
	if (!analysis) return null;
	const polarity = analysis.polarite;
	const centrality = analysis.centralite_islam_musulmans;
	if (
		(polarity != null && POLARITY_NON_COMPARABLE.has(polarity as PolarityValue)) ||
		(centrality != null && CENTRALITY_NON_COMPARABLE.has(centrality as CentralityValue))
	) {
		return 'not-addressed';
	}
	return polarity != null && centrality != null ? 'addressed' : null;
}

/** One applicability column per model, aligned with the panel join. */
export function buildApplicabilityColumns(join: PanelJoin): (ApplicabilityLabel | null)[][] {
	return join.analyses.map((column) => column.map(applicabilityLabel));
}

export interface ModelMarginals {
	modelId: string;
	/** Count per category, in the dimension's ordinal order. */
	counts: number[];
	/** Percentage of the model's analysed articles per category. */
	percentages: number[];
	/** Articles this model declined to place (no label at all). */
	unanalyzed: number;
	total: number;
}

/**
 * Each model's own label distribution for a dimension (exported for tests).
 *
 * This is the calibration signature: Gemini reaches for 'Très positif' 3.8x
 * more often than ChatGPT, Mistral almost never says 'Très central'. Switching
 * datasets and comparing remembered bar heights could never show that.
 */
export function computeMarginals(
	articles: Article[],
	dimension: AgreementDimension,
	modelId: string
): ModelMarginals {
	return marginalsFromLabels(
		articles.map((article) => getDimensionLabel(article, dimension)),
		articles.map((_, i) => i),
		dimension,
		modelId
	);
}

/** `computeMarginals` over one label column of the panel join, on the given rows. */
export function marginalsFromLabels(
	column: readonly (string | null)[],
	rows: readonly number[],
	dimension: AgreementDimension,
	modelId: string
): ModelMarginals {
	const categories = DIMENSION_CATEGORIES[dimension];
	const index = new Map(categories.map((category, i) => [category, i]));
	const counts = new Array<number>(categories.length).fill(0);
	let analyzed = 0;
	let unanalyzed = 0;

	for (const i of rows) {
		const label = column[i];
		const position = label === null ? undefined : index.get(label);

		if (position === undefined) {
			unanalyzed++;
			continue;
		}

		counts[position]++;
		analyzed++;
	}

	return {
		modelId,
		counts,
		percentages: counts.map((count) => (analyzed > 0 ? (count / analyzed) * 100 : 0)),
		unanalyzed,
		total: rows.length
	};
}
