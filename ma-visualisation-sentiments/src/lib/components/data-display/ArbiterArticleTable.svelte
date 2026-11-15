<!--
  ArbiterArticleTable Component

  Archived (generation 1) pairwise arbiter: a table of the articles the arbiter
  judged, with the overall verdict and confidence. Title, newspaper and date
  come from the comparison join; the row's title button opens the article.

  The five columns fit from the 640px breakpoint up; below it the table option
  is disabled and the rows render as cards whatever `arbiterLayout` says.
  Verdict labels resolve model_a / model_b through the pair's model names; the
  blind assignment (`model_a_is_first`) is untouched here.
-->
<script lang="ts">
	import { viewOptionsState, paginationURLState } from '#lib/stores/view-options.svelte.js';
	import { arbiterEvaluations, comparisonState, datasetState } from '#lib/stores/index.js';
	import { fmtDate } from '#lib/i18n/utils.js';
	import { getPairModelNames, type ArbiterAnalysis } from '#lib/types/data.js';
	import { t } from '#lib/i18n/index.js';
	import { getJournalName } from '#lib/utils/format.js';
	import { createPagination } from '#lib/utils/pagination.svelte.js';
	import { VERDICT_ORDER, CONFIDENCE_ORDER } from '#lib/utils/arbiter.js';
	import { compareBy, dateKey, nextSort, titleKey, type SortValue } from '#lib/utils/sorting.js';
	import { isCompact } from '#lib/utils/viewport.svelte.js';
	import TableControls from '#lib/components/common/TableControls.svelte';
	import RowDetailButton from '#lib/components/common/RowDetailButton.svelte';
	import ArticleCard from '#lib/components/common/ArticleCard.svelte';
	import ConfidenceBadge from '#lib/components/common/ConfidenceBadge.svelte';
	import VerdictBadge from '#lib/components/common/VerdictBadge.svelte';
	import EmptyState from '#lib/components/common/EmptyState.svelte';
	import SortableHeader from '#lib/components/common/SortableHeader.svelte';
	import ArbiterCSVExportButton from '#lib/components/ui/ArbiterCSVExportButton.svelte';

	interface ArbiterArticleTableProps {
		onSelectArticle: (articleId: string, arbiterData: ArbiterAnalysis) => void;
	}

	let { onSelectArticle }: ArbiterArticleTableProps = $props();

	/** Five columns fit from the first breakpoint up; below it, cards only. */
	const compact = $derived(isCompact());
	const layout = $derived(compact ? 'cards' : viewOptionsState.arbiterLayout);

	const modelNames = $derived(getPairModelNames(datasetState.pair, datasetState.available));

	interface ArticleWithArbiter {
		articleId: string;
		title: string;
		/** The stored title, for sorting; null when the corpus has none. */
		sortTitle: string | null;
		journal: string;
		date: string | null;
		arbiter: ArbiterAnalysis;
	}

	const articlesWithArbiter = $derived.by(() => {
		const evaluations = arbiterEvaluations.current?.evaluations;
		// Use comparisonState.data to reactively subscribe to the store
		const comparisons = comparisonState.data;
		if (!evaluations || evaluations.length === 0) return [];

		const comparisonsById = new Map(
			(comparisons ?? []).map((comparison) => [String(comparison.article['o:id']), comparison])
		);

		return evaluations.map((evaluation): ArticleWithArbiter => {
			const comparison = comparisonsById.get(String(evaluation.article_id));
			if (comparison) {
				const sortTitle = titleKey(comparison.article['o:title']);
				return {
					articleId: evaluation.article_id,
					title: sortTitle ?? $t.table.untitled,
					sortTitle,
					journal: getJournalName(comparison.article),
					date: comparison.article.publication_date || null,
					arbiter: evaluation.arbiter
				};
			}
			// Not in the comparison data: still listed, by its id.
			return {
				articleId: evaluation.article_id,
				title: `#${evaluation.article_id}`,
				sortTitle: null,
				journal: $t.table.unknownJournal,
				date: null,
				arbiter: evaluation.arbiter
			};
		});
	});

	type SortColumn = typeof viewOptionsState.arbiterSort;

	function sortValue(article: ArticleWithArbiter, column: SortColumn): SortValue {
		switch (column) {
			case 'title':
				return article.sortTitle;
			case 'date':
				return dateKey(article.date);
			case 'verdict':
				return VERDICT_ORDER[article.arbiter.overall_winner] ?? null;
			case 'confidence':
				return CONFIDENCE_ORDER[article.arbiter.confidence_level] ?? null;
		}
	}

	const sortedArticles = $derived.by(() => {
		const column = viewOptionsState.arbiterSort;
		return [...articlesWithArbiter].sort(
			compareBy(
				(article: ArticleWithArbiter) => sortValue(article, column),
				viewOptionsState.arbiterOrder
			)
		);
	});

	const pagination = createPagination({
		state: paginationURLState('arbiter'),
		totalItems: () => sortedArticles.length,
		initialItemsPerPage: 25,
		itemsPerPageOptions: [10, 25, 50, 100],
		maxVisiblePages: () => (compact ? 3 : 5)
	});

	const paginatedArticles = $derived(
		sortedArticles.slice(pagination.startIndex, pagination.endIndex)
	);

	function getVerdictLabel(verdict: 'model_a' | 'model_b' | 'both' | 'neither'): string {
		switch (verdict) {
			case 'model_a':
				return modelNames.modelAName;
			case 'model_b':
				return modelNames.modelBName;
			case 'both':
				return $t.arbiter.bothEqual;
			case 'neither':
				return $t.arbiter.neitherAccurate;
			default:
				return verdict;
		}
	}

	function handleSort(column: SortColumn) {
		const next = nextSort(
			{ column: viewOptionsState.arbiterSort, order: viewOptionsState.arbiterOrder },
			column
		);
		viewOptionsState.arbiterSort = next.column;
		viewOptionsState.arbiterOrder = next.order;
		pagination.currentPage = 1;
	}

	function handleRowClick(article: ArticleWithArbiter) {
		onSelectArticle(article.articleId, article.arbiter);
	}

	function detailLabel(article: ArticleWithArbiter): string {
		return `${$t.arbiter.viewArticleDetails}: ${article.title}`;
	}
