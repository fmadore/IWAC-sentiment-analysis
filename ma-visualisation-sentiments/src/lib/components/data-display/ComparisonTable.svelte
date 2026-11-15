<!--
  ComparisonTable

  The articles of a model pair with both models' three ratings and the total
  discrepancy. The table has eight columns, which only fit once the layout has
  the width of the 1024px breakpoint; below it the table option is disabled and
  the rows render as cards, whatever `comparisonLayout` says (the parameter is
  kept, so a shared link opens as its author saw it on a wide screen).

  The table's `<tr>` carries no class: `.comparison-row` is the CARD view's
  stacked dimension block (`display: flex; flex-direction: column`), and on a
  row it collapses all eight cells into column 1.
-->
<script lang="ts">
	import { viewOptionsState, paginationURLState } from '#lib/stores/view-options.svelte.js';
	import { comparisonState, datasetState } from '#lib/stores/index.js';
	import { fmtDate } from '#lib/i18n/utils.js';
	import { t } from '#lib/i18n/index.js';
	import { getJournalName } from '#lib/utils/format.js';
	import { discrepancyAttributes, formatDiff } from '#lib/utils/discrepancy.js';
	import { getPairModelNames, type ComparisonData } from '#lib/types/data.js';
	import { compareBy, dateKey, nextSort, titleKey, type SortOrder } from '#lib/utils/sorting.js';
	import { isBelowLarge } from '#lib/utils/viewport.svelte.js';
	import SortableHeader from '#lib/components/common/SortableHeader.svelte';
	import TableControls from '#lib/components/common/TableControls.svelte';
	import RowDetailButton from '#lib/components/common/RowDetailButton.svelte';
	import ArticleCard from '#lib/components/common/ArticleCard.svelte';
	import ComparisonCSVExportButton from '#lib/components/ui/ComparisonCSVExportButton.svelte';
	import SentimentBadge from '#lib/components/common/SentimentBadge.svelte';
	import { createPagination } from '#lib/utils/pagination.svelte.js';

	/** Eight columns need the large breakpoint; below it, cards only. */
	const narrow = $derived(isBelowLarge());
	const layout = $derived(narrow ? 'cards' : viewOptionsState.comparisonLayout);

	const modelNames = $derived(getPairModelNames(datasetState.pair, datasetState.available));

	type Dimension = 'polarity' | 'subjectivity' | 'centrality';
	type Analysis = ComparisonData['modelA'];

	const DIMENSIONS: {
		key: Dimension;
		badge: 'polarity' | 'subjectivity' | 'centrality';
		value: (analysis: Analysis | undefined) => string | number | null | undefined;
		diff: (comparison: ComparisonData) => number;
	}[] = [
		{
			key: 'polarity',
			badge: 'polarity',
			value: (analysis) => analysis?.polarite,
			diff: (comparison) => comparison.discrepancies.polarityDiff
		},
		{
			key: 'subjectivity',
			badge: 'subjectivity',
			value: (analysis) => analysis?.subjectivite_score,
			diff: (comparison) => comparison.discrepancies.subjectivityDiff
		},
		{
			key: 'centrality',
			badge: 'centrality',
			value: (analysis) => analysis?.centralite_islam_musulmans,
			diff: (comparison) => comparison.discrepancies.centralityDiff
		}
	];

	const sortedComparisons = $derived.by(() => {
		const order = viewOptionsState.comparisonOrder;
		switch (viewOptionsState.comparisonSort) {
			case 'title':
				return [...comparisonState.filtered].sort(
					compareBy((comparison: ComparisonData) => titleKey(comparison.article['o:title']), order)
				);
			case 'date':
				return [...comparisonState.filtered].sort(
					compareBy(
						(comparison: ComparisonData) => dateKey(comparison.article.publication_date),
						order
					)
				);
			case 'discrepancy':
			default:
				return [...comparisonState.filtered].sort(
					compareBy((comparison: ComparisonData) => comparison.discrepancies.totalDiff, order)
				);
		}
	});

	/**
	 * Same column flips; a new column starts at its own default (titles A→Z,
	 * discrepancies largest first).
	 */
	function sortBy(column: typeof viewOptionsState.comparisonSort, defaultOrder: SortOrder) {
		const next = nextSort(
			{ column: viewOptionsState.comparisonSort, order: viewOptionsState.comparisonOrder },
			column,
			defaultOrder
		);
		viewOptionsState.comparisonSort = next.column;
		viewOptionsState.comparisonOrder = next.order;
	}

	const pagination = createPagination({
		state: paginationURLState('comparison'),
		totalItems: () => sortedComparisons.length,
		initialItemsPerPage: 25,
		itemsPerPageOptions: [10, 25, 50, 100],
		maxVisiblePages: () => (narrow ? 3 : 5)
	});

	const paginatedComparisons = $derived(
		sortedComparisons.slice(pagination.startIndex, pagination.endIndex)
	);

	function selectComparison(comparison: ComparisonData) {
		comparisonState.selected = comparison;
	}

	function detailLabel(comparison: ComparisonData): string {
		return $t.audit.comparisonDetails.replace('{title}', comparison.article['o:title'] ?? '');
	}

	function dimensionLabel(key: Dimension): string {
		switch (key) {
			case 'polarity':
				return $t.comparison.polarity;
			case 'subjectivity':
				return $t.comparison.subjectivity;
			case 'centrality':
				return $t.comparison.centrality;
		}
	}
