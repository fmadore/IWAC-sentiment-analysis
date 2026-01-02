/**
 * URL State Parser
 * 
 * Parses URL search parameters into application state.
 */

import { LANGUAGES, type Language } from '$lib/i18n';
import type { ModelPair } from '$lib/types/data';
import { VALID_VIEWS, VALID_DATASETS, VALID_PAIRS, URL_PARAMS } from './constants';
import type { URLState } from './types';

/**
 * Parse URL search parameters into application state
 */
export function parseURLState(searchParams: URLSearchParams): URLState {
  const state: URLState = {};

  // Parse view
  const view = searchParams.get(URL_PARAMS.view);
  if (view && (VALID_VIEWS as readonly string[]).includes(view)) {
    state.view = view;
  }

  // Parse language
  const lang = searchParams.get(URL_PARAMS.lang) as Language;
  if (lang && lang in LANGUAGES) {
    state.lang = lang;
  }

  // Parse dataset
  const dataset = searchParams.get(URL_PARAMS.dataset);
  if (dataset && (VALID_DATASETS as readonly string[]).includes(dataset)) {
    state.dataset = dataset;
  }

  // Parse comparison mode
  const compare = searchParams.get(URL_PARAMS.compare);
  if (compare === 'true') {
    state.compare = true;
  }

  // Parse comparison pair
  const pair = searchParams.get(URL_PARAMS.pair) as ModelPair;
  if (pair && (VALID_PAIRS as readonly string[]).includes(pair)) {
    state.pair = pair;
  }

  // Parse discrepancy filters
  const diffMin = searchParams.get(URL_PARAMS.diffMin);
  if (diffMin) {
    const min = parseInt(diffMin, 10);
    if (!isNaN(min) && min >= 0 && min <= 5) {
      state.diffMin = min;
    }
  }

  const diffMax = searchParams.get(URL_PARAMS.diffMax);
  if (diffMax) {
    const max = parseInt(diffMax, 10);
    if (!isNaN(max) && max >= 0 && max <= 5) {
      state.diffMax = max;
    }
  }

  // Parse article ID
  const articleId = searchParams.get(URL_PARAMS.articleId);
  if (articleId) {
    // Try to parse as number first, fallback to string
    const numericId = parseInt(articleId, 10);
    state.articleId = !isNaN(numericId) ? numericId : articleId;

    // If articleId is present but no view is specified, default to table view
    if (!state.view) {
      state.view = 'table';
    }
  }

  // Parse comparison article ID (for full-screen comparison modal)
  const comparisonArticleId = searchParams.get(URL_PARAMS.comparisonArticleId);
  if (comparisonArticleId) {
    const numericId = parseInt(comparisonArticleId, 10);
    state.comparisonArticleId = !isNaN(numericId) ? numericId : comparisonArticleId;

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
  const countries = searchParams.get(URL_PARAMS.countries);
  if (countries) {
    state.countries = countries.split(',').filter(Boolean);
  }

  const journals = searchParams.get(URL_PARAMS.journals);
  if (journals) {
    state.journals = journals.split(',').filter(Boolean);
  }

  const polarities = searchParams.get(URL_PARAMS.polarities);
  if (polarities) {
    state.polarities = polarities.split(',').filter(Boolean);
  }

  const subjectivities = searchParams.get(URL_PARAMS.subjectivities);
  if (subjectivities) {
    state.subjectivities = subjectivities.split(',').filter(Boolean);
  }

  const centralities = searchParams.get(URL_PARAMS.centralities);
  if (centralities) {
    state.centralities = centralities.split(',').filter(Boolean);
  }

  return state;
}
