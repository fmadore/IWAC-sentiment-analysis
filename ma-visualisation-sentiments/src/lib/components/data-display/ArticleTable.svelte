<script lang="ts">
	import { filteredArticles, selectedArticle } from '$lib/stores';
	import type { Article } from '$lib/types/data';
	import { getJournalName } from '$lib/utils';
	import { formatDate } from '$lib/utils/format';
	import { t } from '$lib/i18n';
	import { DatasetBadge } from '$lib/components/ui';
	import { SentimentBadge } from '$lib/components/common';
	import { updateURL } from '$lib/urlState';
	import { innerWidth } from 'svelte/reactivity/window';
	import { createPagination } from '$lib/utils/pagination.svelte';

	// Props - for event dispatching
	let {
		onShowDetails
	}: {
		onShowDetails: (details: { article: Article; position: { x: number; y: number } }) => void;
	} = $props();

	// Reactive articles from store
	let articles = $derived($filteredArticles);

	// Reactive mobile detection using svelte/reactivity/window
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Variables pour le tri
	let sortColumn = $state<string>('titre');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Référence pour le conteneur du tableau
	let tableContainerRef = $state<HTMLElement | undefined>();

	// Dispatcher is removed

	function selectArticle(article: Article, event: MouseEvent) {
		selectedArticle.set(article);

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

	// Ordre de tri pour les valeurs de polarité
	const polarityOrder = {
		'Très positif': 5,
		Positif: 4,
		Neutre: 3,
		Négatif: 2,
		'Très négatif': 1,
		'Non applicable': 0
	};

	// Ordre de tri pour les valeurs de centralité
	const centralityOrder = {
		'Très central': 5,
		Central: 4,
		Secondaire: 3,
		Marginal: 2,
		'Non abordé': 1
	};

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
					valA = centralityOrder[centralA as keyof typeof centralityOrder] || 0;
					valB = centralityOrder[centralB as keyof typeof centralityOrder] || 0;
					break;
				}
				case 'polarite': {
					const polA = a.sentiment_analysis?.polarite || 'Non applicable';
					const polB = b.sentiment_analysis?.polarite || 'Non applicable';
					valA = polarityOrder[polA as keyof typeof polarityOrder] || 0;
					valB = polarityOrder[polB as keyof typeof polarityOrder] || 0;
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
		<!-- Première ligne : Informations et sélecteur -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3">
			<span class="text-xs sm:text-sm text-white">
				{$t.table.showingItems}
				{pagination.startIndex + 1} à {pagination.endIndex} sur {articles.length}
				{$t.common.articles}
			</span>
			<div class="flex items-center gap-2">
				<label for="items-per-page" class="text-xs sm:text-sm text-white whitespace-nowrap"
					>{$t.table.itemsPerPage}:</label
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

		<!-- Deuxième ligne : Navigation de pagination centrée -->
		<div class="flex justify-center">
			<div class="pagination-controls flex items-center gap-1 sm:gap-2">
				<button
					class="btn btn-sm variant-soft-surface"
					onclick={pagination.previousPage}
					disabled={pagination.currentPage === 1}
					title={$t.common.previous || 'Previous page'}
				>
					{isMobile ? '←' : '←'}
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
					title={$t.common.next || 'Next page'}
				>
					{isMobile ? '→' : '→'}
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile Card View -->
	{#if isMobile}
		<!-- Mobile Sort Controls -->
		<div class="mobile-sort-controls mb-4 p-3 card variant-glass">
			<div class="flex items-center gap-2">
				<label for="mobile-sort-select" class="text-xs text-white whitespace-nowrap"
					>{$t.common.sortBy}:</label
				>
				<select
					id="mobile-sort-select"
					bind:value={sortColumn}
					onchange={() => (pagination.currentPage = 1)}
					class="select select-sm bg-surface-700 text-white border-surface-500 flex-1"
				>
					<option value="titre">{$t.table.articleTitle}</option>
					<option value="journal">{$t.filters.journal}</option>
					<option value="date">{$t.table.date}</option>
					<option value="centralite">{$t.table.centrality}</option>
					<option value="polarite">{$t.table.polarity}</option>
					<option value="subjectivite">{$t.table.subjectivity}</option>
				</select>
				<button
					class="btn btn-sm variant-soft-surface"
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
					class="mobile-card card variant-glass p-4 cursor-pointer hover:bg-surface-800/50 transition-colors w-full text-left border-0"
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
						<h3 class="text-sm font-semibold text-white line-clamp-2 mb-1">
							{article['o:title']}
						</h3>
						<div class="flex items-center gap-2 text-xs text-white/70">
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
		<div class="table-container card variant-glass overflow-hidden">
			<table class="table">
				<thead>
					<tr class="bg-surface-800">
						<th class="text-white sortable-header" onclick={() => sortBy('titre')}>
							{$t.table.articleTitle}
							{sortColumn === 'titre' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="text-white sortable-header" onclick={() => sortBy('journal')}>
							{$t.filters.journal}
							{sortColumn === 'journal' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="text-white sortable-header" onclick={() => sortBy('date')}>
							{$t.table.date}
							{sortColumn === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="text-white sortable-header" onclick={() => sortBy('centralite')}>
							{$t.table.centrality}
							{sortColumn === 'centralite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="text-white sortable-header" onclick={() => sortBy('polarite')}>
							{$t.table.polarity}
							{sortColumn === 'polarite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
						</th>
						<th class="text-white sortable-header" onclick={() => sortBy('subjectivite')}>
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
	<div class="pagination-bottom mt-4 flex items-center justify-center">
		<div class="pagination-controls flex items-center gap-2">
			<button
				class="btn btn-sm variant-soft-surface"
				onclick={pagination.previousPage}
				disabled={pagination.currentPage === 1}
				title={$t.common.previous}
			>
				← {$t.common.previous}
			</button>

			<span class="text-sm text-white px-4">
				Page {pagination.currentPage} sur {pagination.totalPages}
			</span>

			<button
				class="btn btn-sm variant-soft-surface"
				onclick={pagination.nextPage}
				disabled={pagination.currentPage === pagination.totalPages}
				title={$t.common.next}
			>
				{$t.common.next} →
			</button>
		</div>
	</div>
{:else}
	<p class="text-center py-8 text-white">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	/* ==============================================
     Table Container - Glass morphism wrapper
     ============================================== */
	.table-container {
		max-height: var(--height-chart-lg);
		overflow-y: auto;
		position: relative;
		/* Glass effect with primary gradient hint */
		background: color-mix(in oklab, var(--color-primary-500) 3%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 12%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border-radius: var(--radius-lg);
	}

	/* Gradient accent line at top */
	.table-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--gradient-header);
		z-index: 10;
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: var(--space-3) var(--space-4);
		text-align: left;
		border-bottom: 1px solid var(--border-subtle);
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
		background-color: var(--color-surface-800);
		box-shadow: 0 1px 0 var(--border-default);
	}

	.sortable-header {
		cursor: pointer;
		user-select: none;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.sortable-header:hover {
		background-color: color-mix(in oklab, var(--color-primary-500) 15%, transparent);
	}

	/* ==============================================
     Pagination Controls Section
     ============================================== */
	.pagination-info {
		background: color-mix(in oklab, var(--color-primary-500) 5%, transparent);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 15%, transparent);
		backdrop-filter: blur(var(--glass-blur-sm));
	}

	.pagination-controls {
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-2);
	}

	.pagination-controls button {
		min-width: var(--size-control-lg);
		height: var(--size-control-lg);
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

	.pagination-bottom {
		background: color-mix(in oklab, var(--color-primary-500) 3%, transparent);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-lg);
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 10%, transparent);
	}

	.select-sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-base);
		border-radius: var(--radius-md);
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
		background: color-mix(in oklab, var(--color-primary-500) 5%, transparent) !important;
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 15%, transparent) !important;
		backdrop-filter: blur(var(--glass-blur-sm));
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
		background: color-mix(in oklab, var(--color-primary-500) 5%, transparent) !important;
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 12%, transparent) !important;
		backdrop-filter: blur(var(--glass-blur-sm));
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			transform var(--timing-fast) var(--easing-default);
	}

	.mobile-card:hover {
		cursor: pointer;
		background: color-mix(in oklab, var(--color-primary-500) 10%, transparent) !important;
		border-color: color-mix(in oklab, var(--color-primary-500) 25%, transparent) !important;
		transform: translateY(-2px);
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
	@media (max-width: 768px) {
		.pagination-info {
			padding: var(--space-3);
		}

		.pagination-controls {
			gap: var(--space-1);
		}

		.pagination-controls button {
			min-width: var(--size-control-sm);
			height: var(--size-control-sm);
			font-size: var(--font-size-xs);
			padding: var(--space-1);
		}

		.table-container {
			max-height: var(--height-chart-md);
		}

		th,
		td {
			padding: var(--space-2);
			font-size: var(--font-size-base);
		}
	}

	/* Extra small screens */
	@media (max-width: 480px) {
		.pagination-controls button {
			min-width: 1.75rem;
			height: 1.75rem;
			font-size: var(--font-size-2xs);
		}

		.mobile-card {
			padding: var(--space-3) !important;
		}

		.mobile-card h3 {
			font-size: var(--font-size-base);
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
</style>
