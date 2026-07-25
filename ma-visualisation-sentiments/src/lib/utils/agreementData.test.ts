import { describe, it, expect } from 'vitest';
import type { Article } from '$lib/types/data';
import {
	getDimensionLabel,
	buildLabelPairs,
	buildRaterItems,
	computeMarginals,
	DIMENSION_CATEGORIES
} from './agreementData';

function article(
	id: number,
	analysis: Partial<NonNullable<Article['sentiment_analysis']>> | null,
	datasetId = 'chatgpt'
): Article {
	return {
		'o:id': id,
		'o:title': `Article ${id}`,
		Newspaper: 'J',
		Country: 'Benin',
		publication_date: '2010-01-01',
		dataset_id: datasetId,
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

describe('getDimensionLabel', () => {
	it('reads each dimension off the analysis block', () => {
		const a = article(1, {
			polarite: 'Positif',
			subjectivite_score: 3,
			centralite_islam_musulmans: 'Central'
		});
		expect(getDimensionLabel(a, 'polarity')).toBe('Positif');
		expect(getDimensionLabel(a, 'centrality')).toBe('Central');
		// Subjectivity is numeric in the data but categorical for agreement.
		expect(getDimensionLabel(a, 'subjectivity')).toBe('3');
	});

	it('returns null for an unanalysed article', () => {
		expect(getDimensionLabel(article(1, null), 'polarity')).toBeNull();
	});

	it('returns null for a dimension the model left empty', () => {
		const a = article(1, { polarite: 'Positif' });
		expect(getDimensionLabel(a, 'centrality')).toBeNull();
		expect(getDimensionLabel(a, 'subjectivity')).toBeNull();
	});
});

describe('buildLabelPairs', () => {
	it('joins the two models on article id', () => {
		const a = [article(1, { polarite: 'Positif' }), article(2, { polarite: 'Neutre' })];
		const b = [article(2, { polarite: 'Négatif' }), article(1, { polarite: 'Positif' })];

		// Note b is in a different order — the join must be by id, not position.
		expect(buildLabelPairs(a, b, 'polarity')).toEqual([
			{ a: 'Positif', b: 'Positif' },
			{ a: 'Neutre', b: 'Négatif' }
		]);
	});

	it('drops articles the other model does not have', () => {
		const a = [article(1, { polarite: 'Positif' }), article(2, { polarite: 'Neutre' })];
		const b = [article(1, { polarite: 'Positif' })];
		expect(buildLabelPairs(a, b, 'polarity')).toHaveLength(1);
	});

	it('drops articles either model left unanalysed', () => {
		// Counting these would inflate n with rows that cannot agree or disagree.
		const a = [article(1, { polarite: 'Positif' }), article(2, null)];
		const b = [article(1, {}), article(2, { polarite: 'Neutre' })];
		expect(buildLabelPairs(a, b, 'polarity')).toHaveLength(0);
	});
});

describe('buildRaterItems', () => {
	const datasets = {
		chatgpt: [article(1, { polarite: 'Positif' }), article(2, { polarite: 'Neutre' })],
		gemini: [article(1, { polarite: 'Positif' }), article(2, { polarite: 'Négatif' })],
		mistral: [article(1, { polarite: 'Neutre' }), article(2, { polarite: 'Neutre' })]
	};

	it('groups every model label per article', () => {
		const items = buildRaterItems(datasets, ['chatgpt', 'gemini', 'mistral'], 'polarity');
		expect(items).toEqual([
			['Positif', 'Positif', 'Neutre'],
			['Neutre', 'Négatif', 'Neutre']
		]);
	});

	it('keeps only complete cases', () => {
		const partial = { ...datasets, mistral: [article(1, { polarite: 'Neutre' })] };
		const items = buildRaterItems(partial, ['chatgpt', 'gemini', 'mistral'], 'polarity');
		expect(items).toHaveLength(1);
	});

	it('returns nothing when the first model has no articles', () => {
		expect(buildRaterItems({}, ['chatgpt', 'gemini'], 'polarity')).toEqual([]);
	});
});

describe('computeMarginals', () => {
	const categories = DIMENSION_CATEGORIES.polarity;

	it('counts each category in ordinal order', () => {
		const articles = [
			article(1, { polarite: 'Positif' }),
			article(2, { polarite: 'Positif' }),
			article(3, { polarite: 'Neutre' })
		];
		const result = computeMarginals(articles, 'polarity', 'chatgpt');

		expect(result.counts[categories.indexOf('Positif')]).toBe(2);
		expect(result.counts[categories.indexOf('Neutre')]).toBe(1);
		expect(result.counts[categories.indexOf('Négatif')]).toBe(0);
	});

	it('expresses percentages against the analysed articles, not the raw total', () => {
		// The unanalysed article must not dilute the distribution — the question
		// is where a model puts its mass, given that it answered at all.
		const articles = [
			article(1, { polarite: 'Positif' }),
			article(2, { polarite: 'Neutre' }),
			article(3, null)
		];
		const result = computeMarginals(articles, 'polarity', 'chatgpt');

		expect(result.percentages[categories.indexOf('Positif')]).toBeCloseTo(50);
		expect(result.unanalyzed).toBe(1);
		expect(result.total).toBe(3);
	});

	it('reports 0% rather than NaN when nothing was analysed', () => {
		const result = computeMarginals([article(1, null)], 'polarity', 'chatgpt');
		result.percentages.forEach((p) => expect(p).toBe(0));
	});

	it('counts a label outside the scale as unanalysed rather than dropping it silently', () => {
		const result = computeMarginals(
			[article(1, { polarite: 'Complètement inventé' })],
			'polarity',
			'chatgpt'
		);
		expect(result.unanalyzed).toBe(1);
		expect(result.counts.every((c) => c === 0)).toBe(true);
	});
});
