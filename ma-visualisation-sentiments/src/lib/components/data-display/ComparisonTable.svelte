<script lang="ts">
	import { filteredComparisons, selectedComparison, availableDatasets } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { getJournalName } from '$lib/utils';
	import { formatDate, getModelDisplayName } from '$lib/utils/format';
	import { getDiffClass, getDiffBadgeClass } from '$lib/utils/discrepancy';
	import type { ComparisonData } from '$lib/types/data';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import TableIcon from '@lucide/svelte/icons/table';
	import { ComparisonCSVExportButton } from '$lib/components/ui';
	import { SentimentBadge } from '$lib/components/common';
	import { innerWidth } from 'svelte/reactivity/window';
	import { createPagination } from '$lib/utils/pagination.svelte';

	let viewMode = $state<'table' | 'cards'>('table');
	let sortBy = $state<'discrepancy' | 'date' | 'title'>('discrepancy');
	let sortDirection = $state<'asc' | 'desc'>('desc');

	// Reactive mobile detection using Svelte 5 pattern
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Switch to card view on mobile
	$effect(() => {
		if (isMobile) {
			viewMode = 'cards';
		}
	});

	// Sort comparisons
	const sortedComparisons = $derived(
		[...$filteredComparisons].sort((a, b) => {
			let valA, valB;

			switch (sortBy) {
				case 'title':
					valA = a.article['o:title'] || '';
					valB = b.article['o:title'] || '';
					break;
				case 'date':
					valA = a.article.publication_date ? new Date(a.article.publication_date).getTime() : 0;
					valB = b.article.publication_date ? new Date(b.article.publication_date).getTime() : 0;
					break;
				case 'discrepancy':
				default:
					valA = a.discrepancies.totalDiff;
					valB = b.discrepancies.totalDiff;
					break;
			}

			if (sortDirection === 'asc') {
				return valA > valB ? 1 : valA < valB ? -1 : 0;
			} else {
				return valA < valB ? 1 : valA > valB ? -1 : 0;
			}
		})
	);

	// Pagination
	const pagination = createPagination({
		totalItems: () => sortedComparisons.length,
		initialItemsPerPage: 25,
		itemsPerPageOptions: [10, 25, 50, 100],
		maxVisiblePages: () => (isMobile ? 3 : 5)
	});

	const paginatedComparisons = $derived(
		sortedComparisons.slice(pagination.startIndex, pagination.endIndex)
	);

	function selectComparison(comparison: ComparisonData) {
		selectedComparison.set(comparison);
	}
</script>

