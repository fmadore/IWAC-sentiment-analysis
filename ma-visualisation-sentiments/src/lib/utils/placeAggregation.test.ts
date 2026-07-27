import { describe, it, expect } from 'vitest';
import { aggregatePlaces } from './placeAggregation';
import type {
	Article,
	CentralityValue,
	PlacesPayload,
	PolarityValue,
	SubjectivityScore
} from '$lib/types/data';

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

interface Ratings {
	polarity?: PolarityValue | null;
	centrality?: CentralityValue | null;
	subjectivity?: SubjectivityScore | null;
}

/** An article with no sentiment_analysis at all. */
function unanalysed(id: number): Article {
	return { 'o:id': id, dataset_id: 'gemini', sentiment_analysis: null };
}

function article(id: number, ratings: Ratings): Article {
	return {
		'o:id': id,
		dataset_id: 'gemini',
		sentiment_analysis: {
			centralite_islam_musulmans: ratings.centrality ?? null,
			centralite_justification: null,
			subjectivite_score: ratings.subjectivity ?? null,
			subjectivite_justification: null,
			polarite: ratings.polarity ?? null,
			polarite_justification: null
		}
	};
}

/** Shorthand: an article rated only on polarity. */
const pol = (id: number, polarity: PolarityValue) => article(id, { polarity });

describe('aggregatePlaces — counting', () => {
	it('counts every article that tags a place', () => {
		const result = aggregatePlaces(
			[pol(10, 'Positif'), pol(11, 'Positif'), pol(13, 'Neutre')],
			PAYLOAD
		);

		const byTitle = Object.fromEntries(result.map((p) => [p.title, p]));
		expect(byTitle['Ouagadougou'].count).toBe(3);
		expect(byTitle['La Mecque'].count).toBe(1);
		expect(byTitle['Lomé'].count).toBe(1);
	});

	it('omits places no filtered article mentions', () => {
		const result = aggregatePlaces([pol(12, 'Positif')], PAYLOAD);
		expect(result.map((p) => p.title)).toEqual(['La Mecque']);
	});

	it('returns places largest-first so small bubbles paint on top', () => {
		const result = aggregatePlaces(
			[pol(10, 'Positif'), pol(11, 'Positif'), pol(13, 'Positif')],
			PAYLOAD
		);
		expect(result.map((p) => p.count)).toEqual([3, 1, 1]);
	});

	it('ignores edges pointing at places absent from the registry', () => {
		const payload: PlacesPayload = { ...PAYLOAD, articles: { '10': [1, 999] } };
		const result = aggregatePlaces([pol(10, 'Positif')], payload);
		expect(result).toHaveLength(1);
		expect(result[0].title).toBe('Ouagadougou');
	});

	it('never double-counts a place repeated on one article', () => {
		const payload: PlacesPayload = { ...PAYLOAD, articles: { '10': [1, 1, 1] } };
		const result = aggregatePlaces([pol(10, 'Positif')], payload);
		expect(result[0].count).toBe(1);
		expect(result[0].stats.polarity.scored).toBe(1);
	});

	it('carries the coordinates through untouched', () => {
		const result = aggregatePlaces([pol(12, 'Positif')], PAYLOAD);
		expect(result[0]).toMatchObject({ id: 2, lat: 21.4225, lng: 39.8261 });
	});

	it('returns nothing for an empty selection', () => {
		expect(aggregatePlaces([], PAYLOAD)).toEqual([]);
	});
});

