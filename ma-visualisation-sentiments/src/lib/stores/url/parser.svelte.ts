/**
 * URL State Parser
 *
 * Parses URL search parameters into application state.
 */

import { LANGUAGES, type Language } from '$lib/i18n';
import type { ModelPair } from '$lib/types/data';
import { TOTAL_DISCREPANCY_MAXIMUM } from '$lib/domain/sentimentContract';
import {
	VALID_VIEWS,
	VALID_DATASETS,
	VALID_PAIRS,
	URL_PARAMS,
	type ValidView,
	type ValidDataset
} from './constants';
import type { URLState } from './types';

/**
 * Parse URL search parameters into application state
 */
export function parseURLState(searchParams: URLSearchParams): URLState {
	const state: URLState = {};

	// Parse view
	const view = searchParams.get(URL_PARAMS.view);
	if (view && (VALID_VIEWS as readonly string[]).includes(view)) {
		state.view = view as ValidView;
	}

	// Parse language
	const lang = searchParams.get(URL_PARAMS.lang);
	if (lang && lang in LANGUAGES) {
		state.lang = lang as Language;
	}

	// Parse dataset
	const dataset = searchParams.get(URL_PARAMS.dataset);
	if (dataset && (VALID_DATASETS as readonly string[]).includes(dataset)) {
		state.dataset = dataset as ValidDataset;
	}

	// Parse comparison mode
	const compare = searchParams.get(URL_PARAMS.compare);
	if (compare === 'true') {
		state.compare = true;
	}

	// Parse comparison pair
	const pair = searchParams.get(URL_PARAMS.pair);
	if (pair && (VALID_PAIRS as readonly string[]).includes(pair as ModelPair)) {
		state.pair = pair as ModelPair;
	}

	// Parse discrepancy filters
	const diffMin = searchParams.get(URL_PARAMS.diffMin);
	if (diffMin && /^\d+$/.test(diffMin)) {
		const min = Number(diffMin);
		if (min >= 0 && min <= TOTAL_DISCREPANCY_MAXIMUM) {
			state.diffMin = min;
		}
	}

	const diffMax = searchParams.get(URL_PARAMS.diffMax);
	if (diffMax && /^\d+$/.test(diffMax)) {
		const max = Number(diffMax);
		if (max >= 0 && max <= TOTAL_DISCREPANCY_MAXIMUM) {
			state.diffMax = max;
		}
	}

	// Parse article ID
	const articleId = searchParams.get(URL_PARAMS.articleId);
	if (articleId) {
		// Try to parse as number first, fallback to string
		state.articleId = /^\d+$/.test(articleId) ? Number(articleId) : articleId;

		// If articleId is present but no view is specified, default to table view
		if (!state.view) {
			state.view = 'table';
		}
	}

	// Parse comparison article ID (for full-screen comparison modal)
	const comparisonArticleId = searchParams.get(URL_PARAMS.comparisonArticleId);
	if (comparisonArticleId) {
		state.comparisonArticleId = /^\d+$/.test(comparisonArticleId)
			? Number(comparisonArticleId)
			: comparisonArticleId;

		// If comparisonArticleId is present, ensure comparison mode is enabled
		if (state.compare !== true) {
			state.compare = true;
		}
		// Default to comparison view if no view specified
		if (!state.view) {
			state.view = 'comparison';
		}
	}

	// Parse array parameters
	const parseArray = (key: string): string[] => {
		const values = searchParams.getAll(key);
		// Backward compatibility for existing shared links that used commas.
		return values
			.flatMap((value) => (values.length === 1 ? value.split(',') : [value]))
			.filter(Boolean);
	};

	for (const [key, stateKey] of [
		[URL_PARAMS.countries, 'countries'],
		[URL_PARAMS.journals, 'journals'],
		[URL_PARAMS.polarities, 'polarities'],
		[URL_PARAMS.subjectivities, 'subjectivities'],
		[URL_PARAMS.centralities, 'centralities']
	] as const) {
		const values = parseArray(key);
		if (values.length > 0) state[stateKey] = values;
	}

	return state;
}
