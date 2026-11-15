<!--
  ArbiterV2ArticleTable

  The articles the panel arbiter read, one row each, with what it decided.
  Title, newspaper and date come from the corpus join rather than from the
  arbiter file, which carries only ids; the row opens the article and the
  full verdict in ArbiterV2ArticleDetailModal.

  A sibling of ArbiterArticleTable, not a generalisation of it: the v1 table
  is pairwise (two named models, win/loss badges) and is part of the archive.
  This one names whichever of the panel the verdict prefers, or says that
  several were equally close.
-->
<script lang="ts">
	import { viewOptionsState, paginationURLState } from '#lib/stores/view-options.svelte.js';
	import { t } from '#lib/i18n/index.js';
	import { fmtDate } from '#lib/i18n/utils.js';
	import { datasetState } from '#lib/stores/index.js';
	import type { ArbiterV2LegendEntry, ArbiterV2Row } from '#lib/utils/arbiterV2.js';
	import { CONFIDENCE_ORDER } from '#lib/utils/arbiter.js';
	import { createPagination } from '#lib/utils/pagination.svelte.js';
	import PaginationControls from '#lib/components/common/PaginationControls.svelte';
	import ArbiterV2CSVExportButton from '#lib/components/ui/ArbiterV2CSVExportButton.svelte';
	import { compareBy, dateKey, nextSort, titleKey, type SortValue } from '#lib/utils/sorting.js';
	import { isCompact } from '#lib/utils/viewport.svelte.js';
	import SortableHeader from '#lib/components/common/SortableHeader.svelte';
	import TableControls from '#lib/components/common/TableControls.svelte';
	import RowDetailButton from '#lib/components/common/RowDetailButton.svelte';
	import ArticleCard from '#lib/components/common/ArticleCard.svelte';
	import ConfidenceBadge from '#lib/components/common/ConfidenceBadge.svelte';
	import EmptyState from '#lib/components/common/EmptyState.svelte';

	interface ArbiterV2ArticleTableProps {
		rows: ArbiterV2Row[];
		legend: ArbiterV2LegendEntry[];
		onSelect: (row: ArbiterV2Row) => void;
	}

	let { rows, legend, onSelect }: ArbiterV2ArticleTableProps = $props();

	/**
	 * The columns fit from the first breakpoint up (the date joins them at
	 * 1024px, in CSS); below it the rows become cards.
	 */
	const wide = $derived(!isCompact());

	type SortKey = 'spread' | 'date' | 'title' | 'verdict' | 'confidence';

	/** Contract order for the models, then "several", then "none". */
	const verdictRank = $derived(
		Object.fromEntries(legend.map((entry, index) => [entry.modelId, index])) as Record<
			string,
			number
		>
	);

	function verdictWeight(row: ArbiterV2Row): number {
		if (row.winner) return verdictRank[row.winner] ?? legend.length;
		return row.evaluation.arbiter.overall_winner === 'multiple'
			? legend.length + 1
			: legend.length + 2;
	}

	function sortValue(row: ArbiterV2Row, column: SortKey): SortValue {
		switch (column) {
			case 'title':
				return titleKey(row.title);
			case 'date':
				return dateKey(row.date);
			case 'verdict':
				return verdictWeight(row);
			case 'confidence':
				return CONFIDENCE_ORDER[row.evaluation.arbiter.confidence_level] ?? null;
			case 'spread':
			default:
				return row.evaluation.spread.total_spread;
		}
	}

	const sorted = $derived.by(() => {
		const column = viewOptionsState.panelSort;
		return [...rows].sort(
			compareBy((row: ArbiterV2Row) => sortValue(row, column), viewOptionsState.panelOrder)
		);
	});

	const pagination = createPagination({
		state: paginationURLState('panel'),
		totalItems: () => sorted.length,
		initialItemsPerPage: 25,
		itemsPerPageOptions: [10, 25, 50, 100],
		maxVisiblePages: () => (wide ? 5 : 3)
	});

	const page = $derived(sorted.slice(pagination.startIndex, pagination.endIndex));

	/** Same column flips; a new column starts A→Z for titles, largest first otherwise. */
	function handleSort(column: SortKey) {
		const next = nextSort(
			{ column: viewOptionsState.panelSort, order: viewOptionsState.panelOrder },
			column,
			column === 'title' ? 'asc' : 'desc'
		);
		viewOptionsState.panelSort = next.column;
		viewOptionsState.panelOrder = next.order;
		pagination.currentPage = 1;
	}

	const panelColumns = $derived<
		{ key: SortKey; label: string; align: 'start' | 'center'; class?: string }[]
	>([
		{ key: 'title', label: $t.table.articleTitle, align: 'start' },
		{ key: 'date', label: $t.table.date, align: 'start', class: 'col-date' },
		{ key: 'spread', label: $t.arbiterV2.spread, align: 'center' },
		{ key: 'verdict', label: $t.arbiterV2.verdict, align: 'start' },
		{ key: 'confidence', label: $t.arbiterV2.confidence, align: 'center' }
	]);

	function winnerName(row: ArbiterV2Row): string {
		if (row.winner) {
			return legend.find((entry) => entry.modelId === row.winner)?.name ?? row.winner;
		}
		return row.evaluation.arbiter.overall_winner === 'multiple'
			? $t.arbiterV2.multiple
			: $t.arbiterV2.none;
	}

	function winnerColor(row: ArbiterV2Row): string {
		return (row.winner && datasetState.getById(row.winner)?.color) || 'var(--text-muted)';
	}

	function rowTitle(row: ArbiterV2Row): string {
		return row.title || `#${row.articleId}`;
	}

	function detailLabel(row: ArbiterV2Row): string {
		return `${$t.arbiterV2.viewArticleDetails}: ${rowTitle(row)}`;
	}
