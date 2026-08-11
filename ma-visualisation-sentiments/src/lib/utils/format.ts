/**
 * Shared formatting utilities
 *
 * Consolidates duplicated formatting functions from across the component tree.
 */

import type { Article } from '$lib/types/data';
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

/**
 * Display names for a list of model ids, in the order given.
 *
 * The three-way charts each need the whole generation's names to label a series,
 * an axis or a triangle corner; mapping `getModelDisplayName` in every one of
 * them is the same line four times.
 */
export function getModelDisplayNames(
	modelIds: readonly string[],
	datasets: { id: string; name: string }[]
): string[] {
	return modelIds.map((id) => getModelDisplayName(id, datasets));
}

/**
 * Get the journal name for an article consistently across the app.
 */
export function getJournalName(article: Article): string {
	return article.journal_source || article.Newspaper || 'Inconnu';
}
