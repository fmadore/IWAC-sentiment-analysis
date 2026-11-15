<!--
  TableControls

  The control set above every article table: an optional table/cards layout
  toggle, an optional slot for actions (a CSV button), the "Showing x–y of n"
  line, the items-per-page select and the page bar — all through
  PaginationControls, so there is one per-page select in the app.

  ComparisonTable and ArbiterArticleTable used to hand-roll the toggle and the
  select (49 duplicated CSS lines); neither toggle set `aria-pressed`, and the
  comparison select reused PaginationControls' default id. The toggle here is a
  labelled group of pressed-state buttons. The table option can be disabled —
  below the width where its columns fit — and the caller keeps the layout it
  renders consistent with that.

  `accent="arbiter"` retints the active page marker and the toggle in the
  judge's amber, as the arbiter tables always have.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PaginationState } from '#lib/utils/pagination.svelte.js';
	import { t } from '#lib/i18n/index.js';
	import { num } from '#lib/i18n/utils.js';
	import PaginationControls from './PaginationControls.svelte';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import TableIcon from '@lucide/svelte/icons/table';

	type Layout = 'table' | 'cards';

	interface TableControlsProps {
		pagination: PaginationState;
		/** Rows across all pages. */
		total: number;
		/** Unique id for the items-per-page select. */
		selectId: string;
		/** Word after the total, e.g. "articles". */
		totalNoun?: string;
		/** Current layout; omit to hide the toggle. */
		layout?: Layout;
		onLayoutChange?: (layout: Layout) => void;
		/** Disable the table option (its columns do not fit). */
		tableDisabled?: boolean;
		/** Extra controls beside the results line, such as a CSV button. */
		actions?: Snippet;
		/** Show Previous/Next words beside the arrows. */
		showLabels?: boolean;
		/** Render the numbered page bar (when there is more than one page). */
		showPages?: boolean;
		accent?: 'primary' | 'arbiter';
	}

	let {
		pagination,
		total,
		selectId,
		totalNoun,
		layout,
		onLayoutChange,
		tableDisabled = false,
		actions,
		showLabels = true,
		showPages = true,
		accent = 'primary'
	}: TableControlsProps = $props();

	const layoutOptions = $derived<{ value: Layout; label: string; icon: typeof TableIcon }[]>([
		{ value: 'table', label: $t.common.tableView, icon: TableIcon },
		{ value: 'cards', label: $t.common.cardView, icon: LayoutGridIcon }
	]);
</script>

<div class="table-controls" data-accent={accent}>
	<PaginationControls
		{pagination}
		{showLabels}
		showItemsPerPage
		{selectId}
		showNav={showPages && pagination.totalPages > 1}
	>
		{#snippet resultsInfo()}
			<div class="controls-lead">
				{#if layout && onLayoutChange}
					<div class="layout-toggle" role="group" aria-label={$t.table.layout}>
						{#each layoutOptions as option (option.value)}
							<button
								type="button"
								class="layout-btn"
								data-active={layout === option.value}
								aria-pressed={layout === option.value}
								disabled={option.value === 'table' && tableDisabled}
								onclick={() => onLayoutChange(option.value)}
							>
								<option.icon size={14} aria-hidden="true" />
								<span>{option.label}</span>
							</button>
						{/each}
					</div>
				{/if}
				{#if actions}{@render actions()}{/if}
				<span class="results-info">
					{$t.table.showingItems}
					<strong
						>{$num(total === 0 ? 0 : pagination.startIndex + 1)}–{$num(pagination.endIndex)}</strong
					>
					{$t.common.of}
					<strong>{$num(total)}</strong>
					{#if totalNoun}{totalNoun}{/if}
				</span>
			</div>
		{/snippet}
	</PaginationControls>
</div>

<style>
	.table-controls {
		--layout-active-fg: var(--accent);
		--layout-active-bg: var(--accent-soft);

		padding: var(--space-3);
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	.table-controls[data-accent='arbiter'] {
		/* The active page marker and toggle take the arbiter amber. */
		--pagination-active-bg: var(--sentiment-arbiter);
		--pagination-active-border: var(--sentiment-arbiter);
		--pagination-active-text: var(--text-on-light);
		--layout-active-fg: var(--sentiment-arbiter-light);
		--layout-active-bg: var(--sentiment-arbiter-bg);

		border-color: var(--sentiment-arbiter-border);
	}

	.controls-lead {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}

	.results-info {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.results-info strong {
		color: var(--text-primary);
		font-weight: var(--font-weight-semibold);
		font-variant-numeric: tabular-nums;
	}

	/* Segmented toggle: the DESIGN.md recipe (nested track, mono uppercase,
	   accent text on a soft fill when active). */
	.layout-toggle {
		display: inline-flex;
		gap: 1px;
		padding: 2px;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	.layout-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		min-height: var(--size-control-sm);
		padding: var(--space-1-5) var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-muted);
		background: transparent;
		border: none;
		border-radius: var(--radius-hairline);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.layout-btn:hover:not(:disabled):not([data-active='true']) {
		color: var(--text-primary);
		background: var(--surface-hover);
	}

	.layout-btn[data-active='true'] {
		color: var(--layout-active-fg);
		background: var(--layout-active-bg);
	}

	.layout-btn:disabled {
		color: var(--text-disabled);
		cursor: not-allowed;
	}

	@media (min-width: 640px) {
		.table-controls {
			padding: var(--space-4);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.layout-btn {
			transition: none;
		}
	}
</style>
