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

	it('uses a display fallback for journals and null for missing dates', () => {
		const article = mapArticleProperties({ 'o:id': 3, sentiment_analysis: null }, 'chatgpt');
		expect(article.journal_source).toBe('N/A');
		expect(article.publication_date).toBeNull();
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
		} satisfies Parameters<typeof joinArticles>[1];
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
		schema_version: '1.0.0',
		analysis_version: 'v1',
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

	it('rejects an unrecognized sentiment payload shape', async () => {
		await expect(
			loadDatasetArticles(
				'/data/iwac_sentiment_chatgpt.json',
				'chatgpt',
				mockFetch({
					iwac_articles_base: baseRecords,
					iwac_sentiment_chatgpt: { nope: true }
				})
			)
		).rejects.toThrow('Sentiment file model must be chatgpt');
	});

	it("rejects a payload declaring the other generation's contract", async () => {
		// The generation is derived from the model id, so a v1 model served with
		// v2 version markers is a mismatch rather than a newer file.
		await expect(
			loadDatasetArticles(
				'/data/iwac_sentiment_chatgpt.json',
				'chatgpt',
				mockFetch({
					iwac_articles_base: baseRecords,
					iwac_sentiment_chatgpt: {
						schema_version: '2.0.0',
						analysis_version: 'v2',
						model: 'chatgpt',
						sentiments: {}
					}
				})
			)
		).rejects.toThrow('Sentiment file schema_version must be 1.0.0');
	});

	it('rejects a failed fetch so the UI can expose and retry it', async () => {
		await expect(
			loadDatasetArticles('/data/iwac_sentiment_chatgpt.json', 'chatgpt', mockFetch({}, false))
		).rejects.toThrow('Failed to fetch');
	});

	it('reports the HTTP status, which survives an empty HTTP/2 statusText', async () => {
		const fetch503 = vi.fn(async () => ({
			ok: false,
			status: 503,
			statusText: '',
			json: async () => null
		})) as unknown as typeof fetch;
		await expect(
			loadDatasetArticles('/data/iwac_sentiment_chatgpt.json', 'chatgpt', fetch503)
		).rejects.toThrow(/^Failed to fetch \S+\.json: 503/);
	});
});

/**
 * Issue #232: like `createResource.ensure`, an implicit request never re-fetches
 * a dataset that failed — only an explicit Retry (`force`) does.
 */
describe('loadSpecificDataset after a failure', () => {
	const baseRecords = [{ 'o:id': 1, 'o:title': 'T', Newspaper: 'J' }];
	const sentimentFile = (model: string) => ({
		schema_version: '1.0.0',
		analysis_version: 'v1',
		model,
		sentiments: {
			'1': { polarite: 'Neutre', subjectivite_score: 3, centralite_islam_musulmans: 'Central' }
		}
	});

	/** Serves the base, and the model file only once `failModel` is false. */
	function flakyFetch(model: string) {
		const control = { failModel: true };
		const spy = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes('iwac_articles_base')) {
				return { ok: true, status: 200, statusText: 'OK', json: async () => baseRecords };
			}
			if (url.includes(`iwac_sentiment_${model}`) && !control.failModel) {
				return { ok: true, status: 200, statusText: 'OK', json: async () => sentimentFile(model) };
			}
			return { ok: false, status: 500, statusText: '', json: async () => null };
		});
		const modelCalls = () =>
			spy.mock.calls.filter(([input]) => String(input).includes(`iwac_sentiment_${model}`)).length;
		return { control, fetch: spy as unknown as typeof fetch, modelCalls };
	}

	it('does not re-request an errored dataset implicitly', async () => {
		const { loadSpecificDataset, articleState } = await import('./articles.svelte');
		const { fetch, modelCalls, control } = flakyFetch('gemini');

		await expect(loadSpecificDataset('gemini', fetch, { showLoading: false })).rejects.toThrow(
			'500'
		);
		expect(articleState.loadStates.gemini?.status).toBe('error');
		expect(modelCalls()).toBe(1);

		// The server recovers, but a requirement change is not a Retry.
		control.failModel = false;
		await expect(loadSpecificDataset('gemini', fetch, { showLoading: false })).rejects.toThrow(
			'500'
		);
		expect(modelCalls()).toBe(1);
		expect(articleState.loadStates.gemini?.status).toBe('error');
	});

	it('reloads an errored dataset when the Retry forces it', async () => {
		const { loadSpecificDataset, articleState } = await import('./articles.svelte');
		const { fetch, modelCalls, control } = flakyFetch('mistral');

		await expect(loadSpecificDataset('mistral', fetch, { showLoading: false })).rejects.toThrow();
		control.failModel = false;
		await loadSpecificDataset('mistral', fetch, { showLoading: false, force: true });

		expect(modelCalls()).toBe(2);
		expect(articleState.loadStates.mistral?.status).toBe('ready');
		expect(articleState.datasets.mistral).toHaveLength(1);

		// Once ready, neither path fetches again.
		await loadSpecificDataset('mistral', fetch, { showLoading: false, force: true });
		await loadSpecificDataset('mistral', fetch, { showLoading: false });
		expect(modelCalls()).toBe(2);
	});

	it('joins a forced retry already in flight instead of fetching twice', async () => {
		const { loadSpecificDataset } = await import('./articles.svelte');
		const { fetch, modelCalls, control } = flakyFetch('chatgpt');

		await expect(loadSpecificDataset('chatgpt', fetch, { showLoading: false })).rejects.toThrow();
		control.failModel = false;
		await Promise.all([
			loadSpecificDataset('chatgpt', fetch, { showLoading: false, force: true }),
			// An implicit request during the retry joins it rather than rejecting.
			loadSpecificDataset('chatgpt', fetch, { showLoading: false })
		]);
		expect(modelCalls()).toBe(2);
	});
});

describe('justificationsOf', () => {
	it('reads each dimension’s prose, null until it has loaded', async () => {
		const { justificationsOf } = await import('./articles.svelte');
		expect(
			justificationsOf({
				polarite: 'Positif',
				polarite_justification: 'because Positif',
				subjectivite_score: 4,
				subjectivite_justification: null,
				centralite_islam_musulmans: 'Central',
				centralite_justification: null
			})
		).toEqual({ polarity: 'because Positif', subjectivity: null, centrality: null });
		expect(justificationsOf(undefined)).toEqual({
			polarity: null,
			subjectivity: null,
			centrality: null
		});
	});
});