</script>

{#snippet verdict(row: ArbiterV2Row)}
	<span class="verdict">
		<span class="verdict-swatch" style:background={winnerColor(row)}></span>
		{winnerName(row)}
	</span>
{/snippet}

{#if rows.length > 0}
	<div class="mb-4">
		<TableControls
			{pagination}
			total={sorted.length}
			selectId="arbiter-v2-items-per-page"
			showLabels={wide}
			showPages={false}
			accent="arbiter"
		>
			{#snippet actions()}<ArbiterV2CSVExportButton {rows} {legend} />{/snippet}
		</TableControls>
	</div>

	{#if wide}
		<div class="table-container arbiter-table-wrapper">
			<table class="table">
				<thead>
					<tr>
						{#each panelColumns as column (column.key)}
							<SortableHeader
								label={column.label}
								active={viewOptionsState.panelSort === column.key}
								order={viewOptionsState.panelOrder}
								onsort={() => handleSort(column.key)}
								accent="arbiter"
								align={column.align}
								class={column.class}
							/>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each page as row (row.articleId)}
						<!-- Mouse convenience; the title button is the accessible control. -->
						<tr class="article-row" onclick={() => onSelect(row)}>
							<td class="col-title">
								<RowDetailButton label={detailLabel(row)} onclick={() => onSelect(row)} clamp
									>{rowTitle(row)}</RowDetailButton
								>
								<span class="row-meta">{row.journal}</span>
							</td>
							<td class="col-date"><span class="row-meta">{$fmtDate(row.date)}</span></td>
							<td class="text-center">
								<span class="spread-value">{row.evaluation.spread.total_spread}</span>
							</td>
							<td>{@render verdict(row)}</td>
							<td class="text-center">
								<ConfidenceBadge level={row.evaluation.arbiter.confidence_level} />
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<ul class="cards">
			{#each page as row (row.articleId)}
				<ArticleCard
					title={rowTitle(row)}
					label={detailLabel(row)}
					meta="{row.journal} • {$fmtDate(row.date)}"
					onselect={() => onSelect(row)}
					accent="arbiter"
				>
					<span class="card-verdicts">
						{@render verdict(row)}
						<ConfidenceBadge level={row.evaluation.arbiter.confidence_level} />
						<span class="card-spread">
							{$t.arbiterV2.spread}
							<strong>{row.evaluation.spread.total_spread}</strong>
						</span>
					</span>
				</ArticleCard>
			{/each}
		</ul>
	{/if}

	{#if pagination.totalPages > 1}
		<div class="pagination-bottom">
			<PaginationControls {pagination} showLabels={wide} />
		</div>
	{/if}
{:else}
	<EmptyState title={$t.arbiterV2.noEvaluatedArticles} lede={$t.table.emptyHint} />
{/if}

<style>
	.pagination-bottom {
		/* The active page marker takes the arbiter amber, as the v1 table does. */
		--pagination-active-bg: var(--sentiment-arbiter);
		--pagination-active-border: var(--sentiment-arbiter);
		--pagination-active-text: var(--text-on-light);

		background: var(--surface-subtle);
		border: 1px solid var(--sentiment-arbiter-border);
		padding: var(--space-3);
		margin: var(--space-4) 0 0;
	}

	.table-container {
		max-height: var(--height-chart-lg);
		overflow-y: auto;
	}

	.arbiter-table-wrapper {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-arbiter);
	}

	/* Typography and the opaque background are owned by the global `.table th`
	   rule; only sticky positioning is added here. */
	/* Sortable header cells are rendered by SortableHeader, a child component, so
	   this table's rules reach them as `:global(th)` under its own `table`. */
	table :global(th) {
		position: sticky;
		top: 0;
		z-index: 1;
		box-shadow: 0 1px 0 var(--border-default);
	}

	.article-row {
		cursor: pointer;
	}

	.article-row:hover {
		background-color: color-mix(in oklab, var(--sentiment-arbiter) 10%, transparent);
	}

	.col-title {
		max-width: 28rem;
	}

	.row-meta {
		display: block;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* Header and cell hide and show together: the cell must never carry a
	   second display rule that outranks this one, or the body rows gain a
	   column the header lacks below the breakpoint. The header cell is
	   SortableHeader's, so both are reached through the table. */
	table :global(.col-date) {
		display: none;
		white-space: nowrap;
	}

	.spread-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
	}

	/* The model's colour goes on the swatch only: brand colours are not
	   contrast-checked as text, and the name has to stay readable. */
	.verdict {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.verdict-swatch {
		width: 10px;
		height: 10px;
		flex-shrink: 0;
	}

	/* ---- Cards, below 640px ---- */
	.cards {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.card-verdicts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		margin-top: var(--space-1);
	}

	.card-spread {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.card-spread strong {
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	@media (min-width: 1024px) {
		table :global(.col-date) {
			display: table-cell;
		}
	}
</style>
