<!--
  PaginationControls Component

  Presentational pagination bar driven by the shared PaginationState composable
  (see $lib/utils/pagination.svelte.ts). Renders prev / numbered pages / next
  using the global `.pagination-btn` classes from app.css, plus an optional
  results-info + items-per-page row above the bar.

  The active page accent defaults to the app accent (matching app.css's
  `.pagination-btn[data-active='true']`); override per view via the
  `--pagination-active-bg/-border/-text` custom properties (e.g. the arbiter
  table sets them to the arbiter amber).

  Usage:
  <PaginationControls {pagination} showLabels={!isMobile} />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PaginationState } from '$lib/utils/pagination.svelte';
	import { t } from '$lib/i18n';

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
		/** id for the items-per-page select (label association) */
		selectId?: string;
	}

	let {
		pagination,
		showLabels = true,
		showPageNumbers = true,
		status,
		resultsInfo,
		showItemsPerPage = false,
		selectId = 'items-per-page'
	}: PaginationControlsProps = $props();
</script>

{#if resultsInfo || showItemsPerPage}
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3">
		{#if resultsInfo}{@render resultsInfo()}{/if}
		{#if showItemsPerPage}
			<div class="flex items-center gap-2">
				<label for={selectId} class="text-xs sm:text-sm text-white whitespace-nowrap"
					>{$t.table?.itemsPerPage || 'Items per page'}:</label
				>
				<select
					id={selectId}
					value={pagination.itemsPerPage}
					onchange={(e) =>
						pagination.changeItemsPerPage(Number((e.target as HTMLSelectElement)?.value))}
					class="select select-sm bg-surface-700 text-white border-surface-500"
				>
					{#each pagination.itemsPerPageOptions as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>
{/if}

<nav class="flex justify-center" aria-label="Pagination">
	<div class="pagination-controls flex flex-wrap items-center justify-center gap-1 sm:gap-2">
		<button
			class="pagination-btn"
			onclick={pagination.previousPage}
			disabled={pagination.currentPage === 1}
			title={$t.common?.previous || 'Previous'}
		>
			←{showLabels ? ` ${$t.common?.previous || 'Previous'}` : ''}
		</button>

		{#if showPageNumbers}
			{#each pagination.visiblePages as page (page)}
				<button
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
		{/if}

		<button
			class="pagination-btn"
			onclick={pagination.nextPage}
			disabled={pagination.currentPage === pagination.totalPages}
			title={$t.common?.next || 'Next'}
		>
			{showLabels ? `${$t.common?.next || 'Next'} ` : ''}→
		</button>
	</div>
</nav>

<style>
	/* Base button chrome comes from the global `.pagination-btn` in app.css.
	   Only the per-view active accent and responsive sizing live here. */
	.pagination-btn[data-active='true'] {
		background: var(--pagination-active-bg, var(--accent-soft));
		border-color: var(--pagination-active-border, var(--accent-border));
		color: var(--pagination-active-text, var(--accent));
	}

	.pagination-btn.page-number {
		padding: 0 var(--space-2);
	}

	.page-status {
		font-size: var(--font-size-sm);
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

	@media (max-width: 640px) {
		.pagination-btn {
			min-width: var(--size-control-sm);
			height: var(--size-control-sm);
			font-size: var(--font-size-xs);
			padding: 0 var(--space-1);
		}
	}
</style>
