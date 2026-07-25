import { describe, it, expect } from 'vitest';
import type { Article } from '$lib/types/data';
import {
	aggregateByJournalAndDimension,
	aggregateByYearAndDimension,
	aggregateByCountryAndYear,
	computeDimensionShares,
	extractYear,
	getSubjectivityLabel
} from './chartAggregators';

function article(
	id: number,
	journal: string,
	polarite: string | null,
	overrides: Partial<Article> = {}
): Article {
	return {
		'o:id': id,
		journal_source: journal,
		Newspaper: journal,
		Country: 'Bénin',
		sentiment_analysis: polarite
			? {
					centralite_islam_musulmans: 'Central',
					centralite_justification: null,
					subjectivite_score: 3,
					subjectivite_justification: null,
					polarite,
					polarite_justification: null
				}
			: null,
		dataset_id: 'chatgpt',
		...overrides
	};
}

const labels = ['Positif', 'Neutre', 'Négatif'];

describe('aggregateByJournalAndDimension', () => {
	it('groups counts by journal with every label pre-seeded', () => {
		const result = aggregateByJournalAndDimension(
			[article(1, 'A', 'Positif'), article(2, 'A', 'Neutre'), article(3, 'B', 'Positif')],
			labels,
			(a) => a.sentiment_analysis?.polarite ?? null
		);
		expect(result.newspaperList).toEqual(['A', 'B']);
		expect(result.articlesAnalyzed).toBe(3);
		expect(result.newspaperCounts.A).toEqual({ Positif: 1, Neutre: 1, Négatif: 0 });
		expect(result.newspaperCounts.B).toEqual({ Positif: 1, Neutre: 0, Négatif: 0 });
	});

	it('skips articles whose key resolver returns null', () => {
		const result = aggregateByJournalAndDimension(
			[article(1, 'A', null), article(2, 'A', 'Positif')],
			labels,
			(a) => a.sentiment_analysis?.polarite ?? null
		);
		expect(result.articlesAnalyzed).toBe(1);
		expect(result.newspaperList).toEqual(['A']);
	});

	it('ignores keys not present in the label set', () => {
		const result = aggregateByJournalAndDimension(
			[article(1, 'A', 'Inconnu')],
			labels,
			(a) => a.sentiment_analysis?.polarite ?? null
		);
		// counted as analysed (journal seen) but no label bucket incremented
		expect(result.articlesAnalyzed).toBe(1);
		expect(result.newspaperCounts.A).toEqual({ Positif: 0, Neutre: 0, Négatif: 0 });
	});

	it('sorts the journal list', () => {
		const result = aggregateByJournalAndDimension(
			[article(1, 'Zebra', 'Positif'), article(2, 'Alpha', 'Positif')],
			labels,
			(a) => a.sentiment_analysis?.polarite ?? null
		);
		expect(result.newspaperList).toEqual(['Alpha', 'Zebra']);
	});
});

describe('extractYear', () => {
	it('returns the 4-digit year of the publication date', () => {
		expect(extractYear(article(1, 'A', 'Positif', { publication_date: '1998-05-12' }))).toBe(
			'1998'
		);
	});

	it('returns null when the publication date is missing or empty', () => {
		expect(extractYear(article(1, 'A', 'Positif'))).toBeNull();
		expect(extractYear(article(2, 'A', 'Positif', { publication_date: '' }))).toBeNull();
	});
});

describe('aggregateByYearAndDimension', () => {
	const getPolarity = (a: Article) => a.sentiment_analysis?.polarite ?? null;

	it('groups counts by year with every label pre-seeded', () => {
		const result = aggregateByYearAndDimension(
			[
				article(1, 'A', 'Positif', { publication_date: '2001-01-01' }),
				article(2, 'A', 'Neutre', { publication_date: '2001-06-30' }),
				article(3, 'B', 'Positif', { publication_date: '2003-12-31' })
			],
			labels,
			getPolarity
		);
		expect(result.years).toEqual(['2001', '2003']);
		expect(result.articlesAnalyzed).toBe(3);
		expect(result.yearlyCounts['2001']).toEqual({ Positif: 1, Neutre: 1, Négatif: 0 });
		expect(result.yearlyCounts['2003']).toEqual({ Positif: 1, Neutre: 0, Négatif: 0 });
	});

	it('skips articles without a publication date or with a null key', () => {
		const result = aggregateByYearAndDimension(
			[
				article(1, 'A', 'Positif'), // no publication_date
				article(2, 'A', null, { publication_date: '2001-01-01' }), // null key
				article(3, 'A', 'Positif', { publication_date: '2001-01-01' })
			],
			labels,
			getPolarity
		);
		expect(result.articlesAnalyzed).toBe(1);
		expect(result.years).toEqual(['2001']);
	});

	it('skips keys not present in the label set entirely (not counted)', () => {
		const result = aggregateByYearAndDimension(
			[article(1, 'A', 'Inconnu', { publication_date: '2001-01-01' })],
			labels,
			getPolarity
		);
		expect(result.articlesAnalyzed).toBe(0);
		expect(result.years).toEqual([]);
	});

	it('sorts the year list', () => {
		const result = aggregateByYearAndDimension(
			[
				article(1, 'A', 'Positif', { publication_date: '2010-01-01' }),
				article(2, 'A', 'Positif', { publication_date: '1995-01-01' })
			],
			labels,
			getPolarity
		);
		expect(result.years).toEqual(['1995', '2010']);
	});
});

