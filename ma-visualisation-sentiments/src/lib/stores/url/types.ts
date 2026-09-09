/**
 * URL State Types
 *
 * Type definitions for URL state management.
 */

import type { ModelPair } from '$lib/types/data';
import type { Language } from '$lib/i18n';
import type { ValidView, ValidDataset } from './constants';

/**
 * Represents the parsed state from URL parameters
 */
export interface URLState {
	chartState?: import('../chart-interactions.svelte').ChartInteractions;
	options?: Partial<import('../view-options.svelte').ViewOptions>;
	view?: ValidView;
	dimensions?: import('../analysis.svelte').AnalysisDimension[];
	excludeNA?: boolean;
	scope?: 'pair' | 'panel';
	dimension?: import('../analysis.svelte').AnalysisDimension;
	declined?: boolean;
	countries?: string[];
	journals?: string[];
	polarities?: string[];
	subjectivities?: string[];
	centralities?: string[];
	lang?: Language;
	dataset?: ValidDataset;
	compare?: boolean;
	pair?: ModelPair;
	diffMin?: number;
	diffMax?: number;
	articleId?: string | number;
	comparisonArticleId?: string | number;
	arbiterArticleId?: string;
}

/**
 * Pending article selection from URL
 */
export interface PendingArticleSelection {
	articleId: string | number;
	dataset: string;
}
