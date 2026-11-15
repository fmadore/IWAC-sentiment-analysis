/**
 * Pure store derivations
 *
 * Framework-agnostic computation behind the article/comparison derived state,
 * extracted from the store modules so it can be unit-tested directly without a
 * Svelte runtime.
 *
 * Every filter criterion is turned into a `Set` once, on entry, rather than
 * searched with `includes` once per row: these run over the whole corpus on
 * every filter change, and a criteria array handed in from reactive state may
 * be a Proxy whose every read is a trap and a signal.
 */

import type {
	Article,
	ComparisonData,
	DiscrepancyInfo,
	DiscrepancyFilter,
	ModelPair,
	SentimentAnalysis
} from '#lib/types/data.js';
import { getModelsFromPair } from '#lib/types/data.js';
import { getJournalName } from '#lib/utils/format.js';
import { buildPanelJoin } from '#lib/utils/panelJoin.js';
import {
	CENTRALITY_NON_COMPARABLE,
	CENTRALITY_ORDER,
	NOT_ANNOTATED,
	POLARITY_NON_COMPARABLE,
	POLARITY_ORDER,
	POLARITY_VALENCE_BANDS,
	SIGNIFICANT_CONFLICT_THRESHOLD,
	SIGNIFICANT_SPREAD_THRESHOLD
} from '#lib/domain/sentimentContract.js';

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

/** A criterion as a lookup set, or null when it selects everything. */
function criterion(values: readonly string[]): Set<string> | null {
	return values.length > 0 ? new Set(values) : null;
}

/** Apply the active filters to a list of articles. */
export function filterArticles(articles: Article[], criteria: ArticleFilterCriteria): Article[] {
	const countries = criterion(criteria.countries);
	const journals = criterion(criteria.journals);
	const polarities = criterion(criteria.polarities);
	const subjectivities = criterion(criteria.subjectivities);
	const centralities = criterion(criteria.centralities);
	// Always a fresh array, as `filter` would return: callers may sort it.
	if (!countries && !journals && !polarities && !subjectivities && !centralities) {
		return articles.slice();
	}

	return articles.filter((article) => {
		if (countries && !countries.has(article.Country || '')) return false;
		if (journals && !journals.has(getJournalName(article))) return false;

		const analysis = article.sentiment_analysis;
		if (polarities && !polarities.has(filterBucket(analysis?.polarite))) return false;
		if (subjectivities && !subjectivities.has(filterBucket(analysis?.subjectivite_score))) {
			return false;
		}
		if (centralities && !centralities.has(filterBucket(analysis?.centralite_islam_musulmans))) {
			return false;
		}
		return true;
	});
}

