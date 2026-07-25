/**
 * Articles Store Unit Tests
 *
 * Covers the raw-record mapping (fallback precedence — the spread-order bug
 * class) and the data-format branching of loadDatasetArticles.
 */
import { describe, it, expect, vi } from 'vitest';
import {
	mapArticleProperties,
	loadDatasetArticles,
	joinArticles,
	applyJustifications
} from './articles.svelte';

describe('mapArticleProperties', () => {
	it('maps a fully-populated record through unchanged', () => {
		const article = mapArticleProperties(
			{
				'o:id': 42,
				'o:title': 'Titre',
				journal_source: 'Le Journal',
				Newspaper: 'Le Journal',
				Country: 'Benin',
				publication_date: '2001-02-03',
				sentiment_analysis: null
			},
			'chatgpt'
		);
		expect(article.journal_source).toBe('Le Journal');
		expect(article.publication_date).toBe('2001-02-03');
		expect(article.dataset_id).toBe('chatgpt');
	});

	it('falls back to Newspaper when journal_source is missing', () => {
		const article = mapArticleProperties(
			{ 'o:id': 1, Newspaper: 'La Nation', sentiment_analysis: null },
			'gemini'
		);
		expect(article.journal_source).toBe('La Nation');
	});

	it('computed fallbacks win over null/empty raw values (spread-order regression)', () => {
		// The raw record HAS the keys but with empty values — the fallbacks must
		// still apply. Regression test for the `...item` spread that used to
		// come last and clobber the computed fields.
		const article = mapArticleProperties(
			{
				'o:id': 2,
				journal_source: '',
				Newspaper: 'Fraternité',
				publication_date: '',
				'dcterms:date': '1999-12-31',
				sentiment_analysis: null
			},
			'mistral'
		);
		expect(article.journal_source).toBe('Fraternité');
		expect(article.publication_date).toBe('1999-12-31');
	});

	it('uses N/A when no journal or date source exists', () => {
		const article = mapArticleProperties({ 'o:id': 3, sentiment_analysis: null }, 'chatgpt');
		expect(article.journal_source).toBe('N/A');
		expect(article.publication_date).toBe('N/A');
	});

	it('defaults sentiment_analysis to null when absent', () => {
		const article = mapArticleProperties({ 'o:id': 4 }, 'chatgpt');
		expect(article.sentiment_analysis).toBeNull();
	});
});

describe('joinArticles', () => {
	const baseRecords = [
		{ 'o:id': 1, 'o:title': 'A', Newspaper: 'J1', Country: 'Benin', 'dcterms:date': '2001-01-01' },
		{ 'o:id': 2, 'o:title': 'B', Newspaper: 'J2', Country: 'Togo', 'dcterms:date': '2002-02-02' }
	];

	it('attaches each article its sentiment analysis by id', () => {
		const sentiments = {
			'1': {
				polarite: 'Positif',
				subjectivite_score: 2,
				centralite_islam_musulmans: 'Central'
			}
		};
		const articles = joinArticles(baseRecords, sentiments, 'chatgpt');
		expect(articles).toHaveLength(2);
		expect(articles[0].sentiment_analysis?.polarite).toBe('Positif');
		expect(articles[0].dataset_id).toBe('chatgpt');
		// article 2 has no analysis in this model's file
		expect(articles[1].sentiment_analysis).toBeNull();
	});

	it('applies the metadata fallbacks from mapArticleProperties', () => {
		const articles = joinArticles(baseRecords, {}, 'gemini');
		expect(articles[0].journal_source).toBe('J1');
		expect(articles[0].publication_date).toBe('2001-01-01');
	});

	it('seeds the justification keys as null so the shape is stable before the prose loads', () => {
		const articles = joinArticles(
			baseRecords,
			{
				'1': { polarite: 'Positif', subjectivite_score: 2, centralite_islam_musulmans: 'Central' }
			},
			'chatgpt'
		);

		// Consumers read `?.polarite_justification` directly; it must be null,
		// not undefined, before loadJustifications has run.
		expect(articles[0].sentiment_analysis?.polarite_justification).toBeNull();
		expect(articles[0].sentiment_analysis?.subjectivite_justification).toBeNull();
		expect(articles[0].sentiment_analysis?.centralite_justification).toBeNull();
	});
});

