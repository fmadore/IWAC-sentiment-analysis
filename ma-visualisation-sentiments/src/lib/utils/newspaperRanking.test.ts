import { describe, it, expect } from 'vitest';
import type { Article, PolarityValue } from '$lib/types/data';
import {
	getMeasureValue,
	rankNewspapers,
	countExcludedNewspapers,
	MEASURE_SCALES
} from './newspaperRanking';

function article(
	newspaper: string,
	analysis: Partial<NonNullable<Article['sentiment_analysis']>> | null
): Article {
	return {
		'o:id': Math.random(),
		Newspaper: newspaper,
		journal_source: newspaper,
		dataset_id: 'chatgpt',
		sentiment_analysis: analysis
			? {
					centralite_islam_musulmans: null,
					centralite_justification: null,
					subjectivite_score: null,
					subjectivite_justification: null,
					polarite: null,
					polarite_justification: null,
					...analysis
				}
			: null
	} as Article;
}

/** n copies of one newspaper's articles at a fixed polarity. */
function repeat(newspaper: string, polarite: PolarityValue, count: number): Article[] {
	return Array.from({ length: count }, () => article(newspaper, { polarite }));
}

describe('getMeasureValue', () => {
	it('centres polarity on zero', () => {
		expect(getMeasureValue(article('J', { polarite: 'Neutre' }), 'polarity')).toBe(0);
		expect(getMeasureValue(article('J', { polarite: 'Très positif' }), 'polarity')).toBe(2);
		expect(getMeasureValue(article('J', { polarite: 'Très négatif' }), 'polarity')).toBe(-2);
	});

	it('excludes "Non applicable" from polarity rather than scoring it neutral', () => {
		// Scoring a refusal as 0 would pull a title toward the middle in
		// proportion to how often its articles were unratable.
		expect(getMeasureValue(article('J', { polarite: 'Non applicable' }), 'polarity')).toBeNull();
	});

	it('keeps subjectivity and centrality on their 1-5 scales', () => {
		expect(getMeasureValue(article('J', { subjectivite_score: 4 }), 'subjectivity')).toBe(4);
		expect(
			getMeasureValue(article('J', { centralite_islam_musulmans: 'Très central' }), 'centrality')
		).toBe(5);
		expect(
			getMeasureValue(article('J', { centralite_islam_musulmans: 'Non abordé' }), 'centrality')
		).toBe(1);
	});

	it('returns null for unanalysed articles and out-of-range scores', () => {
		expect(getMeasureValue(article('J', null), 'polarity')).toBeNull();
		expect(
			getMeasureValue(article('J', { subjectivite_score: 0 as never }), 'subjectivity')
		).toBeNull();
		expect(
			getMeasureValue(article('J', { subjectivite_score: 9 as never }), 'subjectivity')
		).toBeNull();
		expect(getMeasureValue(article('J', { polarite: 'inventé' as never }), 'polarity')).toBeNull();
	});
});

describe('rankNewspapers', () => {
	it('computes the mean per newspaper and sorts ascending', () => {
		const articles = [
			...repeat('Positive Daily', 'Positif', 30),
			...repeat('Negative Daily', 'Négatif', 30)
		];
		const ranks = rankNewspapers(articles, 'polarity');

		expect(ranks.map((r) => r.newspaper)).toEqual(['Negative Daily', 'Positive Daily']);
		expect(ranks[0].mean).toBeCloseTo(-1);
		expect(ranks[1].mean).toBeCloseTo(1);
	});

	it('gives a zero-width interval when every article agrees', () => {
		const ranks = rankNewspapers(repeat('J', 'Positif', 40), 'polarity');
		expect(ranks[0].standardDeviation).toBe(0);
		expect(ranks[0].confidence).toBe(0);
	});

	it('widens the interval as the spread grows', () => {
		const tight = rankNewspapers(
			[...repeat('J', 'Positif', 20), ...repeat('J', 'Neutre', 20)],
			'polarity'
		)[0];
		const wide = rankNewspapers(
			[...repeat('K', 'Très positif', 20), ...repeat('K', 'Très négatif', 20)],
			'polarity'
		)[0];

		expect(wide.confidence).toBeGreaterThan(tight.confidence);
	});

	it('narrows the interval as n grows at a fixed spread', () => {
		const small = rankNewspapers(
			[...repeat('J', 'Positif', 15), ...repeat('J', 'Négatif', 15)],
			'polarity'
		)[0];
		const large = rankNewspapers(
			[...repeat('K', 'Positif', 150), ...repeat('K', 'Négatif', 150)],
			'polarity'
		)[0];

		expect(large.confidence).toBeLessThan(small.confidence);
		expect(large.mean).toBeCloseTo(small.mean);
	});

	it('excludes newspapers below the article threshold', () => {
		// A mean of +2.00 from three articles invites a reading it cannot support.
		const articles = [...repeat('Big', 'Positif', 40), ...repeat('Tiny', 'Très positif', 3)];
		const ranks = rankNewspapers(articles, 'polarity');

		expect(ranks.map((r) => r.newspaper)).toEqual(['Big']);
	});

	it('honours a custom threshold', () => {
		const articles = [...repeat('Big', 'Positif', 40), ...repeat('Small', 'Neutre', 10)];
		expect(rankNewspapers(articles, 'polarity', 5)).toHaveLength(2);
		expect(rankNewspapers(articles, 'polarity', 20)).toHaveLength(1);
	});

	it('counts only rated articles towards n, not the newspaper total', () => {
		const articles = [
			...repeat('J', 'Positif', 30),
			...Array.from({ length: 50 }, () => article('J', { polarite: 'Non applicable' }))
		];
		expect(rankNewspapers(articles, 'polarity')[0].n).toBe(30);
	});

	it('returns nothing when no article can be rated', () => {
		expect(rankNewspapers([article('J', null)], 'polarity')).toEqual([]);
		expect(rankNewspapers([], 'polarity')).toEqual([]);
	});
});

describe('countExcludedNewspapers', () => {
	it('counts titles held back by the threshold', () => {
		const articles = [
			...repeat('Big', 'Positif', 40),
			...repeat('Tiny', 'Neutre', 3),
			...repeat('Small', 'Négatif', 12)
		];
		expect(countExcludedNewspapers(articles, 'polarity')).toBe(2);
	});

	it('ignores titles with nothing rated at all', () => {
		const articles = [...repeat('Big', 'Positif', 40), article('Empty', null)];
		expect(countExcludedNewspapers(articles, 'polarity')).toBe(0);
	});
});

describe('MEASURE_SCALES', () => {
	it('centres polarity on zero and the 1-5 measures on 3', () => {
		expect(MEASURE_SCALES.polarity.neutral).toBe(0);
		expect(MEASURE_SCALES.subjectivity.neutral).toBe(3);
		expect(MEASURE_SCALES.centrality.neutral).toBe(3);
	});
});
