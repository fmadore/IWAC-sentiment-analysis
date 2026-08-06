/**
 * The single source of truth for turning a discrepancy magnitude into the
 * styling hook that resolves its colours — the same shape as
 * `sentimentTokens.ts`, for the same reason.
 *
 * Colours live in `app.css`, which maps `[data-discrepancy]` onto three custom
 * properties:
 *
 *   --discrepancy-fg      text colour
 *   --discrepancy-bg      fill
 *   --discrepancy-border  border colour
 *
 * This module used to return Tailwind colour utilities and Skeleton v2 badge
 * variants. The former hardcoded colour outside the token layer; the latter
 * named classes that no stylesheet in this project defines any more, so every
 * discrepancy badge had been rendering unstyled without anyone noticing.
 *
 * Used by ComparisonTable and ComparisonDetail.
 */

/** Discrepancy severity, widening as the two models disagree by more steps. */
export type DiscrepancySlug = 'none' | 'minor' | 'moderate' | 'severe';

/**
 * Bucket a raw step difference. Anything at or below zero is agreement; three
 * or more steps apart on a five-point scale is the top bucket.
 */
export function discrepancyLevel(diff: number): DiscrepancySlug {
	if (diff <= 0) return 'none';
	if (diff === 1) return 'minor';
	if (diff === 2) return 'moderate';
	return 'severe';
}

/**
 * Ready to spread onto an element: `{...discrepancyAttributes(2)}` emits
 * `data-discrepancy="moderate"`.
 */
export function discrepancyAttributes(diff: number): { 'data-discrepancy': DiscrepancySlug } {
	return { 'data-discrepancy': discrepancyLevel(diff) };
}

/**
 * Format a discrepancy value as the shared "±N" / "=" indicator.
 */
export function formatDiff(diff: number): string {
	return diff > 0 ? `±${diff}` : '=';
}
