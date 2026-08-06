<!--
  ArbiterArticleTable Component
  
  Displays a table of articles evaluated by the arbiter with their verdicts.
  Shows title, newspaper, date, overall verdict, and confidence level.
  
  Features:
  - Sortable columns (title, date)
  - Pagination
  - Mobile card view
  - Click row to view article details
-->
<script lang="ts">
	import { arbiterEvaluations, comparisonState, datasetState } from '$lib/stores';
	import { getPairModelNames, type ArbiterAnalysis } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import { getJournalName } from '$lib/utils/format';
	import { formatDate } from '$lib/utils/format';
	import { createPagination } from '$lib/utils/pagination.svelte';
	import {
		VERDICT_ORDER,
		CONFIDENCE_ORDER,
		getVerdictBadgeClass,
		getConfidenceBadgeClass,
		getConfidenceLabel
	} from '$lib/utils/arbiter';
	import PaginationControls from '$lib/components/common/PaginationControls.svelte';
	import { ArbiterCSVExportButton } from '$lib/components/ui';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import TableIcon from '@lucide/svelte/icons/table';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import MinusCircleIcon from '@lucide/svelte/icons/minus-circle';
	import { innerWidth } from 'svelte/reactivity/window';

	// Props
	interface ArbiterArticleTableProps {
		onSelectArticle: (articleId: string, arbiterData: ArbiterAnalysis) => void;
	}

	let { onSelectArticle }: ArbiterArticleTableProps = $props();

	// Reactive mobile detection
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);
	let viewMode = $state<'table' | 'cards'>('table');

	// Sort state
	let sortBy = $state<'title' | 'date' | 'verdict' | 'confidence'>('date');
	let sortDirection = $state<'asc' | 'desc'>('desc');

	// Switch to card view on mobile
	$effect(() => {
		if (isMobile) {
			viewMode = 'cards';
		}
	});

	// Get model names
	const modelNames = $derived(getPairModelNames(datasetState.pair, datasetState.available));

	// Build article data by joining arbiter evaluations with comparison data
	interface ArticleWithArbiter {
		articleId: string;
		title: string;
		journal: string;
		date: string | null;
		arbiter: ArbiterAnalysis;
	}

	const articlesWithArbiter = $derived.by(() => {
		const evaluations = arbiterEvaluations.current?.evaluations;
		// Use comparisonState.data to reactively subscribe to the store
		const comparisons = comparisonState.data;

		if (!evaluations || evaluations.length === 0) {
			return [];
		}

		const result: ArticleWithArbiter[] = [];

		for (const evaluation of evaluations) {
			// Find the corresponding article in comparison data
			const comparison = comparisons?.find(
				(c) => String(c.article['o:id']) === String(evaluation.article_id)
			);

			if (comparison) {
				result.push({
					articleId: evaluation.article_id,
					title: comparison.article['o:title'] || 'Untitled',
					journal: getJournalName(comparison.article),
					date: comparison.article.publication_date || null,
					arbiter: evaluation.arbiter
				});
			} else {
				// Article not found in comparison data, still show it
				result.push({
					articleId: evaluation.article_id,
					title: `Article ${evaluation.article_id}`,
					journal: 'Unknown',
					date: null,
					arbiter: evaluation.arbiter
				});
			}
		}

		return result;
	});

	// Sorted articles
	const sortedArticles = $derived(
		[...articlesWithArbiter].sort((a, b) => {
			let valA: string | number, valB: string | number;

			switch (sortBy) {
				case 'title':
					valA = a.title.toLowerCase();
					valB = b.title.toLowerCase();
					break;
				case 'date':
					valA = a.date ? new Date(a.date).getTime() : 0;
					valB = b.date ? new Date(b.date).getTime() : 0;
					break;
				case 'verdict':
					valA = VERDICT_ORDER[a.arbiter.overall_winner] ?? 0;
					valB = VERDICT_ORDER[b.arbiter.overall_winner] ?? 0;
					break;
				case 'confidence':
					valA = CONFIDENCE_ORDER[a.arbiter.confidence_level] ?? 0;
					valB = CONFIDENCE_ORDER[b.arbiter.confidence_level] ?? 0;
					break;
				default:
					return 0;
			}

			if (sortDirection === 'asc') {
				return valA > valB ? 1 : valA < valB ? -1 : 0;
			} else {
				return valA < valB ? 1 : valA > valB ? -1 : 0;
			}
		})
	);

	// Pagination via the shared composable (also used by ArticleTable and
	// ComparisonTable); resets to page 1 when the total changes.
	const pagination = createPagination({
		totalItems: () => sortedArticles.length,
		initialItemsPerPage: 25,
		itemsPerPageOptions: [10, 25, 50, 100],
		maxVisiblePages: () => (isMobile ? 3 : 5)
	});

	const paginatedArticles = $derived(
		sortedArticles.slice(pagination.startIndex, pagination.endIndex)
	);

	// Helper functions
	function getVerdictLabel(verdict: 'model_a' | 'model_b' | 'both' | 'neither'): string {
		switch (verdict) {
			case 'model_a':
				return modelNames.modelAName;
			case 'model_b':
				return modelNames.modelBName;
			case 'both':
				return $t.arbiter?.bothEqual || 'Both equal';
			case 'neither':
				return $t.arbiter?.neitherAccurate || 'Neither accurate';
			default:
				return verdict;
		}
	}

	function handleSort(column: typeof sortBy) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'asc';
		}
		pagination.currentPage = 1;
	}

	function handleRowClick(article: ArticleWithArbiter) {
		onSelectArticle(article.articleId, article.arbiter);
	}
