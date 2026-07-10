/**
 * Pure store derivations
 *
 * Framework-agnostic computation behind the article/comparison derived state.
 * Extracted from the store modules so the exact same logic backs both the
 * (transitional) legacy derived stores and the runes-based accessors, and so
 * it can be unit-tested directly without a Svelte runtime.
 */

import type {
	Article,
	ComparisonData,
	DiscrepancyInfo,
	DiscrepancyFilter,
	ModelPair,
	SentimentAnalysis
} from '$lib/types/data';
import { getModelsFromPair } from '$lib/types/data';
import { getJournalName } from '$lib/utils';

// ============================================
// Score Mappings
// ============================================

export const polarityScores: Record<string, number> = {
	'Très positif': 5,
	Positif: 4,
	Neutre: 3,
	Négatif: 2,
	'Très négatif': 1,
	'Non applicable': 0
};

export const centralityScores: Record<string, number> = {
	'Très central': 5,
	Central: 4,
	Secondaire: 3,
	Marginal: 2,
	'Non abordé': 1
};

// ============================================
// Article filtering
// ============================================

export interface ArticleFilterCriteria {
	countries: string[];
	journals: string[];
	polarities: string[];
	subjectivities: string[];
	centralities: string[];
}

/** Apply the active filters to a list of articles. */
export function filterArticles(
	articles: Article[],
	{ countries, journals, polarities, subjectivities, centralities }: ArticleFilterCriteria
): Article[] {
	return articles.filter((article) => {
		if (countries.length > 0 && !countries.includes(article.Country || '')) {
			return false;
		}

		if (journals.length > 0) {
			const journalName = getJournalName(article);
			if (!journals.includes(journalName)) {
				return false;
			}
		}

		if (
			polarities.length > 0 &&
			!polarities.includes(article.sentiment_analysis?.polarite || 'Non applicable')
		) {
			return false;
		}

		if (subjectivities.length > 0) {
			const score = article.sentiment_analysis?.subjectivite_score;
			if (score === null || score === undefined) {
				return false;
			}
			if (!subjectivities.includes(score.toString())) {
				return false;
			}
		}

		if (
			centralities.length > 0 &&
			!centralities.includes(article.sentiment_analysis?.centralite_islam_musulmans || 'Non abordé')
		) {
			return false;
		}

		return true;
	});
}

/** Compute the sorted, unique list of journals available for the given articles. */
export function computeAvailableJournals(articles: Article[], countries: string[]): string[] {
	const scoped =
		countries.length > 0
			? articles.filter((article) => countries.includes(article.Country || ''))
			: articles;

	return [
		...new Set(
			scoped.map((article) => getJournalName(article)).filter((name): name is string => !!name)
		)
	].sort((a, b) => a.localeCompare(b));
}

// ============================================
// Comparison derivations
// ============================================

/** Calculate discrepancies between two sentiment analyses. */
export function calculateDiscrepancies(
	modelA: SentimentAnalysis | null | undefined,
	modelB: SentimentAnalysis | null | undefined
): DiscrepancyInfo {
	if (!modelA || !modelB) {
		return {
			polarityDiff: 0,
			subjectivityDiff: 0,
			centralityDiff: 0,
			totalDiff: 0,
			hasConflict: false
		};
	}

	const polarityDiff = Math.abs(
		(polarityScores[modelA.polarite || 'Non applicable'] || 0) -
			(polarityScores[modelB.polarite || 'Non applicable'] || 0)
	);

	// Skip the subjectivity dimension when either score is missing — coercing a
	// missing score to 0 would manufacture a spurious 4-5 point gap against a
	// present score (mirrors the 'Non applicable' handling on the other axes).
	const subjectivityDiff =
		modelA.subjectivite_score == null || modelB.subjectivite_score == null
			? 0
			: Math.abs(modelA.subjectivite_score - modelB.subjectivite_score);

	const centralityDiff = Math.abs(
		(centralityScores[modelA.centralite_islam_musulmans || 'Non abordé'] || 0) -
			(centralityScores[modelB.centralite_islam_musulmans || 'Non abordé'] || 0)
	);

	const totalDiff = polarityDiff + subjectivityDiff + centralityDiff;
	const hasConflict = polarityDiff >= 3 || subjectivityDiff >= 3 || centralityDiff >= 3;

	return { polarityDiff, subjectivityDiff, centralityDiff, totalDiff, hasConflict };
}

/** Build the per-article comparison rows for the active model pair. */
export function buildComparisonData(
	datasets: Record<string, Article[]>,
	isComparison: boolean,
	pair: ModelPair
): ComparisonData[] {
	if (!isComparison) {
		return [];
	}

	const [modelAId, modelBId] = getModelsFromPair(pair);

	if (!datasets[modelAId] || !datasets[modelBId]) {
		return [];
	}

	const modelBMap = new Map(datasets[modelBId].map((article) => [article['o:id'], article]));
	const comparisons: ComparisonData[] = [];

	datasets[modelAId].forEach((modelAArticle) => {
		const modelBArticle = modelBMap.get(modelAArticle['o:id']);

		if (modelBArticle) {
			comparisons.push({
				article: modelAArticle,
				modelA: modelAArticle.sentiment_analysis || null,
				modelB: modelBArticle.sentiment_analysis || null,
				modelAId,
				modelBId,
				discrepancies: calculateDiscrepancies(
					modelAArticle.sentiment_analysis,
					modelBArticle.sentiment_analysis
				)
			});
		}
	});

	return comparisons;
}

