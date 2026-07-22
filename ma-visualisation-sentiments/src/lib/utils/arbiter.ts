/**
 * Shared arbiter display utilities
 *
 * Consolidates the verdict/confidence badge mappers and sort-order maps that
 * were previously copy-pasted between ArbiterSection.svelte and
 * ArbiterArticleTable.svelte. The badge classes are the semantic
 * `.badge-verdict-*` / `.badge-confidence-*` classes defined in app.css.
 *
 * Pure functions only — the current `$t` translations object is passed in as
 * a parameter so this module never subscribes to stores.
 */

import type { Translations } from '$lib/i18n/types';

/** Sort weight for overall verdicts (higher = model A preferred). */
export const VERDICT_ORDER: Record<string, number> = {
	model_a: 4,
	model_b: 3,
	both: 2,
	neither: 1
};

/** Sort weight for confidence levels (higher = more confident). */
export const CONFIDENCE_ORDER: Record<string, number> = {
	high: 3,
	medium: 2,
	low: 1
};

/** Semantic badge class for an arbiter verdict / preferred model. */
export function getVerdictBadgeClass(verdict: string): string {
	switch (verdict) {
		case 'model_a':
			return 'badge-verdict-win';
		case 'model_b':
			return 'badge-verdict-loss';
		case 'both':
			return 'badge-verdict-both';
		case 'neither':
		default:
			return 'badge-verdict-neither';
	}
}

/** Semantic badge class for an arbiter confidence level. */
export function getConfidenceBadgeClass(level: string): string {
	switch (level) {
		case 'high':
			return 'badge-confidence-high';
		case 'medium':
			return 'badge-confidence-medium';
		case 'low':
			return 'badge-confidence-low';
		default:
			return 'badge-verdict-neither';
	}
}

/** Translated label for a confidence level. Pass the current `$t` object. */
export function getConfidenceLabel(level: string, t: Translations): string {
	switch (level) {
		case 'high':
			return t.arbiter?.confidenceHigh || 'High';
		case 'medium':
			return t.arbiter?.confidenceMedium || 'Medium';
		case 'low':
			return t.arbiter?.confidenceLow || 'Low';
		default:
			return level;
	}
}
