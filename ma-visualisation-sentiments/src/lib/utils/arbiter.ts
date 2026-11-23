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

import type { Translations } from '#lib/i18n/types.js';

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

/**
 * Map a v1 arbiter verdict from the judge's blind slots to pair order.
 *
 * The archived arbiter saw the pair's two analyses as "Model A" / "Model B"
 * under a per-run blind assignment, so its `model_a` is the pair's first model
 * only when `modelAIsFirst` (the store's `arbiterModelAIsFirst`). With the
 * assignment swapped — `gemini-mistral` — `model_a` is the pair's second
 * model. The result reads `model_a` as the pair's first model, ready for a
 * label from `getPairModelNames`, a VerdictBadge and `VERDICT_ORDER`. Ties
 * (`both`, `neither`) and any other value pass through unchanged.
 */
export function toPairOrderVerdict<V extends string>(verdict: V, modelAIsFirst: boolean): V {
	if (modelAIsFirst) return verdict;
	if (verdict === 'model_a') return 'model_b' as V;
	if (verdict === 'model_b') return 'model_a' as V;
	return verdict;
}

/**
 * Percentage points between two preference shares (each 0–100), as a number.
 *
 * Kept numeric so the caller can compare it with a threshold and format it
 * per language afterwards; the archive cards once compared the formatted
 * string, which is NaN in French ("12,3").
 */
export function leadPoints(firstPercentage: number, secondPercentage: number): number {
	return Math.abs(firstPercentage - secondPercentage);
}

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

/**
 * Translated label for a confidence level. Pass the current `$t` object.
 *
 * No English fallback: both catalogues carry the three keys (fr.ts is typed
 * against en.ts), and a literal 'High' here used to be what a French reader
 * would see if the catalogue lookup ever came back empty.
 */
export function getConfidenceLabel(level: string, t: Translations): string {
	switch (level) {
		case 'high':
			return t.arbiter.confidenceHigh;
		case 'medium':
			return t.arbiter.confidenceMedium;
		case 'low':
			return t.arbiter.confidenceLow;
		default:
			return level;
	}
}
