/**
 * URL State Types
 * 
 * Type definitions for URL state management.
 */

import type { ModelPair } from '$lib/types/data';
import type { Language } from '$lib/i18n';

/**
 * Represents the parsed state from URL parameters
 */
export interface URLState {
  view?: string;
  countries?: string[];
  journals?: string[];
  polarities?: string[];
  subjectivities?: string[];
  centralities?: string[];
  lang?: Language;
  dataset?: string;
  compare?: boolean;
  pair?: ModelPair;
  diffMin?: number;
  diffMax?: number;
  articleId?: string | number;
  comparisonArticleId?: string | number;
}

/**
 * Pending article selection from URL
 */
export interface PendingArticleSelection {
  articleId: string | number;
  dataset: string;
}