/** Apply discrepancy/country/journal filters to comparison rows. */
export function filterComparisons(
	comparisons: ComparisonData[],
	filters: DiscrepancyFilter,
	countries: string[],
	journals: string[]
): ComparisonData[] {
	return comparisons
		.map((comparison) => {
			const originalDisc = comparison.discrepancies;
			let filteredDiscrepancy = {
				polarityDiff: filters.dimensions.includes('polarity') ? originalDisc.polarityDiff : 0,
				subjectivityDiff: filters.dimensions.includes('subjectivity')
					? originalDisc.subjectivityDiff
					: 0,
				centralityDiff: filters.dimensions.includes('centrality') ? originalDisc.centralityDiff : 0,
				totalDiff: 0,
				hasConflict: false
			};

			if (filters.dimensions.length === 0) {
				filteredDiscrepancy = originalDisc;
			} else {
				filteredDiscrepancy.totalDiff =
					filteredDiscrepancy.polarityDiff +
					filteredDiscrepancy.subjectivityDiff +
					filteredDiscrepancy.centralityDiff;

				filteredDiscrepancy.hasConflict =
					filteredDiscrepancy.polarityDiff >= 3 ||
					filteredDiscrepancy.subjectivityDiff >= 3 ||
					filteredDiscrepancy.centralityDiff >= 3;
			}

			return { ...comparison, discrepancies: filteredDiscrepancy };
		})
		.filter((comparison) => {
			if (countries.length > 0 && !countries.includes(comparison.article.Country || '')) {
				return false;
			}

			const journalName = getJournalName(comparison.article);
			if (journals.length > 0 && !journals.includes(journalName)) {
				return false;
			}

			if (filters.excludeNonApplicable) {
				const modelACentrality = comparison.modelA?.centralite_islam_musulmans;
				const modelBCentrality = comparison.modelB?.centralite_islam_musulmans;

				if (
					modelACentrality === 'Non applicable' ||
					modelACentrality === 'Non abordé' ||
					modelBCentrality === 'Non applicable' ||
					modelBCentrality === 'Non abordé'
				) {
					return false;
				}
			}

			const disc = comparison.discrepancies;

			if (disc.totalDiff < filters.minDifference || disc.totalDiff > filters.maxDifference) {
				return false;
			}

			if (filters.dimensions.length === 0) {
				return true;
			}

			return disc.totalDiff > 0;
		});
}

export interface ComparisonStatistics {
	totalArticles: number;
	totalDiscrepancies: number;
	averageDiscrepancy: number;
	polarityConflicts: number;
	subjectivityConflicts: number;
	centralityConflicts: number;
	highConflictArticles: number;
}

/** Compute aggregate statistics for the filtered comparison set. */
export function computeComparisonStatistics(
	allComparisons: ComparisonData[],
	filteredComparisons: ComparisonData[],
	countries: string[],
	journals: string[]
): ComparisonStatistics {
	let totalArticles = allComparisons.length;

	if (countries.length > 0 || journals.length > 0) {
		totalArticles = allComparisons.filter((comparison) => {
			if (countries.length > 0 && !countries.includes(comparison.article.Country || '')) {
				return false;
			}

			const journalName = getJournalName(comparison.article);
			if (journals.length > 0 && !journals.includes(journalName)) {
				return false;
			}

			return true;
		}).length;
	}

	if (filteredComparisons.length === 0) {
		return {
			totalArticles,
			totalDiscrepancies: 0,
			averageDiscrepancy: 0,
			polarityConflicts: 0,
			subjectivityConflicts: 0,
			centralityConflicts: 0,
			highConflictArticles: 0
		};
	}

	const stats = filteredComparisons.reduce(
		(acc, comp) => {
			const disc = comp.discrepancies;

			acc.totalDiscrepancies += disc.totalDiff > 0 ? 1 : 0;
			acc.totalDiffSum += disc.totalDiff;
			acc.polarityConflicts += disc.polarityDiff > 0 ? 1 : 0;
			acc.subjectivityConflicts += disc.subjectivityDiff > 0 ? 1 : 0;
			acc.centralityConflicts += disc.centralityDiff > 0 ? 1 : 0;
			acc.highConflictArticles += disc.hasConflict ? 1 : 0;

			return acc;
		},
		{
			totalDiscrepancies: 0,
			totalDiffSum: 0,
			polarityConflicts: 0,
			subjectivityConflicts: 0,
			centralityConflicts: 0,
			highConflictArticles: 0
		}
	);

	return {
		totalArticles,
		totalDiscrepancies: stats.totalDiscrepancies,
		averageDiscrepancy: stats.totalDiffSum / filteredComparisons.length,
		polarityConflicts: stats.polarityConflicts,
		subjectivityConflicts: stats.subjectivityConflicts,
		centralityConflicts: stats.centralityConflicts,
		highConflictArticles: stats.highConflictArticles
	};
}
