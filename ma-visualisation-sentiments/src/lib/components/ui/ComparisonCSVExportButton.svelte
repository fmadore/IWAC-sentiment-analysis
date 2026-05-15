<script lang="ts">
	import { comparisonState, datasetState } from '$lib/stores';
	import { getJournalName } from '$lib/utils';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import type { ComparisonData } from '$lib/types/data';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { escapeCSVField, formatDateForCSV, downloadCSVFile } from '$lib/utils/csv';
	import { getModelDisplayName } from '$lib/utils/format';

	let isExporting = $state(false);

	// Function to convert comparison data to CSV
	function convertToCSV(comparisons: ComparisonData[]): string {
		if (comparisons.length === 0) return '';

		// Get model names from first comparison (they're all the same pair)
		const firstComp = comparisons[0];
		const modelAName = getModelDisplayName(firstComp.modelAId, datasetState.available);
		const modelBName = getModelDisplayName(firstComp.modelBId, datasetState.available);

		// Define CSV headers based on current language
		const headers = [
			$t.table.articleTitle,
			$t.filters.country,
			$t.filters.journal,
			$t.table.date,
			// Model A columns
			modelAName + ' - ' + $t.table.polarity,
			modelAName + ' - ' + $t.table.subjectivity,
			modelAName + ' - ' + $t.table.centrality,
			modelAName + ' - ' + $t.export.polarityJustification,
			modelAName + ' - ' + $t.export.subjectivityJustification,
			modelAName + ' - ' + $t.export.centralityJustification,
			// Model B columns
			modelBName + ' - ' + $t.table.polarity,
			modelBName + ' - ' + $t.table.subjectivity,
			modelBName + ' - ' + $t.table.centrality,
			modelBName + ' - ' + $t.export.polarityJustification,
			modelBName + ' - ' + $t.export.subjectivityJustification,
			modelBName + ' - ' + $t.export.centralityJustification,
			// Discrepancy columns
			$t.comparison.polarity + ' ' + $t.comparison.pointsDifference,
			$t.comparison.subjectivity + ' ' + $t.comparison.pointsDifference,
			$t.comparison.centrality + ' ' + $t.comparison.pointsDifference,
			$t.comparison.totalDiscrepancy,
			$t.export.articleId
		];

		// Create CSV content
		const csvRows = [
			// Header row
			headers.map((header) => escapeCSVField(header)).join(','),

			// Data rows
			...comparisons.map((comparison) => {
				const row = [
					// Article info
					escapeCSVField(comparison.article['o:title']),
					escapeCSVField(comparison.article.Country),
					escapeCSVField(getJournalName(comparison.article)),
					escapeCSVField(formatDateForCSV(comparison.article.publication_date)),

					// Model A analysis
					escapeCSVField(translateSentimentValue(comparison.modelA?.polarite, $currentLanguage)),
					escapeCSVField(
						translateSubjectivityScore(comparison.modelA?.subjectivite_score, $currentLanguage)
					),
					escapeCSVField(
						translateSentimentValue(comparison.modelA?.centralite_islam_musulmans, $currentLanguage)
					),
					escapeCSVField(comparison.modelA?.polarite_justification),
					escapeCSVField(comparison.modelA?.subjectivite_justification),
					escapeCSVField(comparison.modelA?.centralite_justification),

					// Model B analysis
					escapeCSVField(translateSentimentValue(comparison.modelB?.polarite, $currentLanguage)),
					escapeCSVField(
						translateSubjectivityScore(comparison.modelB?.subjectivite_score, $currentLanguage)
					),
					escapeCSVField(
						translateSentimentValue(comparison.modelB?.centralite_islam_musulmans, $currentLanguage)
					),
					escapeCSVField(comparison.modelB?.polarite_justification),
					escapeCSVField(comparison.modelB?.subjectivite_justification),
					escapeCSVField(comparison.modelB?.centralite_justification),

					// Discrepancies
					escapeCSVField(comparison.discrepancies.polarityDiff.toString()),
					escapeCSVField(comparison.discrepancies.subjectivityDiff.toString()),
					escapeCSVField(comparison.discrepancies.centralityDiff.toString()),
					escapeCSVField(comparison.discrepancies.totalDiff.toString()),
					escapeCSVField(comparison.article['o:id']?.toString())
				];
				return row.join(',');
			})
		];

		return csvRows.join('\n');
	}

	// Function to generate filename with current date and comparison info
	function generateFilename(): string {
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
		const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format

		return `iwac-comparison-${dateStr}-${timeStr}.csv`;
	}

	// Function to download CSV
	async function downloadCSV() {
		if (isExporting) return;

		isExporting = true;

		try {
			const comparisons = comparisonState.filtered;

			if (comparisons.length === 0) {
				alert($t.export.noDataToExport);
				return;
			}

			const csvContent = convertToCSV(comparisons);
			downloadCSVFile(csvContent, generateFilename());
		} catch (error) {
			console.error('Error exporting comparison CSV:', error);
			alert($t.export.exportError);
		} finally {
			isExporting = false;
		}
	}

	// Get the count of filtered comparisons
	const comparisonCount = $derived(comparisonState.filtered.length);
</script>

<button
	class="csv-export-btn"
	onclick={downloadCSV}
	disabled={isExporting || comparisonCount === 0}
	title={comparisonCount === 0 ? $t.export.noDataToExport : $t.export.downloadCSV}
>
	<DownloadIcon size={16} class={isExporting ? 'animate-bounce' : ''} />
	<span class="button-text">
		{#if isExporting}
			{$t.export.exporting}...
		{:else}
			{$t.export.exportCSV} ({comparisonCount})
		{/if}
	</span>
</button>

<style>
	.csv-export-btn {
		background: color-mix(in oklab, var(--sentiment-comparison-light) 12%, transparent);
		border: 1px solid color-mix(in oklab, var(--sentiment-comparison-light) 32%, transparent);
		color: var(--sentiment-comparison-light);
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
		background: color-mix(in oklab, var(--sentiment-comparison-light) 22%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-comparison-light) 50%, transparent);
		color: var(--text-primary);
	}

	.csv-export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.button-text {
			display: none;
		}
	}
</style>
