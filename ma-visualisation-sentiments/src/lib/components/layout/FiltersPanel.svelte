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
	import { uiState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import XIcon from '@lucide/svelte/icons/x';
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

	function closeDrawer() {
		uiState.filtersDrawerOpen = false;
	}

	// On small screens the rail is an off-canvas drawer; Escape closes it.
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && uiState.filtersDrawerOpen) closeDrawer();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Mobile-only scrim behind the drawer -->
{#if uiState.filtersDrawerOpen}
	<button class="filters-overlay" onclick={closeDrawer} aria-label={$t.common.close}></button>
{/if}

<aside
	class="filters-rail"
	class:drawer-open={uiState.filtersDrawerOpen}
	aria-label={$t.filters.title}
>
	<div class="rail-header">
		<h2 class="rail-title">{$t.filters.title}</h2>
		<button class="rail-close" onclick={closeDrawer} aria-label={$t.common.close}>
			<XIcon size={20} />
		</button>
	</div>

	<div class="rail-body">
		{#if activeView === 'extremes'}
			<div class="rail-dataset"><DatasetBadge size="sm" /></div>
			<div class="rail-stack">
				<div class="filter-shell"><CountryFilter /></div>
				<div class="filter-shell">
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
			<div class="rail-stack">
				<div class="filter-shell"><CountryFilter /></div>
				<div class="filter-shell"><JournalFilter /></div>
				<div class="filter-shell"><PolarityFilter /></div>
				<div class="filter-shell"><SubjectivityFilter /></div>
				<div class="filter-shell"><CentralityFilter /></div>
			</div>
		{/if}
		<div class="rail-clear"><ClearFiltersButton /></div>
	</div>
</aside>

<style>
	/* =========================================================================
	   FILTER RAIL
	   Two presentations from one component:
	   • < 1024px — off-canvas drawer, slid in from the left over a scrim, opened
	     from the AppHeader "Filters" button (uiState.filtersDrawerOpen).
	   • >= 1024px — a static, sticky left rail that lives in the page grid's
	     first column; the close button and scrim are hidden.
	   ========================================================================= */

	.filters-rail {
		display: flex;
		flex-direction: column;

		/* Drawer defaults (mobile). The drawer must sit ABOVE its own scrim, so it
		   goes one step above --z-overlay (the scrim); otherwise the scrim dims it
		   and swallows the clicks. */
		position: fixed;
		top: 0;
		left: 0;
		z-index: calc(var(--z-overlay) + 1);
		width: min(88vw, 22rem);
		height: 100dvh;
		background: var(--app-bg-elevated);
		border-right: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-overlay, 0 0 0 transparent);
		transform: translateX(-100%);
		transition: transform var(--timing-normal) var(--easing-default);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.filters-rail.drawer-open {
		transform: translateX(0);
	}

	.filters-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: color-mix(in oklab, black 65%, transparent);
		border: none;
		cursor: pointer;
	}

	/* Rail header — section label + (mobile) close affordance */
	.rail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-4) var(--space-3);
		position: sticky;
		top: 0;
		background: inherit;
		z-index: 1;
	}

	.rail-title {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
		margin: 0;
	}

	.rail-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-sm);
		height: var(--size-control-sm);
		border-radius: var(--radius-md);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-muted);
		cursor: pointer;
		flex-shrink: 0;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.rail-close:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	.rail-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: 0 var(--space-4) var(--space-5);
	}

	.rail-dataset {
		margin-bottom: var(--space-1);
	}

	.rail-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.filter-shell :global(.filter-card) {
		width: 100%;
	}

	.rail-clear {
		margin-top: var(--space-1);
	}

	/* ---- Desktop: static sticky rail inside the page grid ------------------- */
	@media (min-width: 1024px) {
		.filters-rail {
			/* Clears the sticky AppHeader (~96px tall at >=1024px) plus a small gap. */
			position: sticky;
			top: var(--rail-top);
			left: auto;
			z-index: auto;
			width: 100%;
			height: auto;
			max-height: calc(100dvh - var(--rail-top) - var(--space-4));
			background: transparent;
			border-right: none;
			box-shadow: none;
			transform: none;
			align-self: start;
		}

		.rail-header {
			padding: 0 0 var(--space-3);
			border-bottom: 1px solid var(--border-subtle);
			background: var(--app-bg);
		}

		.rail-close {
			display: none;
		}

		.filters-overlay {
			display: none;
		}

		.rail-body {
			padding: var(--space-4) 0 0;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.filters-rail {
			transition: none;
		}
	}
</style>
