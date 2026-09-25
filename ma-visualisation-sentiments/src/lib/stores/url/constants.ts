/**
 * URL State Constants
 *
 * Centralized constants for URL parameter names and valid values.
 */

import {
	DATASET_IDS,
	MODEL_PAIR_IDS,
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
export const VALID_PAIRS: readonly ModelPair[] = MODEL_PAIR_IDS;

// URL parameter names: every parameter the app reads or writes, except the
// per-view presentation options, whose names are the keys of VIEW_OPTIONS
// (view-options.svelte.ts).
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
	comparisonArticleId: 'comparisonArticleId',
	arbiterArticleId: 'arbiterArticleId',
	/** Distinguishes repeated literal facet values from legacy comma-separated lists. */
	urlVersion: 'urlVersion',
	/** Comparison: discrepancy dimensions, comma-separated. */
	dimensions: 'dimensions',
	/** Comparison: exclude non-comparable rows. */
	excludeNA: 'excludeNA',
	/** Agreement: pair or panel scope. */
	scope: 'scope',
	/** Agreement: the dimension on screen. */
	dimension: 'dimension',
	/** Agreement: include declined ratings. */
	declined: 'declined',
	/** Chart interactions (hidden series, zoom), as JSON. */
	chartState: 'chartState'
} as const;

export type URLParamKey = keyof typeof URL_PARAMS;