describe('applyJustifications', () => {
	function articlesWithScores() {
		return joinArticles(
			[
				{ 'o:id': 1, 'o:title': 'A', Newspaper: 'J1' },
				{ 'o:id': 2, 'o:title': 'B', Newspaper: 'J2' }
			],
			{
				'1': { polarite: 'Positif', subjectivite_score: 2, centralite_islam_musulmans: 'Central' },
				'2': { polarite: 'Neutre', subjectivite_score: 3, centralite_islam_musulmans: 'Marginal' }
			},
			'chatgpt'
		);
	}

	it('merges prose into the existing sentiment_analysis objects', () => {
		const articles = articlesWithScores();
		// Capturing the object mirrors what an open detail modal holds; the merge
		// must be visible through that reference, not only via a rebuilt array.
		const captured = articles[0].sentiment_analysis;

		applyJustifications(articles, {
			'1': {
				polarite_justification: 'because',
				subjectivite_justification: 'factual',
				centralite_justification: 'central'
			}
		});

		expect(captured?.polarite_justification).toBe('because');
		expect(articles[0].sentiment_analysis?.subjectivite_justification).toBe('factual');
		expect(articles[0].sentiment_analysis?.centralite_justification).toBe('central');
	});

	it('preserves the scores it merges alongside', () => {
		const articles = articlesWithScores();
		applyJustifications(articles, {
			'1': {
				polarite_justification: 'because',
				subjectivite_justification: null,
				centralite_justification: null
			}
		});

		expect(articles[0].sentiment_analysis?.polarite).toBe('Positif');
		expect(articles[0].sentiment_analysis?.subjectivite_score).toBe(2);
	});

	it('leaves articles with no prose entry untouched', () => {
		const articles = articlesWithScores();
		applyJustifications(articles, {
			'1': {
				polarite_justification: 'because',
				subjectivite_justification: null,
				centralite_justification: null
			}
		});

		expect(articles[1].sentiment_analysis?.polarite_justification).toBeNull();
	});

	it('skips articles this model did not analyse', () => {
		const articles = joinArticles([{ 'o:id': 9, Newspaper: 'J' }], {}, 'chatgpt');
		expect(articles[0].sentiment_analysis).toBeNull();

		expect(() =>
			applyJustifications(articles, {
				'9': {
					polarite_justification: 'x',
					subjectivite_justification: 'y',
					centralite_justification: 'z'
				}
			})
		).not.toThrow();
		expect(articles[0].sentiment_analysis).toBeNull();
	});
});

describe('loadDatasetArticles', () => {
	const baseRecords = [
		{ 'o:id': 1, 'o:title': 'T', Newspaper: 'J', Country: 'Benin', 'dcterms:date': '2001-01-01' }
	];
	const sentimentFile = {
		model: 'chatgpt',
		sentiments: {
			'1': {
				polarite: 'Neutre',
				subjectivite_score: 3,
				centralite_islam_musulmans: 'Central'
			}
		}
	};

	function mockFetch(bodies: Record<string, unknown>, ok = true): typeof fetch {
		return vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			const key = Object.keys(bodies).find((k) => url.includes(k));
			return {
				ok: ok && key !== undefined,
				statusText: 'OK',
				json: async () => (key ? bodies[key] : null)
			};
		}) as unknown as typeof fetch;
	}

	it('joins the shared base file with the model sentiment file', async () => {
		const articles = await loadDatasetArticles(
			'/data/iwac_sentiment_chatgpt.json',
			'chatgpt',
			mockFetch({
				iwac_articles_base: baseRecords,
				iwac_sentiment_chatgpt: sentimentFile
			})
		);
		expect(articles).toHaveLength(1);
		expect(articles[0]['o:title']).toBe('T');
		expect(articles[0].sentiment_analysis?.subjectivite_score).toBe(3);
		expect(articles[0].dataset_id).toBe('chatgpt');
	});

	it('returns [] for an unrecognized sentiment payload shape', async () => {
		const articles = await loadDatasetArticles(
			'/data/iwac_sentiment_chatgpt.json',
			'chatgpt',
			mockFetch({
				iwac_articles_base: baseRecords,
				iwac_sentiment_chatgpt: { nope: true }
			})
		);
		expect(articles).toEqual([]);
	});

	it('returns [] when a fetch fails instead of throwing', async () => {
		const articles = await loadDatasetArticles(
			'/data/iwac_sentiment_chatgpt.json',
			'chatgpt',
			mockFetch({}, false)
		);
		expect(articles).toEqual([]);
	});
});
