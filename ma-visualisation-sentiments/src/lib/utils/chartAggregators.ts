/**
 * Chart data aggregators
 *
 * Pure helpers shared by the per-journal sentiment/subjectivity charts.
 * Extracted from the chart components so the grouping logic is unit-tested
 * once instead of being copy-pasted into each `$derived.by` block.
 */
import type { Article } from '$lib/types/data';
import { getJournalName } from '$lib/utils/format';
import { publicationDateToHijri } from '$lib/utils/hijri';

export interface JournalDimensionAggregation {
	/** journal -> { frenchLabel -> count }, every label pre-seeded to 0 */
	newspaperCounts: Record<string, Record<string, number>>;
	/** sorted list of journals that had at least one analysed article */
	newspaperList: string[];
	/** number of articles that contributed a value */
	articlesAnalyzed: number;
}

/**
 * Group articles by journal and by a sentiment dimension label.
 *
 * `getKey` returns the French dimension label for an article, or `null` to
 * skip it (e.g. the dimension was not analysed). Counts are only incremented
 * for keys present in `frenchLabels`, matching the original per-chart logic.
 */
export function aggregateByJournalAndDimension(
	articles: Article[],
	frenchLabels: string[],
	getKey: (article: Article) => string | null
): JournalDimensionAggregation {
	const newspaperCounts: Record<string, Record<string, number>> = {};
	const uniqueNewspapers = new Set<string>();
	let articlesAnalyzed = 0;

	articles.forEach((article) => {
		const key = getKey(article);
		if (key === null) return;

		const journal = getJournalName(article);
		uniqueNewspapers.add(journal);

		if (!newspaperCounts[journal]) {
			newspaperCounts[journal] = Object.fromEntries(frenchLabels.map((l) => [l, 0]));
		}
		if (Object.prototype.hasOwnProperty.call(newspaperCounts[journal], key)) {
			newspaperCounts[journal][key]++;
		}
		articlesAnalyzed++;
	});

	return {
		newspaperCounts,
		newspaperList: Array.from(uniqueNewspapers).sort(),
		articlesAnalyzed
	};
}

/**
 * Extract the 4-digit publication year of an article, or `null` when the
 * publication date is missing. Matches the inline `publication_date` guards
 * previously copy-pasted into the year-bucketing chart loops.
 */
export function extractYear(article: Article): string | null {
	if (!article.publication_date) return null;
	return article.publication_date.substring(0, 4);
}

export interface YearDimensionAggregation {
	/** year -> { frenchLabel -> count }, every label pre-seeded to 0 */
	yearlyCounts: Record<string, Record<string, number>>;
	/** sorted list of years that had at least one counted article */
	years: string[];
	/** number of articles that contributed a value */
	articlesAnalyzed: number;
}

/**
 * Group articles by publication year and by a sentiment dimension label.
 *
 * Mirrors {@link aggregateByJournalAndDimension} but buckets by year. Unlike
 * the journal variant, articles whose key is not in `frenchLabels` are skipped
 * entirely (not counted), matching the trends charts' original inline loops.
 */
export function aggregateByYearAndDimension(
	articles: Article[],
	frenchLabels: string[],
	getKey: (article: Article) => string | null
): YearDimensionAggregation {
	const yearlyCounts: Record<string, Record<string, number>> = {};
	let articlesAnalyzed = 0;

	articles.forEach((article) => {
		const year = extractYear(article);
		if (year === null) return;

		const key = getKey(article);
		if (key === null || !frenchLabels.includes(key)) return;

		if (!yearlyCounts[year]) {
			yearlyCounts[year] = Object.fromEntries(frenchLabels.map((l) => [l, 0]));
		}
		yearlyCounts[year][key]++;
		articlesAnalyzed++;
	});

	return {
		yearlyCounts,
		years: Object.keys(yearlyCounts).sort(),
		articlesAnalyzed
	};
}

/** One share-mode datum: percentage of the year's total, plus the raw count. */
export interface SharePoint {
	/** 0-100 percentage of the bucket's total */
	value: number;
	/** Underlying article count, carried through for tooltips */
	rawCount: number;
}

/**
 * Convert per-year dimension counts into per-year percentage shares.
 *
 * Denominators use only the labels the caller plots, so the resulting bands sum
 * to exactly 100% rather than to some fraction of a wider total that includes
 * buckets the chart doesn't draw. A year with no articles in any plotted label
 * yields 0% across the board instead of NaN.
 */
export function computeDimensionShares(
	yearlyCounts: Record<string, Record<string, number>>,
	years: string[],
	frenchLabels: string[]
): Record<string, Record<string, SharePoint>> {
	const shares: Record<string, Record<string, SharePoint>> = {};

	years.forEach((year) => {
		const counts = yearlyCounts[year] ?? {};
		const total = frenchLabels.reduce((sum, label) => sum + (counts[label] || 0), 0);

		shares[year] = Object.fromEntries(
			frenchLabels.map((label) => {
				const rawCount = counts[label] || 0;
				return [label, { value: total > 0 ? (rawCount / total) * 100 : 0, rawCount }];
			})
		);
	});

	return shares;
}

export interface CountryYearAggregation {
	/** country -> { year -> count } */
	countryYearCounts: Record<string, Record<string, number>>;
	/** countries in first-seen order (matches the original inline loop) */
	countries: string[];
	/** sorted union of all years seen across countries */
	years: string[];
	/** number of articles that contributed a value */
	articlesAnalyzed: number;
}

/**
 * Count articles per country per publication year (VolumeChart's shape).
 * Articles missing either the publication date or the country are skipped.
 */
