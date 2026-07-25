<!--
  Shared CSV download button.

  Owns the export flow (in-progress guard, blob download, empty/error
  alerts), the button markup and the bounce animation. Variant-specific
  data + filename are supplied by the thin wrappers
  (CSVExportButton / ComparisonCSVExportButton / ArbiterCSVExportButton);
  `variant` selects the accent styling so the rendered output is unchanged.
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { downloadCSVFile } from '$lib/utils/csv';
	import DownloadIcon from '@lucide/svelte/icons/download';

	interface Props {
		/** Number of rows available; the button is disabled at 0. */
		count: number;
		/** Filename stem, e.g. `iwac-articles`; date/time + .csv are appended. */
		filenamePrefix: string;
		/** Builds the CSV text for the current data. */
		buildCsv: () => string;
		/**
		 * Optional async step run before `buildCsv`, for data the app loads
		 * lazily. Exports include the models' justification prose, which is not
		 * part of the initial payload — this is where it gets fetched. The button
		 * already shows an in-progress state, so the wait is visible.
		 */
		prepare?: () => Promise<void>;
		variant: 'articles' | 'comparison' | 'arbiter';
	}

	let { count, filenamePrefix, buildCsv, prepare, variant }: Props = $props();

	let isExporting = $state(false);

	function generateFilename(): string {
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0];
		const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
		return `${filenamePrefix}-${dateStr}-${timeStr}.csv`;
	}

	async function downloadCSV() {
		if (isExporting) return;
		isExporting = true;

		try {
			if (count === 0) {
				alert($t.export.noDataToExport);
				return;
			}

			await prepare?.();

			const csvContent = buildCsv();
			downloadCSVFile(csvContent, generateFilename());
		} catch (error) {
			console.error('Error exporting CSV:', error);
			alert($t.export.exportError);
		} finally {
			isExporting = false;
		}
	}
</script>

<button
	class="csv-export-btn"
	data-variant={variant}
	onclick={downloadCSV}
	disabled={isExporting || count === 0}
	title={count === 0 ? $t.export.noDataToExport : $t.export.downloadCSV}
>
	<DownloadIcon size={16} class={isExporting ? 'animate-bounce' : ''} />
	<span class="button-text">
		{#if isExporting}
			{$t.export.exporting}...
		{:else}
			{$t.export.exportCSV} ({count})
		{/if}
	</span>
</button>

<style>
	.csv-export-btn {
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

	.csv-export-btn :global(svg) {
		flex-shrink: 0;
	}

	.csv-export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* --- Articles variant --- */
	.csv-export-btn[data-variant='articles'] {
		background: color-mix(in oklab, var(--sentiment-polarity-very-positive) 12%, transparent);
		border: 1px solid color-mix(in oklab, var(--sentiment-polarity-very-positive) 32%, transparent);
		color: var(--sentiment-polarity-very-positive);
	}
	.csv-export-btn[data-variant='articles']:hover:not(:disabled) {
		background: color-mix(in oklab, var(--sentiment-polarity-very-positive) 22%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-polarity-very-positive) 50%, transparent);
		color: var(--text-primary);
	}

	/* --- Comparison variant --- */
	.csv-export-btn[data-variant='comparison'] {
		background: color-mix(in oklab, var(--sentiment-comparison-light) 12%, transparent);
		border: 1px solid color-mix(in oklab, var(--sentiment-comparison-light) 32%, transparent);
		color: var(--sentiment-comparison-light);
	}
	.csv-export-btn[data-variant='comparison']:hover:not(:disabled) {
		background: color-mix(in oklab, var(--sentiment-comparison-light) 22%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-comparison-light) 50%, transparent);
		color: var(--text-primary);
	}

	/* --- Arbiter variant --- */
	.csv-export-btn[data-variant='arbiter'] {
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter-light);
	}
	.csv-export-btn[data-variant='arbiter']:hover:not(:disabled) {
		background: color-mix(in oklab, var(--sentiment-arbiter) 22%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-arbiter) 55%, transparent);
		color: var(--text-primary);
	}

	/* Articles collapses to a square icon button on very small screens. */
	@media (max-width: 480px) {
		.csv-export-btn[data-variant='articles'] .button-text {
			display: none;
		}
		.csv-export-btn[data-variant='articles'] {
			padding: var(--space-2-5);
			width: var(--size-control-lg);
			height: var(--size-control-lg);
			justify-content: center;
		}
	}

	@media (max-width: 640px) {
		.csv-export-btn[data-variant='comparison'] .button-text,
		.csv-export-btn[data-variant='arbiter'] .button-text {
			display: none;
		}
	}

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

	@media (prefers-reduced-motion: reduce) {
		.csv-export-btn {
			transition: none;
		}
		:global(.animate-bounce) {
			animation: none;
		}
	}
</style>