</script>

{#snippet dimensionBlock(comparison: ComparisonData, dimension: (typeof DIMENSIONS)[number])}
	<div class="comparison-row">
		<span class="dimension-label">{dimensionLabel(dimension.key)}</span>
		<div class="values-grid">
			<div class="value-cell">
				<span class="model-label">{modelNames.modelAName}</span>
				<SentimentBadge
					type={dimension.badge}
					value={dimension.value(comparison.modelA)}
					size="sm"
				/>
			</div>
			<div class="diff-indicator" {...discrepancyAttributes(dimension.diff(comparison))}>
				{formatDiff(dimension.diff(comparison))}
			</div>
			<div class="value-cell">
				<span class="model-label">{modelNames.modelBName}</span>
				<SentimentBadge
					type={dimension.badge}
					value={dimension.value(comparison.modelB)}
					size="sm"
				/>
			</div>
		</div>
	</div>
{/snippet}

<div class="comparison-table-container">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
		<h2 class="comparison-table-title">
			{$t.datasets.compareModels}
		</h2>
		<ComparisonCSVExportButton />
	</div>

	<div class="mb-4">
		<TableControls
			{pagination}
			total={sortedComparisons.length}
			selectId="comparison-items-per-page"
			{layout}
			onLayoutChange={(next) => (viewOptionsState.comparisonLayout = next)}
			tableDisabled={narrow}
			showLabels={!narrow}
		/>
	</div>

	{#if layout === 'table'}
		<div class="table-container comparison-table-wrapper">
			<table class="table">
				<thead>
					<!-- Row backgrounds live on the cells, not the rows: a `tr` fill sits
					     behind the sticky cells and scrolls away from under them. -->
					<tr>
						<SortableHeader
							label={$t.table.articleTitle}
							active={viewOptionsState.comparisonSort === 'title'}
							order={viewOptionsState.comparisonOrder}
							onsort={() => sortBy('title', 'asc')}
							accent="neutral"
						/>
						{#each DIMENSIONS as dimension (dimension.key)}
							<th scope="colgroup" class="text-center" colspan="2"
								>{dimensionLabel(dimension.key)}</th
							>
						{/each}
						<SortableHeader
							label={$t.comparison.totalDiscrepancy}
							active={viewOptionsState.comparisonSort === 'discrepancy'}
							order={viewOptionsState.comparisonOrder}
							onsort={() => sortBy('discrepancy', 'desc')}
							accent="neutral"
							align="center"
						/>
					</tr>
					<tr>
						<td class="subhead-spacer"></td>
						{#each DIMENSIONS as dimension (dimension.key)}
							<th scope="col" class="col-subhead text-center">{modelNames.modelAName}</th>
							<th scope="col" class="col-subhead text-center">{modelNames.modelBName}</th>
						{/each}
						<td class="subhead-spacer"></td>
					</tr>
				</thead>
				<tbody>
					{#each paginatedComparisons as comparison (comparison.article['o:id'])}
						<!-- No class on this row — see the header comment. Mouse
						     convenience only; the title button is the accessible control. -->
						<tr onclick={() => selectComparison(comparison)}>
							<td class="max-w-xs">
								<div class="flex flex-col gap-1">
									<RowDetailButton
										label={detailLabel(comparison)}
										onclick={() => selectComparison(comparison)}
										>{comparison.article['o:title'] ?? $t.table.untitled}</RowDetailButton
									>
									<span class="row-meta"
										>{getJournalName(comparison.article)} • {$fmtDate(
											comparison.article.publication_date
										)}</span
									>
								</div>
							</td>
							{#each DIMENSIONS as dimension (dimension.key)}
								<td class="text-center">
									<SentimentBadge
										type={dimension.badge}
										value={dimension.value(comparison.modelA)}
										size="sm"
									/>
								</td>
								<td class="text-center">
									<SentimentBadge
										type={dimension.badge}
										value={dimension.value(comparison.modelB)}
										size="sm"
									/>
								</td>
							{/each}
							<td class="text-center">
								<span
									class="diff-badge diff-badge-lg"
									{...discrepancyAttributes(comparison.discrepancies.totalDiff)}
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
		<ul class="cards-grid">
			{#each paginatedComparisons as comparison (comparison.article['o:id'])}
				<ArticleCard
					title={comparison.article['o:title'] ?? $t.table.untitled}
					label={detailLabel(comparison)}
					meta="{getJournalName(comparison.article)} • {$fmtDate(
						comparison.article.publication_date
					)}"
					onselect={() => selectComparison(comparison)}
					accent="neutral"
				>
					<div class="comparison-grid">
						{#each DIMENSIONS as dimension (dimension.key)}
							{@render dimensionBlock(comparison, dimension)}
						{/each}
					</div>
					<div class="card-total">
						<span class="card-total-label">{$t.comparison.totalDiscrepancy}</span>
						<span
							class="diff-badge diff-badge-lg"
							{...discrepancyAttributes(comparison.discrepancies.totalDiff)}
						>
							{comparison.discrepancies.totalDiff}
						</span>
					</div>
				</ArticleCard>
			{/each}
		</ul>
	{/if}
</div>

<style>
	/* 20 → 26px, between two steps of the type scale. */
	.comparison-table-title {
		font-family: var(--font-display);
		font-size: clamp(var(--font-size-xl), calc(var(--font-size-lg) + 1vw), var(--font-size-2xl));
		font-weight: var(--font-weight-semibold);
		line-height: var(--line-height-tight);
		color: var(--text-primary);
		letter-spacing: var(--tracking-snug);
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

	thead tr:last-child > * {
		box-shadow: 0 1px 0 var(--border-hover);
	}

	/* The empty corners of the model-name row: a `td`, so they announce
	   nothing, painted like the header around them. */
	.subhead-spacer {
		background: var(--surface-card-elevated);
	}

	/* Model-name sub-header row — subordinate to the dimension labels above */
	.col-subhead {
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-regular);
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
	}

	tbody tr {
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	tbody tr:hover {
		background-color: var(--surface-subtle);
	}

	.row-meta {
		font-size: var(--font-size-xs);
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

	.comparison-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* CARD VIEW ONLY — one stacked dimension block (label over the two models'
	   values). Never put this on the table's `<tr>`: `display: flex` overrides
	   `display: table-row` and collapses all eight `<td>`s into column 1. */
	.comparison-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.dimension-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-widest);
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
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
		text-align: center;
	}

	.diff-indicator {
		font-family: var(--font-mono);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	.card-total {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: var(--space-3);
		border-top: 1px solid var(--border-subtle);
	}

	.card-total-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.diff-badge {
		display: inline-flex;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		font-variant-numeric: tabular-nums;
		border-radius: 0;
		border: 1px solid var(--border-default);
		background: var(--surface-subtle);
	}

	.diff-badge-lg {
		padding: var(--space-1-5) var(--space-3);
		font-size: var(--font-size-xs);
	}

	/* Severity resolves from the data attribute via components.css. */
	.diff-badge[data-discrepancy],
	.diff-indicator[data-discrepancy] {
		color: var(--discrepancy-fg);
	}

	.diff-badge[data-discrepancy] {
		background: var(--discrepancy-bg);
		border-color: var(--discrepancy-border);
	}

	@media (min-width: 640px) {
		.cards-grid {
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
			gap: var(--space-5);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		tbody tr {
			transition: none;
		}
	}
</style>
