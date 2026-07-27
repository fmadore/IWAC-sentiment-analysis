import { describe, it, expect } from 'vitest';
import { aggregatePlaces } from './placeAggregation';
import type { Article, PlacesPayload, PolarityValue } from '$lib/types/data';

const PAYLOAD: PlacesPayload = {
	places: [
		{ id: 1, title: 'Ouagadougou', lat: 12.3657, lng: -1.5339 },
		{ id: 2, title: 'La Mecque', lat: 21.4225, lng: 39.8261 },
		{ id: 3, title: 'Lomé', lat: 6.1287, lng: 1.2215 }
	],
	articles: {
		'10': [1, 2],
		'11': [1],
		'12': [2],
		'13': [1, 3]
	}
};

function article(id: number, polarity: PolarityValue | null): Article {
	return {
		'o:id': id,
		dataset_id: 'gemini',
		sentiment_analysis: polarity
			? {
					centralite_islam_musulmans: null,
					centralite_justification: null,
					subjectivite_score: null,
					subjectivite_justification: null,
					polarite: polarity,
					polarite_justification: null
				}
			: null
	};
}

describe('aggregatePlaces', () => {
	it('counts every article that tags a place', () => {
		const result = aggregatePlaces(
			[article(10, 'Positif'), article(11, 'Positif'), article(13, 'Neutre')],
			PAYLOAD
		);

		const byTitle = Object.fromEntries(result.map((p) => [p.title, p]));
		expect(byTitle['Ouagadougou'].count).toBe(3);
		expect(byTitle['La Mecque'].count).toBe(1);
		expect(byTitle['Lomé'].count).toBe(1);
	});

	it('omits places no filtered article mentions', () => {
		const result = aggregatePlaces([article(12, 'Positif')], PAYLOAD);
		expect(result.map((p) => p.title)).toEqual(['La Mecque']);
	});

	it('returns places largest-first so small bubbles paint on top', () => {
		const result = aggregatePlaces(
			[article(10, 'Positif'), article(11, 'Positif'), article(13, 'Positif')],
			PAYLOAD
		);
		expect(result.map((p) => p.count)).toEqual([3, 1, 1]);
	});

	it('averages polarity on the ordinal scale', () => {
		// Ouagadougou gets Positif (4) and Neutre (3) -> 3.5
		const result = aggregatePlaces([article(11, 'Positif'), article(13, 'Neutre')], PAYLOAD);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.meanPolarity).toBeCloseTo(3.5);
		expect(ouaga.scored).toBe(2);
	});

	it('excludes "Non applicable" from the mean but still counts the article', () => {
		// Without the exclusion this would average (4 + 0) / 2 = 2 and read as
		// negative coverage; the article expresses no stance at all.
		const result = aggregatePlaces(
			[article(11, 'Positif'), article(13, 'Non applicable')],
			PAYLOAD
		);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;

		expect(ouaga.count).toBe(2);
		expect(ouaga.scored).toBe(1);
		expect(ouaga.meanPolarity).toBe(4);
		expect(ouaga.buckets['Non applicable']).toBe(1);
	});

	it('reports a null mean when nothing is scored', () => {
		const result = aggregatePlaces([article(11, 'Non applicable')], PAYLOAD);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.meanPolarity).toBeNull();
		expect(ouaga.scored).toBe(0);
		expect(ouaga.count).toBe(1);
	});

	it('handles articles with no sentiment analysis at all', () => {
		const result = aggregatePlaces([article(11, null)], PAYLOAD);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.count).toBe(1);
		expect(ouaga.meanPolarity).toBeNull();
		expect(ouaga.buckets).toEqual({});
	});

	it('ignores edges pointing at places absent from the registry', () => {
		const payload: PlacesPayload = { ...PAYLOAD, articles: { '10': [1, 999] } };
		const result = aggregatePlaces([article(10, 'Positif')], payload);
		expect(result).toHaveLength(1);
		expect(result[0].title).toBe('Ouagadougou');
	});

	it('never double-counts a place repeated on one article', () => {
		const payload: PlacesPayload = { ...PAYLOAD, articles: { '10': [1, 1, 1] } };
		const result = aggregatePlaces([article(10, 'Positif')], payload);
		expect(result[0].count).toBe(1);
		expect(result[0].scored).toBe(1);
	});

	it('carries the coordinates through untouched', () => {
		const result = aggregatePlaces([article(12, 'Positif')], PAYLOAD);
		expect(result[0]).toMatchObject({ id: 2, lat: 21.4225, lng: 39.8261 });
	});

	it('returns nothing for an empty selection', () => {
		expect(aggregatePlaces([], PAYLOAD)).toEqual([]);
	});
});
