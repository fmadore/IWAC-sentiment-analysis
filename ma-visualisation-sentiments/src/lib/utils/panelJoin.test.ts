import { describe, expect, it } from 'vitest';
import type { Article, PolarityValue, SentimentAnalysis } from '#lib/types/data.js';
import {
	allRows,
	buildPanelJoin,
	createPanelJoinCache,
	datasetsAligned,
	filterPanelRows
} from './panelJoin';

function analysis(polarite: PolarityValue | null): SentimentAnalysis {
	return {
		polarite,
		polarite_justification: null,
		centralite_islam_musulmans: 'Central',
		centralite_justification: null,
		subjectivite_score: 3,
		subjectivite_justification: null
	};
}

function article(
	id: number,
	polarite: PolarityValue | null,
	country = 'Togo',
	journal = 'A'
): Article {
	return {
		'o:id': id,
		Country: country,
		journal_source: journal,
		sentiment_analysis: analysis(polarite)
	} as Article;
}

describe('buildPanelJoin', () => {
	it('joins aligned datasets positionally', () => {
		const a = [article(1, 'Positif'), article(2, 'Neutre')];
		const b = [article(1, 'Négatif'), article(2, null)];
		const join = buildPanelJoin({ a, b }, ['a', 'b']);
		expect(join?.aligned).toBe(true);
		expect(join?.articles).toBe(a);
		expect(join?.analyses.map((column) => column.map((x) => x?.polarite ?? null))).toEqual([
			['Positif', 'Neutre'],
			['Négatif', null]
		]);
		expect(join?.indexById.get('2')).toBe(1);
	});

	it('falls back to an inner join on ids when datasets are out of step', () => {
		const a = [article(1, 'Positif'), article(2, 'Neutre'), article(3, 'Positif')];
		const b = [article(3, 'Négatif'), article(1, 'Neutre')];
		const join = buildPanelJoin({ a, b }, ['a', 'b']);
		expect(join?.aligned).toBe(false);
		// Article 2 is missing from b entirely, so it is dropped, as every
		// per-pair join used to drop it.
		expect(join?.articles.map((x) => x['o:id'])).toEqual([1, 3]);
		expect(join?.analyses[1].map((x) => x?.polarite)).toEqual(['Neutre', 'Négatif']);
		expect(join?.indexById.get('3')).toBe(1);
	});

	it('keeps a present article with a null analysis', () => {
		const a = [article(1, 'Positif')];
		const b = [{ ...article(1, 'Neutre'), sentiment_analysis: null } as Article];
		expect(buildPanelJoin({ a, b }, ['a', 'b'])?.analyses[1]).toEqual([null]);
	});

	it('returns null while any model is missing or empty', () => {
		expect(buildPanelJoin({ a: [article(1, 'Positif')] }, ['a', 'b'])).toBeNull();
		expect(buildPanelJoin({ a: [article(1, 'Positif')], b: [] }, ['a', 'b'])).toBeNull();
		expect(buildPanelJoin({}, [])).toBeNull();
	});

	it('checks alignment id by id', () => {
		expect(datasetsAligned([[article(1, null)], [article(1, null)]])).toBe(true);
		expect(datasetsAligned([[article(1, null)], [article(2, null)]])).toBe(false);
		expect(datasetsAligned([[article(1, null)], []])).toBe(false);
	});
});

describe('createPanelJoinCache', () => {
	it('returns the same join while the input arrays are unchanged', () => {
		const cache = createPanelJoinCache();
		const a = [article(1, 'Positif')];
		const b = [article(1, 'Neutre')];
		const first = cache({ a, b }, ['a', 'b']);
		// A new datasets record (another dataset arrived) with the same arrays.
		expect(cache({ a, b, c: [article(1, null)] }, ['a', 'b'])).toBe(first);
		expect(cache({ a, b: [article(1, 'Négatif')] }, ['a', 'b'])).not.toBe(first);
		expect(cache({ a, b }, ['b', 'a'])?.modelIds).toEqual(['b', 'a']);
	});
});

describe('filterPanelRows', () => {
	const a = [
		article(1, 'Positif', 'Togo', 'A'),
		article(2, 'Neutre', 'Bénin', 'B'),
		article(3, 'Positif', 'Togo', 'B')
	];
	const join = buildPanelJoin({ a, b: a }, ['a', 'b'])!;

	it('keeps every row without facets', () => {
		expect(filterPanelRows(join, [], [])).toEqual(allRows(join));
	});

	it('filters by country and newspaper', () => {
		expect(filterPanelRows(join, ['Togo'], [])).toEqual([0, 2]);
		expect(filterPanelRows(join, ['Togo'], ['B'])).toEqual([2]);
	});
});
