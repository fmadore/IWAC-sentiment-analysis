<!--
  ArbiterCSVExportButton Component
  
  Exports arbiter evaluation data to CSV format.
  Includes article metadata, both model analyses, and arbiter verdicts.
  
  Features:
  - Exports all evaluated articles with arbiter verdicts
  - Includes dimension-by-dimension verdicts
  - Styled with arbiter amber/gold theme
-->
<script lang="ts">
	import {
		arbiterEvaluations,
		comparisonData,
		availableDatasets,
		comparisonPair,
		getActualModelName
	} from '$lib/stores';
	import { getJournalName } from '$lib/utils';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { getModelsFromPair, type ArbiterEvaluationData } from '$lib/types/data';
	import { get } from 'svelte/store';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { escapeCSVField, formatDateForCSV, downloadCSVFile } from '$lib/utils/csv';

	let isExporting = $state(false);

	// Get model names from current pair
	const modelNames = $derived.by(() => {
		const [modelAId, modelBId] = getModelsFromPair($comparisonPair);
		const datasets = $availableDatasets;
		const modelAName = datasets.find((d) => d.id === modelAId)?.name || modelAId;
		const modelBName = datasets.find((d) => d.id === modelBId)?.name || modelBId;
		return { modelAName, modelBName };
	});

	// Translate verdict to user-friendly text
	// Uses getActualModelName to correctly map arbiter's model_a/model_b to actual model names
	// based on the blind assignment (arbiter_model_a/arbiter_model_b from metadata)
	function translateVerdict(verdict: 'model_a' | 'model_b' | 'both' | 'neither'): string {
		switch (verdict) {
			case 'model_a':
			case 'model_b':
				// Use getActualModelName which correctly maps arbiter's blind assignment
				return getActualModelName(verdict);
			case 'both':
				return $t.arbiter?.bothEqual || 'Both equal';
			case 'neither':
				return $t.arbiter?.neitherAccurate || 'Neither accurate';
			default:
				return verdict;
		}
	}

	// Translate confidence level
	function translateConfidence(level: 'high' | 'medium' | 'low'): string {
		switch (level) {
			case 'high':
				return $t.arbiter?.confidenceHigh || 'High';
			case 'medium':
				return $t.arbiter?.confidenceMedium || 'Medium';
			case 'low':
				return $t.arbiter?.confidenceLow || 'Low';
			default:
				return level;
		}
	}

	// Type for individual evaluation items from ArbiterEvaluationData.evaluations
	type ArbiterEvaluationItem = ArbiterEvaluationData['evaluations'][number];

	// Function to convert arbiter evaluations to CSV
	function convertToCSV(evaluations: ArbiterEvaluationItem[]): string {
		if (evaluations.length === 0) return '';

		const comparisons = get(comparisonData);

		// Define CSV headers based on current language
		const headers = [
			$t.table?.articleTitle || 'Title',
			$t.filters?.country || 'Country',
			$t.filters?.journal || 'Newspaper',
			$t.table?.date || 'Date',
			// Model A columns
			modelNames.modelAName + ' - ' + ($t.table?.polarity || 'Polarity'),
			modelNames.modelAName + ' - ' + ($t.table?.subjectivity || 'Subjectivity'),
			modelNames.modelAName + ' - ' + ($t.table?.centrality || 'Centrality'),
			// Model B columns
			modelNames.modelBName + ' - ' + ($t.table?.polarity || 'Polarity'),
			modelNames.modelBName + ' - ' + ($t.table?.subjectivity || 'Subjectivity'),
			modelNames.modelBName + ' - ' + ($t.table?.centrality || 'Centrality'),
			// Arbiter overall verdict columns
			$t.arbiter?.overallVerdict || 'Overall Verdict',
			$t.arbiter?.confidenceLevel || 'Confidence Level',
			// Arbiter Polarity columns
			($t.arbiter?.polarity || 'Polarity') + ' - ' + ($t.arbiter?.arbiterScore || 'Arbiter Score'),
			($t.arbiter?.polarity || 'Polarity') +
				' - ' +
				($t.arbiter?.arbiterJustification || 'Arbiter Justification'),
			($t.arbiter?.polarity || 'Polarity') + ' - ' + ($t.arbiter?.verdict || 'Verdict'),
			($t.arbiter?.polarity || 'Polarity') +
				' - ' +
				($t.arbiter?.verdictExplanation || 'Verdict Explanation'),
			// Arbiter Subjectivity columns
			($t.arbiter?.subjectivity || 'Subjectivity') +
				' - ' +
				($t.arbiter?.arbiterScore || 'Arbiter Score'),
			($t.arbiter?.subjectivity || 'Subjectivity') +
				' - ' +
				($t.arbiter?.arbiterJustification || 'Arbiter Justification'),
			($t.arbiter?.subjectivity || 'Subjectivity') + ' - ' + ($t.arbiter?.verdict || 'Verdict'),
			($t.arbiter?.subjectivity || 'Subjectivity') +
				' - ' +
				($t.arbiter?.verdictExplanation || 'Verdict Explanation'),
			// Arbiter Centrality columns
			($t.arbiter?.centrality || 'Centrality') +
				' - ' +
				($t.arbiter?.arbiterScore || 'Arbiter Score'),
			($t.arbiter?.centrality || 'Centrality') +
				' - ' +
				($t.arbiter?.arbiterJustification || 'Arbiter Justification'),
			($t.arbiter?.centrality || 'Centrality') + ' - ' + ($t.arbiter?.verdict || 'Verdict'),
			($t.arbiter?.centrality || 'Centrality') +
				' - ' +
				($t.arbiter?.verdictExplanation || 'Verdict Explanation'),
			// Overall justification
			$t.arbiter?.arbiterJustification || 'Overall Justification',
			$t.export?.articleId || 'Article ID'
		];

		// Create CSV content
		const csvRows = [
			// Header row
			headers.map((header) => escapeCSVField(header)).join(','),

			// Data rows
			...evaluations.map((evaluation) => {
				// Find matching comparison data for article metadata
				const comparison = comparisons?.find(
					(c) => String(c.article['o:id']) === String(evaluation.article_id)
				);

				const row = [
					// Article info
					escapeCSVField(comparison?.article['o:title'] || `Article ${evaluation.article_id}`),
					escapeCSVField(comparison?.article.Country || ''),
					escapeCSVField(comparison ? getJournalName(comparison.article) : ''),
					escapeCSVField(formatDateForCSV(comparison?.article.publication_date)),

					// Model A analysis
					escapeCSVField(translateSentimentValue(comparison?.modelA?.polarite, $currentLanguage)),
					escapeCSVField(
						translateSubjectivityScore(comparison?.modelA?.subjectivite_score, $currentLanguage)
					),
					escapeCSVField(
						translateSentimentValue(
							comparison?.modelA?.centralite_islam_musulmans,
							$currentLanguage
						)
					),

					// Model B analysis
					escapeCSVField(translateSentimentValue(comparison?.modelB?.polarite, $currentLanguage)),
					escapeCSVField(
						translateSubjectivityScore(comparison?.modelB?.subjectivite_score, $currentLanguage)
					),
					escapeCSVField(
						translateSentimentValue(
							comparison?.modelB?.centralite_islam_musulmans,
							$currentLanguage
						)
					),

					// Arbiter overall verdicts
					escapeCSVField(translateVerdict(evaluation.arbiter.overall_winner)),
					escapeCSVField(translateConfidence(evaluation.arbiter.confidence_level)),
					// Arbiter Polarity
					escapeCSVField(evaluation.arbiter.polarity.score),
					escapeCSVField(evaluation.arbiter.polarity.justification),
					escapeCSVField(translateVerdict(evaluation.arbiter.polarity.preferred_model)),
					escapeCSVField(evaluation.arbiter.polarity.verdict_explanation),
					// Arbiter Subjectivity
					escapeCSVField(evaluation.arbiter.subjectivity.score),
					escapeCSVField(evaluation.arbiter.subjectivity.justification),
					escapeCSVField(translateVerdict(evaluation.arbiter.subjectivity.preferred_model)),
					escapeCSVField(evaluation.arbiter.subjectivity.verdict_explanation),
					// Arbiter Centrality
					escapeCSVField(evaluation.arbiter.centrality.score),
					escapeCSVField(evaluation.arbiter.centrality.justification),
					escapeCSVField(translateVerdict(evaluation.arbiter.centrality.preferred_model)),
					escapeCSVField(evaluation.arbiter.centrality.verdict_explanation),
					// Overall justification
					escapeCSVField(evaluation.arbiter.overall_explanation),
					escapeCSVField(evaluation.article_id)
				];
				return row.join(',');
			})
		];

		return csvRows.join('\n');
	}

	// Function to generate filename with current date and model pair info
	function generateFilename(): string {
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
		const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format

		return `iwac-arbiter-evaluations-${dateStr}-${timeStr}.csv`;
	}

	// Function to download CSV
	async function downloadCSV() {
		if (isExporting) return;

		isExporting = true;

		try {
			const evaluations = arbiterEvaluations.current?.evaluations;

			if (!evaluations || evaluations.length === 0) {
				alert($t.export?.noDataToExport || 'No data to export');
				return;
			}

			const csvContent = convertToCSV(evaluations);
			downloadCSVFile(csvContent, generateFilename());
		} catch (error) {
			console.error('Error exporting arbiter CSV:', error);
			alert($t.export?.exportError || 'Error exporting CSV');
		} finally {
			isExporting = false;
		}
	}

	// Get the count of evaluations
	const evaluationCount = $derived(arbiterEvaluations.current?.evaluations?.length ?? 0);
