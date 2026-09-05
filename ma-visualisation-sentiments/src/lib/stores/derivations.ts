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
import { getJournalName } from '$lib/utils/format';
import {
	CENTRALITY_NON_COMPARABLE,
	CENTRALITY_ORDER,
	NOT_ANNOTATED,
	POLARITY_NON_COMPARABLE,
	POLARITY_ORDER,
	POLARITY_VALENCE_BANDS,
	SIGNIFICANT_CONFLICT_THRESHOLD,
	SIGNIFICANT_SPREAD_THRESHOLD
} from '$lib/domain/sentimentContract';

// ============================================
// Score Mappings
// ============================================

export const polarityScores: Record<string, number> = POLARITY_ORDER;
export const centralityScores: Record<string, number> = CENTRALITY_ORDER;

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

/**
 * The chip an article answers to on one dimension: its stored value, or the
 * `Non annoté` bucket when there is none. A missing rating used to fall into
 * `Non applicable` (polarity) and `Non abordé` (centrality) — a model that
 * declined looked like a model that found no stance, and the table's counts
 * under those chips disagreed with the charts, which skip nulls.
 */
function filterBucket(value: string | number | null | undefined): string {
	return value === null || value === undefined ? NOT_ANNOTATED : String(value);
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

		const analysis = article.sentiment_analysis;

		if (polarities.length > 0 && !polarities.includes(filterBucket(analysis?.polarite))) {
			return false;
		}

		if (
			subjectivities.length > 0 &&
			!subjectivities.includes(filterBucket(analysis?.subjectivite_score))
		) {
			return false;
		}

		if (
			centralities.length > 0 &&
			!centralities.includes(filterBucket(analysis?.centralite_islam_musulmans))
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
			hasConflict: false,
			isComparable: false
		};
	}

	const isComparable =
		modelA.polarite !== null &&
		modelB.polarite !== null &&
		modelA.centralite_islam_musulmans !== null &&
		modelB.centralite_islam_musulmans !== null &&
		!POLARITY_NON_COMPARABLE.has(modelA.polarite) &&
		!POLARITY_NON_COMPARABLE.has(modelB.polarite) &&
		!CENTRALITY_NON_COMPARABLE.has(modelA.centralite_islam_musulmans) &&
		!CENTRALITY_NON_COMPARABLE.has(modelB.centralite_islam_musulmans);

	if (!isComparable) {
		return {
			polarityDiff: 0,
			subjectivityDiff: 0,
			centralityDiff: 0,
			totalDiff: 0,
			hasConflict: false,
			isComparable: false
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
	const hasConflict =
		polarityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD ||
		subjectivityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD ||
		centralityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD;

	return { polarityDiff, subjectivityDiff, centralityDiff, totalDiff, hasConflict, isComparable };
}

/** How far apart three analyses of the same article sit, per dimension. */
export interface SpreadInfo {
	polaritySpread: number;
	subjectivitySpread: number;
	centralitySpread: number;
	totalSpread: number;
	/** At least one dimension spans the significance threshold. */
	hasSignificantSpread: boolean;
	/** False when any model marks the sentiment task non-applicable. */
	isComparable: boolean;
}

const EMPTY_SPREAD: SpreadInfo = {
	polaritySpread: 0,
	subjectivitySpread: 0,
	centralitySpread: 0,
	totalSpread: 0,
	hasSignificantSpread: false,
	isComparable: false
};

/**
 * Measure the disagreement across all three models of a generation at once.
 *
 * This is the selection metric for the three-way arbiter, and it mirrors
 * `calculate_three_way_spread` in data-preprocess/iwac_preprocess/discrepancy.py
 * — the shared fixtures in `discrepancy-v2-fixtures.json` hold the two
 * implementations together.
 *
 * Spread is the full range (max − min), not a pairwise gap: three models one
 * step apart in a row disagree more than the widest single pair suggests.
 */
export function calculateThreeWaySpread(
	analyses: (SentimentAnalysis | null | undefined)[]
): SpreadInfo {
	if (analyses.length < 2 || analyses.some((analysis) => !analysis)) return EMPTY_SPREAD;
	const present = analyses as SentimentAnalysis[];

	const isComparable = present.every(
		(analysis) =>
			analysis.polarite !== null &&
			analysis.centralite_islam_musulmans !== null &&
			!POLARITY_NON_COMPARABLE.has(analysis.polarite) &&
			!CENTRALITY_NON_COMPARABLE.has(analysis.centralite_islam_musulmans)
	);
	if (!isComparable) return EMPTY_SPREAD;

	const range = (values: number[]) => Math.max(...values) - Math.min(...values);

	const polaritySpread = range(
		present.map((analysis) => polarityScores[analysis.polarite || 'Non applicable'] || 0)
	);
	const centralitySpread = range(
		present.map(
			(analysis) => centralityScores[analysis.centralite_islam_musulmans || 'Non abordé'] || 0
		)
	);

	// One declined score drops the whole dimension, exactly as the pairwise rule
	// skips it: a model that did not answer is not a model that agreed.
	const subjectivityScores = present.map((analysis) => analysis.subjectivite_score);
	const subjectivitySpread = subjectivityScores.some((score) => score == null)
		? 0
		: range(subjectivityScores as number[]);

	const spreads = [polaritySpread, subjectivitySpread, centralitySpread];
	return {
		polaritySpread,
		subjectivitySpread,
		centralitySpread,
		totalSpread: spreads.reduce((total, value) => total + value, 0),
		hasSignificantSpread: spreads.some((spread) => spread >= SIGNIFICANT_SPREAD_THRESHOLD),
		isComparable: true
	};
}

/**
 * Whether the panel disagrees about the *sign* of the polarity — at least one
 * model positive and at least one negative on the same article.
 *
 * Not the amplitude question restated. On the 1-5 scale a spread of 3 already
 * implies a flip, so the spread rule catches the widest reversals for free; what
 * it structurally cannot reach is `Positif` against `Négatif`, which spans only
 * two ranks. Returns false on a row the panel cannot be compared on, so callers
 * combine it with the spread rule without a three-valued dance.
 *
 * The Python half is `has_polarity_valence_flip`; `discrepancy-v2-fixtures.json`
 * holds both implementations to the same answers.
 */
export function hasPolarityValenceFlip(
	analyses: (SentimentAnalysis | null | undefined)[]
): boolean {
	const spread = calculateThreeWaySpread(analyses);
	if (!spread.isComparable) return false;

	const ranks = (analyses as SentimentAnalysis[]).map(
		(analysis) => polarityScores[analysis.polarite || 'Non applicable'] || 0
	);
	return (
		ranks.some((rank) => rank >= POLARITY_VALENCE_BANDS.positiveMinimum) &&
		ranks.some((rank) => rank <= POLARITY_VALENCE_BANDS.negativeMaximum)
	);
}

/**
 * Whether an article is inside the contract's arbiter frame: a significant
 * spread on any dimension, or a polarity valence flip.
 *
 * Deliberately *not* `hasSignificantSpread` — that one drives the discrepancy
 * views, and widening what was paid to arbitrate must not move what a reader is
 * told is a significant disagreement.
 */
export function isArbiterEligible(analyses: (SentimentAnalysis | null | undefined)[]): boolean {
	const spread = calculateThreeWaySpread(analyses);
	if (!spread.isComparable) return false;
	return spread.hasSignificantSpread || hasPolarityValenceFlip(analyses);
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
				hasConflict: false,
				isComparable: originalDisc.isComparable
			};

			if (filters.dimensions.length === 0) {
				filteredDiscrepancy = originalDisc;
			} else {
				filteredDiscrepancy.totalDiff =
					filteredDiscrepancy.polarityDiff +
					filteredDiscrepancy.subjectivityDiff +
					filteredDiscrepancy.centralityDiff;

				filteredDiscrepancy.hasConflict =
					filteredDiscrepancy.polarityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD ||
					filteredDiscrepancy.subjectivityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD ||
					filteredDiscrepancy.centralityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD;
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

			if (filters.excludeNonApplicable && !comparison.discrepancies.isComparable) {
				return false;
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
