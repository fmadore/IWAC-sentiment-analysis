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

import type { Article } from '#lib/types/data.js';
import { getJournalName } from '#lib/utils/format.js';
import { countGroupsBelow, summarizeMean, wilsonInterval } from '#lib/utils/stats.js';

/**
 * Which measure to rank newspapers by.
 *
 * The first three are means of ordinal codes, which treats the steps of the
 * scale as equal distances — a convenience, not a property of the labels. The
 * proportion measures avoid that assumption: `positive` and `negative` are the
 * share of a title's applicable polarity ratings on that side of neutral
 * (Wilson 95% interval), and `net` is the first minus the second, i.e. the
 * mean of a −1/0/+1 sign (normal-approximation interval).
 */
export type RankingMeasure =
	'polarity' | 'subjectivity' | 'centrality' | 'positive' | 'negative' | 'net';

export const MEAN_MEASURES = ['polarity', 'subjectivity', 'centrality'] as const;
export const PROPORTION_MEASURES = ['positive', 'negative', 'net'] as const;

/** Whether the measure is a share (plotted as a percentage) rather than a mean code. */
export function isProportionMeasure(measure: RankingMeasure): boolean {
	return (PROPORTION_MEASURES as readonly string[]).includes(measure);
}

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
		centrality: { min: 1, max: 5, neutral: 3 },
		// Shares, as fractions. No neutral reference line is meaningful for a
		// one-sided share, so its "neutral" is the axis floor.
		positive: { min: 0, max: 1, neutral: 0 },
		negative: { min: 0, max: 1, neutral: 0 },
		net: { min: -1, max: 1, neutral: 0 }
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
		case 'positive':
		case 'negative':
		case 'net': {
			const label = analysis.polarite;
			if (!label || !(label in POLARITY_INDEX)) return null;
			const sign = Math.sign(POLARITY_INDEX[label]);
			if (measure === 'net') return sign;
			return (measure === 'positive' ? sign > 0 : sign < 0) ? 1 : 0;
		}
	}
}

export interface NewspaperRank {
	newspaper: string;
	/** Mean of the measure across this newspaper's rated articles (a share for `positive`/`negative`). */
	mean: number;
	/** Half-width of the normal 95% interval; 0 when n < 2. Symmetric measures only. */
	confidence: number;
	/** Lower bound of the 95% interval: Wilson for a share, mean − confidence otherwise. */
	low: number;
	/** Upper bound of the 95% interval. */
	high: number;
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
 * Sorted ascending by mean, which is the order a dot plot wants. Order among
 * titles whose intervals overlap is not interpretable, and it is one model's
 * ordering: other models of the same generation rank the same titles
 * differently.
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
		if (values.length < minArticles) continue;

		const summary = summarizeMean(values);
		const share =
			measure === 'positive' || measure === 'negative'
				? wilsonInterval(
						values.reduce((sum, value) => sum + value, 0),
						values.length
					)
				: null;
		ranks.push({
			newspaper,
			...summary,
			low: share ? share.low : summary.mean - summary.confidence,
			high: share ? share.high : summary.mean + summary.confidence
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
	const newspapers: string[] = [];
	for (const article of articles) {
		if (getMeasureValue(article, measure) === null) continue;
		const newspaper = getJournalName(article);
		if (newspaper) newspapers.push(newspaper);
	}
	return countGroupsBelow(newspapers, minArticles);
}
