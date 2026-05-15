<script lang="ts">
	import { articleState } from '$lib/stores';
	import { getJournalName } from '$lib/utils';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import type { Article } from '$lib/types/data';
	import DownloadIcon from '@lucide/svelte/icons/download';

	let isExporting = $state(false);

	// Function to escape CSV fields that contain commas, quotes, or newlines
	function escapeCSVField(field: string | null | undefined): string {
		if (field === null || field === undefined) return '';

		const str = String(field);
		// If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
		if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
			return '"' + str.replace(/"/g, '""') + '"';
		}
		return str;
	}

	// Function to format date for CSV
	function formatDateForCSV(dateStr: string | null | undefined): string {
		if (!dateStr) return '';

		try {
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) {
				return dateStr;
			}
			// Return in ISO format (YYYY-MM-DD)
			return date.toISOString().split('T')[0];
		} catch (_error) {
			return dateStr || '';
		}
	}

	// Function to convert articles to CSV
	function convertToCSV(articles: Article[]): string {
		if (articles.length === 0) return '';

		// Define CSV headers based on current language
		const headers = [
			$t.table.articleTitle,
			$t.filters.country,
			$t.filters.journal,
			$t.table.date,
			$t.table.polarity,
			$t.table.subjectivity,
			$t.table.centrality,
			$t.export.polarityJustification,
			$t.export.subjectivityJustification,
			$t.export.centralityJustification,
			$t.export.articleId
		];

		// Create CSV content
		const csvRows = [
			// Header row
			headers.map((header) => escapeCSVField(header)).join(','),

			// Data rows
			...articles.map((article) => {
				const row = [
					escapeCSVField(article['o:title']),
					escapeCSVField(article.Country),
					escapeCSVField(getJournalName(article)),
					escapeCSVField(formatDateForCSV(article.publication_date)),
					escapeCSVField(
						translateSentimentValue(article.sentiment_analysis?.polarite, $currentLanguage)
					),
					escapeCSVField(
						translateSubjectivityScore(
							article.sentiment_analysis?.subjectivite_score,
							$currentLanguage
						)
					),
					escapeCSVField(
						translateSentimentValue(
							article.sentiment_analysis?.centralite_islam_musulmans,
							$currentLanguage
						)
					),
					escapeCSVField(article.sentiment_analysis?.polarite_justification),
					escapeCSVField(article.sentiment_analysis?.subjectivite_justification),
					escapeCSVField(article.sentiment_analysis?.centralite_justification),
					escapeCSVField(article['o:id']?.toString())
				];
				return row.join(',');
			})
		];

		return csvRows.join('\n');
	}

	// Function to generate filename with current date and filters info
	function generateFilename(): string {
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
		const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format

		return `iwac-articles-${dateStr}-${timeStr}.csv`;
	}

	// Function to download CSV
	async function downloadCSV() {
		if (isExporting) return;

		isExporting = true;

		try {
			const articles = articleState.filtered;

			if (articles.length === 0) {
				alert($t.export.noDataToExport);
				return;
			}

			const csvContent = convertToCSV(articles);
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);

			// Create download link
			const link = document.createElement('a');
			link.href = url;
			link.download = generateFilename();
			link.style.display = 'none';

			// Trigger download
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error exporting CSV:', error);
			alert($t.export.exportError);
		} finally {
			isExporting = false;
		}
	}

	// Get the count of filtered articles
	const articleCount = $derived(articleState.filtered.length);
</script>

<button
	class="csv-export-btn"
	onclick={downloadCSV}
	disabled={isExporting || articleCount === 0}
	title={articleCount === 0 ? $t.export.noDataToExport : $t.export.downloadCSV}
>
	<DownloadIcon size={16} class={isExporting ? 'animate-bounce' : ''} />
	<span class="button-text">
		{#if isExporting}
			{$t.export.exporting}...
		{:else}
			{$t.export.exportCSV} ({articleCount})
		{/if}
	</span>
</button>

<style>
	.csv-export-btn {
		background: color-mix(in oklab, var(--sentiment-polarity-very-positive) 12%, transparent);
		border: 1px solid color-mix(in oklab, var(--sentiment-polarity-very-positive) 32%, transparent);
		color: var(--sentiment-polarity-very-positive);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: var(--space-2-5) var(--space-4);
		border-radius: 0;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		white-space: nowrap;
	}

	.csv-export-btn:hover:not(:disabled) {
		background: color-mix(in oklab, var(--sentiment-polarity-very-positive) 22%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-polarity-very-positive) 50%, transparent);
		color: var(--text-primary);
	}

	.csv-export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.csv-export-btn :global(svg) {
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.button-text {
			display: none;
		}

		.csv-export-btn {
			padding: var(--space-2-5);
			width: var(--size-control-lg);
			height: var(--size-control-lg);
			justify-content: center;
		}
	}

	/* Animation for the download icon when exporting */
	:global(.animate-bounce) {
		animation: bounce 1s infinite;
	}

	@keyframes bounce {
		0%,
		20%,
		53%,
		80%,
		100% {
			transform: translate3d(0, 0, 0);
		}
		40%,
		43% {
			transform: translate3d(0, -8px, 0);
		}
		70% {
			transform: translate3d(0, -4px, 0);
		}
		90% {
			transform: translate3d(0, -2px, 0);
		}
	}
</style>
