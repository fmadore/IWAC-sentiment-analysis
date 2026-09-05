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
	import { MediaQuery } from 'svelte/reactivity';
	import { t } from '$lib/i18n';
	import { num, fmtDate } from '$lib/i18n/utils';
	import { datasetState } from '$lib/stores';
	import type { ArbiterV2LegendEntry, ArbiterV2Row } from '$lib/utils/arbiterV2';
	import {
		CONFIDENCE_ORDER,
		getConfidenceBadgeClass,
		getConfidenceLabel
	} from '$lib/utils/arbiter';
	import { createPagination } from '$lib/utils/pagination.svelte';
	import PaginationControls from '$lib/components/common/PaginationControls.svelte';
	import ArbiterV2CSVExportButton from '$lib/components/ui/ArbiterV2CSVExportButton.svelte';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';

	interface ArbiterV2ArticleTableProps {
		rows: ArbiterV2Row[];
		legend: ArbiterV2LegendEntry[];
		onSelect: (row: ArbiterV2Row) => void;
	}

	let { rows, legend, onSelect }: ArbiterV2ArticleTableProps = $props();

	/**
	 * Four columns fit from the first breakpoint up; below it the rows become
	 * cards. A declared breakpoint, read through MediaQuery, rather than a
	 * viewport width read once at mount.
	 */
	const wide = new MediaQuery('min-width: 640px', false);

	type SortKey = 'spread' | 'date' | 'title' | 'verdict' | 'confidence';
	let sortBy = $state<SortKey>('spread');
	let sortDirection = $state<'asc' | 'desc'>('desc');

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

	const sorted = $derived.by(() => {
		const direction = sortDirection === 'asc' ? 1 : -1;
		return [...rows].sort((a, b) => {
			let valA: string | number;
			let valB: string | number;
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
					valA = verdictWeight(a);
					valB = verdictWeight(b);
					break;
				case 'confidence':
					valA = CONFIDENCE_ORDER[a.evaluation.arbiter.confidence_level] ?? 0;
					valB = CONFIDENCE_ORDER[b.evaluation.arbiter.confidence_level] ?? 0;
					break;
				case 'spread':
				default:
					valA = a.evaluation.spread.total_spread;
					valB = b.evaluation.spread.total_spread;
					break;
			}
			if (valA === valB) return 0;
			return (valA > valB ? 1 : -1) * direction;
		});
	});

	const pagination = createPagination({
		totalItems: () => sorted.length,
		initialItemsPerPage: 25,
		itemsPerPageOptions: [10, 25, 50, 100],
		maxVisiblePages: () => (wide.current ? 5 : 3)
	});

	const page = $derived(sorted.slice(pagination.startIndex, pagination.endIndex));

	function handleSort(column: SortKey) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = column === 'title' ? 'asc' : 'desc';
		}
		pagination.currentPage = 1;
	}

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

	function activate(event: KeyboardEvent, row: ArbiterV2Row) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSelect(row);
		}
	}
</script>