/** Compute the sorted, unique list of journals available for the given articles. */
export function computeAvailableJournals(articles: Article[], countries: string[]): string[] {
	const countrySet = criterion(countries);
	const scoped = countrySet
		? articles.filter((article) => countrySet.has(article.Country || ''))
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

/** How far apart every model's analysis of the same article sits, per dimension. */
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
 * Measure the disagreement across every model of a generation at once: any
 * number of analyses, not three. The contract key (`discrepancy.threeWaySpread`)
 * and the Python half keep their historical three-model names because
 * published fingerprints and fixtures read them.
 *
 * This is the discrepancy flag shown to readers and half of the arbiter's
 * selection rule. It mirrors `calculate_three_way_spread` in
 * data-preprocess/iwac_preprocess/discrepancy.py; the shared fixtures in
 * `discrepancy-v2-fixtures.json` hold the two implementations together.
 *
 * Spread is the full range (max − min), not a pairwise gap: models one step
 * apart in a row disagree more than the widest single pair suggests.
 */
export function calculatePanelSpread(
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

/** Which dimensions put an article over the discrepancy threshold. */
export interface PanelFlagBreakdown {
	/** Articles flagged (`hasSignificantSpread`). */
	flagged: number;
	/** Comparable articles: the flag's denominator. */
	comparable: number;
	polarity: number;
	centrality: number;
	subjectivity: number;
	/** Flagged by subjectivity and by no other dimension. */
	subjectivityOnly: number;
}

/**
 * Break the panel discrepancy flag down by dimension, live. The rule itself is
 * unchanged; this only says which dimension tripped it, because subjectivity,
 * the least consistently scaled of the three, trips it alone far more often
 * than the other two combined.
 */
export function summarizePanelFlags(
	rows: Iterable<(SentimentAnalysis | null | undefined)[]>
): PanelFlagBreakdown {
	const breakdown: PanelFlagBreakdown = {
		flagged: 0,
		comparable: 0,
		polarity: 0,
		centrality: 0,
		subjectivity: 0,
		subjectivityOnly: 0
	};
	for (const analyses of rows) {
		const spread = calculatePanelSpread(analyses);
		if (!spread.isComparable) continue;
		breakdown.comparable++;
		if (!spread.hasSignificantSpread) continue;
		breakdown.flagged++;
		const polarity = spread.polaritySpread >= SIGNIFICANT_SPREAD_THRESHOLD;
		const centrality = spread.centralitySpread >= SIGNIFICANT_SPREAD_THRESHOLD;
		const subjectivity = spread.subjectivitySpread >= SIGNIFICANT_SPREAD_THRESHOLD;
		if (polarity) breakdown.polarity++;
		if (centrality) breakdown.centrality++;
		if (subjectivity) breakdown.subjectivity++;
		if (subjectivity && !polarity && !centrality) breakdown.subjectivityOnly++;
	}
	return breakdown;
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
	const spread = calculatePanelSpread(analyses);
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
	const spread = calculatePanelSpread(analyses);
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

	// The shared positional join: no id map when the two datasets are aligned,
	// as every pair loaded from the same article base is.
	const join = buildPanelJoin(datasets, [modelAId, modelBId]);
	if (!join) return [];
	const [analysesA, analysesB] = join.analyses;

	return join.articles.map((article, i) => ({
		article,
		modelA: analysesA[i] || null,
		modelB: analysesB[i] || null,
		modelAId,
		modelBId,
		discrepancies: calculateDiscrepancies(analysesA[i], analysesB[i])
	}));
}

/** Apply discrepancy/country/journal filters to comparison rows. */
export function filterComparisons(
	comparisons: ComparisonData[],
	filters: DiscrepancyFilter,
	countries: string[],
	journals: string[]
): ComparisonData[] {
	const countrySet = criterion(countries);
	const journalSet = criterion(journals);
	const dimensions = new Set(filters.dimensions);
	const allDimensions = dimensions.size === 0;

	return comparisons
		.map((comparison) => {
			const originalDisc = comparison.discrepancies;
			if (allDimensions) return comparison;

			const polarityDiff = dimensions.has('polarity') ? originalDisc.polarityDiff : 0;
			const subjectivityDiff = dimensions.has('subjectivity') ? originalDisc.subjectivityDiff : 0;
			const centralityDiff = dimensions.has('centrality') ? originalDisc.centralityDiff : 0;
			const filteredDiscrepancy: DiscrepancyInfo = {
				polarityDiff,
				subjectivityDiff,
				centralityDiff,
				totalDiff: polarityDiff + subjectivityDiff + centralityDiff,
				hasConflict:
					polarityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD ||
					subjectivityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD ||
					centralityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD,
				isComparable: originalDisc.isComparable
			};

			return { ...comparison, discrepancies: filteredDiscrepancy };
		})
		.filter((comparison) => {
			if (countrySet && !countrySet.has(comparison.article.Country || '')) {
				return false;
			}

			if (journalSet && !journalSet.has(getJournalName(comparison.article))) {
				return false;
			}

			if (filters.excludeNonApplicable && !comparison.discrepancies.isComparable) {
				return false;
			}

			const disc = comparison.discrepancies;

			if (disc.totalDiff < filters.minDifference || disc.totalDiff > filters.maxDifference) {
				return false;
			}

			if (allDimensions) {
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
	/**
	 * Which dimension reached the sharp-disagreement gap, per flagged article.
	 * The flag rule is unchanged; this only says what tripped it.
	 */
	highConflictBy: {
		polarity: number;
		subjectivity: number;
		centrality: number;
		subjectivityOnly: number;
	};
}

/** Compute aggregate statistics for the filtered comparison set. */
export function computeComparisonStatistics(
	allComparisons: ComparisonData[],
	filteredComparisons: ComparisonData[],
	countries: string[],
	journals: string[]
): ComparisonStatistics {
	let totalArticles = allComparisons.length;
	const countrySet = criterion(countries);
	const journalSet = criterion(journals);

	if (countrySet || journalSet) {
		totalArticles = allComparisons.filter((comparison) => {
			if (countrySet && !countrySet.has(comparison.article.Country || '')) return false;
			if (journalSet && !journalSet.has(getJournalName(comparison.article))) return false;
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
			highConflictArticles: 0,
			highConflictBy: { polarity: 0, subjectivity: 0, centrality: 0, subjectivityOnly: 0 }
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
			if (disc.hasConflict) {
				const polarity = disc.polarityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD;
				const subjectivity = disc.subjectivityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD;
				const centrality = disc.centralityDiff >= SIGNIFICANT_CONFLICT_THRESHOLD;
				if (polarity) acc.highConflictBy.polarity++;
				if (subjectivity) acc.highConflictBy.subjectivity++;
				if (centrality) acc.highConflictBy.centrality++;
				if (subjectivity && !polarity && !centrality) acc.highConflictBy.subjectivityOnly++;
			}

			return acc;
		},
		{
			totalDiscrepancies: 0,
			totalDiffSum: 0,
			polarityConflicts: 0,
			subjectivityConflicts: 0,
			centralityConflicts: 0,
			highConflictArticles: 0,
			highConflictBy: { polarity: 0, subjectivity: 0, centrality: 0, subjectivityOnly: 0 }
		}
	);

	return {
		totalArticles,
		totalDiscrepancies: stats.totalDiscrepancies,
		averageDiscrepancy: stats.totalDiffSum / filteredComparisons.length,
		polarityConflicts: stats.polarityConflicts,
		subjectivityConflicts: stats.subjectivityConflicts,
		centralityConflicts: stats.centralityConflicts,
		highConflictArticles: stats.highConflictArticles,
		highConflictBy: stats.highConflictBy
	};
}
