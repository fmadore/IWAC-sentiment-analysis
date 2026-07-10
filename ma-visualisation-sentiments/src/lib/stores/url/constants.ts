/**
 * URL State Constants
 *
 * Centralized constants for URL parameter names and valid values.
 */

import {
	DATASET_IDS,
	VIEW_IDS,
	type DatasetId,
	type ViewId,
	type ModelPair
} from '$lib/types/data';

// Valid views that can be set in URL (canonical list lives in types/data)
export const VALID_VIEWS = VIEW_IDS;
export type ValidView = ViewId;

// Valid datasets (canonical list lives in types/data)
export const VALID_DATASETS = DATASET_IDS;
export type ValidDataset = DatasetId;

// Valid comparison pairs
export const VALID_PAIRS: readonly ModelPair[] = [
	'chatgpt-gemini',
	'chatgpt-mistral',
	'gemini-mistral'
] as const;

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
