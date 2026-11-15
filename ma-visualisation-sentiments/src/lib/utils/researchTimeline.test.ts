import { describe, expect, it } from 'vitest';
import type { Article } from '#lib/types/data.js';
import {
	corpusSlice,
	historicalTrends,
	newspaperTimeline,
	panelInCategory,
	targetRating
} from './researchTimeline';

function article(
	id: number,
	year: string | null,
	polarity: NonNullable<Article['sentiment_analysis']>['polarite'] = 'Neutre',
	journal = 'Paper'
): Article {
	return {
		'o:id': id,
		'o:title': String(id),
		dataset_id: 'luna',
		Country: 'Togo',
		Newspaper: journal,
		publication_date: year,
		sentiment_analysis: {
			polarite: polarity as NonNullable<Article['sentiment_analysis']>['polarite'],
			centralite_islam_musulmans: 'Central',
			subjectivite_score: 2,
			polarite_justification: null,
			centralite_justification: null,
			subjectivite_justification: null
		}
	};
}
const defaults = {
	measure: 'negative',
	period: 'year',
	facet: 'all',
	cohort: 'common',
	minimumCount: 1,
	countries: [],
	journals: []
} as const;

describe('historical model sensitivity', () => {
	it('joins by id and gives every model exactly the same applicable cohort', () => {
		const a = [
			article(1, '2000', 'Négatif'),
			article(2, '2000', 'Positif'),
			article(3, '2002', 'Négatif')
		];
		const b = [
			article(3, '2002', 'Neutre'),
			article(2, '2000', null),
			article(1, '2000', 'Positif')
		];
		const result = historicalTrends({ a, b }, ['a', 'b'], defaults);
		expect(result.common).toBe(2);
		expect(result.groups[0].buckets).toMatchObject([
			{ period: 2000, collected: 2, n: [1, 1], shares: [1, 0], minimum: 0, maximum: 1 },
			{ period: 2001, n: [0, 0], shares: [null, null] },
			{ period: 2002, n: [1, 1], shares: [1, 0] }
		]);
	});
	it('available cases retain separate denominators and non-applicable is not negative', () => {
		const result = historicalTrends(
			{
				a: [article(1, '2000', 'Négatif'), article(2, '2000')],
				b: [article(1, '2000', 'Non applicable'), article(2, '2000')]
			},
			['a', 'b'],
			{ ...defaults, cohort: 'available' }
		);
		expect(result.groups[0].buckets[0]).toMatchObject({
			n: [2, 1],
			target: [1, 0],
			shares: [0.5, 0]
		});
		expect(targetRating(article(1, '2000', 'Non applicable'), 'negative')).toBeNull();
	});
	it('keeps observed zero shares and masks small denominators rather than drawing zero', () => {
		const result = historicalTrends({ a: [article(1, '2000')] }, ['a'], {
			...defaults,
			minimumCount: 2
		});
		expect(result.groups[0].buckets[0]).toMatchObject({
			n: [1],
			target: [0],
			shares: [null],
			minimum: null
		});
		expect(
			historicalTrends({ a: [article(1, '2000')] }, ['a'], defaults).groups[0].buckets[0].shares
		).toEqual([0]);
	});
	it('supports three and five raters without pooling a model outside the supplied panel', () => {
		const data = Object.fromEntries(
			['a', 'b', 'c', 'd', 'e', 'archive'].map((model) => [model, [article(1, '2000')]])
		);
		for (const ids of [
			['a', 'b', 'c'],
			['a', 'b', 'c', 'd', 'e']
		]) {
			expect(historicalTrends(data, ids, defaults).groups[0].buckets[0].n).toEqual(
				ids.map(() => 1)
			);
		}
	});
	it('deduplicates corpus rows, applies source facets and retains partial years', () => {
		const first = article(1, '1998-05');
		const base = [first, first, article(2, null), article(3, '2000', 'Neutre', 'Other')];
		const result = historicalTrends({ a: base }, ['a'], {
			...defaults,
			journals: ['Paper'],
			period: 'decade',
			facet: 'journal'
		});
		expect(result).toMatchObject({
			collected: 2,
			undated: 1,
			groups: [{ key: 'Paper', buckets: [{ period: 1990, n: [1] }] }]
		});
		expect(corpusSlice(base, { countries: ['Benin'], journals: [] })).toEqual([]);
	});
	it('attaches a Wilson interval to every shown share, and none to a masked one', () => {
		const a = Array.from({ length: 5 }, (_, i) => article(i + 1, '2000'));
		const [shown] = historicalTrends({ a }, ['a'], defaults).groups[0].buckets;
		// n = 5 and no negatives: the point plots 0%, the interval reaches ~43%.
		expect(shown.shares).toEqual([0]);
		expect(shown.intervals[0]!.low).toBe(0);
		expect(shown.intervals[0]!.high).toBeCloseTo(0.4345, 3);
		const [masked] = historicalTrends({ a }, ['a'], { ...defaults, minimumCount: 6 }).groups[0]
			.buckets;
		expect(masked.intervals).toEqual([null]);
	});
	it('adds panel majority and any-model series over articles every model rated', () => {
		const data = {
			a: [article(1, '2000', 'Négatif'), article(2, '2000', 'Négatif'), article(3, '2000')],
			b: [article(1, '2000', 'Négatif'), article(2, '2000'), article(3, '2000', null)],
			c: [article(1, '2000'), article(2, '2000'), article(3, '2000')]
		};
		const ids = ['a', 'b', 'c'];
		const none = historicalTrends(data, ids, defaults).groups[0].buckets[0];
		expect(none.panelShare).toBeNull();
		const majority = historicalTrends(data, ids, { ...defaults, panel: 'majority' }).groups[0]
			.buckets[0];
		// Article 3 is incomplete; of 1 and 2, only 1 has two of three negative.
		expect(majority).toMatchObject({ panelN: 2, panelTarget: 1, panelShare: 0.5 });
		const any = historicalTrends(data, ids, { ...defaults, panel: 'any' }).groups[0].buckets[0];
		expect(any).toMatchObject({ panelN: 2, panelTarget: 2, panelShare: 1 });
		// The panel series reads complete ratings even under available cases.
		expect(
			historicalTrends(data, ids, { ...defaults, panel: 'any', cohort: 'available' }).groups[0]
				.buckets[0].panelN
		).toBe(2);
	});
	it('applies the minimum to the panel series too', () => {
		const data = { a: [article(1, '2000', 'Négatif')], b: [article(1, '2000', 'Négatif')] };
		const bucket = historicalTrends(data, ['a', 'b'], {
			...defaults,
			panel: 'majority',
			minimumCount: 2
		}).groups[0].buckets[0];
		expect(bucket).toMatchObject({ panelN: 1, panelShare: null, panelInterval: null });
	});
});