</script>

<div class="arbiter-article-table-container">
	{#if articlesWithArbiter.length > 0}
		<div class="mb-4">
			<TableControls
				{pagination}
				total={sortedArticles.length}
				selectId="arbiter-items-per-page"
				{layout}
				onLayoutChange={(next) => (viewOptionsState.arbiterLayout = next)}
				tableDisabled={compact}
				showLabels={!compact}
				accent="arbiter"
			>
				{#snippet actions()}<ArbiterCSVExportButton />{/snippet}
			</TableControls>
		</div>

		{#if layout === 'table'}
			<div class="table-container arbiter-table-wrapper">
				<table class="table">
					<thead>
						<tr>
							<SortableHeader
								label={$t.table.articleTitle}
								active={viewOptionsState.arbiterSort === 'title'}
								order={viewOptionsState.arbiterOrder}
								onsort={() => handleSort('title')}
								accent="arbiter"
							/>
							<th scope="col">{$t.filters.journal}</th>
							<SortableHeader
								label={$t.table.date}
								active={viewOptionsState.arbiterSort === 'date'}
								order={viewOptionsState.arbiterOrder}
								onsort={() => handleSort('date')}
								accent="arbiter"
							/>
							<SortableHeader
								label={$t.arbiter.overallVerdict}
								active={viewOptionsState.arbiterSort === 'verdict'}
								order={viewOptionsState.arbiterOrder}
								onsort={() => handleSort('verdict')}
								accent="arbiter"
								align="center"
							/>
							<SortableHeader
								label={$t.arbiter.confidenceLevel}
								active={viewOptionsState.arbiterSort === 'confidence'}
								order={viewOptionsState.arbiterOrder}
								onsort={() => handleSort('confidence')}
								accent="arbiter"
								align="center"
							/>
						</tr>
					</thead>
					<tbody>
						{#each paginatedArticles as article (article.articleId)}
							<!-- Mouse convenience; the title button is the accessible control. -->
							<tr class="article-row" onclick={() => handleRowClick(article)}>
								<td class="max-w-xs">
									<RowDetailButton
										label={detailLabel(article)}
										onclick={() => handleRowClick(article)}
										clamp>{article.title}</RowDetailButton
									>
								</td>
								<td class="row-meta">{article.journal}</td>
								<td class="row-meta">{$fmtDate(article.date)}</td>
								<td class="text-center">
									<VerdictBadge
										verdict={article.arbiter.overall_winner}
										label={getVerdictLabel(article.arbiter.overall_winner)}
									/>
								</td>
								<td class="text-center">
									<ConfidenceBadge level={article.arbiter.confidence_level} />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<ul class="cards-grid">
				{#each paginatedArticles as article (article.articleId)}
					<ArticleCard
						title={article.title}
						label={detailLabel(article)}
						meta="{article.journal} • {$fmtDate(article.date)}"
						onselect={() => handleRowClick(article)}
						accent="arbiter"
					>
						<div class="card-badges">
							<VerdictBadge
								verdict={article.arbiter.overall_winner}
								label={getVerdictLabel(article.arbiter.overall_winner)}
							/>
							<ConfidenceBadge level={article.arbiter.confidence_level} />
						</div>
					</ArticleCard>
				{/each}
			</ul>
		{/if}
	{:else}
		<EmptyState title={$t.arbiter.noEvaluatedArticles} lede={$t.table.emptyHint} />
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

	/* Sortable header cells are rendered by SortableHeader, a child component, so
	   this table's rules reach them as `:global(th)` under its own `table`.
	   Background owned by the global `.table th` rule. */
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
		background-color: color-mix(in oklab, var(--sentiment-arbiter) 10%, transparent);
	}

	.row-meta {
		color: var(--text-muted);
	}

	.cards-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card-badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	@media (min-width: 640px) {
		.cards-grid {
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
			gap: var(--space-5);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.article-row {
			transition: none;
		}
	}
</style>
