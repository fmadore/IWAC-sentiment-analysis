<!--
  ArticleTable

  Every article of the selected model, sortable, searchable by title and
  paginated. Below the 640px breakpoint the six columns no longer fit and the
  rows become cards; the title is the row's detail button in both layouts.

  The title search is the `tableSearch` URL parameter: accent- and
  case-insensitive (« eglise » finds « Église »), debounced, back to page one
  on every new query, with the match count announced politely. The CSV export in
  the page header carries the same rows (`searchByTitle`), search included.
-->
<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { viewOptionsState, paginationURLState } from '#lib/stores/view-options.svelte.js';
	import { articleState } from '#lib/stores/index.js';
	import { num, fmtDate } from '#lib/i18n/utils.js';
	import { POLARITY_ORDER, CENTRALITY_ORDER, type Article } from '#lib/types/data.js';
	import { getJournalName } from '#lib/utils/format.js';
	import { t } from '#lib/i18n/index.js';
	import DatasetBadge from '#lib/components/ui/DatasetBadge.svelte';
	import SentimentBadge from '#lib/components/common/SentimentBadge.svelte';
	import { updateURL } from '#lib/stores/url/index.js';
	import { createPagination } from '#lib/utils/pagination.svelte.js';
	import {
		compareBy,
		dateKey,
		nextSort,
		searchByTitle,
		searchKey,
		titleKey,
		type SortValue
	} from '#lib/utils/sorting.js';
	import { isCompact } from '#lib/utils/viewport.svelte.js';
	import SortableHeader from '#lib/components/common/SortableHeader.svelte';
	import PaginationControls from '#lib/components/common/PaginationControls.svelte';
	import TableControls from '#lib/components/common/TableControls.svelte';
	import RowDetailButton from '#lib/components/common/RowDetailButton.svelte';
	import ArticleCard from '#lib/components/common/ArticleCard.svelte';
	import EmptyState from '#lib/components/common/EmptyState.svelte';
	import SearchInput from '#lib/components/common/SearchInput.svelte';

	let {
		onShowDetails
	}: {
		onShowDetails: (details: { article: Article; position: { x: number; y: number } }) => void;
	} = $props();

	const articles = $derived(articleState.filtered);

	/** Six columns fit from the first breakpoint up; below it, cards. */
	const compact = $derived(isCompact());

	let tableContainerRef = $state<HTMLElement | undefined>();

	function selectArticle(article: Article, event?: MouseEvent) {
		articleState.selected = article;
		updateURL();
		onShowDetails({
			article,
			position: { x: event?.clientX ?? 0, y: event?.clientY ?? 0 }
		});
	}

	// ---- Title search -------------------------------------------------------

	const SEARCH_DEBOUNCE_MS = 250;
	let draft = $state(untrack(() => viewOptionsState.tableSearch));
	let timer: ReturnType<typeof setTimeout> | undefined;

	function onSearchInput(value: string) {
		draft = value;
		clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			const next = value.trim() ? value : '';
			if (next === viewOptionsState.tableSearch) return;
			viewOptionsState.tableSearch = next;
			pagination.currentPage = 1;
		}, SEARCH_DEBOUNCE_MS);
	}

	// History navigation and shared links change the committed query; the box
	// follows unless the reader is mid-way through typing a new one.
	$effect(() => {
		const committed = viewOptionsState.tableSearch;
		untrack(() => {
			if (timer === undefined && committed !== draft) draft = committed;
		});
	});

	onDestroy(() => clearTimeout(timer));

	const query = $derived(searchKey(viewOptionsState.tableSearch));

	const searched = $derived(searchByTitle(articles, viewOptionsState.tableSearch));

	const searchAnnouncement = $derived(
		query
			? searched.length > 0
				? $t.table.searchResults
						.replace('{count}', $num(searched.length))
						.replace('{query}', viewOptionsState.tableSearch.trim())
				: $t.table.searchNoResults.replace('{query}', viewOptionsState.tableSearch.trim())
			: ''
	);

	// ---- Sorting ------------------------------------------------------------

	type SortColumn = typeof viewOptionsState.tableSort;

	/** Same column flips; a new column starts ascending. Back to page one either way. */
	function sortBy(column: SortColumn) {
		const next = nextSort(
			{ column: viewOptionsState.tableSort, order: viewOptionsState.tableOrder },
			column
		);
		viewOptionsState.tableSort = next.column;
		viewOptionsState.tableOrder = next.order;
		pagination.currentPage = 1;
	}

	const sortColumns = $derived<{ key: SortColumn; label: string }[]>([
		{ key: 'titre', label: $t.table.articleTitle },
		{ key: 'journal', label: $t.filters.journal },
		{ key: 'date', label: $t.table.date },
		{ key: 'centralite', label: $t.table.centrality },
		{ key: 'polarite', label: $t.table.polarity },
		{ key: 'subjectivite', label: $t.table.subjectivity }
	]);

	/** A missing rating sorts last, like a missing date; it is not a verdict. */
	function sortValue(article: Article, column: SortColumn): SortValue {
		const analysis = article.sentiment_analysis;
		switch (column) {
			case 'titre':
				return titleKey(article['o:title']);
			case 'journal':
				return getJournalName(article);
			case 'date':
				return dateKey(article.publication_date);
			case 'centralite': {
				const value = analysis?.centralite_islam_musulmans;
				return value ? (CENTRALITY_ORDER[value as keyof typeof CENTRALITY_ORDER] ?? 0) : null;
			}
			case 'polarite': {
				const value = analysis?.polarite;
				return value ? (POLARITY_ORDER[value as keyof typeof POLARITY_ORDER] ?? 0) : null;
			}
			case 'subjectivite': {
				const value = analysis?.subjectivite_score;
				return value === null || value === undefined ? null : Number(value);
			}
		}
	}

	const sortedArticles = $derived.by(() => {
		const column = viewOptionsState.tableSort;
		return [...searched].sort(
			compareBy((article: Article) => sortValue(article, column), viewOptionsState.tableOrder)
		);
	});

	function scrollToTop() {
		tableContainerRef?.scrollIntoView({
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
				? 'instant'
				: 'smooth',
			block: 'start'
		});
	}

	const pagination = createPagination({
		state: paginationURLState('table'),
		totalItems: () => searched.length,
		initialItemsPerPage: 50,
		itemsPerPageOptions: [25, 50, 100, 200],
		maxVisiblePages: () => (compact ? 3 : 7),
		onPageChange: () => setTimeout(scrollToTop, 100)
	});

	const paginatedArticles = $derived(
		sortedArticles.slice(pagination.startIndex, pagination.endIndex)
	);

	function detailLabel(article: Article): string {
		return $t.audit.articleDetails.replace('{title}', article['o:title'] ?? '');
	}
