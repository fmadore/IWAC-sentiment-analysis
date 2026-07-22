/**
 * URL State Module Unit Tests
 *
 * Tests the URL builder and parser logic, specifically:
 * - buildURLSearchParams correctly builds URL parameters
 * - Comparison mode excludes dataset parameter
 * - parseURLState correctly parses URL parameters
 */
import { describe, it, expect } from 'vitest';
import { buildURLSearchParams } from '$lib/stores/url/builder.svelte';
import { parseURLState } from '$lib/stores/url/parser.svelte';
import type { URLState } from '$lib/stores/url/types';

// ============================================
// buildURLSearchParams Tests
// ============================================

describe('buildURLSearchParams', () => {
	describe('dataset parameter handling', () => {
		it('includes dataset when not in comparison mode', () => {
			const state: URLState = {
				view: 'charts',
				dataset: 'mistral',
				lang: 'en'
			};

			const params = buildURLSearchParams(state);

			expect(params.get('dataset')).toBe('mistral');
			expect(params.get('view')).toBe('charts');
		});

		it('excludes dataset when in comparison mode', () => {
			const state: URLState = {
				view: 'comparison',
				dataset: 'mistral',
				compare: true,
				pair: 'chatgpt-gemini',
				lang: 'en'
			};

			const params = buildURLSearchParams(state);

			expect(params.get('dataset')).toBeNull();
			expect(params.get('compare')).toBe('true');
			expect(params.get('pair')).toBe('chatgpt-gemini');
		});

		it('excludes dataset when compare is true even with dataset set', () => {
			const state: URLState = {
				view: 'comparison',
				dataset: 'chatgpt',
				compare: true,
				pair: 'gemini-mistral',
				diffMin: 0,
				diffMax: 5,
				lang: 'fr'
			};

			const params = buildURLSearchParams(state);

			expect(params.get('dataset')).toBeNull();
			expect(params.get('view')).toBe('comparison');
			expect(params.get('lang')).toBe('fr');
			expect(params.get('pair')).toBe('gemini-mistral');
			expect(params.get('diffMin')).toBe('0');
			expect(params.get('diffMax')).toBe('5');
		});
	});

	describe('comparison mode parameters', () => {
		it('includes pair only when compare is true', () => {
			const stateWithCompare: URLState = {
				compare: true,
				pair: 'chatgpt-gemini'
			};

			const stateWithoutCompare: URLState = {
				compare: false,
				pair: 'chatgpt-gemini'
			};

			const paramsWithCompare = buildURLSearchParams(stateWithCompare);
			const paramsWithoutCompare = buildURLSearchParams(stateWithoutCompare);

			expect(paramsWithCompare.get('pair')).toBe('chatgpt-gemini');
			expect(paramsWithoutCompare.get('pair')).toBeNull();
		});

		it('includes diffMin and diffMax in comparison mode', () => {
			const state: URLState = {
				compare: true,
				pair: 'chatgpt-mistral',
				diffMin: 1,
				diffMax: 4
			};

			const params = buildURLSearchParams(state);

			expect(params.get('diffMin')).toBe('1');
			expect(params.get('diffMax')).toBe('4');
		});

		it('excludes diffMin/diffMax when viewing specific article with default values', () => {
			const state: URLState = {
				compare: true,
				pair: 'chatgpt-gemini',
				diffMin: 0,
				diffMax: 5,
				comparisonArticleId: 1234
			};

			const params = buildURLSearchParams(state);

			// Default values should be omitted when a specific article is selected
			expect(params.get('diffMin')).toBeNull();
			expect(params.get('diffMax')).toBeNull();
			expect(params.get('comparisonArticleId')).toBe('1234');
		});
	});

	describe('filter parameters', () => {
		it('includes array filters when non-empty', () => {
			const state: URLState = {
				countries: ['Nigeria', 'Senegal'],
				journals: ['Journal1'],
				polarities: ['positive', 'negative']
			};

			const params = buildURLSearchParams(state);

			expect(params.get('countries')).toBe('Nigeria,Senegal');
			expect(params.get('journals')).toBe('Journal1');
			expect(params.get('polarities')).toBe('positive,negative');
		});

		it('excludes empty array filters', () => {
			const state: URLState = {
				countries: [],
				journals: [],
				view: 'table'
			};

			const params = buildURLSearchParams(state);

			expect(params.get('countries')).toBeNull();
			expect(params.get('journals')).toBeNull();
			expect(params.get('view')).toBe('table');
		});
	});
});

