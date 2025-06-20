import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { 
  countryFilters, 
  journalFilters, 
  polarityFilters, 
  subjectivityFilters, 
  centralityFilters 
} from './stores';
import { currentLanguage, type Language, LANGUAGES, initializeLanguage } from './i18n/index.js';

// Types for URL state
export interface URLState {
  view?: string;
  countries?: string[];
  journals?: string[];
  polarities?: string[];
  subjectivities?: number[];
  centralities?: string[];
  lang?: Language;
}

// Valid views that can be set in URL
const VALID_VIEWS = ['charts', 'trends', 'correlation', 'volume', 'heatmap', 'table'];

// URL parameter names
const URL_PARAMS = {
  view: 'view',
  countries: 'countries',
  journals: 'journals', 
  polarities: 'polarities',
  subjectivities: 'subjectivities',
  centralities: 'centralities',
  lang: 'lang'
} as const;

/**
 * Parse URL search parameters into application state
 */
export function parseURLState(searchParams: URLSearchParams): URLState {
  const state: URLState = {};

  // Parse view
  const view = searchParams.get(URL_PARAMS.view);
  if (view && VALID_VIEWS.includes(view)) {
    state.view = view;
  }

  // Parse language
  const lang = searchParams.get(URL_PARAMS.lang) as Language;
  if (lang && lang in LANGUAGES) {
    state.lang = lang;
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
    state.subjectivities = subjectivities.split(',')
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= 5);
  }

  const centralities = searchParams.get(URL_PARAMS.centralities);
  if (centralities) {
    state.centralities = centralities.split(',').filter(Boolean);
  }

  return state;
}

/**
 * Convert application state to URL search parameters
 */
export function buildURLSearchParams(state: URLState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.view && VALID_VIEWS.includes(state.view)) {
    params.set(URL_PARAMS.view, state.view);
  }

  if (state.lang && state.lang in LANGUAGES) {
    params.set(URL_PARAMS.lang, state.lang);
  }

  if (state.countries && state.countries.length > 0) {
    params.set(URL_PARAMS.countries, state.countries.join(','));
  }

  if (state.journals && state.journals.length > 0) {
    params.set(URL_PARAMS.journals, state.journals.join(','));
  }

  if (state.polarities && state.polarities.length > 0) {
    params.set(URL_PARAMS.polarities, state.polarities.join(','));
  }

  if (state.subjectivities && state.subjectivities.length > 0) {
    params.set(URL_PARAMS.subjectivities, state.subjectivities.join(','));
  }

  if (state.centralities && state.centralities.length > 0) {
    params.set(URL_PARAMS.centralities, state.centralities.join(','));
  }

  return params;
}

/**
 * Get current application state from stores
 */
export function getCurrentState(): URLState {
  return {
    countries: get(countryFilters),
    journals: get(journalFilters),
    polarities: get(polarityFilters),
    subjectivities: get(subjectivityFilters),
    centralities: get(centralityFilters),
    lang: get(currentLanguage)
  };
}

/**
 * Apply URL state to application stores
 */
export function applyURLState(state: URLState): string | undefined {
  // Initialize language first (this handles URL lang, localStorage, and browser detection)
  initializeLanguage(state.lang);

  if (state.countries) {
    countryFilters.set(state.countries);
  }

  if (state.journals) {
    journalFilters.set(state.journals);
  }

  if (state.polarities) {
    polarityFilters.set(state.polarities);
  }

  if (state.subjectivities) {
    subjectivityFilters.set(state.subjectivities);
  }

  if (state.centralities) {
    centralityFilters.set(state.centralities);
  }

  return state.view;
}

/**
 * Update URL with current application state
 */
export function updateURL(currentView?: string, replaceState = false): void {
  if (!browser) return;

  const currentState = getCurrentState();
  if (currentView) {
    currentState.view = currentView;
  }

  const params = buildURLSearchParams(currentState);
  const url = params.toString() ? `?${params.toString()}` : window.location.pathname;

  goto(url, { 
    replaceState,
    keepFocus: true,
    noScroll: true
  });
}

/**
 * Initialize URL state management
 * Should be called once when the app loads
 */
export function initializeURLState(): string | undefined {
  if (!browser) return;

  const currentPage = get(page);
  const urlState = parseURLState(currentPage.url.searchParams);
  
  return applyURLState(urlState);
}

/**
 * Clear all filters and update URL
 */
export function clearAllFilters(): void {
  countryFilters.set([]);
  journalFilters.set([]);
  polarityFilters.set([]);
  subjectivityFilters.set([]);
  centralityFilters.set([]);
  
  updateURL(undefined, true);
}

/**
 * Export utility functions for components
 */
export const urlStateUtils = {
  parseURLState,
  buildURLSearchParams,
  getCurrentState,
  applyURLState,
  updateURL,
  initializeURLState,
  clearAllFilters,
  VALID_VIEWS
}; 