</script>

<div class="arbiter-article-table-container">
	{#if articlesWithArbiter.length > 0}
		<!-- Controls Section -->
		<div class="controls-section arbiter-controls mb-4">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
				<!-- View Mode Toggle -->
				<div class="view-controls flex gap-2">
					<button
						class="control-btn {viewMode === 'table' ? 'control-btn-active' : ''}"
						onclick={() => (viewMode = 'table')}
						disabled={isMobile}
					>
						<TableIcon size={16} />
						<span>{$t.common?.tableView || 'Table'}</span>
					</button>
					<button
						class="control-btn {viewMode === 'cards' ? 'control-btn-active' : ''}"
						onclick={() => (viewMode = 'cards')}
					>
						<LayoutGridIcon size={16} />
						<span>{$t.common?.cardView || 'Cards'}</span>
					</button>

					<!-- CSV Export Button -->
					<ArbiterCSVExportButton />
				</div>

				<!-- Results info and items per page -->
				<div class="flex items-center gap-4">
					<div class="results-info">
						{$t.table?.showingItems || 'Showing'}
						<strong>{pagination.startIndex + 1}-{pagination.endIndex}</strong>
						{$t.common?.of || 'of'}
						<strong>{sortedArticles.length}</strong>
					</div>
					<div class="flex items-center gap-2">
						<label for="arbiter-items-per-page" class="items-per-page-label"
							>{$t.table?.itemsPerPage || 'Items per page'}:</label
						>
						<select
							id="arbiter-items-per-page"
							value={pagination.itemsPerPage}
							onchange={(e) =>
								pagination.changeItemsPerPage(Number((e.target as HTMLSelectElement)?.value))}
							class="items-per-page-select"
						>
							{#each pagination.itemsPerPageOptions as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Pagination controls -->
			{#if pagination.totalPages > 1}
				<div class="arbiter-pagination">
					<PaginationControls {pagination} showLabels={!isMobile} />
				</div>
			{/if}
		</div>

		{#if viewMode === 'table' && !isMobile}
			<!-- Table View -->
			<div class="table-container arbiter-table-wrapper card variant-glass overflow-hidden">
				<table class="table">
					<thead>
						<tr class="table-head-row">
							<th class="sortable-header" onclick={() => handleSort('title')}>
								{$t.table?.articleTitle || 'Title'}
								{#if sortBy === 'title'}
									<ArrowUpDownIcon size={14} class="inline ml-1" />
								{/if}
							</th>
							<th>{$t.filters?.journal || 'Newspaper'}</th>
							<th class="sortable-header" onclick={() => handleSort('date')}>
								{$t.table?.date || 'Date'}
								{#if sortBy === 'date'}
									<ArrowUpDownIcon size={14} class="inline ml-1" />
								{/if}
							</th>
							<th class="sortable-header text-center" onclick={() => handleSort('verdict')}>
								{$t.arbiter?.overallVerdict || 'Verdict'}
								{#if sortBy === 'verdict'}
									<ArrowUpDownIcon size={14} class="inline ml-1" />
								{/if}
							</th>
							<th class="sortable-header text-center" onclick={() => handleSort('confidence')}>
								{$t.arbiter?.confidenceLevel || 'Confidence'}
								{#if sortBy === 'confidence'}
									<ArrowUpDownIcon size={14} class="inline ml-1" />
								{/if}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedArticles as article (article.articleId)}
							<tr class="article-row cursor-pointer" onclick={() => handleRowClick(article)}>
								<td class="max-w-xs">
									<span class="row-title line-clamp-2">{article.title}</span>
								</td>
								<td class="row-meta">{article.journal}</td>
								<td class="row-meta">{formatDate(article.date)}</td>
								<td class="text-center">
									<span
										class="badge badge-sm {getVerdictBadgeClass(article.arbiter.overall_winner)}"
									>
										{#if article.arbiter.overall_winner === 'model_a' || article.arbiter.overall_winner === 'model_b'}
											<CheckCircleIcon size={12} class="mr-1" />
										{:else if article.arbiter.overall_winner === 'both'}
											<MinusCircleIcon size={12} class="mr-1" />
										{:else}
											<XCircleIcon size={12} class="mr-1" />
										{/if}
										{getVerdictLabel(article.arbiter.overall_winner)}
									</span>
								</td>
								<td class="text-center">
									<span
										class="badge badge-sm {getConfidenceBadgeClass(
											article.arbiter.confidence_level
										)}"
									>
										{getConfidenceLabel(article.arbiter.confidence_level, $t)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<!-- Card View -->
			<div class="cards-grid arbiter-cards-grid">
				{#each paginatedArticles as article (article.articleId)}
					<div
						class="arbiter-card cursor-pointer"
						onclick={() => handleRowClick(article)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleRowClick(article);
							}
						}}
						role="button"
						tabindex="0"
						aria-label="{$t.arbiter?.viewArticleDetails || 'View article details'}: {article.title}"
					>
						<!-- Header -->
						<div class="mb-3">
							<h3 class="row-title line-clamp-2 mb-1">{article.title}</h3>
							<p class="row-submeta">
								{article.journal} • {formatDate(article.date)}
							</p>
						</div>

						<!-- Verdict & Confidence -->
						<div class="flex flex-wrap items-center gap-2">
							<span class="badge {getVerdictBadgeClass(article.arbiter.overall_winner)}">
								{#if article.arbiter.overall_winner === 'model_a' || article.arbiter.overall_winner === 'model_b'}
									<CheckCircleIcon size={12} class="mr-1" />
								{:else if article.arbiter.overall_winner === 'both'}
									<MinusCircleIcon size={12} class="mr-1" />
								{:else}
									<XCircleIcon size={12} class="mr-1" />
								{/if}
								{getVerdictLabel(article.arbiter.overall_winner)}
							</span>
							<span
								class="badge badge-sm {getConfidenceBadgeClass(article.arbiter.confidence_level)}"
							>
								{getConfidenceLabel(article.arbiter.confidence_level, $t)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Empty state -->
		<div class="empty-state">
			<p class="empty-state-lede">
				{$t.arbiter?.noEvaluatedArticles || 'No evaluated articles available'}
			</p>
		</div>
	{/if}
</div>

<style>
	.table-container {
		max-height: var(--height-chart-lg);
		overflow-y: auto;
	}

	.arbiter-table-wrapper {
		position: relative;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-arbiter);
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
			var(--sentiment-arbiter) 15%,
			var(--surface-card-elevated)
		);
	}

	th {
		position: sticky;
		top: 0;
		z-index: 1;
		box-shadow: 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
		/* Background owned by the global `.table th` rule — see ArticleTable. */
	}

	.article-row {
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.article-row:hover {
		background-color: color-mix(in oklab, var(--sentiment-arbiter) 10%, transparent);
	}

	.cards-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
	}

	.arbiter-cards-grid {
		gap: var(--space-5);
	}

	.arbiter-card {
		cursor: pointer;
		padding: var(--space-3);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.arbiter-card:hover {
		background: var(--surface-card-elevated);
		border-color: var(--sentiment-arbiter-border);
	}

	.empty-state {
		padding: var(--space-8);
		text-align: center;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.empty-state-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		margin: 0;
	}

	.controls-section {
		background: var(--surface-subtle);
		padding: var(--space-3);
		border: 1px solid var(--border-subtle);
	}

	.arbiter-controls {
		background: var(--surface-subtle);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	/* Control buttons (Table/Cards toggle) */
	.control-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		color: var(--text-secondary);
		background: var(--surface-hover);
		border: 1px solid var(--border-hover);
		border-radius: var(--radius-panel);
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.control-btn:hover:not(:disabled) {
		color: var(--text-primary);
		background: var(--surface-active);
		border-color: var(--border-active);
	}

	.control-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.control-btn-active {
		color: var(--text-on-light);
		background: var(--sentiment-arbiter);
		border-color: var(--sentiment-arbiter);
	}

	.control-btn-active:hover:not(:disabled) {
		background: var(--sentiment-arbiter-light);
		border-color: var(--sentiment-arbiter-light);
	}

	/* Results info text */
	.results-info {
		font-size: var(--font-size-base);
		color: var(--text-secondary);
	}

	.results-info strong {
		color: var(--text-primary);
		font-weight: var(--font-weight-semibold);
	}

	/* Items per page label */
	.items-per-page-label {
		font-size: var(--font-size-base);
		color: var(--text-secondary);
		white-space: nowrap;
		cursor: pointer;
	}

	/* Items per page select */
	.items-per-page-select {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		color: var(--text-primary);
		background: var(--surface-hover);
		border: 1px solid var(--border-active);
		border-radius: var(--radius-hairline);
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.items-per-page-select:hover {
		background: var(--surface-active);
		border-color: var(--border-active);
	}

	.items-per-page-select:focus {
		outline: 2px solid var(--sentiment-arbiter);
		outline-offset: 2px;
	}

	.items-per-page-select option {
		background: var(--color-surface-800);
		color: var(--text-primary);
	}

	/* Pagination — shared PaginationControls bar with the arbiter accent for
	   the active page (defaults in app.css use the app accent). */
	.arbiter-pagination {
		--pagination-active-bg: var(--sentiment-arbiter);
		--pagination-active-border: var(--sentiment-arbiter);
		--pagination-active-text: var(--text-on-light);
	}

	.badge {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-hairline);
		border: 1px solid;
		display: inline-flex;
		align-items: center;
	}

	.badge-sm {
		padding: var(--space-1) var(--space-1-5);
		font-size: var(--font-size-eyebrow);
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.view-controls button {
		cursor: pointer;
	}

	.view-controls button:disabled {
		cursor: not-allowed;
	}

	select {
		cursor: pointer;
	}

	button {
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
	}

	label {
		cursor: pointer;
	}

	.empty-state {
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	/* Responsive adjustments */
	@media (min-width: 640px) {
		.cards-grid {
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		}

		.arbiter-card {
			padding: var(--space-4);
		}

		.controls-section {
			padding: var(--space-4);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.sortable-header,
		.arbiter-card,
		.article-row {
			transition: none;
		}

		.arbiter-card:hover {
			transform: none;
		}
	}

	/* ---- Text roles, replacing Tailwind colour utilities. ---- */
	.table-head-row {
		background: var(--surface-nested);
	}

	.article-row {
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.article-row:hover {
		background: var(--surface-hover);
	}

	.row-title {
		font-weight: var(--font-weight-medium);
		color: var(--text-primary);
	}

	.row-meta {
		color: var(--text-muted);
	}

	.row-submeta {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}
</style>
