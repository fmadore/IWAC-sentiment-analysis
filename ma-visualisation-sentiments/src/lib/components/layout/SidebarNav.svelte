<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';
	import { uiState } from '$lib/stores';
	import ChartIcon from '@lucide/svelte/icons/bar-chart-2';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import AreaChartIcon from '@lucide/svelte/icons/area-chart';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import TableIcon from '@lucide/svelte/icons/table';
	import GitCompareIcon from '@lucide/svelte/icons/git-compare';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// Default expanded on wider desktops where the labels fit and where the
	// flame/gavel/git-compare icons aren't self-explanatory to a researcher.
	// Below 1280 we keep collapsed to preserve chart real estate.
	onMount(() => {
		if (browser && window.innerWidth >= 1280) {
			uiState.sidebarExpanded = true;
		}
	});

	function change(view: string) {
		if (view !== uiState.activeView) uiState.activeView = view;
		// Close mobile menu after selection
		if (uiState.mobileMenuOpen) uiState.mobileMenuOpen = false;
	}

	function toggleSidebar() {
		uiState.sidebarExpanded = !uiState.sidebarExpanded;
	}

	const navItems = [
		{ id: 'charts', icon: ChartIcon, labelKey: 'charts' as const },
		{ id: 'trends', icon: TrendingUpIcon, labelKey: 'trends' as const },
		{ id: 'correlation', icon: BarChart3Icon, labelKey: 'distribution' as const },
		{ id: 'volume', icon: AreaChartIcon, labelKey: 'volume' as const },
		{ id: 'heatmap', icon: ActivityIcon, labelKey: 'heatmap' as const },
		{ id: 'table', icon: TableIcon, labelKey: 'table' as const },
		{ id: 'comparison', icon: GitCompareIcon, labelKey: 'comparison' as const },
		{ id: 'extremes', icon: FlameIcon, labelKey: 'extremes' as const },
		{ id: 'arbiter', icon: GavelIcon, labelKey: 'arbiter' as const }
	];
</script>

<!-- Mobile Overlay -->
{#if uiState.mobileMenuOpen}
	<button
		class="mobile-overlay"
		onclick={() => (uiState.mobileMenuOpen = false)}
		aria-label="Close navigation"
	></button>
{/if}

<!-- Sidebar Navigation -->
<nav
	class="sidebar"
	class:expanded={uiState.sidebarExpanded}
	class:mobile-open={uiState.mobileMenuOpen}
	aria-label="Main navigation"
>
	<!-- Desktop Toggle Button -->
	<button
		class="toggle-btn desktop-only"
		onclick={toggleSidebar}
		aria-label={uiState.sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
		aria-expanded={uiState.sidebarExpanded}
	>
		{#if uiState.sidebarExpanded}
			<ChevronLeftIcon size={18} />
		{:else}
			<ChevronRightIcon size={18} />
		{/if}
	</button>

	<!-- Navigation Items -->
	<div class="nav-items" role="navigation">
		{#each navItems as item (item.id)}
			<button
				class="nav-item"
				data-state={uiState.activeView === item.id ? 'active' : 'inactive'}
				onclick={() => change(item.id)}
				role="menuitem"
				aria-current={uiState.activeView === item.id ? 'page' : undefined}
				title={!uiState.sidebarExpanded ? $t.nav[item.labelKey] || item.id : undefined}
			>
				<span class="nav-icon">
					<item.icon size={20} />
				</span>
				<span class="nav-label">
					{$t.nav[item.labelKey] || item.id}
				</span>
			</button>
		{/each}
	</div>
</nav>

<style>
	/* ===== Mobile Overlay ===== */
	.mobile-overlay {
		display: block;
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: color-mix(in oklab, black 65%, transparent);
		border: none;
		cursor: pointer;
	}

	@media (min-width: 1024px) {
		.mobile-overlay {
			display: none;
		}
	}

	/* ===== Sidebar Container ===== */
	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		z-index: var(--z-sidebar);
		height: 100dvh;
		padding-top: var(--space-4);

		/* Collapsed width */
		width: 4.5rem;

		background: var(--app-bg-elevated);
		border-right: 1px solid var(--border-subtle);
		box-shadow: 1px 0 0 color-mix(in oklab, black 30%, transparent);

		transition:
			width var(--timing-normal) var(--easing-default),
			transform var(--timing-normal) var(--easing-default);

		transform: translateX(-100%);
	}

	/* Expanded state */
	.sidebar.expanded {
		width: 14rem;
	}

	/* Mobile open state */
	.sidebar.mobile-open {
		transform: translateX(0);
		width: 16rem;
	}

	/* Desktop: always visible */
	@media (min-width: 1024px) {
		.sidebar {
			transform: translateX(0);
		}
	}

	/* ===== Toggle Button (Desktop) ===== */
	.toggle-btn {
		position: absolute;
		top: var(--space-6);
		right: -0.75rem;
		z-index: 10;

		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-icon-lg);
		height: var(--size-icon-lg);

		border-radius: var(--radius-sm);
		background: var(--color-surface-800);
		border: 1px solid var(--border-default);
		color: var(--text-muted);
		cursor: pointer;

		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.toggle-btn:hover {
		background: var(--color-surface-700);
		color: var(--text-primary);
		border-color: var(--border-hover);
	}

	.desktop-only {
		display: none;
	}

	@media (min-width: 1024px) {
		.desktop-only {
			display: flex;
		}
	}

	/* ===== Navigation Items Container ===== */
	.nav-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		overflow-y: auto;
		max-height: calc(100dvh - 2rem);
	}

	/* ===== Navigation Item ===== */
	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2-5) var(--space-3);
		border-radius: var(--radius-lg);

		background: transparent;
		border: 1px solid transparent;
		color: var(--text-muted);

		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-base);
		text-align: left;
		white-space: nowrap;
		cursor: pointer;

		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.nav-item:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	/* Active state: tonal fill with a precise accent rail on the left */
	.nav-item[data-state='active'] {
		background: color-mix(in oklab, var(--color-primary-500) 14%, transparent);
		color: var(--text-primary);
	}

	.nav-item[data-state='active']::before {
		content: '';
		position: absolute;
		left: 0;
		top: 20%;
		bottom: 20%;
		width: 3px;
		border-radius: var(--radius-full);
		background: var(--color-primary-400);
	}

	.nav-item[data-state='active'] .nav-icon {
		color: var(--color-primary-300);
	}

	/* ===== Icon ===== */
	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		transition: color var(--timing-fast) var(--easing-default);
	}

	/* ===== Label ===== */
	.nav-label {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition:
			opacity var(--timing-normal) var(--easing-default),
			width var(--timing-normal) var(--easing-default);
	}

	.sidebar.expanded .nav-label,
	.sidebar.mobile-open .nav-label {
		opacity: 1;
		width: auto;
	}

	/* ===== Reduced Motion ===== */
	@media (prefers-reduced-motion: reduce) {
		.sidebar,
		.nav-item,
		.toggle-btn,
		.nav-label {
			transition: none;
		}
	}
</style>
