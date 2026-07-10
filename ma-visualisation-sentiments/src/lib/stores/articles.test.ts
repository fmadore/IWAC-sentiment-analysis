/**
 * Articles Store Unit Tests
 *
 * Covers the raw-record mapping (fallback precedence — the spread-order bug
 * class) and the data-format branching of loadDatasetArticles.
 */
import { describe, it, expect, vi } from 'vitest';
import { mapArticleProperties, loadDatasetArticles } from './articles.svelte';

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

describe('loadDatasetArticles', () => {
	const record = { 'o:id': 1, 'o:title': 'T', Newspaper: 'J', sentiment_analysis: null };

	function mockFetch(body: unknown, ok = true): typeof fetch {
		return vi.fn(async () => ({
			ok,
			statusText: ok ? 'OK' : 'Not Found',
			json: async () => body
		})) as unknown as typeof fetch;
	}

	it('accepts a bare array payload', async () => {
		const articles = await loadDatasetArticles('/data/x.json', 'chatgpt', mockFetch([record]));
		expect(articles).toHaveLength(1);
		expect(articles[0].dataset_id).toBe('chatgpt');
	});

	it('accepts an { articles: [...] } payload', async () => {
		const articles = await loadDatasetArticles(
			'/data/x.json',
			'gemini',
			mockFetch({ articles: [record, record] })
		);
		expect(articles).toHaveLength(2);
		expect(articles[1].dataset_id).toBe('gemini');
	});

	it('returns [] for an unrecognized payload shape', async () => {
		const articles = await loadDatasetArticles(
			'/data/x.json',
			'chatgpt',
			mockFetch({ nope: true })
		);
		expect(articles).toEqual([]);
	});

	it('returns [] on a failed response instead of throwing', async () => {
		const articles = await loadDatasetArticles('/data/x.json', 'chatgpt', mockFetch(null, false));
		expect(articles).toEqual([]);
	});
});
