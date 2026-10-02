import type { Article } from '$lib/types/data';
import { CENTRALITY_ORDER, POLARITY_ORDER } from '$lib/domain/sentimentContract';
import { extractYear } from './chartAggregators';
import { getJournalName } from './format';

export type HistoricalMeasure = 'negative' | 'central' | 'subjective';
export type HistoricalPeriod = 'year' | 'decade';
export type HistoricalFacet = 'all' | 'country' | 'journal';
export type HistoricalCohort = 'common' | 'available';

export interface CorpusFacets {
	countries: readonly string[];
	journals: readonly string[];
}

/** Corpus membership must not depend on the selected model's sentiment labels. */
export function corpusSlice(articles: readonly Article[], filters: CorpusFacets): Article[] {
	const seen = new Set<string>();
	return articles.filter((article) => {
		const id = String(article['o:id']);
		if (seen.has(id)) return false;
		seen.add(id);
		return (
			(!filters.countries.length || filters.countries.includes(article.Country ?? '')) &&
			(!filters.journals.length || filters.journals.includes(getJournalName(article)))
		);
	});
}

/** null means no applicable rating; false is a valid rating outside the target category. */
export function targetRating(
	article: Article | undefined,
	measure: HistoricalMeasure
): boolean | null {
	const analysis = article?.sentiment_analysis;
	if (!analysis) return null;
	if (measure === 'subjective') {
		const score = analysis.subjectivite_score;
		return typeof score === 'number' && Number.isInteger(score) && score >= 1 && score <= 5
			? score >= 4
			: null;
	}
	const score =
		measure === 'negative'
			? analysis.polarite
				? POLARITY_ORDER[analysis.polarite]
				: undefined
			: analysis.centralite_islam_musulmans
				? CENTRALITY_ORDER[analysis.centralite_islam_musulmans]
				: undefined;
	if (typeof score !== 'number' || score < 1) return null;
	return measure === 'negative' ? score <= 2 : score >= 4;
}

export function periodOf(year: number, period: HistoricalPeriod): number {
	return period === 'decade' ? Math.floor(year / 10) * 10 : year;
}

function periodRange(periods: Iterable<number>, step: number): number[] {
	const values = [...periods];
	if (!values.length) return [];
	const minimum = Math.min(...values);
	const maximum = Math.max(...values);
	return Array.from(
		{ length: Math.floor((maximum - minimum) / step) + 1 },
		(_, i) => minimum + i * step
	);
}

export interface HistoricalBucket {
	period: number;
	/** Number of collected articles before rating exclusions. */
	collected: number;
	n: number[];
	target: number[];
	shares: Array<number | null>;
	/** Descriptive model range, never a confidence interval. */
	minimum: number | null;
	maximum: number | null;
}

export interface HistoricalGroup {
	key: string;
	collected: number;
	buckets: HistoricalBucket[];
}

/** Compare models on an identical per-dimension cohort, or explicitly separate available cases. */
export function historicalTrends(
	datasets: Readonly<Record<string, readonly Article[] | undefined>>,
	modelIds: readonly string[],
	options: CorpusFacets & {
		measure: HistoricalMeasure;
		period: HistoricalPeriod;
		facet: HistoricalFacet;
		cohort: HistoricalCohort;
		minimumCount: number;
	}
): { groups: HistoricalGroup[]; collected: number; undated: number; common: number } {
	const base = corpusSlice(datasets[modelIds[0]] ?? [], options);
	const maps = modelIds.map(
		(model) => new Map((datasets[model] ?? []).map((a) => [String(a['o:id']), a]))
	);
	const grouped = new Map<string, Map<number, HistoricalBucket>>();
	let undated = 0;
	let common = 0;
	for (const article of base) {
		const year = extractYear(article);
		if (year === null) {
			undated++;
			continue;
		}
		const period = periodOf(Number(year), options.period);
		const key =
			options.facet === 'all'
				? ''
				: options.facet === 'country'
					? (article.Country ?? '')
					: getJournalName(article);
		let group = grouped.get(key);
		if (!group) {
			group = new Map();
			grouped.set(key, group);
		}
		let bucket = group.get(period);
		if (!bucket) {
			bucket = {
				period,
				collected: 0,
				n: modelIds.map(() => 0),
				target: modelIds.map(() => 0),
				shares: [],
				minimum: null,
				maximum: null
			};
			group.set(period, bucket);
		}
		bucket.collected++;
		const ratings = maps.map((map) =>
			targetRating(map.get(String(article['o:id'])), options.measure)
		);
		const complete = ratings.length > 0 && ratings.every((rating) => rating !== null);
		if (complete) common++;
		if (options.cohort === 'common' && !complete) continue;
		ratings.forEach((rating, index) => {
			if (rating === null) return;
			bucket.n[index]++;
			if (rating) bucket.target[index]++;
		});
	}
	const periods = periodRange(
		[...grouped.values()].flatMap((group) => [...group.keys()]),
		options.period === 'decade' ? 10 : 1
	);
	const groups = [...grouped]
		.map(([key, group]) => {
			const buckets = periods.map((period) => {
				const bucket = group.get(period) ?? {
					period,
					collected: 0,
					n: modelIds.map(() => 0),
					target: modelIds.map(() => 0),
					shares: [],
					minimum: null,
					maximum: null
				};
				bucket.shares = bucket.n.map((n, i) =>
					n >= options.minimumCount && n > 0 ? bucket.target[i] / n : null
				);
				if (bucket.shares.length && bucket.shares.every((share) => share !== null)) {
					bucket.minimum = Math.min(...(bucket.shares as number[]));
					bucket.maximum = Math.max(...(bucket.shares as number[]));
				}
				return bucket;
			});
			return { key, buckets, collected: buckets.reduce((n, bucket) => n + bucket.collected, 0) };
		})
		.sort((a, b) => b.collected - a.collected || a.key.localeCompare(b.key));
	return { groups, collected: base.length, undated, common };
}

export interface NewspaperTimelineRow {
	journal: string;
	total: number;
	counts: number[];
}

/** One metadata record per article; empty cells mean zero collected items, not zero publication. */
export function newspaperTimeline(articles: readonly Article[], period: HistoricalPeriod) {
	const counts = new Map<string, Map<number, number>>();
	const seen = new Set<string>();
	let undated = 0;
	for (const article of articles) {
		const id = String(article['o:id']);
		if (seen.has(id)) continue;
		seen.add(id);
		const year = extractYear(article);
		if (year === null) {
			undated++;
			continue;
		}
		const key = periodOf(Number(year), period);
		const journal = getJournalName(article);
		let row = counts.get(journal);
		if (!row) {
			row = new Map();
			counts.set(journal, row);
		}
		row.set(key, (row.get(key) ?? 0) + 1);
	}
	const periods = periodRange(
		[...counts.values()].flatMap((row) => [...row.keys()]),
		period === 'decade' ? 10 : 1
	);
	const rows: NewspaperTimelineRow[] = [...counts]
		.map(([journal, counts]) => {
			const values = periods.map((year) => counts.get(year) ?? 0);
			return { journal, counts: values, total: values.reduce((a, b) => a + b, 0) };
		})
		.sort((a, b) => b.total - a.total || a.journal.localeCompare(b.journal));
	return { rows, periods, undated, total: rows.reduce((n, row) => n + row.total, 0) };
}
