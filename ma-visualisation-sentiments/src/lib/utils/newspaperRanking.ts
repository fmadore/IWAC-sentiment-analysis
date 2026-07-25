/**
 * Per-newspaper sentiment index with confidence intervals.
 *
 * The existing per-newspaper chart stacks absolute counts for all 56 titles in
 * alphabetical order, so it mostly reads as a volume chart with colour on it:
 * Sidwaya's 1,167 articles dwarf Plume Libre's 62 regardless of what either
 * says. Ranking by a mean index instead makes the editorial variation legible
 * — and the interval is what keeps that honest, because the titles with the
 * most extreme means are usually the ones with the fewest articles.
 */

import type { Article } from '$lib/types/data';
import { getJournalName } from '$lib/utils/format';

/** Which measure to rank newspapers by. */
export type RankingMeasure = 'polarity' | 'subjectivity' | 'centrality';

/**
 * Scale definitions per measure.
 *
 * Polarity is centred on zero so the index reads as "net favourability"
 * (negative = unfavourable coverage); the other two keep their natural 1-5
 * scale because there is no meaningful midpoint to subtract.
 */
export const MEASURE_SCALES: Record<RankingMeasure, { min: number; max: number; neutral: number }> =
	{
		polarity: { min: -2, max: 2, neutral: 0 },
		subjectivity: { min: 1, max: 5, neutral: 3 },
		centrality: { min: 1, max: 5, neutral: 3 }
	};

const POLARITY_INDEX: Record<string, number> = {
	'Très négatif': -2,
	Négatif: -1,
	Neutre: 0,
	Positif: 1,
	'Très positif': 2
	// 'Non applicable' deliberately absent: a refusal to rate is not a neutral
	// rating, and averaging it in as 0 would drag every title toward the middle
	// in proportion to how often its articles were unratable.
};

const CENTRALITY_INDEX: Record<string, number> = {
	'Non abordé': 1,
	Marginal: 2,
	Secondaire: 3,
	Central: 4,
	'Très central': 5
};

/** Numeric value of an article on the chosen measure, or null to skip it. */
export function getMeasureValue(article: Article, measure: RankingMeasure): number | null {
	const analysis = article.sentiment_analysis;
	if (!analysis) return null;

	switch (measure) {
		case 'polarity': {
			const label = analysis.polarite;
			return label && label in POLARITY_INDEX ? POLARITY_INDEX[label] : null;
		}
		case 'centrality': {
			const label = analysis.centralite_islam_musulmans;
			return label && label in CENTRALITY_INDEX ? CENTRALITY_INDEX[label] : null;
		}
		case 'subjectivity': {
			const score = analysis.subjectivite_score;
			return typeof score === 'number' && score >= 1 && score <= 5 ? score : null;
		}
	}
}

export interface NewspaperRank {
	newspaper: string;
	/** Mean of the measure across this newspaper's rated articles. */
	mean: number;
	/** Half-width of the 95% confidence interval; 0 when n < 2. */
	confidence: number;
	/** Rated articles (the CI's n, not the newspaper's total). */
	n: number;
	/** Sample standard deviation; 0 when n < 2. */
	standardDeviation: number;
}

/**
 * Mean measure per newspaper with a 95% confidence interval.
 *
 * Uses the normal approximation (1.96 × SEM) rather than a t-distribution: at
 * the default 30-article threshold the two differ by under 4% of the interval
 * width, far smaller than the sampling issues inherent in a press corpus. Titles below the threshold are excluded rather than drawn with
 * enormous whiskers, because a mean of +1.00 from three articles invites a
 * reading it cannot support.
 *
 * Sorted ascending by mean, which is the order a dot plot wants.
 */
export function rankNewspapers(
	articles: Article[],
	measure: RankingMeasure,
	minArticles = 30
): NewspaperRank[] {
	const groups = new Map<string, number[]>();

	for (const article of articles) {
		const value = getMeasureValue(article, measure);
		if (value === null) continue;

		const newspaper = getJournalName(article);
		if (!newspaper) continue;

		const existing = groups.get(newspaper);
		if (existing) {
			existing.push(value);
		} else {
			groups.set(newspaper, [value]);
		}
	}

	const ranks: NewspaperRank[] = [];

	for (const [newspaper, values] of groups) {
		const n = values.length;
		if (n < minArticles) continue;

		const mean = values.reduce((sum, v) => sum + v, 0) / n;
		const variance = n > 1 ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1) : 0;
		const standardDeviation = Math.sqrt(variance);

		ranks.push({
			newspaper,
			mean,
			standardDeviation,
			confidence: n > 1 ? 1.96 * (standardDeviation / Math.sqrt(n)) : 0,
			n
		});
	}

	return ranks.sort((a, b) => a.mean - b.mean);
}

/** Newspapers excluded by the threshold, for an honest "n titles omitted" note. */
export function countExcludedNewspapers(
	articles: Article[],
	measure: RankingMeasure,
	minArticles = 30
): number {
	const counts = new Map<string, number>();

	for (const article of articles) {
		if (getMeasureValue(article, measure) === null) continue;
		const newspaper = getJournalName(article);
		if (!newspaper) continue;
		counts.set(newspaper, (counts.get(newspaper) ?? 0) + 1);
	}

	let excluded = 0;
	for (const count of counts.values()) {
		if (count < minArticles) excluded++;
	}
	return excluded;
}
