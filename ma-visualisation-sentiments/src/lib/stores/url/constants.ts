/**
 * URL State Constants
 * 
 * Centralized constants for URL parameter names and valid values.
 */

import type { ModelPair } from '$lib/types/data';

// Valid views that can be set in URL
export const VALID_VIEWS = ['charts', 'trends', 'correlation', 'volume', 'heatmap', 'table', 'comparison', 'extremes'] as const;
export type ValidView = typeof VALID_VIEWS[number];

// Valid datasets
export const VALID_DATASETS = ['chatgpt', 'gemini', 'mistral'] as const;
export type ValidDataset = typeof VALID_DATASETS[number];

// Valid comparison pairs
export const VALID_PAIRS: readonly ModelPair[] = ['chatgpt-gemini', 'chatgpt-mistral', 'gemini-mistral'] as const;

// URL parameter names
export const URL_PARAMS = {
  view: 'view',
  countries: 'countries',
  journals: 'journals',
  polarities: 'polarities',
  subjectivities: 'subjectivities',
  centralities: 'centralities',
  lang: 'lang',
  dataset: 'dataset',
  compare: 'compare',
  pair: 'pair',
  diffMin: 'diffMin',
  diffMax: 'diffMax',
  articleId: 'articleId',
  comparisonArticleId: 'comparisonArticleId'
} as const;

export type URLParamKey = keyof typeof URL_PARAMS;
