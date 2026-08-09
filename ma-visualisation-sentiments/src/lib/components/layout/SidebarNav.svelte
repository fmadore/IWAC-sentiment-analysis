<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { t } from '$lib/i18n';
	import { uiState } from '$lib/stores';
	import { LanguageSwitcher, DatasetPicker } from '$lib/components/ui';
	import Drawer from '$lib/components/common/Drawer.svelte';
	import { NAV_ITEMS } from './navItems';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { ViewId } from '$lib/types/data';

	// Default expanded on wider desktops where the labels fit and where the
	// flame/gavel/git-compare icons aren't self-explanatory to a researcher.
	// Below 1280 we default to collapsed to preserve chart real estate.
	//
	// This tracks, rather than being read once at mount: the previous
	// `onMount(() => window.innerWidth >= 1280)` meant opening the app wide and
	// dragging the window narrow left a 14rem rail eating a fifth of the
	// viewport, and going the other way never expanded. The fallback is `false`
	// so the prerendered markup is the collapsed rail.
	const wideDesktop = new MediaQuery('min-width: 1280px', false);

	// Once the user has an opinion, the viewport stops having one.
	let userSetSidebar = $state(false);

	$effect(() => {
		if (userSetSidebar) return;
		uiState.sidebarExpanded = wideDesktop.current;
	});

	function change(view: ViewId) {
		if (view !== uiState.activeView) uiState.activeView = view;
		// Close mobile menu after selection
		if (uiState.mobileMenuOpen) uiState.mobileMenuOpen = false;
	}

	function toggleSidebar() {
		userSetSidebar = true;
		uiState.sidebarExpanded = !uiState.sidebarExpanded;
	}

	const navItems = NAV_ITEMS;

	/**
	 * Below 1024px this rail is the mobile drawer, and it absorbs the controls
	 * the header used to carry: the model picker and the language switcher.
	 * They belong here — the dataset is a mode switch over the very views listed
	 * below it, and the drawer has room that a 375px bar does not.
	 */
	const desktop = new MediaQuery('min-width: 1024px', false);
</script>

<Drawer
	open={uiState.mobileMenuOpen}
	onClose={() => (uiState.mobileMenuOpen = false)}
	enabled={!desktop.current}
	label="Main navigation"
	element="nav"
	width="var(--sidebar-width-mobile-drawer)"
	class="sidebar"
	data-expanded={uiState.sidebarExpanded}
>
	<!-- Desktop Toggle Button -->
	<button
		class="toggle-btn"
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

	<!-- Mobile only: the model picker, above the views it modifies. -->
	{#if !desktop.current}
		<div class="drawer-section">
			<span class="drawer-label">{$t.datasets.availableModels ?? 'Model'}</span>
			<DatasetPicker />
		</div>
		<span class="drawer-label drawer-label-standalone">{$t.nav.views ?? 'Views'}</span>
	{/if}

	<!-- No role="navigation" on this container: the panel Drawer renders is
	     already a <nav> landmark and a second one is a duplicate. No
	     role="menuitem" on the buttons either — it is invalid without a
	     role="menu" parent and it promises arrow-key navigation this component
	     does not implement. aria-current does the real work. -->
	<div class="nav-items">
		{#each navItems as item (item.id)}
			<button
				class="nav-item"
				data-state={uiState.activeView === item.id ? 'active' : 'inactive'}
				onclick={() => change(item.id)}
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

	<!-- Mobile only: language, pinned to the foot of the drawer. -->
	{#if !desktop.current}
		<div class="drawer-footer">
			<span class="drawer-label">{$t.language ?? 'Language'}</span>
			<LanguageSwitcher />
		</div>
	{/if}
</Drawer>

<style>
	/* ===== Sidebar =====
	   Two presentations from one component:
	   • < 1024px — the mobile drawer. All of that chrome (fixed panel, scrim,
	     z-index above the scrim, slide transform, focus trap, Escape, scroll
	     lock) belongs to common/Drawer.svelte, shared with the filter rail.
	     This file no longer owns any of it, and the two can no longer disagree
	     about width, shadow or keyboard behaviour the way they used to.
	   • >= 1024px — a permanent fixed rail that the page content margins around
	     (see +layout.svelte). That is what the :global rules below describe;
	     they target the element Drawer renders, which is why they are global. */
	@media (min-width: 1024px) {
		:global(.sidebar) {
			display: flex;
			flex-direction: column;
			position: fixed;
			top: 0;
			left: 0;
			z-index: var(--z-sidebar);
			height: 100dvh;
			padding-top: var(--space-4);
			width: var(--sidebar-width-collapsed);
			background: var(--app-bg-elevated);
			border-right: 1px solid var(--border-subtle);
			transform: translateX(0);
			transition: width var(--timing-normal) var(--easing-default);
		}

		:global(.sidebar[data-expanded='true']) {
			width: var(--sidebar-width-expanded);
		}
	}

	/* ===== Drawer sections (mobile only) =====
	   The controls the header handed over. The drawer is a column: model at the
	   top, the views it modifies below it, language pinned at the foot. */
	.drawer-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: 0 var(--space-3) var(--space-4);
	}

	.drawer-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
	}

	.drawer-label-standalone {
		padding: 0 var(--space-3);
	}

	.drawer-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-top: auto;
		padding: var(--space-3);
		border-top: 1px solid var(--border-subtle);
	}

	/* ===== Toggle Button (desktop only) ===== */
	.toggle-btn {
		position: absolute;
		top: var(--space-6);
		right: -0.75rem;
		z-index: 10;
		display: none;
		align-items: center;
		justify-content: center;
		width: var(--size-icon-lg);
		height: var(--size-icon-lg);
		border-radius: var(--radius-hairline);
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

	@media (min-width: 1024px) {
		.toggle-btn {
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
		flex: 1;
		min-height: 0;
	}

	/* ===== Navigation Item ===== */
	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2-5) var(--space-3);
		border-radius: var(--radius-panel);
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
		border-radius: var(--radius-circle);
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

	/* ===== Label =====
	   Always visible in the mobile drawer, which is wide enough for it; on the
	   desktop rail it collapses with the rail. */
	.nav-label {
		opacity: 1;
		width: auto;
		overflow: hidden;
		transition:
			opacity var(--timing-normal) var(--easing-default),
			width var(--timing-normal) var(--easing-default);
	}

	@media (min-width: 1024px) {
		.nav-label {
			opacity: 0;
			width: 0;
		}

		:global(.sidebar[data-expanded='true']) .nav-label {
			opacity: 1;
			width: auto;
		}
	}

	/* ===== Reduced Motion ===== */
	@media (prefers-reduced-motion: reduce) {
		.nav-item,
		.toggle-btn,
		.nav-label {
			transition: none;
		}
	}
</style>