export function aggregateByCountryAndYear(articles: Article[]): CountryYearAggregation {
	const countryYearCounts: Record<string, Record<string, number>> = {};
	let articlesAnalyzed = 0;

	articles.forEach((article) => {
		const year = extractYear(article);
		if (year === null || !article.Country) return;

		const country = article.Country;
		if (!countryYearCounts[country]) {
			countryYearCounts[country] = {};
		}
		countryYearCounts[country][year] = (countryYearCounts[country][year] || 0) + 1;
		articlesAnalyzed++;
	});

	const countries = Object.keys(countryYearCounts);
	const years = Array.from(
		new Set(countries.flatMap((country) => Object.keys(countryYearCounts[country])))
	).sort();

	return { countryYearCounts, countries, years, articlesAnalyzed };
}

/** Numeric subjectivity score (1-5) to the French label used in the data. */
export function getSubjectivityLabel(score: number | null | undefined): string {
	switch (score) {
		case 1:
			return 'Factuel';
		case 2:
			return 'Plutôt factuel';
		case 3:
			return 'Mixte';
		case 4:
			return 'Plutôt subjectif';
		case 5:
			return 'Subjectif';
		default:
			return 'Non applicable';
	}
}

export interface HijriMonthBucket {
	/** 1-12, Muharram through Dhu al-Hijjah. */
	month: number;
	count: number;
	/**
	 * Coverage index: 1.0 means this month holds exactly its even share of the
	 * corpus (1/12). Volume alone can't be read across months — the index is
	 * what makes "Ramadan carries 1.7x its share" legible.
	 */
	index: number;
	/** Mean centrality on the 1-5 scale, or null when nothing was analysed. */
	meanCentrality: number | null;
	/** Articles contributing to meanCentrality. */
	analyzed: number;
}

export interface HijriSeasonality {
	buckets: HijriMonthBucket[];
	/** Articles with a full date that could be converted. */
	total: number;
	/** Articles skipped for want of a usable publication date. */
	undated: number;
}

/**
 * Bucket articles by Hijri month, with a coverage index and mean centrality.
 *
 * Mean centrality rides along because the interesting result is not just that
 * more gets published in Ramadan — it is that what gets published is also more
 * centrally about Islam. Two separate charts would make that correlation the
 * reader's job to spot.
 */
export function aggregateByHijriMonth(
	articles: Article[],
	centralityScores: Record<string, number>
): HijriSeasonality {
	const counts = new Array<number>(12).fill(0);
	const centralitySums = new Array<number>(12).fill(0);
	const centralityCounts = new Array<number>(12).fill(0);
	let total = 0;
	let undated = 0;

	for (const article of articles) {
		const hijri = publicationDateToHijri(article.publication_date);
		if (!hijri) {
			undated++;
			continue;
		}

		const i = hijri.month - 1;
		counts[i]++;
		total++;

		const label = article.sentiment_analysis?.centralite_islam_musulmans;
		const score = label ? centralityScores[label] : undefined;
		if (score !== undefined) {
			centralitySums[i] += score;
			centralityCounts[i]++;
		}
	}

	const evenShare = total / 12;

	return {
		buckets: counts.map((count, i) => ({
			month: i + 1,
			count,
			index: evenShare > 0 ? count / evenShare : 0,
			meanCentrality: centralityCounts[i] > 0 ? centralitySums[i] / centralityCounts[i] : null,
			analyzed: centralityCounts[i]
		})),
		total,
		undated
	};
}

export interface DisagreementBucket {
	/** Decade label ('1990s') or country name. */
	key: string;
	/** Mean total discrepancy per compared article. */
	meanTotal: number;
	/** Percentage of the bucket flagged as a significant conflict. */
	conflictRate: number;
	n: number;
}

/** Minimal shape the disagreement aggregation needs from a comparison row. */
export interface DisagreementInput {
	key: string | null;
	totalDiff: number;
	hasConflict: boolean;
}

/**
 * Mean discrepancy per bucket, dropping buckets too small to mean anything.
 *
 * The comparison view reports one corpus-wide mean, which cannot distinguish
 * "these models differ" from "these models differ about the 1970s". Bucketing
 * locates it. The minimum guards against a five-article bucket producing an
 * extreme mean that reads as a finding; what it dropped is surfaced in the UI
 * rather than silently truncated.
 */
export function aggregateDisagreement(
	rows: DisagreementInput[],
	minPerBucket = 20
): DisagreementBucket[] {
	const groups = new Map<string, { total: number; conflicts: number; n: number }>();

	for (const row of rows) {
		if (row.key === null) continue;

		const entry = groups.get(row.key) ?? { total: 0, conflicts: 0, n: 0 };
		entry.total += row.totalDiff;
		entry.conflicts += row.hasConflict ? 1 : 0;
		entry.n++;
		groups.set(row.key, entry);
	}

	const buckets: DisagreementBucket[] = [];
	for (const [key, entry] of groups) {
		if (entry.n < minPerBucket) continue;
		buckets.push({
			key,
			meanTotal: entry.total / entry.n,
			conflictRate: (entry.conflicts / entry.n) * 100,
			n: entry.n
		});
	}

	return buckets;
}

/** Decade label ('1990s') for a publication date, or null when undatable. */
export function bucketDecade(publicationDate: string | undefined): string | null {
	if (!publicationDate || publicationDate.length < 4) return null;
	const year = Number(publicationDate.slice(0, 4));
	if (!Number.isInteger(year)) return null;
	return `${Math.floor(year / 10) * 10}s`;
}