</script>

<button
	class="csv-export-btn arbiter-export"
	onclick={downloadCSV}
	disabled={isExporting || evaluationCount === 0}
	title={evaluationCount === 0
		? $t.export?.noDataToExport || 'No data to export'
		: $t.export?.downloadCSV || 'Download CSV'}
>
	<DownloadIcon size={16} class={isExporting ? 'animate-bounce' : ''} />
	<span class="button-text">
		{#if isExporting}
			{$t.export?.exporting || 'Exporting'}...
		{:else}
			{$t.export?.exportCSV || 'Export CSV'} ({evaluationCount})
		{/if}
	</span>
</button>

<style>
	.csv-export-btn {
		background: linear-gradient(
			135deg,
			var(--sentiment-arbiter-bg),
			color-mix(in oklab, var(--sentiment-arbiter) 10%, transparent)
		);
		border: 1px solid var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter);
		font-weight: var(--font-weight-semibold);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-lg);
		backdrop-filter: blur(var(--glass-blur-md));
		box-shadow:
			0 4px 12px var(--sentiment-arbiter-bg),
			inset 0 1px 0 var(--surface-subtle);
		transition: all var(--timing-normal) var(--easing-default);
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
		background: linear-gradient(90deg, transparent, var(--surface-subtle), transparent);
		transition: left var(--timing-slow) ease;
	}

	.csv-export-btn:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--sentiment-arbiter) 25%, transparent),
			color-mix(in oklab, var(--sentiment-arbiter) 15%, transparent)
		);
		border-color: color-mix(in oklab, var(--sentiment-arbiter) 50%, transparent);
		color: var(--sentiment-arbiter-light);
		transform: translateY(-2px);
		box-shadow:
			0 8px 25px color-mix(in oklab, var(--sentiment-arbiter) 25%, transparent),
			inset 0 1px 0 var(--surface-active);
	}

	.csv-export-btn:hover:not(:disabled)::before {
		left: 100%;
	}

	.csv-export-btn:active:not(:disabled) {
		transform: translateY(-1px);
		box-shadow:
			0 4px 12px var(--sentiment-arbiter-bg),
			inset 0 1px 0 var(--surface-subtle);
	}

	.csv-export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.button-text {
		transition: all var(--timing-fast) var(--easing-default);
	}

	.csv-export-btn :global(svg) {
		transition: transform var(--timing-normal) var(--easing-default);
		flex-shrink: 0;
	}

	.csv-export-btn:hover:not(:disabled) :global(svg) {
		transform: scale(1.1);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.csv-export-btn {
			padding: var(--space-2) var(--space-4);
			font-size: var(--font-size-xs);
		}

		.button-text {
			display: none;
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

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.csv-export-btn,
		.csv-export-btn::before,
		.button-text,
		.csv-export-btn :global(svg) {
			transition: none;
		}

		.csv-export-btn:hover:not(:disabled) {
			transform: none;
		}

		:global(.animate-bounce) {
			animation: none;
		}
	}
</style>