// ============================================
// parseURLState Tests
// ============================================

describe('parseURLState', () => {
	it('parses comparison mode URL correctly', () => {
		const params = new URLSearchParams(
			'view=comparison&lang=en&compare=true&pair=chatgpt-gemini&diffMin=0&diffMax=5'
		);

		const state = parseURLState(params);

		expect(state.view).toBe('comparison');
		expect(state.lang).toBe('en');
		expect(state.compare).toBe(true);
		expect(state.pair).toBe('chatgpt-gemini');
		expect(state.diffMin).toBe(0);
		expect(state.diffMax).toBe(5);
		// Dataset should not be present
		expect(state.dataset).toBeUndefined();
	});

	it('parses non-comparison mode URL with dataset', () => {
		const params = new URLSearchParams('view=charts&lang=fr&dataset=mistral');

		const state = parseURLState(params);

		expect(state.view).toBe('charts');
		expect(state.lang).toBe('fr');
		expect(state.dataset).toBe('mistral');
		expect(state.compare).toBeUndefined();
	});

	it('parses array parameters correctly', () => {
		const params = new URLSearchParams(
			'countries=Nigeria,Senegal&journals=Journal1,Journal2&polarities=positive'
		);

		const state = parseURLState(params);

		expect(state.countries).toEqual(['Nigeria', 'Senegal']);
		expect(state.journals).toEqual(['Journal1', 'Journal2']);
		expect(state.polarities).toEqual(['positive']);
	});

	it('validates view parameter', () => {
		const validParams = new URLSearchParams('view=comparison');
		const invalidParams = new URLSearchParams('view=invalid');

		const validState = parseURLState(validParams);
		const invalidState = parseURLState(invalidParams);

		expect(validState.view).toBe('comparison');
		expect(invalidState.view).toBeUndefined();
	});

	it('validates pair parameter', () => {
		const validParams = new URLSearchParams('pair=chatgpt-gemini&compare=true');
		const invalidParams = new URLSearchParams('pair=invalid-pair&compare=true');

		const validState = parseURLState(validParams);
		const invalidState = parseURLState(invalidParams);

		expect(validState.pair).toBe('chatgpt-gemini');
		expect(invalidState.pair).toBeUndefined();
	});

	it('defaults articleId presence to table view', () => {
		const params = new URLSearchParams('articleId=1234');

		const state = parseURLState(params);

		expect(state.articleId).toBe(1234);
		expect(state.view).toBe('table');
	});

	it('enables comparison mode when comparisonArticleId is present', () => {
		const params = new URLSearchParams('comparisonArticleId=5678');

		const state = parseURLState(params);

		expect(state.comparisonArticleId).toBe(5678);
		expect(state.compare).toBe(true);
		expect(state.view).toBe('comparison');
	});
});

// ============================================
// Round-trip: build -> parse must reproduce the state
// ============================================

describe('build/parse round-trip', () => {
	const roundTrip = (state: URLState): URLState => parseURLState(buildURLSearchParams(state));

	it('reproduces a plain dataset view with filters', () => {
		const state: URLState = {
			view: 'table',
			dataset: 'mistral',
			lang: 'en',
			countries: ['Benin', 'Togo'],
			journals: ['La Nation'],
			polarities: ['Positif'],
			subjectivities: ['3'],
			centralities: ['Central']
		};
		expect(roundTrip(state)).toMatchObject(state);
	});

	it('reproduces comparison mode with pair and discrepancy range', () => {
		const state: URLState = {
			view: 'comparison',
			compare: true,
			pair: 'gemini-mistral',
			lang: 'fr',
			diffMin: 2,
			diffMax: 4
		};
		expect(roundTrip(state)).toMatchObject(state);
	});

	it('reproduces a selected-article deep link', () => {
		const state: URLState = {
			view: 'table',
			dataset: 'chatgpt',
			lang: 'fr',
			articleId: '12345'
		};
		const parsed = roundTrip(state);
		expect(String(parsed.articleId)).toBe('12345');
		expect(parsed.view).toBe('table');
		expect(parsed.dataset).toBe('chatgpt');
	});
});
