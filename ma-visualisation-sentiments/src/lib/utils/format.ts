/**
 * Shared formatting utilities
 *
 * Consolidates duplicated formatting functions from across the component tree.
 */

import { currentLanguage, t } from '$lib/i18n';
import { get } from 'svelte/store';

/**
 * Format a date string for display using the current language locale.
 * Used by ArticleTable, ArticleDetail, ComparisonDetail, ComparisonTable,
 * ArbiterArticleDetailModal.
 */
export function formatDate(dateStr: string | null | undefined): string {
	const translations = get(t);
	if (!dateStr) return translations.messages?.noData || 'N/A';

	try {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) {
			return dateStr;
		}

		const lang = get(currentLanguage);
		const locale = lang === 'en' ? 'en-US' : 'fr-FR';
		return date.toLocaleDateString(locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	} catch {
		return dateStr || '';
	}
}

/**
 * Build the IWAC article URL from an article ID.
 * Used by ArticleDetail, ComparisonDetail, ArbiterArticleDetailModal.
 */
export function getArticleUrl(id: string | number | null | undefined): string {
	if (!id) return '#';
	return `https://islam.zmo.de/s/afrique_ouest/item/${id}`;
}

/**
 * Get a model's display name from its ID using the available datasets list.
 */
export function getModelDisplayName(
	modelId: string,
	datasets: { id: string; name: string }[]
): string {
	return datasets.find((d) => d.id === modelId)?.name || modelId;
}