describe('aggregatePlaces — polarity', () => {
	it('averages on the ordinal scale', () => {
		// Ouagadougou gets Positif (4) and Neutre (3) -> 3.5
		const result = aggregatePlaces([pol(11, 'Positif'), pol(13, 'Neutre')], PAYLOAD);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.stats.polarity.mean).toBeCloseTo(3.5);
		expect(ouaga.stats.polarity.scored).toBe(2);
	});

	it('excludes "Non applicable" from the mean but still counts the article', () => {
		// Without the exclusion this would average (4 + 0) / 2 = 2 and read as
		// negative coverage; the article expresses no stance at all.
		const result = aggregatePlaces([pol(11, 'Positif'), pol(13, 'Non applicable')], PAYLOAD);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;

		expect(ouaga.count).toBe(2);
		expect(ouaga.stats.polarity.scored).toBe(1);
		expect(ouaga.stats.polarity.mean).toBe(4);
		expect(ouaga.stats.polarity.buckets['Non applicable']).toBe(1);
	});

	it('reports a null mean when nothing is scored', () => {
		const result = aggregatePlaces([pol(11, 'Non applicable')], PAYLOAD);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.stats.polarity.mean).toBeNull();
		expect(ouaga.stats.polarity.scored).toBe(0);
		expect(ouaga.count).toBe(1);
	});
});

describe('aggregatePlaces — centrality', () => {
	it('averages on the ordinal scale', () => {
		// Très central (5) and Secondaire (3) -> 4
		const result = aggregatePlaces(
			[article(11, { centrality: 'Très central' }), article(13, { centrality: 'Secondaire' })],
			PAYLOAD
		);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.stats.centrality.mean).toBeCloseTo(4);
		expect(ouaga.stats.centrality.scored).toBe(2);
	});

	it('INCLUDES "Non abordé" in the mean — it is a real bottom of scale', () => {
		// Unlike polarity's "Non applicable", an article that does not address
		// Islam is genuinely minimally central. Central (4) + Non abordé (1) -> 2.5
		const result = aggregatePlaces(
			[article(11, { centrality: 'Central' }), article(13, { centrality: 'Non abordé' })],
			PAYLOAD
		);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.stats.centrality.scored).toBe(2);
		expect(ouaga.stats.centrality.mean).toBeCloseTo(2.5);
	});
});

describe('aggregatePlaces — subjectivity', () => {
	it('averages the raw 1-5 score', () => {
		const result = aggregatePlaces(
			[article(11, { subjectivity: 2 }), article(13, { subjectivity: 5 })],
			PAYLOAD
		);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.stats.subjectivity.mean).toBeCloseTo(3.5);
		expect(ouaga.stats.subjectivity.scored).toBe(2);
	});

	it('buckets by the score as a string', () => {
		const result = aggregatePlaces([article(11, { subjectivity: 4 })], PAYLOAD);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;
		expect(ouaga.stats.subjectivity.buckets['4']).toBe(1);
	});
});

describe('aggregatePlaces — dimensions are independent', () => {
	it('scores each dimension separately on the same article set', () => {
		// One article rated on all three, one rated only on polarity: the
		// polarity mean sees both, the other two see only the first.
		const result = aggregatePlaces(
			[
				article(11, { polarity: 'Positif', centrality: 'Central', subjectivity: 2 }),
				article(13, { polarity: 'Neutre' })
			],
			PAYLOAD
		);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;

		expect(ouaga.count).toBe(2);
		expect(ouaga.stats.polarity.scored).toBe(2);
		expect(ouaga.stats.polarity.mean).toBeCloseTo(3.5);
		expect(ouaga.stats.centrality.scored).toBe(1);
		expect(ouaga.stats.centrality.mean).toBe(4);
		expect(ouaga.stats.subjectivity.scored).toBe(1);
		expect(ouaga.stats.subjectivity.mean).toBe(2);
	});

	it('handles articles with no sentiment analysis at all', () => {
		const result = aggregatePlaces([unanalysed(11)], PAYLOAD);
		const ouaga = result.find((p) => p.title === 'Ouagadougou')!;

		expect(ouaga.count).toBe(1);
		for (const dimension of ['polarity', 'subjectivity', 'centrality'] as const) {
			expect(ouaga.stats[dimension].mean).toBeNull();
			expect(ouaga.stats[dimension].scored).toBe(0);
			expect(ouaga.stats[dimension].buckets).toEqual({});
		}
	});
});