<div class="comparison-table-container">
	<!-- Header with title and export button -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
		<h2 class="h3 m-0 text-white comparison-text-gradient">
			{$t.datasets?.compareModels || 'Model Comparison'}
		</h2>
		<ComparisonCSVExportButton />
	</div>

	<!-- Controls and Pagination Info -->
	<div class="controls-section comparison-controls mb-4">
		<!-- First row: View controls and results info -->
		<div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
			<!-- View Mode Toggle -->
			<div class="view-controls flex gap-2">
				<button
					class="btn btn-sm {viewMode === 'table'
						? 'variant-filled-primary'
						: 'variant-soft-surface'}"
					onclick={() => (viewMode = 'table')}
					disabled={isMobile}
				>
					<TableIcon size={16} />
					<span>{$t.common?.tableView || 'Table'}</span>
				</button>
				<button
					class="btn btn-sm {viewMode === 'cards'
						? 'variant-filled-primary'
						: 'variant-soft-surface'}"
					onclick={() => (viewMode = 'cards')}
				>
					<LayoutGridIcon size={16} />
					<span>{$t.common?.cardView || 'Cards'}</span>
				</button>
			</div>

			<!-- Results info and items per page -->
			<div class="flex items-center gap-4">
				<div class="text-sm text-white/60">
					{$t.table?.showingItems || 'Showing'}
					{pagination.startIndex + 1}-{pagination.endIndex}
					{$t.common?.of || 'of'}
					{sortedComparisons.length}
				</div>
				<div class="flex items-center gap-2">
					<label for="items-per-page" class="text-sm text-white whitespace-nowrap"
						>{$t.table?.itemsPerPage || 'Items per page'}:</label
					>
					<select
						id="items-per-page"
						bind:value={pagination.itemsPerPage}
						onchange={(e) =>
							pagination.changeItemsPerPage(Number((e.target as HTMLSelectElement)?.value))}
						class="select select-sm bg-surface-700 text-white border-surface-500"
					>
						{#each pagination.itemsPerPageOptions as option (option)}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<!-- Second row: Pagination controls -->
		{#if pagination.totalPages > 1}
			<div class="flex justify-center">
				<div class="pagination-controls flex items-center gap-2">
					<button
						class="btn btn-sm variant-soft-surface"
						onclick={pagination.previousPage}
						disabled={pagination.currentPage === 1}
						title={$t.common?.previous || 'Previous page'}
					>
						← {isMobile ? '' : $t.common?.previous || 'Previous'}
					</button>

					{#each pagination.visiblePages as page (page)}
						<button
							class="btn btn-sm {page === pagination.currentPage
								? 'variant-filled-primary'
								: 'variant-soft-surface'}"
							onclick={() => pagination.goToPage(page)}
						>
							{page}
						</button>
					{/each}

					<button
						class="btn btn-sm variant-soft-surface"
						onclick={pagination.nextPage}
						disabled={pagination.currentPage === pagination.totalPages}
						title={$t.common?.next || 'Next page'}
					>
						{isMobile ? '' : $t.common?.next || 'Next'} →
					</button>
				</div>
			</div>
		{/if}
	</div>

	{#if viewMode === 'table' && !isMobile}
		<!-- Table View -->
		<div class="table-container comparison-table-wrapper card variant-glass overflow-hidden">
			<table class="table">
				<thead>
					<tr class="bg-surface-800">
						<th
							class="text-white sortable-header"
							onclick={() => {
								sortBy = 'title';
								sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
							}}
						>
							{$t.table?.articleTitle || 'Article'}
							{#if sortBy === 'title'}
								<ArrowUpDownIcon size={14} class="inline ml-1" />
							{/if}
						</th>
						<th class="text-white text-center" colspan="2"
							>{$t.comparison?.polarity || 'Polarity'}</th
						>
						<th class="text-white text-center" colspan="2"
							>{$t.comparison?.subjectivity || 'Subjectivity'}</th
						>
						<th class="text-white text-center" colspan="2"
							>{$t.comparison?.centrality || 'Centrality'}</th
						>
						<th
							class="text-white sortable-header text-center"
							onclick={() => {
								sortBy = 'discrepancy';
								sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
							}}
						>
							{$t.comparison?.totalDiscrepancy || 'Total'}
							{#if sortBy === 'discrepancy'}
								<ArrowUpDownIcon size={14} class="inline ml-1" />
							{/if}
						</th>
					</tr>
					<tr class="bg-surface-700/50 text-xs">
						<th></th>
						<th class="text-white/60 text-center font-normal"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelAId, $availableDatasets)
								: 'Model A'}</th
						>
						<th class="text-white/60 text-center font-normal"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelBId, $availableDatasets)
								: 'Model B'}</th
						>
						<th class="text-white/60 text-center font-normal"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelAId, $availableDatasets)
								: 'Model A'}</th
						>
						<th class="text-white/60 text-center font-normal"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelBId, $availableDatasets)
								: 'Model B'}</th
						>
						<th class="text-white/60 text-center font-normal"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelAId, $availableDatasets)
								: 'Model A'}</th
						>
						<th class="text-white/60 text-center font-normal"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelBId, $availableDatasets)
								: 'Model B'}</th
						>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedComparisons as comparison (comparison.article['o:id'])}
						<tr
							class="hover:bg-surface-700/30 cursor-pointer transition-colors"
							onclick={() => selectComparison(comparison)}
						>
							<td class="max-w-xs">
								<div class="flex flex-col gap-1">
									<span class="text-white font-medium line-clamp-2"
										>{comparison.article['o:title']}</span
									>
									<span class="text-xs text-white/60"
										>{getJournalName(comparison.article)} • {formatDate(
											comparison.article.publication_date
										)}</span
									>
								</div>
							</td>
							<td class="text-center">
								<SentimentBadge type="polarity" value={comparison.modelA?.polarite} size="sm" />
							</td>
							<td class="text-center">
								<SentimentBadge type="polarity" value={comparison.modelB?.polarite} size="sm" />
							</td>
							<td class="text-center">
								<SentimentBadge
									type="subjectivity"
									value={comparison.modelA?.subjectivite_score}
									size="sm"
								/>
							</td>
							<td class="text-center">
								<SentimentBadge
									type="subjectivity"
									value={comparison.modelB?.subjectivite_score}
									size="sm"
								/>
							</td>
							<td class="text-center">
								<SentimentBadge
									type="centrality"
									value={comparison.modelA?.centralite_islam_musulmans}
									size="sm"
								/>
							</td>
							<td class="text-center">
								<SentimentBadge
									type="centrality"
									value={comparison.modelB?.centralite_islam_musulmans}
									size="sm"
								/>
							</td>
							<td class="text-center">
								<span
									class="badge badge-lg {getDiffBadgeClass(comparison.discrepancies.totalDiff)}"
								>
									{comparison.discrepancies.totalDiff}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<!-- Card View -->
		<div class="cards-grid comparison-cards-grid">
			{#each paginatedComparisons as comparison (comparison.article['o:id'])}
				<div
					class="comparison-card card variant-glass p-4 hover-lift cursor-pointer"
					onclick={() => selectComparison(comparison)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							selectComparison(comparison);
						}
					}}
					role="button"
					tabindex="0"
					aria-label="View comparison details for {comparison.article['o:title']}"
				>
					<!-- Header -->
					<div class="mb-3">
						<h3 class="text-white font-semibold line-clamp-2 mb-1">
							{comparison.article['o:title']}
						</h3>
						<p class="text-xs text-white/60">
							{getJournalName(comparison.article)} • {formatDate(
								comparison.article.publication_date
							)}
						</p>
					</div>

					<!-- Comparison Grid -->
					<div class="comparison-grid">
						<!-- Polarity -->
						<div class="comparison-row">
							<span class="dimension-label">{$t.comparison?.polarity || 'Polarity'}</span>
							<div class="values-grid">
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelAId, $availableDatasets)}</span
									>
									<SentimentBadge type="polarity" value={comparison.modelA?.polarite} size="sm" />
								</div>
								<div class="diff-indicator {getDiffClass(comparison.discrepancies.polarityDiff)}">
									{comparison.discrepancies.polarityDiff > 0
										? `±${comparison.discrepancies.polarityDiff}`
										: '='}
								</div>
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelBId, $availableDatasets)}</span
									>
									<SentimentBadge type="polarity" value={comparison.modelB?.polarite} size="sm" />
								</div>
							</div>
						</div>

						<!-- Subjectivity -->
						<div class="comparison-row">
							<span class="dimension-label">{$t.comparison?.subjectivity || 'Subjectivity'}</span>
							<div class="values-grid">
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelAId, $availableDatasets)}</span
									>
									<SentimentBadge
										type="subjectivity"
										value={comparison.modelA?.subjectivite_score}
										size="sm"
									/>
								</div>
								<div
									class="diff-indicator {getDiffClass(comparison.discrepancies.subjectivityDiff)}"
								>
									{comparison.discrepancies.subjectivityDiff > 0
										? `±${comparison.discrepancies.subjectivityDiff}`
										: '='}
								</div>
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelBId, $availableDatasets)}</span
									>
									<SentimentBadge
										type="subjectivity"
										value={comparison.modelB?.subjectivite_score}
										size="sm"
									/>
								</div>
							</div>
						</div>

						<!-- Centrality -->
						<div class="comparison-row">
							<span class="dimension-label">{$t.comparison?.centrality || 'Centrality'}</span>
							<div class="values-grid">
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelAId, $availableDatasets)}</span
									>
									<SentimentBadge
										type="centrality"
										value={comparison.modelA?.centralite_islam_musulmans}
										size="sm"
									/>
								</div>
								<div class="diff-indicator {getDiffClass(comparison.discrepancies.centralityDiff)}">
									{comparison.discrepancies.centralityDiff > 0
										? `±${comparison.discrepancies.centralityDiff}`
										: '='}
								</div>
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelBId, $availableDatasets)}</span
									>
									<SentimentBadge
										type="centrality"
										value={comparison.modelB?.centralite_islam_musulmans}
										size="sm"
									/>
								</div>
							</div>
						</div>
					</div>

					<!-- Total Discrepancy -->
					<div class="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
						<span class="text-sm text-white/60"
							>{$t.comparison?.totalDiscrepancy || 'Total Discrepancy'}</span
						>
						<span class="badge badge-lg {getDiffBadgeClass(comparison.discrepancies.totalDiff)}">
							{comparison.discrepancies.totalDiff}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.table-container {
		max-height: 600px;
		overflow-y: auto;
	}

	/* Comparison table wrapper with gradient accent */
	.comparison-table-wrapper {
		background: color-mix(in oklab, var(--color-surface-900) 80%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
	}

	.sortable-header {
		cursor: pointer;
		user-select: none;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.sortable-header:hover {
		background-color: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	/* Sticky table headers */
	th {
		position: sticky;
		top: 0;
		z-index: 1;
		background-color: var(--color-surface-800);
		box-shadow: 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
	}

	/* Ensure all clickable elements have pointer cursor */
	.comparison-card {
		cursor: pointer;
		background: color-mix(in oklab, var(--color-surface-900) 80%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		backdrop-filter: blur(var(--glass-blur-sm));
		transition: all var(--timing-fast) var(--easing-default);
	}

	.comparison-card:hover {
		cursor: pointer;
		background: color-mix(in oklab, var(--color-surface-900) 90%, transparent);
		border-color: color-mix(in oklab, var(--color-surface-50) 18%, transparent);
		transform: translateY(-2px);
	}

	/* Table rows */
	tbody tr {
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	tbody tr:hover {
		cursor: pointer;
		background-color: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}

	.comparison-cards-grid {
		gap: 1.25rem;
	}

	.comparison-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.comparison-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.dimension-label {
		font-size: 0.75rem;
		color: var(--sentiment-comparison-light);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.values-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 0.5rem;
		align-items: center;
	}

	.value-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.model-label {
		font-size: 0.625rem;
		color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
	}

	.diff-indicator {
		font-size: 0.875rem;
		font-weight: 600;
		text-align: center;
	}

	.badge {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 9999px;
		cursor: inherit; /* Inherit cursor from parent */
	}

	.badge-lg {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		cursor: inherit; /* Inherit cursor from parent */
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Pagination styles */
	.controls-section {
		background: color-mix(in oklab, var(--color-surface-50) 5%, transparent);
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		backdrop-filter: blur(var(--glass-blur-sm));
	}

	.comparison-controls {
		background: color-mix(in oklab, var(--color-surface-900) 80%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	.pagination-controls {
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}

	.pagination-controls button {
		min-width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.pagination-controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pagination-controls button:not(:disabled):hover {
		cursor: pointer;
	}

	.select-sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		border-radius: 0.375rem;
	}

	/* Text gradient styling */
	.comparison-text-gradient {
		background: var(--gradient-comparison);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* View controls and other buttons */
	.view-controls button {
		cursor: pointer;
	}

	.view-controls button:disabled {
		cursor: not-allowed;
	}

	/* Select elements */
	select {
		cursor: pointer;
	}

	/* Ensure all buttons have pointer cursor */
	button {
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
	}

	/* Labels for form elements */
	label {
		cursor: pointer;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.cards-grid {
			grid-template-columns: 1fr;
		}

		.comparison-card {
			padding: 0.75rem;
		}

		.controls-section {
			padding: 0.75rem;
		}

		.pagination-controls {
			gap: 0.25rem;
		}

		.pagination-controls button {
			min-width: 2rem;
			height: 2rem;
			font-size: 0.75rem;
			padding: 0.25rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.sortable-header,
		.comparison-card,
		tbody tr {
			transition: none;
		}
	}
</style>
