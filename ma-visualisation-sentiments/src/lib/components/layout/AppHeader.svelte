<!--
  AppHeader

  Two presentations from one component.

  >= 1024px — the full editorial masthead: brand, centred DatasetPicker,
  LanguageSwitcher and (where the browser supports it) a fullscreen toggle.
  Unchanged by the mobile rework.

  < 1024px — "slim header, loaded drawer". The bar carries identity plus one
  action and nothing else. It used to carry six controls at three different
  heights, roughly 192px of fixed chrome before the brand got any space, which
  squeezed the title down to 13px — smaller than body text, on the one element
  that says what this thing is. The dataset picker and language switcher move
  into the nav drawer (SidebarNav), which is mostly empty below thirteen nav
  items; the brand recovers to its full size and gains a mono context line
  naming the model and the current view, which the old header never showed.

  Three rules hold across both:
    • One control height. Everything in the bar is --size-control-lg (40px).
      The previous design shrank targets to 32px on the smallest screens, which
      is backwards.
    • One DatasetPicker instance. Two used to be mounted at once (one hidden
      below 768px, one above), so the component's dropdown state, click-outside
      listeners and touch handlers all existed twice and the control visually
      teleported across the bar at the breakpoint.
    • Fullscreen is gated on capability, not on `browser`. Safari on iOS does
      not implement the Fullscreen API on phones, so the button did nothing at
      all there.
-->
<script lang="ts">
	import FullscreenIcon from '@lucide/svelte/icons/maximize';
	import MinimizeIcon from '@lucide/svelte/icons/minimize';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { t } from '$lib/i18n';
	import { LanguageSwitcher, DatasetPicker } from '$lib/components/ui';
	import { uiState, datasetState, filterState } from '$lib/stores';
	import { hasFilterRail } from '$lib/types/data';
	import { NAV_ITEMS } from './navItems';

	let isFullscreen = $state(false);

	/**
	 * Whether the Fullscreen API is actually available, as opposed to whether we
	 * are in a browser at all. `document.fullscreenEnabled` is false on iOS
	 * Safari for phones, which is exactly the case the old `{#if browser}` gate
	 * missed — a permanently dead button in the most cramped bar in the app.
	 */
	let canFullscreen = $state(false);

	/**
	 * The desktop layout threshold, shared with the sidebar and the filter rail.
	 * Used here to decide *which controls exist*, not merely how they look, so
	 * it has to be readable from script rather than CSS. The `false` fallback
	 * means the prerendered markup is the mobile bar.
	 */
	const desktop = new MediaQuery('min-width: 1024px', false);

	// The filters drawer trigger is only meaningful on views that have a filter
	// rail — the self-contained views carry their own internal controls instead.
	// Read from the view registry, never re-enumerated here (see VIEW_META).
	let showFiltersButton = $derived(hasFilterRail(uiState.activeView));

	let activeFilterCount = $derived(filterState.activeCount);

	let currentModelName = $derived(
		datasetState.available.find((d) => d.id === datasetState.selected)?.name ?? ''
	);

	let currentViewName = $derived.by(() => {
		const item = NAV_ITEMS.find((nav) => nav.id === uiState.activeView);
		return item ? ($t.nav[item.labelKey] ?? item.id) : uiState.activeView;
	});

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.error(`Error attempting to enable fullscreen: ${err.message}`);
			});
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}

	onMount(() => {
		canFullscreen = document.fullscreenEnabled;
		isFullscreen = !!document.fullscreenElement;

		const handleFullscreenChange = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	});
</script>

