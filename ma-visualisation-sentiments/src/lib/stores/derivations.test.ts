/**
 * Pure store derivations — unit tests
 *
 * These cover the exact logic the runes migration relies on: the article
 * filter predicate, journal aggregation, and the comparison build/filter/
 * statistics pipeline. The legacy derived stores and the new reactive
 * accessors both delegate here, so green tests prove behavioural parity.
 */
import { describe, it, expect } from 'vitest';
import type { Article, ComparisonData, DiscrepancyFilter } from '$lib/types/data';
import {
	filterArticles,
	computeAvailableJournals,
	calculateDiscrepancies,
	buildComparisonData,
	filterComparisons,
	computeComparisonStatistics
} from './derivations';

function article(id: number, overrides: Partial<Article> = {}): Article {
	return {
		'o:id': id,
		'o:title': `Article ${id}`,
		journal_source: 'Le Journal',
		Newspaper: 'Le Journal',
		Country: 'Bénin',
		publication_date: '2020-01-01',
		sentiment_analysis: {
			centralite_islam_musulmans: 'Central',
			centralite_justification: null,
			subjectivite_score: 3,
			subjectivite_justification: null,
			polarite: 'Neutre',
			polarite_justification: null
		},
		dataset_id: 'chatgpt',
		...overrides
	};
}

const noFilters = {
	countries: [],
	journals: [],
	polarities: [],
	subjectivities: [],
	centralities: []
};

describe('filterArticles', () => {
	it('returns everything when no filters are active', () => {
		const articles = [article(1), article(2)];
		expect(filterArticles(articles, noFilters)).toHaveLength(2);
	});

	it('filters by country', () => {
		const articles = [
			article(1, { Country: 'Bénin' }),
			article(2, { Country: 'Togo' })
		];
		const result = filterArticles(articles, { ...noFilters, countries: ['Togo'] });
		expect(result.map((a) => a['o:id'])).toEqual([2]);
	});

	it('filters by journal using getJournalName resolution', () => {
		const articles = [
			article(1, { journal_source: 'Fraternité' }),
			article(2, { journal_source: undefined, Newspaper: 'La Nation' })
		];
		expect(
			filterArticles(articles, { ...noFilters, journals: ['La Nation'] }).map((a) => a['o:id'])
		).toEqual([2]);
	});

	it('treats missing polarity as "Non applicable"', () => {
		const articles = [article(1, { sentiment_analysis: null })];
		expect(filterArticles(articles, { ...noFilters, polarities: ['Non applicable'] })).toHaveLength(
			1
		);
		expect(filterArticles(articles, { ...noFilters, polarities: ['Positif'] })).toHaveLength(0);
	});

	it('excludes articles with null subjectivity when a subjectivity filter is set', () => {
		const withScore = article(1, {
			sentiment_analysis: {
				centralite_islam_musulmans: 'Central',
				centralite_justification: null,
				subjectivite_score: 4,
				subjectivite_justification: null,
				polarite: 'Neutre',
				polarite_justification: null
			}
		});
		const withoutScore = article(2, {
			sentiment_analysis: {
				centralite_islam_musulmans: 'Central',
				centralite_justification: null,
				subjectivite_score: null,
				subjectivite_justification: null,
				polarite: 'Neutre',
				polarite_justification: null
			}
		});
		const result = filterArticles([withScore, withoutScore], {
			...noFilters,
			subjectivities: ['4']
		});
		expect(result.map((a) => a['o:id'])).toEqual([1]);
	});

	it('treats missing centrality as "Non abordé"', () => {
		const articles = [article(1, { sentiment_analysis: null })];
		expect(filterArticles(articles, { ...noFilters, centralities: ['Non abordé'] })).toHaveLength(
			1
		);
	});
});

describe('computeAvailableJournals', () => {
	it('returns sorted, de-duplicated journal names', () => {
		const articles = [
			article(1, { journal_source: 'Zebra' }),
			article(2, { journal_source: 'Alpha' }),
			article(3, { journal_source: 'Alpha' })
		];
		expect(computeAvailableJournals(articles, [])).toEqual(['Alpha', 'Zebra']);
	});

	it('scopes to selected countries when provided', () => {
		const articles = [
			article(1, { journal_source: 'Bénin Paper', Country: 'Bénin' }),
			article(2, { journal_source: 'Togo Paper', Country: 'Togo' })
		];
		expect(computeAvailableJournals(articles, ['Togo'])).toEqual(['Togo Paper']);
	});
});

const sa = (
	polarite: string,
	subjectivite_score: number | null,
	centralite: string
): Article['sentiment_analysis'] => ({
	centralite_islam_musulmans: centralite,
	centralite_justification: null,
	subjectivite_score,
	subjectivite_justification: null,
	polarite,
	polarite_justification: null
});