</script>

{#snippet badges(article: Article)}
	<SentimentBadge
		type="centrality"
		value={article.sentiment_analysis?.centralite_islam_musulmans}
		size="sm"
	/>
	<SentimentBadge type="polarity" value={article.sentiment_analysis?.polarite} size="sm" />
	<SentimentBadge
		type="subjectivity"
		value={article.sentiment_analysis?.subjectivite_score}
		size="sm"
	/>
{/snippet}

{#if articles.length > 0}
	<div class="table-head mb-4">
		<DatasetBadge size="sm" />
		<div class="search-row">
			<SearchInput
				value={draft}
				onchange={onSearchInput}
				placeholder={$t.table.searchTitles}
				showSearchIcon
				size="sm"
			/>
			<p class="search-note">{$t.table.searchScopeNote}</p>
		</div>
	</div>
	<p class="sr-only" aria-live="polite" aria-atomic="true">{searchAnnouncement}</p>

	{#if searched.length > 0}
		<div bind:this={tableContainerRef} class="mb-4">
			<TableControls
				{pagination}
				total={searched.length}
				totalNoun={$t.common.articles}
				selectId="article-table-items-per-page"
				showLabels={false}
			/>
		</div>

		{#if compact}
			<div class="mobile-sort-controls mb-4">
				<label for="article-table-sort" class="sort-label whitespace-nowrap"
					>{$t.common.sortBy}:</label
				>
				<select
					id="article-table-sort"
					bind:value={viewOptionsState.tableSort}
					onchange={() => (pagination.currentPage = 1)}
					class="select select-sm flex-1"
				>
					{#each sortColumns as column (column.key)}
						<option value={column.key}>{column.label}</option>
					{/each}
				</select>
				<button
					type="button"
					class="sort-direction-btn"
					onclick={() => {
						viewOptionsState.tableOrder = viewOptionsState.tableOrder === 'asc' ? 'desc' : 'asc';
						pagination.currentPage = 1;
					}}
					aria-label={viewOptionsState.tableOrder === 'asc'
						? $t.table.sortDirectionAsc
						: $t.table.sortDirectionDesc}
				>
					<span aria-hidden="true">{viewOptionsState.tableOrder === 'asc' ? '↑' : '↓'}</span>
				</button>
			</div>

			<ul class="card-list">
				{#each paginatedArticles as article (article['o:id'])}
					<ArticleCard
						title={article['o:title'] ?? $t.table.untitled}
						label={detailLabel(article)}
						meta="{getJournalName(article)} • {$fmtDate(article.publication_date)}"
						onselect={(event) => selectArticle(article, event)}
					>
						<div class="card-badges">{@render badges(article)}</div>
					</ArticleCard>
				{/each}
			</ul>
		{:else}
			<div class="table-container">
				<table class="table">
					<thead>
						<tr>
							{#each sortColumns as column (column.key)}
								<SortableHeader
									label={column.label}
									active={viewOptionsState.tableSort === column.key}
									order={viewOptionsState.tableOrder}
									onsort={() => sortBy(column.key)}
								/>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each paginatedArticles as article (article['o:id'])}
							<!-- Mouse convenience; the title button is the accessible control. -->
							<tr class="article-row" onclick={(event) => selectArticle(article, event)}>
								<td class="article-title">
									<RowDetailButton
										label={detailLabel(article)}
										onclick={(event) => selectArticle(article, event)}
										>{article['o:title'] ?? $t.table.untitled}</RowDetailButton
									>
								</td>
								<td>{getJournalName(article)}</td>
								<td>{$fmtDate(article.publication_date)}</td>
								<td>
									<SentimentBadge
										type="centrality"
										value={article.sentiment_analysis?.centralite_islam_musulmans}
									/>
								</td>
								<td>
									<SentimentBadge type="polarity" value={article.sentiment_analysis?.polarite} />
								</td>
								<td>
									<SentimentBadge
										type="subjectivity"
										value={article.sentiment_analysis?.subjectivite_score}
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<div class="pagination-bottom mt-4">
			<PaginationControls {pagination} showPageNumbers={false} />
		</div>
	{:else}
		<EmptyState
			title={$t.table.searchNoResults.replace('{query}', viewOptionsState.tableSearch.trim())}
			lede={$t.table.searchNoResultsHint}
		/>
	{/if}
{:else}
	<EmptyState title={$t.table.noFilteredArticles} lede={$t.table.noFilteredArticlesHint} />
{/if}

<style>
	.table-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.search-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		width: 100%;
		max-width: 24rem;
	}

	.search-note {
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.table-container {
		max-height: var(--height-chart-md);
		overflow-y: auto;
		position: relative;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	/* Sortable header cells are rendered by SortableHeader, a child component, so
	   this table's rules reach them as `:global(th)` under its own `table`. */
	table :global(th),
	td {
		padding: var(--space-3) var(--space-4);
		text-align: left;
		border-bottom: 1px solid var(--border-subtle);
	}

	/* Sticky header: typography and the opaque background are owned by the
	   global `.table th` rule, which wins ties on source order. */
	table :global(th) {
		position: sticky;
		top: 0;
		z-index: 1;
		box-shadow: 0 1px 0 var(--border-default);
	}

	.article-row {
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.article-row:hover {
		background-color: color-mix(in oklab, var(--color-primary-500) 10%, transparent);
	}

	.pagination-bottom {
		padding: var(--space-3) var(--space-4);
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	/* ---- Cards, below 640px ---- */
	.mobile-sort-controls {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	/* The sort row exists only on a phone: the last place to shrink targets. */
	.mobile-sort-controls select {
		min-height: var(--size-control-lg);
	}

	.sort-label {
		font-size: var(--font-size-xs);
		color: var(--text-primary);
	}

	.sort-direction-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-panel);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.sort-direction-btn:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.card-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-height: var(--height-chart-lg);
		overflow-y: auto;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card-badges {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	@media (min-width: 640px) {
		.table-container {
			max-height: var(--height-chart-lg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.article-row,
		.sort-direction-btn {
			transition: none;
		}
	}
</style>
