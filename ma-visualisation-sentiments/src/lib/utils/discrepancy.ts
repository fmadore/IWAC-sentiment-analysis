/**
 * Shared discrepancy display utilities
 *
 * Used by ComparisonTable and ComparisonDetail for styling
 * discrepancy severity levels.
 */

/**
 * Get a text color class based on the discrepancy severity.
 */
export function getDiffClass(diff: number): string {
	if (diff === 0) return 'text-white/40';
	if (diff === 1) return 'text-yellow-400';
	if (diff === 2) return 'text-orange-400';
	return 'text-red-400';
}

/**
 * Get a badge variant class based on the discrepancy severity.
 */
export function getDiffBadgeClass(diff: number): string {
	if (diff === 0) return 'variant-ghost';
	if (diff === 1) return 'variant-soft-warning';
	if (diff === 2) return 'variant-soft-error';
	return 'variant-filled-error';
}

/**
 * Format a discrepancy value as the shared "±N" / "=" indicator.
 */
export function formatDiff(diff: number): string {
	return diff > 0 ? `±${diff}` : '=';
}
