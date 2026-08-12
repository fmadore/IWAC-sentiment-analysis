<!--
  ChartDataTable Component

  A collapsible table of the numbers behind a chart, plus a CSV button.

  Two problems, one component. Every chart in this app renders to a <canvas>
  with an aria-label, which tells a screen-reader user what the chart is about
  and nothing about what it says — there has been no tabular equivalent. And a
  researcher wanting the aggregate behind a chart could previously only export
  all 12,287 article rows and re-derive it.

  Collapsed by default so it never competes with the chart (charts are the
  primary content), but it is a real <table> in the DOM the moment it opens,
  and the disclosure button is reachable by keyboard like any other.

  Callers pass raw numbers and say how each column should read; this component
  owns both renderings. That split is load-bearing: the table on screen follows
  the reader's language (`0,359` in French) while the CSV stays machine-readable
  (`0.359`, no thousands separators, no percent sign). Letting callers pass
  pre-formatted strings, as they once did, meant the export silently inherited
  whatever the interface happened to be displaying.
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { num, dec, pct } from '$lib/i18n/utils';
	import { escapeCSVField, downloadCSVFile } from '$lib/utils/csv';
	import TableIcon from '@lucide/svelte/icons/table';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import DownloadIcon from '@lucide/svelte/icons/download';

	export type ChartDataColumn = {
		/** Header text, already translated. */
		label: string;
		/**
		 * How this column's numbers read on screen. `percent` takes a fraction
		 * between 0 and 1 and shows `58.1%` / `58,1 %`; the CSV gets `58.1`, the
		 * same magnitude the header implies, without the sign. Omit for text.
		 */
		format?: 'integer' | 'decimal' | 'percent';
		/** Decimal places for `decimal` and `percent`. */
		digits?: number;
	};

	/** A missing value: an em dash on screen, an empty cell in the CSV. */
	type Cell = string | number | null;

	interface ChartDataTableProps {
		columns: ChartDataColumn[];
		/** Raw row values, in column order. Formatting happens here, not in the caller. */
		rows: Cell[][];
		/** Filename stem for the CSV export. */
		filenamePrefix: string;
		/** Accessible caption naming what the table contains. */
		caption: string;
	}

	let { columns, rows, filenamePrefix, caption }: ChartDataTableProps = $props();

	let open = $state(false);

	function display(cell: Cell, column: ChartDataColumn | undefined): string {
		if (cell === null || cell === undefined) return '—';
		if (typeof cell !== 'number') return cell;
		switch (column?.format) {
			case 'integer':
				return $num(cell);
			case 'decimal':
				return $dec(cell, column.digits ?? 2);
			case 'percent':
				return $pct(cell, column.digits ?? 1);
			default:
				return String(cell);
		}
	}

	function exportValue(cell: Cell, column: ChartDataColumn | undefined): string {
		if (cell === null || cell === undefined) return '';
		if (typeof cell !== 'number') return cell;
		switch (column?.format) {
			case 'decimal':
				return cell.toFixed(column.digits ?? 2);
			case 'percent':
				return (cell * 100).toFixed(column.digits ?? 1);
			default:
				return String(cell);
		}
	}

	function exportCSV() {
		const lines = [
			columns.map((column) => escapeCSVField(column.label)).join(','),
			...rows.map((row) =>
				row.map((cell, i) => escapeCSVField(exportValue(cell, columns[i]))).join(',')
			)
		];

		const now = new Date();
		const stamp = now.toISOString().split('T')[0];
		downloadCSVFile(lines.join('\n'), `${filenamePrefix}-${stamp}.csv`);
	}
</script>

{#if rows.length > 0}
	<div class="data-disclosure">
		<div class="disclosure-bar">
			<button
				type="button"
				class="disclosure-toggle"
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				<TableIcon size={14} aria-hidden="true" />
				<span>{$t.chartData.showData}</span>
				<span class="chevron" data-open={open}>
					<ChevronDownIcon size={14} aria-hidden="true" />
				</span>
			</button>

			{#if open}
				<button type="button" class="disclosure-export" onclick={exportCSV}>
					<DownloadIcon size={13} aria-hidden="true" />
					<span>{$t.export.exportCSV}</span>
				</button>
			{/if}
		</div>

		{#if open}
			<div class="disclosure-table-wrap">
				<table class="table">
					<caption class="sr-only">{caption}</caption>
					<thead>
						<tr>
							{#each columns as column (column.label)}
								<th scope="col">{column.label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each rows as row, i (i)}
							<tr>
								{#each row as cell, j (j)}
									{#if j === 0}
										<th scope="row">{display(cell, columns[j])}</th>
									{:else}
										<td>{display(cell, columns[j])}</td>
									{/if}
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}

<style>
	.data-disclosure {
		margin-top: var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--border-subtle);
	}

	.disclosure-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.disclosure-toggle,
	.disclosure-export {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
		background: transparent;
		border: 1px solid var(--border-subtle);
		padding: var(--space-2) var(--space-3);
		cursor: pointer;
		transition:
			color var(--timing-fast) var(--easing-default),
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.disclosure-toggle:hover,
	.disclosure-export:hover {
		color: var(--text-primary);
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}

	.chevron {
		display: inline-flex;
		transition: transform var(--timing-fast) var(--easing-default);
	}

	.chevron[data-open='true'] {
		transform: rotate(180deg);
	}

	.disclosure-table-wrap {
		margin-top: var(--space-3);
		max-height: 24rem;
		overflow: auto;
		border: 1px solid var(--border-subtle);
	}

	.disclosure-table-wrap :global(th),
	.disclosure-table-wrap :global(td) {
		white-space: nowrap;
	}

	.disclosure-table-wrap :global(tbody th) {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		text-transform: none;
		letter-spacing: normal;
		background: transparent;
		color: var(--text-primary);
		text-align: left;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.chevron,
		.disclosure-toggle,
		.disclosure-export {
			transition: none;
		}
	}
</style>
