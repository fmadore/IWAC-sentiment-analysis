/**
 * Agreement data shaping.
 *
 * Turns the app's Article records into the label pairs / rater items /
 * marginal counts that `utils/agreement.ts` computes statistics over. Kept
 * separate from both: the statistics module knows nothing about Articles, and
 * the store module (agreement.svelte.ts) only wires these into runes.
 */

import type { Article } from '$lib/types/data';
import type { LabelPair } from './agreement';

/** The three analysis dimensions, with their ordered category scales. */
export type AgreementDimension = 'polarity' | 'subjectivity' | 'centrality';

export const AGREEMENT_DIMENSIONS: AgreementDimension[] = [
	'polarity',
	'subjectivity',
	'centrality'
];

/**
 * Category scales in ORDINAL order — weighted kappa and the adjacency band
 * both read positions from these arrays, so the order is load-bearing, not
 * cosmetic.
 *
 * 'Non applicable' / 'Non abordé' sit at the bottom of the polarity and
 * centrality scales respectively because that is where the app's existing
 * score maps (derivations.ts) put them.
 */
export const DIMENSION_CATEGORIES: Record<AgreementDimension, string[]> = {
	polarity: ['Non applicable', 'Très négatif', 'Négatif', 'Neutre', 'Positif', 'Très positif'],
	subjectivity: ['1', '2', '3', '4', '5'],
	centrality: ['Non abordé', 'Marginal', 'Secondaire', 'Central', 'Très central']
};

/** Read an article's label for a dimension, or null when it wasn't analysed. */
export function getDimensionLabel(article: Article, dimension: AgreementDimension): string | null {
	const analysis = article.sentiment_analysis;
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
	const byIdB = new Map(articlesB.map((article) => [String(article['o:id']), article]));
	const pairs: LabelPair[] = [];

	for (const articleA of articlesA) {
		const articleB = byIdB.get(String(articleA['o:id']));
		if (!articleB) continue;

		const a = getDimensionLabel(articleA, dimension);
		const b = getDimensionLabel(articleB, dimension);
		if (a === null || b === null) continue;

		pairs.push({ a, b });
	}

	return pairs;
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
	const [first, ...rest] = modelIds;
	const firstArticles = datasets[first] ?? [];
	if (firstArticles.length === 0) return [];

	const restMaps = rest.map(
		(id) => new Map((datasets[id] ?? []).map((article) => [String(article['o:id']), article]))
	);

	const items: string[][] = [];

	for (const article of firstArticles) {
		const labels: string[] = [];
		const firstLabel = getDimensionLabel(article, dimension);
		if (firstLabel === null) continue;
		labels.push(firstLabel);

		let complete = true;
		for (const map of restMaps) {
			const other = map.get(String(article['o:id']));
			const label = other ? getDimensionLabel(other, dimension) : null;
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
	const categories = DIMENSION_CATEGORIES[dimension];
	const index = new Map(categories.map((category, i) => [category, i]));
	const counts = new Array<number>(categories.length).fill(0);
	let analyzed = 0;
	let unanalyzed = 0;

	for (const article of articles) {
		const label = getDimensionLabel(article, dimension);
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
		total: articles.length
	};
}
