<!--
  PaginationControls Component

  Presentational pagination bar driven by the shared PaginationState composable
  (see #lib/utils/pagination.svelte.ts). Renders prev / numbered pages / next
  using the global `.pagination-btn` classes from app.css, plus an optional
  results-info + items-per-page row above the bar. TableControls builds the
  tables' control set on top of it, so this is the app's one items-per-page
  select.

  The arrows are decoration: each button's accessible name is "Previous page"
  / "Next page" in words, whether or not the visible label is shown.

  The active page accent defaults to the app accent (matching app.css's
  `.pagination-btn[data-active='true']`); override per view via the
  `--pagination-active-bg/-border/-text` custom properties (e.g. the arbiter
  table sets them to the arbiter amber).

  Usage:
  <PaginationControls {pagination} showLabels={!compact} />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PaginationState } from '#lib/utils/pagination.svelte.js';
	import { t } from '#lib/i18n/index.js';

	interface PaginationControlsProps {
		/** Pagination state object from createPagination() */
		pagination: PaginationState;
		/** Show the Previous/Next text labels beside the arrows */
		showLabels?: boolean;
		/** Render the numbered page buttons (default). When false, renders the `status` snippet instead */
		showPageNumbers?: boolean;
		/** Content rendered between prev/next when showPageNumbers is false (e.g. "Page X of Y") */
		status?: Snippet;
		/** Optional "Showing X-Y of Z" info rendered in a row above the bar */
		resultsInfo?: Snippet;
		/** Show the built-in items-per-page select next to the results info */
		showItemsPerPage?: boolean;
		/** id for the items-per-page select (label association); unique per page */
		selectId?: string;
		/** Render the prev/next bar itself (default). */
		showNav?: boolean;
	}

	let {
		pagination,
		showLabels = true,
		showPageNumbers = true,
		status,
		resultsInfo,
		showItemsPerPage = false,
		selectId = 'items-per-page',
		showNav = true
	}: PaginationControlsProps = $props();
</script>

{#if resultsInfo || showItemsPerPage}
	<div
		class="pagination-meta flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4"
		data-nav={showNav}
	>
		{#if resultsInfo}{@render resultsInfo()}{/if}
		{#if showItemsPerPage}
			<div class="flex items-center gap-2">
				<label for={selectId} class="per-page-label whitespace-nowrap"
					>{$t.table.itemsPerPage}:</label
				>
				<select
					id={selectId}
					value={pagination.itemsPerPage}
					onchange={(e) =>
						pagination.changeItemsPerPage(Number((e.target as HTMLSelectElement)?.value))}
					class="select select-sm"
				>
					{#each pagination.itemsPerPageOptions as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>
{/if}

{#if showNav}
	<nav class="flex justify-center" aria-label={$t.table.pagination}>
		<div class="pagination-controls flex flex-wrap items-center justify-center gap-1 sm:gap-2">
			<button
				type="button"
				class="pagination-btn"
				onclick={pagination.previousPage}
				disabled={pagination.currentPage === 1}
				aria-label={$t.table.previousPage}
			>
				<span aria-hidden="true">←{showLabels ? ` ${$t.common.previous}` : ''}</span>
			</button>

			{#if showPageNumbers}
				{#each pagination.visiblePages as page (page)}
					<button
						type="button"
						class="pagination-btn page-number"
						data-active={page === pagination.currentPage}
						aria-current={page === pagination.currentPage ? 'page' : undefined}
						onclick={() => pagination.goToPage(page)}
					>
						{page}
					</button>
				{/each}
			{:else if status}
				<span class="page-status">{@render status()}</span>
			{:else}
				<span class="page-status">
					{$t.table.pageStatus
						.replace('{page}', String(pagination.currentPage))
						.replace('{pages}', String(Math.max(1, pagination.totalPages)))}
				</span>
			{/if}

			<button
				type="button"
				class="pagination-btn"
				onclick={pagination.nextPage}
				disabled={pagination.currentPage >= pagination.totalPages}
				aria-label={$t.table.nextPage}
			>
				<span aria-hidden="true">{showLabels ? `${$t.common.next} ` : ''}→</span>
			</button>
		</div>
	</nav>
{/if}

<style>
	.pagination-meta[data-nav='true'] {
		margin-bottom: var(--space-3);
	}

	/* Base button chrome comes from the global `.pagination-btn` in app.css.
	   Only the per-view active accent and responsive sizing live here. */
	.pagination-btn {
		/* Component API — a view may retint its active page marker by setting
		   these on any ancestor. Defaults declared once here rather than as a
		   var() fallback per property. */
		--pagination-active-bg: var(--accent-soft);
		--pagination-active-border: var(--accent-border);
		--pagination-active-text: var(--accent);

		/* Compact by default; the global `.pagination-btn` in app.css carries
		   the full-size chrome, restored once there is room for it. */
		min-width: var(--size-control-sm);
		height: var(--size-control-sm);
		font-size: var(--font-size-xs);
		padding: 0 var(--space-1);
	}

	@media (min-width: 640px) {
		.pagination-btn {
			min-width: var(--size-control-lg);
			height: var(--size-control-lg);
			font-size: var(--font-size-sm);
			padding: 0 var(--space-3);
		}
	}

	.pagination-btn[data-active='true'] {
		background: var(--pagination-active-bg);
		border-color: var(--pagination-active-border);
		color: var(--pagination-active-text);
	}

	.pagination-btn.page-number {
		padding: 0 var(--space-2);
	}

	.page-status {
		font-size: var(--font-size-sm);
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
		padding: 0 var(--space-4);
	}

	select,
	label,
	button {
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
	}

	.per-page-label {
		font-size: var(--font-size-xs);
		color: var(--text-primary);
	}

	@media (min-width: 640px) {
		.per-page-label {
			font-size: var(--font-size-sm);
		}
	}
</style>