<header class="app-header sticky top-0">
	<div class="header-toolbar">
		<div class="header-lead">
			<button
				class="icon-button"
				onclick={() => (uiState.mobileMenuOpen = !uiState.mobileMenuOpen)}
				aria-label={uiState.mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
				aria-expanded={uiState.mobileMenuOpen}
			>
				{#if uiState.mobileMenuOpen}
					<XIcon size={22} />
				{:else}
					<MenuIcon size={22} />
				{/if}
			</button>

			<div class="brand-text">
				<span class="brand-title">{$t.appTitle}</span>
				<!-- Below 1024px the subtitle gives way to a context line: which
				     model produced the numbers on screen, and which view you are in.
				     Both facts were previously invisible once the drawer was shut. -->
				<span class="brand-subtitle">{$t.appSubtitle}</span>
				<span class="brand-context">{currentModelName} · {currentViewName}</span>
			</div>
		</div>

		{#if desktop.current}
			<div class="header-headline">
				<DatasetPicker />
			</div>
		{/if}

		<div class="header-trail">
			{#if showFiltersButton}
				<button
					class="filters-trigger"
					data-state={activeFilterCount > 0 ? 'active' : 'inactive'}
					onclick={() => uiState.toggleFiltersDrawer()}
					aria-label={$t.filters.title}
					aria-expanded={uiState.filtersDrawerOpen}
				>
					<SlidersHorizontalIcon size={18} />
					<span class="filters-trigger-label">{$t.filters.title}</span>
					{#if activeFilterCount > 0}
						<span class="filters-count">{activeFilterCount}</span>
					{/if}
				</button>
			{/if}

			{#if desktop.current}
				<LanguageSwitcher />
				{#if canFullscreen}
					<button
						class="icon-button"
						onclick={toggleFullscreen}
						title={isFullscreen ? $t.exitFullscreen : $t.enterFullscreen}
						aria-label={isFullscreen ? $t.exitFullscreen : $t.enterFullscreen}
					>
						{#if isFullscreen}
							<MinimizeIcon size={20} />
						{:else}
							<FullscreenIcon size={20} />
						{/if}
					</button>
				{/if}
			{/if}
		</div>
	</div>
</header>

<style>
	/* App Header — opaque editorial bar, no backdrop blur. */
	.app-header {
		z-index: var(--z-header);
		background: var(--app-bg-elevated);
		border-bottom: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-sticky);
		position: sticky;
	}

	.header-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2-5) var(--space-3);
		max-width: 1400px;
		margin: 0 auto;
		position: relative;
	}

	.header-lead {
		display: flex;
		align-items: center;
		gap: var(--space-2-5);
		min-width: 0;
	}

	.header-headline {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-trail {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		justify-content: flex-end;
		flex-shrink: 0;
	}

	/* ---- Controls -----------------------------------------------------------
	   One height for everything in the bar. --size-control-lg is 40px, which is
	   also the smallest comfortable touch target; the old design shrank these to
	   32px exactly where fingers are least precise. */
	.icon-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		flex-shrink: 0;
		border-radius: var(--radius-panel);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-primary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.icon-button:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}

	.filters-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		height: var(--size-control-lg);
		padding: 0 var(--space-3);
		flex-shrink: 0;
		border-radius: var(--radius-panel);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-primary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.filters-trigger:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}

	/* With filters applied the trigger carries the accent, so the drawer's state
	   is legible without opening it. */
	.filters-trigger[data-state='active'] {
		background: var(--accent-soft);
		border-color: var(--accent-border);
		color: var(--accent);
	}

	.filters-trigger-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		white-space: nowrap;
		/* The label is the first thing to go when space is tight; the count and
		   the icon still say everything the control needs to. */
		display: none;
	}

	.filters-count {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	/* ---- Brand --------------------------------------------------------------
	   Source Serif 4 for the project name (reads as "research artefact" rather
	   than "product name"); JetBrains Mono for the wire-service caption below. */
	.brand-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-0-5);
		min-width: 0;
	}

	.brand-title {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		color: var(--text-primary);
		line-height: var(--line-height-tight);
		letter-spacing: var(--tracking-tight);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.brand-subtitle {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-regular);
		color: var(--text-muted);
		line-height: var(--line-height-snug);
		letter-spacing: var(--tracking-normal);
		max-width: 320px;
		/* The long-form subtitle is a desktop affordance; below 1024px the
		   context line replaces it. */
		display: none;
	}

	.brand-context {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-medium);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
		line-height: var(--line-height-snug);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ---- 640px: room for the Filters label ---------------------------------- */
	@media (min-width: 640px) {
		.header-toolbar {
			padding: var(--space-3) var(--space-4);
			gap: var(--space-4);
		}

		.filters-trigger-label {
			display: inline;
		}
	}

	/* ---- 1024px: the full desktop masthead ---------------------------------- */
	@media (min-width: 1024px) {
		.header-toolbar {
			/* The sticky filter rail clears the header by reading this same token
			   (--rail-top). Declaring it here rather than measuring it is what
			   keeps the two in step when the brand size or padding changes. */
			min-height: var(--header-height);
			display: grid;
			grid-template-columns: 1fr auto 1fr;
			padding: var(--space-3-5) var(--space-8);
			gap: var(--space-6);
		}

		.brand-title {
			font-size: var(--font-size-2xl);
		}

		.brand-subtitle {
			display: block;
			font-size: var(--font-size-sm);
		}

		/* Identity is permanent chrome on desktop; the context line is redundant
		   with the sidebar's own active-item marker and the dataset picker. */
		.brand-context {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.icon-button,
		.filters-trigger {
			transition: none;
		}
	}

	@media (prefers-contrast: high) {
		.icon-button {
			border-width: 2px;
		}
	}
</style>
