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
	import { MediaQuery } from 'svelte/reactivity';
	import Drawer from '$lib/components/common/Drawer.svelte';
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

	/**
	 * Below this the rail is an off-canvas drawer; at or above it, a static
	 * sticky column in the page grid. Drawer chrome — scrim, focus trap, Escape,
	 * body-scroll lock — is only enabled in the first case.
	 */
	const desktop = new MediaQuery('min-width: 1024px', false);
</script>

<Drawer
	open={uiState.filtersDrawerOpen}
	onClose={closeDrawer}
	enabled={!desktop.current}
	label={$t.filters.title}
	side="right"
	class="filters-rail"
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
</Drawer>

<style>
	/* =========================================================================
	   FILTER RAIL

	   Two presentations from one component:
	   • < 1024px — an off-canvas drawer, entering from the RIGHT. Its trigger is
	     the Filters button at the right end of the header, and a panel that
	     arrives from the opposite edge to the control that summoned it reads as
	     a different, unrelated surface. The nav drawer keeps the left, where its
	     own trigger and the desktop rail both live. All of that chrome (fixed
	     panel, scrim, z-index above the scrim, slide transform, focus trap,
	     Escape, scroll lock) belongs to common/Drawer.svelte, which SidebarNav
	     uses too. This file no longer owns any of it.
	   • >= 1024px — a static, sticky column in the page grid's first track. That
	     is what the rules below describe, via :global because the element they
	     target is rendered by Drawer rather than by this template.
	   ========================================================================= */

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
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-panel);
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
		/* THE containment context for everything in the rail.
		   Rail children must never branch on viewport width: they see the
		   viewport, not the 320px column they actually live in. That mistake
		   shipped twice, and its visible symptom was that the same filter card
		   got two different designs at the same physical width — the 320px
		   sticky rail on desktop rendered full-size, while the ~330px drawer on
		   a phone got the "480px" compact treatment with 13px titles.
		   Measuring this element's content box makes the rule structural
		   instead of remembered: a component that asks `@container filter-rail`
		   is asking about the space it is actually in. Outside the rail the
		   query simply never matches and the base styles stand. */
		container: filter-rail / inline-size;

		display: flex;
		flex-direction: column;
		gap: var(--gap-stack);
		padding: 0 var(--space-4) var(--space-5);
	}

	.rail-dataset {
		margin-bottom: var(--space-1);
	}

	.rail-stack {
		display: flex;
		flex-direction: column;
		gap: var(--gap-stack);
	}

	.filter-shell :global(.filter-card) {
		width: 100%;
	}

	.rail-clear {
		margin-top: var(--space-1);
	}

	/* ---- Desktop: static sticky rail inside the page grid ------------------ */
	@media (min-width: 1024px) {
		:global(.filters-rail) {
			/* Clears the sticky AppHeader by reading the same --header-height it
			   sets on itself. */
			position: sticky;
			top: var(--rail-top);
			left: auto;
			right: auto;
			z-index: auto;
			width: 100%;
			height: auto;
			max-height: calc(100dvh - var(--rail-top) - var(--space-4));
			background: transparent;
			border-right: none;
			border-left: none;
			box-shadow: none;
			transform: none;
			align-self: start;
			overflow-y: auto;
		}

		.rail-header {
			padding: 0 0 var(--space-3);
			border-bottom: 1px solid var(--border-subtle);
			background: var(--app-bg);
		}

		.rail-close {
			display: none;
		}

		.rail-body {
			padding: var(--space-4) 0 0;
		}
	}
</style>
