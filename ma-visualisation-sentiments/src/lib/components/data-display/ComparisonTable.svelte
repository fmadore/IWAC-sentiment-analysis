<script lang="ts">
	import { comparisonState, datasetState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { getJournalName } from '$lib/utils/format';
	import { formatDate, getModelDisplayName } from '$lib/utils/format';
	import { getDiffClass, getDiffBadgeClass, formatDiff } from '$lib/utils/discrepancy';
	import type { ComparisonData } from '$lib/types/data';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import TableIcon from '@lucide/svelte/icons/table';
	import { ComparisonCSVExportButton } from '$lib/components/ui';
	import { SentimentBadge } from '$lib/components/common';
	import { innerWidth } from 'svelte/reactivity/window';
	import { createPagination } from '$lib/utils/pagination.svelte';
	import PaginationControls from '$lib/components/common/PaginationControls.svelte';

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
		[...comparisonState.filtered].sort((a, b) => {
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
		comparisonState.selected = comparison;
	}
</script>

<div class="comparison-table-container">
	<!-- Header with title and export button -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
		<h2 class="comparison-table-title">
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
			<PaginationControls {pagination} showLabels={!isMobile} />
		{/if}
	</div>

	{#if viewMode === 'table' && !isMobile}
		<!-- Table View -->
		<div class="table-container comparison-table-wrapper">
			<table class="table">
				<thead>
					<!-- Row backgrounds live on the cells, not the rows: a `tr` fill sits
					     behind the sticky cells and scrolls away from under them. -->
					<tr>
						<th
							class="sortable-header"
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
						<th class="text-center" colspan="2">{$t.comparison?.polarity || 'Polarity'}</th>
						<th class="text-center" colspan="2">{$t.comparison?.subjectivity || 'Subjectivity'}</th>
						<th class="text-center" colspan="2">{$t.comparison?.centrality || 'Centrality'}</th>
						<th
							class="sortable-header text-center"
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
					<tr class="text-xs">
						<th></th>
						<th class="col-subhead text-center"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelAId, datasetState.available)
								: 'Model A'}</th
						>
						<th class="col-subhead text-center"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelBId, datasetState.available)
								: 'Model B'}</th
						>
						<th class="col-subhead text-center"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelAId, datasetState.available)
								: 'Model A'}</th
						>
						<th class="col-subhead text-center"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelBId, datasetState.available)
								: 'Model B'}</th
						>
						<th class="col-subhead text-center"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelAId, datasetState.available)
								: 'Model A'}</th
						>
						<th class="col-subhead text-center"
							>{paginatedComparisons[0]
								? getModelDisplayName(paginatedComparisons[0].modelBId, datasetState.available)
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
					class="comparison-card cursor-pointer"
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
										>{getModelDisplayName(comparison.modelAId, datasetState.available)}</span
									>
									<SentimentBadge type="polarity" value={comparison.modelA?.polarite} size="sm" />
								</div>
								<div class="diff-indicator {getDiffClass(comparison.discrepancies.polarityDiff)}">
									{formatDiff(comparison.discrepancies.polarityDiff)}
								</div>
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelBId, datasetState.available)}</span
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
										>{getModelDisplayName(comparison.modelAId, datasetState.available)}</span
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
									{formatDiff(comparison.discrepancies.subjectivityDiff)}
								</div>
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelBId, datasetState.available)}</span
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
										>{getModelDisplayName(comparison.modelAId, datasetState.available)}</span
									>
									<SentimentBadge
										type="centrality"
										value={comparison.modelA?.centralite_islam_musulmans}
										size="sm"
									/>
								</div>
								<div class="diff-indicator {getDiffClass(comparison.discrepancies.centralityDiff)}">
									{formatDiff(comparison.discrepancies.centralityDiff)}
								</div>
								<div class="value-cell">
									<span class="model-label"
										>{getModelDisplayName(comparison.modelBId, datasetState.available)}</span
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
	.comparison-table-title {
		font-family: var(--font-display);
		font-size: clamp(1.375rem, 1.1rem + 1vw, 1.875rem);
		font-weight: 600;
		line-height: 1.15;
		color: var(--text-primary);
		letter-spacing: -0.005em;
		margin: 0;
	}

	.table-container {
		max-height: var(--height-chart-lg);
		overflow-y: auto;
	}

	.comparison-table-wrapper {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.sortable-header {
		cursor: pointer;
		user-select: none;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.sortable-header:hover {
		/* Mixed into the opaque header colour: the header is sticky, so any
		   translucent fill lets the scrolling rows read through it. */
		background-color: color-mix(
			in oklab,
			var(--color-surface-50) 10%,
			var(--surface-card-elevated)
		);
	}

	/*
		Sticky header — typography and the opaque background are owned by the
		global `.table th` rule.

		This header is TWO rows (dimension labels, then model names), so the whole
		`thead` sticks as one block. Sticking each `th` individually — what every
		other table here does — pins both rows to `top: 0`, and the model-name row
		lands on top of the dimension labels.
	*/
	thead {
		position: sticky;
		top: 0;
		z-index: 1;
	}

	thead tr:last-child th {
		box-shadow: 0 1px 0 var(--border-hover);
	}

	/* Model-name sub-header row — subordinate to the dimension labels above */
	.col-subhead {
		font-size: 0.625rem;
		font-weight: var(--font-weight-regular);
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.comparison-card {
		cursor: pointer;
		padding: var(--space-4);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.comparison-card:hover {
		background: var(--surface-card-elevated);
		border-color: var(--border-hover);
	}

	/* Table rows */
	tbody tr {
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	tbody tr:hover {
		cursor: pointer;
		background-color: var(--surface-subtle);
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--space-4);
	}

	.comparison-cards-grid {
		gap: var(--space-5);
	}

	.comparison-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.comparison-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.dimension-label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.values-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: var(--space-2);
		align-items: center;
	}

	.value-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}

	.model-label {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.diff-indicator {
		font-family: var(--font-mono);
		font-size: var(--font-size-base);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	.badge {
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		border-radius: 0;
		border: 1px solid var(--border-default);
		background: var(--surface-subtle);
		cursor: inherit;
	}

	.badge-lg {
		padding: var(--space-1-5) var(--space-3);
		font-size: 0.75rem;
		cursor: inherit;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.controls-section {
		background: var(--surface-subtle);
		padding: var(--space-4);
		border: 1px solid var(--border-subtle);
	}

	.comparison-controls {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.select-sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-base);
		border-radius: var(--radius-sm);
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
			padding: var(--space-3);
		}

		.controls-section {
			padding: var(--space-3);
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