describe('aggregateByCountryAndYear', () => {
	it('counts articles per country per year', () => {
		const result = aggregateByCountryAndYear([
			article(1, 'A', 'Positif', { publication_date: '2001-01-01', Country: 'Bénin' }),
			article(2, 'A', 'Positif', { publication_date: '2001-02-02', Country: 'Bénin' }),
			article(3, 'B', 'Positif', { publication_date: '2003-03-03', Country: 'Togo' })
		]);
		expect(result.countries).toEqual(['Bénin', 'Togo']);
		expect(result.years).toEqual(['2001', '2003']);
		expect(result.articlesAnalyzed).toBe(3);
		expect(result.countryYearCounts['Bénin']).toEqual({ '2001': 2 });
		expect(result.countryYearCounts['Togo']).toEqual({ '2003': 1 });
	});

	it('skips articles missing the date or the country', () => {
		const result = aggregateByCountryAndYear([
			article(1, 'A', 'Positif', { Country: 'Bénin' }), // no date
			article(2, 'A', 'Positif', { publication_date: '2001-01-01', Country: undefined }),
			article(3, 'A', 'Positif', { publication_date: '2001-01-01', Country: 'Bénin' })
		]);
		expect(result.articlesAnalyzed).toBe(1);
		expect(result.countries).toEqual(['Bénin']);
	});

	it('keeps countries in first-seen order and sorts the year union', () => {
		const result = aggregateByCountryAndYear([
			article(1, 'A', 'Positif', { publication_date: '2010-01-01', Country: 'Togo' }),
			article(2, 'A', 'Positif', { publication_date: '1995-01-01', Country: 'Bénin' })
		]);
		expect(result.countries).toEqual(['Togo', 'Bénin']);
		expect(result.years).toEqual(['1995', '2010']);
	});
});

describe('getSubjectivityLabel', () => {
	it('maps 1-5 to French labels', () => {
		expect(getSubjectivityLabel(1)).toBe('Factuel');
		expect(getSubjectivityLabel(2)).toBe('Plutôt factuel');
		expect(getSubjectivityLabel(3)).toBe('Mixte');
		expect(getSubjectivityLabel(4)).toBe('Plutôt subjectif');
		expect(getSubjectivityLabel(5)).toBe('Subjectif');
	});

	it('falls back to "Non applicable" for null/unknown', () => {
		expect(getSubjectivityLabel(null)).toBe('Non applicable');
		expect(getSubjectivityLabel(undefined)).toBe('Non applicable');
		expect(getSubjectivityLabel(0)).toBe('Non applicable');
	});
});

describe('computeDimensionShares', () => {
	const labels = ['Positif', 'Neutre', 'Négatif'];

	it('converts counts to percentages that sum to 100 per year', () => {
		const shares = computeDimensionShares(
			{ '2010': { Positif: 3, Neutre: 1, Négatif: 0 } },
			['2010'],
			labels
		);

		expect(shares['2010'].Positif.value).toBeCloseTo(75);
		expect(shares['2010'].Neutre.value).toBeCloseTo(25);
		expect(shares['2010'].Négatif.value).toBe(0);

		const total = labels.reduce((sum, label) => sum + shares['2010'][label].value, 0);
		expect(total).toBeCloseTo(100);
	});

	it('carries the raw count alongside each percentage', () => {
		const shares = computeDimensionShares(
			{ '2010': { Positif: 3, Neutre: 1, Négatif: 0 } },
			['2010'],
			labels
		);

		expect(shares['2010'].Positif.rawCount).toBe(3);
		expect(shares['2010'].Négatif.rawCount).toBe(0);
	});

	it('normalizes against the plotted labels only, not other buckets present', () => {
		// 'Non applicable' is excluded from `labels`, so it must not dilute the
		// bands — otherwise they would visibly fail to reach 100%.
		const shares = computeDimensionShares(
			{ '2010': { Positif: 1, Neutre: 1, Négatif: 0, 'Non applicable': 98 } },
			['2010'],
			labels
		);

		expect(shares['2010'].Positif.value).toBeCloseTo(50);
		expect(shares['2010'].Neutre.value).toBeCloseTo(50);
	});

	it('yields 0% rather than NaN for a year with no plotted articles', () => {
		const shares = computeDimensionShares(
			{ '2010': { Positif: 0, Neutre: 0, Négatif: 0 } },
			['2010'],
			labels
		);

		labels.forEach((label) => {
			expect(shares['2010'][label].value).toBe(0);
			expect(Number.isNaN(shares['2010'][label].value)).toBe(false);
		});
	});

	it('tolerates a year missing from the counts map', () => {
		const shares = computeDimensionShares({}, ['1999'], labels);
		expect(shares['1999'].Positif).toEqual({ value: 0, rawCount: 0 });
	});
});
