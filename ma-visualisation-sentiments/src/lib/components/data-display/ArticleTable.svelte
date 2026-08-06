<script lang="ts">
	import { articleState } from '$lib/stores';
	import { POLARITY_ORDER, CENTRALITY_ORDER, type Article } from '$lib/types/data';
	import { getJournalName } from '$lib/utils/format';
	import { formatDate } from '$lib/utils/format';
	import { t } from '$lib/i18n';
	import { DatasetBadge } from '$lib/components/ui';
	import { SentimentBadge } from '$lib/components/common';
	import { updateURL } from '$lib/stores/url';
	import { innerWidth } from 'svelte/reactivity/window';
	import { createPagination } from '$lib/utils/pagination.svelte';
	import PaginationControls from '$lib/components/common/PaginationControls.svelte';

	// Props - for event dispatching
	let {
		onShowDetails
	}: {
		onShowDetails: (details: { article: Article; position: { x: number; y: number } }) => void;
	} = $props();

	// Reactive articles from store
	let articles = $derived(articleState.filtered);

	// Reactive mobile detection using svelte/reactivity/window
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Variables pour le tri
	let sortColumn = $state<string>('titre');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Référence pour le conteneur du tableau
	let tableContainerRef = $state<HTMLElement | undefined>();

	// Dispatcher is removed

	function selectArticle(article: Article, event: MouseEvent) {
		articleState.selected = article;

		// Update URL to include the selected article ID
		updateURL(undefined, true);

		// Notifier le parent de montrer les détails via callback prop
		if (onShowDetails) {
			onShowDetails({
				article, // Ensure article is passed as per the prop type
				position: { x: event.clientX, y: event.clientY }
			});
		}
	}

	// Fonction pour changer la colonne de tri
	function sortBy(column: string) {
		if (sortColumn === column) {
			// Inverser la direction si on clique sur la même colonne
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// Nouvelle colonne de tri, direction par défaut ascendante
			sortColumn = column;
			sortDirection = 'asc';
		}
		// Réinitialiser à la première page après un tri
		pagination.currentPage = 1;
	}

	// Fonction pour trier les articles
	const sortedArticles = $derived(
		[...articles].sort((a, b) => {
			let valA, valB;

			// Extraction des valeurs selon la colonne
			switch (sortColumn) {
				case 'titre':
					valA = a['o:title'] || '';
					valB = b['o:title'] || '';
					break;
				case 'journal':
					valA = getJournalName(a);
					valB = getJournalName(b);
					break;
				case 'date':
					valA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
					valB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
					break;
				case 'centralite': {
					const centralA = a.sentiment_analysis?.centralite_islam_musulmans || 'Non abordé';
					const centralB = b.sentiment_analysis?.centralite_islam_musulmans || 'Non abordé';
					valA = CENTRALITY_ORDER[centralA as keyof typeof CENTRALITY_ORDER] || 0;
					valB = CENTRALITY_ORDER[centralB as keyof typeof CENTRALITY_ORDER] || 0;
					break;
				}
				case 'polarite': {
					const polA = a.sentiment_analysis?.polarite || 'Non applicable';
					const polB = b.sentiment_analysis?.polarite || 'Non applicable';
					valA = POLARITY_ORDER[polA as keyof typeof POLARITY_ORDER] || 0;
					valB = POLARITY_ORDER[polB as keyof typeof POLARITY_ORDER] || 0;
					break;
				}
				case 'subjectivite':
					valA = Number(a.sentiment_analysis?.subjectivite_score || 0);
					valB = Number(b.sentiment_analysis?.subjectivite_score || 0);
					break;
				default:
					return 0;
			}

			// Comparaison en fonction de la direction
			if (sortDirection === 'asc') {
				return valA > valB ? 1 : valA < valB ? -1 : 0;
			} else {
				return valA < valB ? 1 : valA > valB ? -1 : 0;
			}
		})
	);

	// Fonction pour faire défiler vers le haut du tableau
	function scrollToTop() {
		if (tableContainerRef) {
			tableContainerRef.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}
	}

	// Pagination
	const pagination = createPagination({
		totalItems: () => articles.length,
		initialItemsPerPage: 50,
		itemsPerPageOptions: [25, 50, 100, 200],
		maxVisiblePages: 7,
		onPageChange: () => setTimeout(scrollToTop, 100)
	});

	const paginatedArticles = $derived(
		sortedArticles.slice(pagination.startIndex, pagination.endIndex)
	);
