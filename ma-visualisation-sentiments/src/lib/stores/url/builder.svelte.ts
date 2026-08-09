/**
 * URL State Builder
 *
 * Converts application state to URL search parameters.
 */

import { SvelteURLSearchParams } from 'svelte/reactivity';
import { LANGUAGES } from '$lib/i18n';
import { VALID_VIEWS, VALID_DATASETS, VALID_PAIRS, URL_PARAMS } from './constants';
import type { URLState } from './types';
import { TOTAL_DISCREPANCY_MAXIMUM } from '$lib/domain/sentimentContract';

/**
 * Convert application state to URL search parameters
 */
export function buildURLSearchParams(state: URLState): SvelteURLSearchParams {
	const params = new SvelteURLSearchParams();

	if (state.view && (VALID_VIEWS as readonly string[]).includes(state.view)) {
		params.set(URL_PARAMS.view, state.view);
	}

	if (state.lang && state.lang in LANGUAGES) {
		params.set(URL_PARAMS.lang, state.lang);
	}

	// Only include dataset parameter when NOT in comparison mode
	// In comparison mode, datasets are derived from the pair parameter
	if (
		state.dataset &&
		(VALID_DATASETS as readonly string[]).includes(state.dataset) &&
		state.compare !== true
	) {
		params.set(URL_PARAMS.dataset, state.dataset);
	}

	if (state.compare === true) {
		params.set(URL_PARAMS.compare, 'true');
	}

	if (
		state.pair &&
		(VALID_PAIRS as readonly string[]).includes(state.pair) &&
		state.compare === true
	) {
		params.set(URL_PARAMS.pair, state.pair);
	}

	// Include diffMin/diffMax ONLY for comparison view (not arbiter view)
	// - Arbiter view has its own filters and doesn't use diff ranges
	// - Also omit when viewing a specific article with default values
	const isArbiterView = state.view === 'arbiter';
	const hasSpecificArticle = state.comparisonArticleId !== undefined;
	const diffMinIsDefault = state.diffMin === undefined || state.diffMin === 0;
	const diffMaxIsDefault =
		state.diffMax === undefined || state.diffMax === TOTAL_DISCREPANCY_MAXIMUM;

	if (state.compare === true && !isArbiterView) {
		// Include diffMin if: not viewing specific article, OR it's not the default value
		if (state.diffMin !== undefined && (!hasSpecificArticle || !diffMinIsDefault)) {
			params.set(URL_PARAMS.diffMin, state.diffMin.toString());
		}

		// Include diffMax if: not viewing specific article, OR it's not the default value
		if (state.diffMax !== undefined && (!hasSpecificArticle || !diffMaxIsDefault)) {
			params.set(URL_PARAMS.diffMax, state.diffMax.toString());
		}
	}

	if (state.articleId !== undefined) {
		params.set(URL_PARAMS.articleId, state.articleId.toString());
	}

	// Include comparison article ID when in comparison mode
	if (state.comparisonArticleId !== undefined && state.compare === true) {
		params.set(URL_PARAMS.comparisonArticleId, state.comparisonArticleId.toString());
	}

	// Exclude regular filters for arbiter view (it has its own filter system)
	if (!isArbiterView) {
		for (const [key, values] of [
			[URL_PARAMS.countries, state.countries],
			[URL_PARAMS.journals, state.journals],
			[URL_PARAMS.polarities, state.polarities],
			[URL_PARAMS.subjectivities, state.subjectivities],
			[URL_PARAMS.centralities, state.centralities]
		] as const) {
			for (const value of values ?? []) params.append(key, value);
		}
	}

	return params;
}
