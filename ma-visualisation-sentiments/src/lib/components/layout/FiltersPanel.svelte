<script lang="ts">
	import {
		CountryFilter,
		JournalFilter,
		PolarityFilter,
		SubjectivityFilter,
		CentralityFilter,
		ExtremeAnalysisControls,
		ClearFiltersButton
	} from '$lib/components/filters';
	import { DatasetBadge } from '$lib/components/ui';
	import { t } from '$lib/i18n';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';

	let {
		activeView,
		selectedCategory,
		selectedKeywordType,
		showTopN,
		onCategoryChange,
		onKeywordTypeChange,
		onTopNChange
	} = $props<{
		activeView: string;
		selectedCategory: ExtremeCategory;
		selectedKeywordType: KeywordType;
		showTopN: number;
		onCategoryChange: (c: ExtremeCategory) => void;
		onKeywordTypeChange: (k: KeywordType) => void;
		onTopNChange: (n: number) => void;
	}>();

	// State for collapsible filters panel
	let isFiltersOpen = $state(true);
</script>

<div class="filters-panel">
	<!-- Collapsible Header -->
	<button
		class="filters-header-btn"
		onclick={() => (isFiltersOpen = !isFiltersOpen)}
		aria-expanded={isFiltersOpen}
	>
		<h2 class="filters-title">{$t.filters.title}</h2>
		<span class="header-icon" data-state={isFiltersOpen ? 'open' : 'closed'}>
			<ChevronDownIcon size={20} />
		</span>
	</button>

	{#if isFiltersOpen}
		<div class="filters-content" data-state="open">
			{#if activeView === 'extremes'}
				<div class="mb-4"><DatasetBadge size="sm" /></div>
				<div class="extreme-filters-layout mb-4 sm:mb-6">
					<div class="filter-shell country"><CountryFilter /></div>
					<div class="filter-shell extreme-controls">
						<ExtremeAnalysisControls
							{selectedCategory}
							{selectedKeywordType}
							{showTopN}
							{onCategoryChange}
							{onKeywordTypeChange}
							{onTopNChange}
						/>
					</div>
				</div>
			{:else}
				<div class="filters-grid-responsive masonry mb-4 sm:mb-6">
					<div class="filter-shell country"><CountryFilter /></div>
					<div class="filter-shell journal"><JournalFilter /></div>
					<div class="filter-shell polarity"><PolarityFilter /></div>
					<div class="filter-shell subjectivity"><SubjectivityFilter /></div>
					<div class="filter-shell centrality"><CentralityFilter /></div>
				</div>
			{/if}
			<ClearFiltersButton />
		</div>
	{/if}
</div>

<style>
	/* Auto-fit responsive grid for standard facets */
	.filters-grid-responsive {
		display: grid;
		gap: var(--space-3-5);
		align-items: start;
		grid-auto-flow: row dense;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
	}

	/* Masonry mode with CSS columns */
	.filters-grid-responsive.masonry {
		display: block !important;
	}

	@media (min-width: 1024px) {
		.filters-grid-responsive.masonry {
			column-count: 2;
			column-gap: var(--space-5);
			column-width: 300px;
		}
	}

	@media (min-width: 1280px) {
		.filters-grid-responsive.masonry {
			column-count: 3;
			column-gap: var(--space-5);
			column-width: 320px;
		}
	}

	@media (min-width: 1600px) {
		.filters-grid-responsive.masonry {
			column-count: 4;
			column-gap: var(--space-6);
			column-width: 340px;
		}
	}

	.filters-grid-responsive.masonry .filter-shell {
		break-inside: avoid;
		-webkit-column-break-inside: avoid;
		page-break-inside: avoid;
		margin: 0 0 var(--space-5);
		width: 100%;
	}

	.filters-grid-responsive.masonry .filter-shell :global(.filter-card) {
		height: auto !important;
		display: block;
		width: 100%;
		transition:
			border-color var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-normal) var(--easing-default);
	}

	/* Journal width hint for non-masonry grid */
	@media (min-width: 1200px) {
		.filters-grid-responsive:not(.masonry) .journal {
			grid-column: span 2;
		}
	}

	@media (min-width: 1600px) {
		.filters-grid-responsive:not(.masonry) {
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		}
		.filters-grid-responsive:not(.masonry) .journal {
			grid-column: span 2;
		}
	}

	/* Extreme layout with fluid columns */
	.extreme-filters-layout {
		display: grid;
		gap: var(--space-6);
		grid-template-columns: clamp(230px, 26%, 320px) 1fr;
		align-items: start;
	}

	@media (max-width: 1100px) {
		.extreme-filters-layout {
			grid-template-columns: clamp(220px, 32%, 300px) 1fr;
			gap: var(--space-5);
		}
	}

	@media (max-width: 900px) {
		.extreme-filters-layout {
			grid-template-columns: 1fr;
			gap: var(--space-4);
		}
	}

	@media (max-width: 600px) {
		.filters-grid-responsive {
			gap: var(--space-2-5);
		}
		.extreme-filters-layout {
			gap: var(--space-3);
		}
	}

	/* =========================================================================
	   COLLAPSIBLE PANEL
	   ========================================================================= */
	.filters-panel {
		background: var(--surface-card);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-2xl);
		padding: var(--space-5);
		margin-bottom: var(--space-6);
		box-shadow: var(--elevation-card);
	}

	.filters-header-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.filters-header-btn:hover .header-icon {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	.filters-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		letter-spacing: var(--tracking-snug);
		line-height: var(--line-height-tight);
		margin: 0;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-sm);
		height: var(--size-control-sm);
		border-radius: var(--radius-md);
		background: var(--surface-subtle);
		color: var(--text-muted);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default),
			transform var(--timing-normal) var(--easing-default);
		flex-shrink: 0;
	}

	.header-icon[data-state='open'] {
		transform: rotate(180deg);
		color: var(--color-primary-300);
	}

	.filters-content {
		margin-top: var(--space-4);
		animation: slideDown var(--timing-normal) var(--easing-default);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.filters-panel {
			padding: var(--space-4);
			border-radius: var(--radius-xl);
		}

		.filters-title {
			font-size: var(--font-size-lg);
		}

		.header-icon {
			width: 1.75rem;
			height: 1.75rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.filters-grid-responsive.masonry .filter-shell :global(.filter-card),
		.filters-content,
		.header-icon,
		.filters-header-btn {
			transition: none;
			animation: none;
		}
	}
</style>
