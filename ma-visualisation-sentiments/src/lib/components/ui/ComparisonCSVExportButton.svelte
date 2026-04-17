<script lang="ts">
	import { filteredComparisons, availableDatasets } from '$lib/stores';
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
		const modelAName = getModelDisplayName(firstComp.modelAId, $availableDatasets);
		const modelBName = getModelDisplayName(firstComp.modelBId, $availableDatasets);

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
			const comparisons = $filteredComparisons;

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
	const comparisonCount = $derived($filteredComparisons.length);
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
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-tertiary-500) 15%, transparent),
			color-mix(in oklab, var(--color-tertiary-600) 10%, transparent)
		);
		border: 1px solid color-mix(in oklab, var(--color-tertiary-500) 30%, transparent);
		color: var(--color-tertiary-500);
		font-weight: var(--font-weight-semibold);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur-md));
		box-shadow:
			0 4px 12px color-mix(in oklab, var(--color-tertiary-500) 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		transition:
			background-color var(--timing-normal) var(--easing-default),
			border-color var(--timing-normal) var(--easing-default),
			color var(--timing-normal) var(--easing-default),
			transform var(--timing-normal) var(--easing-default),
			box-shadow var(--timing-normal) var(--easing-default);
		position: relative;
		overflow: hidden;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-base);
		white-space: nowrap;
	}

	.csv-export-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in oklab, var(--color-surface-50) 10%, transparent),
			transparent
		);
		transition: left var(--timing-slow) ease;
	}

	.csv-export-btn:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-tertiary-500) 25%, transparent),
			color-mix(in oklab, var(--color-tertiary-600) 15%, transparent)
		);
		border-color: color-mix(in oklab, var(--color-tertiary-500) 50%, transparent);
		color: var(--color-tertiary-600);
		transform: translateY(-2px);
		box-shadow:
			0 8px 25px color-mix(in oklab, var(--color-tertiary-500) 25%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
	}

	.csv-export-btn:hover:not(:disabled)::before {
		left: 100%;
	}

	.csv-export-btn:active:not(:disabled) {
		transform: translateY(-1px);
		box-shadow:
			0 4px 12px color-mix(in oklab, var(--color-tertiary-500) 20%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	.csv-export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.button-text {
		transition:
			opacity var(--timing-fast) var(--easing-default),
			transform var(--timing-fast) var(--easing-default);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.csv-export-btn {
			padding: var(--space-2) var(--space-4);
			font-size: 0.8rem;
		}

		.button-text {
			display: none;
		}
	}
</style>