describe('calculateDiscrepancies', () => {
	it('returns zeros when either analysis is missing', () => {
		expect(calculateDiscrepancies(null, sa('Positif', 3, 'Central'))).toEqual({
			polarityDiff: 0,
			subjectivityDiff: 0,
			centralityDiff: 0,
			totalDiff: 0,
			hasConflict: false
		});
	});

	it('computes per-dimension and total differences', () => {
		const result = calculateDiscrepancies(
			sa('Très positif', 5, 'Très central'),
			sa('Très négatif', 1, 'Marginal')
		);
		expect(result.polarityDiff).toBe(4);
		expect(result.subjectivityDiff).toBe(4);
		expect(result.centralityDiff).toBe(3);
		expect(result.totalDiff).toBe(11);
		expect(result.hasConflict).toBe(true);
	});

	it('flags no conflict when every dimension differs by less than 3', () => {
		const result = calculateDiscrepancies(sa('Positif', 3, 'Central'), sa('Neutre', 2, 'Secondaire'));
		expect(result.hasConflict).toBe(false);
	});
});

function comparisonArticle(id: number, country = 'Bénin'): Article {
	return article(id, { Country: country });
}

describe('buildComparisonData', () => {
	const datasets: Record<string, Article[]> = {
		chatgpt: [comparisonArticle(1), comparisonArticle(2)],
		gemini: [comparisonArticle(1), comparisonArticle(3)]
	};

	it('returns an empty list outside comparison mode', () => {
		expect(buildComparisonData(datasets, false, 'chatgpt-gemini')).toEqual([]);
	});

	it('returns an empty list when a side of the pair is unloaded', () => {
		expect(buildComparisonData({ chatgpt: datasets.chatgpt }, true, 'chatgpt-gemini')).toEqual([]);
	});

	it('pairs articles present in both datasets by o:id', () => {
		const result = buildComparisonData(datasets, true, 'chatgpt-gemini');
		expect(result.map((c) => c.article['o:id'])).toEqual([1]);
		expect(result[0].modelAId).toBe('chatgpt');
		expect(result[0].modelBId).toBe('gemini');
	});
});

const baseFilter: DiscrepancyFilter = {
	minDifference: 0,
	maxDifference: 15,
	dimensions: ['polarity', 'subjectivity', 'centrality'],
	excludeNonApplicable: false
};

function comparison(id: number, polA: string, polB: string): ComparisonData {
	const modelA = sa(polA, 3, 'Central');
	const modelB = sa(polB, 3, 'Central');
	return {
		article: comparisonArticle(id),
		modelA,
		modelB,
		modelAId: 'chatgpt',
		modelBId: 'gemini',
		discrepancies: calculateDiscrepancies(modelA, modelB)
	};
}

describe('filterComparisons', () => {
	it('keeps only rows within the difference range', () => {
		const rows = [
			comparison(1, 'Très positif', 'Très négatif'), // polarityDiff 4
			comparison(2, 'Positif', 'Neutre') // polarityDiff 1
		];
		const result = filterComparisons(
			rows,
			{ ...baseFilter, minDifference: 3 },
			[],
			[]
		);
		expect(result.map((c) => c.article['o:id'])).toEqual([1]);
	});

	it('zeroes out dimensions that are not selected', () => {
		const rows = [comparison(1, 'Très positif', 'Très négatif')];
		const result = filterComparisons(
			rows,
			{ ...baseFilter, dimensions: ['subjectivity'] },
			[],
			[]
		);
		expect(result).toHaveLength(0); // polarity masked out, nothing left to differ
	});

	it('respects country filters', () => {
		const rows = [
			{ ...comparison(1, 'Très positif', 'Très négatif'), article: comparisonArticle(1, 'Togo') },
			comparison(2, 'Très positif', 'Très négatif')
		];
		const result = filterComparisons(rows, baseFilter, ['Togo'], []);
		expect(result.map((c) => c.article['o:id'])).toEqual([1]);
	});
});

describe('computeComparisonStatistics', () => {
	it('reports zeros for an empty filtered set', () => {
		const stats = computeComparisonStatistics([comparison(1, 'Positif', 'Positif')], [], [], []);
		expect(stats.totalArticles).toBe(1);
		expect(stats.totalDiscrepancies).toBe(0);
		expect(stats.averageDiscrepancy).toBe(0);
	});

	it('aggregates conflicts and averages over the filtered set', () => {
		const rows = [
			comparison(1, 'Très positif', 'Très négatif'),
			comparison(2, 'Positif', 'Neutre')
		];
		const stats = computeComparisonStatistics(rows, rows, [], []);
		expect(stats.totalArticles).toBe(2);
		expect(stats.totalDiscrepancies).toBe(2);
		expect(stats.polarityConflicts).toBe(2);
		expect(stats.highConflictArticles).toBe(1); // only the diff-of-4 row
		expect(stats.averageDiscrepancy).toBeCloseTo((4 + 1) / 2);
	});
});