describe('panelInCategory', () => {
	it('needs a strict majority, or a single model for “any”', () => {
		expect(panelInCategory([true, true, false, false], 'majority')).toBe(false);
		expect(panelInCategory([true, true, true, false, false], 'majority')).toBe(true);
		expect(panelInCategory([false, false, true], 'any')).toBe(true);
		expect(panelInCategory([false, false], 'any')).toBe(false);
	});
});

describe('newspaper coverage timeline', () => {
	it('counts articles once and fills uncollected intervening years', () => {
		const a = article(1, '1998');
		const result = newspaperTimeline(
			[a, a, article(2, '2000'), article(3, null), article(4, '2000', 'Neutre', 'Other')],
			'year'
		);
		expect(result).toMatchObject({
			total: 3,
			undated: 1,
			periods: [1998, 1999, 2000],
			rows: [
				{ journal: 'Paper', total: 2, counts: [1, 0, 1] },
				{ journal: 'Other', total: 1, counts: [0, 0, 1] }
			]
		});
	});
	it('has no fabricated periods for an undated or empty corpus', () => {
		expect(newspaperTimeline([article(1, null)], 'decade')).toMatchObject({
			periods: [],
			rows: [],
			undated: 1
		});
		expect(newspaperTimeline([], 'year').total).toBe(0);
	});
});