</script>

{#if articles.length > 0}
	<!-- Dataset badge -->
	<div class="mb-4">
		<DatasetBadge size="sm" />
	</div>

	<!-- Informations et contrôles de pagination (en haut) -->
	<div bind:this={tableContainerRef} class="pagination-info mb-4">
		<PaginationControls {pagination} showLabels={false} showItemsPerPage selectId="items-per-page">
			{#snippet resultsInfo()}
				<span class="results-info">
					{$t.table.showingItems}
					{pagination.startIndex + 1} à {pagination.endIndex} sur {articles.length}
					{$t.common.articles}
				</span>
			{/snippet}
		</PaginationControls>
	</div>

	<!-- Mobile Card View -->
	{#if isMobile}
		<!-- Mobile Sort Controls -->
		<div class="mobile-sort-controls mb-4 p-3 card variant-glass">
			<div class="flex items-center gap-2">
				<label for="mobile-sort-select" class="sort-label whitespace-nowrap"
					>{$t.common.sortBy}:</label
				>
				<select
					id="mobile-sort-select"
					bind:value={sortColumn}
					onchange={() => (pagination.currentPage = 1)}
					class="select select-sm flex-1"
				>
					<option value="titre">{$t.table.articleTitle}</option>
					<option value="journal">{$t.filters.journal}</option>
					<option value="date">{$t.table.date}</option>
					<option value="centralite">{$t.table.centrality}</option>
					<option value="polarite">{$t.table.polarity}</option>
					<option value="subjectivite">{$t.table.subjectivity}</option>
				</select>
				<button
					class="btn btn-sm sort-direction-btn"
					onclick={() => {
						sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
						pagination.currentPage = 1;
					}}
					title={$t.table.sortBy}
				>
					{sortDirection === 'asc' ? '↑' : '↓'}
				</button>
			</div>
		</div>

		<div class="mobile-cards space-y-3">
			{#each paginatedArticles as article (article['o:id'])}
				<button
					class="mobile-card card variant-glass p-4 cursor-pointer w-full text-left border-0"
					onclick={(event) => selectArticle(article, event)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							const mouseEvent = new MouseEvent('click', {
								clientX: 0,
								clientY: 0,
								bubbles: true
							});
							selectArticle(article, mouseEvent);
						}
					}}
					aria-label="{$t.table.viewDetails}: {article['o:title']}"
				>
					<div class="mb-2">
						<h3 class="card-title line-clamp-2 mb-1">
							{article['o:title']}
						</h3>
						<div class="card-meta flex items-center gap-2">
							<span>{getJournalName(article)}</span>
							<span>•</span>
							<span>{formatDate(article.publication_date)}</span>
						</div>
					</div>

					<div class="flex flex-wrap gap-2">
						<SentimentBadge
							type="centrality"
							value={article.sentiment_analysis?.centralite_islam_musulmans}
							size="sm"
						/>
						<SentimentBadge
							type="polarity"
							value={article.sentiment_analysis?.polarite}
							size="sm"
						/>
						<SentimentBadge
							type="subjectivity"
							value={article.sentiment_analysis?.subjectivite_score}
							size="sm"
						/>
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<!-- Desktop Table View -->
		<div class="table-container card variant-glass">
			<table class="table">
				<thead>
					<tr class="bg-surface-800">
						<th class="sortable-header" onclick={() => sortBy('titre')}>
							{$t.table.articleTitle}
							{sortColumn === 'titre' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="sortable-header" onclick={() => sortBy('journal')}>
							{$t.filters.journal}
							{sortColumn === 'journal' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="sortable-header" onclick={() => sortBy('date')}>
							{$t.table.date}
							{sortColumn === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="sortable-header" onclick={() => sortBy('centralite')}>
							{$t.table.centrality}
							{sortColumn === 'centralite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="sortable-header" onclick={() => sortBy('polarite')}>
							{$t.table.polarity}
							{sortColumn === 'polarite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="sortable-header" onclick={() => sortBy('subjectivite')}>
							{$t.table.subjectivity}
							{sortColumn === 'subjectivite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedArticles as article (article['o:id'])}
						<tr
							class="article-row"
							title={$t.table.viewDetails}
							onclick={(event) => selectArticle(article, event)}
						>
							<td class="article-title">{article['o:title']}</td>
							<td>{getJournalName(article)}</td>
							<td>{formatDate(article.publication_date)}</td>
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

	<!-- Navigation de pagination (en bas) -->
	<div class="pagination-bottom mt-4">
		<PaginationControls {pagination} showPageNumbers={false}>
			{#snippet status()}
				Page {pagination.currentPage} sur {pagination.totalPages}
			{/snippet}
		</PaginationControls>
	</div>
{:else}
	<p class="empty-note text-center py-8">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	/* ==============================================
     Table Container - Glass morphism wrapper
     ============================================== */
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

	th,
	td {
		padding: var(--space-2);
		text-align: left;
		border-bottom: 1px solid var(--border-subtle);
	}

	@media (min-width: 640px) {
		th,
		td {
			padding: var(--space-3) var(--space-4);
		}
	}

	/* ==============================================
     Table Row Styles
     ============================================== */
	.article-row {
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.article-row:hover {
		cursor: pointer;
		background-color: color-mix(in oklab, var(--color-primary-500) 10%, transparent);
	}

	.article-title {
		cursor: pointer;
		transition: color var(--timing-fast) var(--easing-default);
	}

	.article-title:hover {
		color: var(--color-primary-400);
		text-decoration: underline;
		font-weight: var(--font-weight-medium);
	}

	/* ==============================================
     Sticky Table Headers
     ============================================== */
	th {
		position: sticky;
		top: 0;
		z-index: 1;
		box-shadow: 0 1px 0 var(--border-default);
		/* Header typography AND the opaque background are owned by the global
		   `.table th` rule — that shorthand ties on specificity with this scoped
		   rule and wins on source order, so setting a background here silently
		   does nothing. */
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
			var(--color-primary-500) 15%,
			var(--surface-card-elevated)
		);
	}

	/* ==============================================
     Pagination Controls Section
     ============================================== */
	.pagination-info {
		background: var(--surface-nested);
		padding: var(--space-3);
		border-radius: var(--radius-panel);
		border: 1px solid var(--border-subtle);
	}

	.pagination-bottom {
		background: color-mix(in oklab, var(--color-primary-500) 3%, transparent);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-panel);
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 10%, transparent);
	}

	.select-sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-base);
		border-radius: var(--radius-panel);
	}

	/* Select elements */
	select {
		cursor: pointer;
	}

	/* Labels for form elements */
	label {
		cursor: pointer;
	}

	/* ==============================================
     Mobile Sort Controls
     ============================================== */
	.mobile-sort-controls {
		background: var(--surface-nested) !important;
		border: 1px solid var(--border-subtle) !important;
	}

	/* ==============================================
     Mobile Card Styles
     ============================================== */
	.mobile-cards {
		max-height: var(--height-chart-lg);
		overflow-y: auto;
	}

	.mobile-card {
		cursor: pointer;
		background: var(--surface-card) !important;
		border: 1px solid var(--border-subtle) !important;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.mobile-card:hover {
		background: var(--surface-card-hover) !important;
		border-color: var(--border-hover) !important;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* ==============================================
     Responsive Design
     ============================================== */
	@media (min-width: 640px) {
		.pagination-info {
			padding: var(--space-4);
		}

		.table-container {
			max-height: var(--height-chart-lg);
		}
	}

	/* ==============================================
     Reduced Motion
     ============================================== */
	@media (prefers-reduced-motion: reduce) {
		.article-row,
		.article-title,
		.sortable-header,
		.mobile-card {
			transition: none;
		}

		.mobile-card:hover {
			transform: none;
		}
	}

	/* ---- Text roles, replacing Tailwind colour utilities. ---- */
	.results-info {
		font-size: var(--font-size-xs);
		color: var(--text-primary);
	}

	@media (min-width: 640px) {
		.results-info {
			font-size: var(--font-size-sm);
		}
	}

	.sort-label {
		font-size: var(--font-size-xs);
		color: var(--text-primary);
	}

	.card-title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.card-meta {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.empty-note {
		color: var(--text-primary);
	}

	/* Was a Skeleton v2 variant class no stylesheet here defines any more, so
	   the sort-direction button rendered with no surface at all. */
	.sort-direction-btn {
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.sort-direction-btn:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.mobile-card {
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.mobile-card:hover {
		background: var(--surface-card-hover);
	}
</style>