{#if rows.length > 0}
	<div class="controls">
		<PaginationControls
			{pagination}
			showLabels={wide.current}
			showItemsPerPage
			selectId="arbiter-v2-items-per-page"
		>
			{#snippet resultsInfo()}
				<div class="controls-lead">
					<span class="results-info">
						{$t.table.showingItems}
						<strong>{$num(pagination.startIndex + 1)}–{$num(pagination.endIndex)}</strong>
						{$t.common.of}
						<strong>{$num(sorted.length)}</strong>
					</span>
					<ArbiterV2CSVExportButton {rows} {legend} />
				</div>
			{/snippet}
		</PaginationControls>
	</div>

	{#if wide.current}
		<div class="table-container arbiter-table-wrapper">
			<table class="table">
				<thead>
					<tr>
						<th class="sortable-header">
							<button class="sort-button" type="button" onclick={() => handleSort('title')}>
								{$t.table.articleTitle}
								{#if sortBy === 'title'}<ArrowUpDownIcon size={14} />{/if}
							</button>
						</th>
						<th class="sortable-header col-date">
							<button class="sort-button" type="button" onclick={() => handleSort('date')}>
								{$t.table.date}
								{#if sortBy === 'date'}<ArrowUpDownIcon size={14} />{/if}
							</button>
						</th>
						<th class="sortable-header text-center">
							<button class="sort-button" type="button" onclick={() => handleSort('spread')}>
								{$t.arbiterV2.spread}
								{#if sortBy === 'spread'}<ArrowUpDownIcon size={14} />{/if}
							</button>
						</th>
						<th class="sortable-header">
							<button class="sort-button" type="button" onclick={() => handleSort('verdict')}>
								{$t.arbiterV2.verdict}
								{#if sortBy === 'verdict'}<ArrowUpDownIcon size={14} />{/if}
							</button>
						</th>
						<th class="sortable-header text-center">
							<button class="sort-button" type="button" onclick={() => handleSort('confidence')}>
								{$t.arbiterV2.confidence}
								{#if sortBy === 'confidence'}<ArrowUpDownIcon size={14} />{/if}
							</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each page as row (row.articleId)}
						<tr
							class="article-row"
							onclick={() => onSelect(row)}
							onkeydown={(event) => activate(event, row)}
							role="button"
							tabindex="0"
							aria-label="{$t.arbiterV2.viewArticleDetails}: {rowTitle(row)}"
						>
							<td class="col-title">
								<span class="row-title">{rowTitle(row)}</span>
								<span class="row-meta">{row.journal}</span>
							</td>
							<td class="col-date"><span class="row-meta">{$fmtDate(row.date)}</span></td>
							<td class="text-center">
								<span class="spread-value">{row.evaluation.spread.total_spread}</span>
							</td>
							<td>
								<span class="verdict">
									<span class="verdict-swatch" style="background: {winnerColor(row)}"></span>
									{winnerName(row)}
								</span>
							</td>
							<td class="text-center">
								<span
									class="badge badge-sm {getConfidenceBadgeClass(
										row.evaluation.arbiter.confidence_level
									)}"
								>
									{getConfidenceLabel(row.evaluation.arbiter.confidence_level, $t)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<ul class="cards">
			{#each page as row (row.articleId)}
				<li>
					<button
						type="button"
						class="card-row"
						onclick={() => onSelect(row)}
						aria-label="{$t.arbiterV2.viewArticleDetails}: {rowTitle(row)}"
					>
						<span class="row-title">{rowTitle(row)}</span>
						<span class="row-meta">{row.journal} • {$fmtDate(row.date)}</span>
						<span class="card-verdicts">
							<span class="verdict">
								<span class="verdict-swatch" style="background: {winnerColor(row)}"></span>
								{winnerName(row)}
							</span>
							<span
								class="badge badge-sm {getConfidenceBadgeClass(
									row.evaluation.arbiter.confidence_level
								)}"
							>
								{getConfidenceLabel(row.evaluation.arbiter.confidence_level, $t)}
							</span>
							<span class="card-spread">
								{$t.arbiterV2.spread}
								<strong>{row.evaluation.spread.total_spread}</strong>
							</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if pagination.totalPages > 1}
		<div class="pagination-bottom">
			<PaginationControls {pagination} showLabels={wide.current} />
		</div>
	{/if}
{:else}
	<div class="empty-state">
		<p class="empty-state-lede">{$t.arbiterV2.noEvaluatedArticles}</p>
	</div>
{/if}

<style>
	.controls,
	.pagination-bottom {
		/* The active page marker takes the arbiter amber, as the v1 table does. */
		--pagination-active-bg: var(--sentiment-arbiter);
		--pagination-active-border: var(--sentiment-arbiter);
		--pagination-active-text: var(--text-on-light);

		background: var(--surface-subtle);
		border: 1px solid var(--sentiment-arbiter-border);
		padding: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.pagination-bottom {
		margin: var(--space-4) 0 0;
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
	th {
		position: sticky;
		top: 0;
		z-index: 1;
		box-shadow: 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
	}

	.sortable-header {
		cursor: pointer;
		user-select: none;
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

	.sort-button {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		width: 100%;
		padding: 0;
		appearance: none;
		background: none;
		border: 0;
		color: inherit;
		cursor: pointer;
		font: inherit;
		font-weight: inherit;
		text-align: inherit;
	}

	.sortable-header.text-center .sort-button {
		justify-content: center;
	}

	.sort-button:focus-visible {
		outline: 2px solid var(--color-primary-400);
		outline-offset: 3px;
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

	.row-title {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-weight: var(--font-weight-medium);
		color: var(--text-primary);
	}

	.row-meta {
		display: block;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* Header and cell hide and show together: the cell must never carry a
	   second display rule that outranks this one, or the body rows gain a
	   column the header lacks below the breakpoint. */
	.col-date {
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

	.badge {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		border-radius: 0;
		border: 1px solid var(--border-default);
		white-space: nowrap;
	}

	.badge-sm {
		padding: var(--space-0-5) var(--space-2);
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

	.card-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-4);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		text-align: left;
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.card-row:hover {
		background: var(--surface-card-elevated);
		border-color: var(--sentiment-arbiter-border);
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

	.empty-state {
		padding: var(--space-8);
		text-align: center;
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.empty-state-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		margin: 0;
	}

	@media (min-width: 1024px) {
		.col-date {
			display: table-cell;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card-row {
			transition: none;
		}
	}
</style>
