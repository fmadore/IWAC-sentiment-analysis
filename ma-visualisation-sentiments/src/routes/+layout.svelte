<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AppHeader from '#lib/components/layout/AppHeader.svelte';
	import SidebarNav from '#lib/components/layout/SidebarNav.svelte';
	import SiteFooter from '#lib/components/layout/SiteFooter.svelte';
	import { t } from '#lib/i18n/index.js';
	import PWAManager from '#lib/components/PWAManager.svelte';
	import { uiState } from '#lib/stores/index.js';
	import { readStorage, removeStorage } from '#lib/utils/safeStorage.js';

	let { children } = $props();

	let isSidebarExpanded = $derived(uiState.sidebarExpanded);

	// Restore the URL after a GitHub Pages 404 fallback. The 404.html script
	// stashes the original search/hash in sessionStorage and replaces the
	// location with the SPA root; here we route through SvelteKit's own
	// navigation API so its router stays authoritative.
	onMount(() => {
		const raw = readStorage('sessionStorage', 'spa-redirect');
		if (!raw) return;
		removeStorage('sessionStorage', 'spa-redirect');
		try {
			const data = JSON.parse(raw) as { search?: string; hash?: string };
			if (!data.search && !data.hash) return;
			const target = `${resolve('/')}${data.search ?? ''}${data.hash ?? ''}`;
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(target, { replace: true, reset: false });
		} catch (err) {
			console.error('Failed to parse SPA redirect data:', err);
		}
	});
</script>

<!-- The first focusable element on the page: past the sidebar and the header,
     straight to the analysis. The target is focusable so the jump moves focus,
     not only the scroll position. -->
<a class="skip-link" href="#main-content">{$t.skipToContent}</a>

<SidebarNav />

<div class="app-content" data-sidebar={isSidebarExpanded ? 'expanded' : 'collapsed'}>
	<AppHeader />
	<main id="main-content" tabindex="-1">
		{@render children()}
	</main>
	<SiteFooter />
</div>

<PWAManager />

<style>
	/* Main content wrapper — accounts for sidebar on desktop.
	   The margin snaps with the rail rather than animating: toggling the rail is
	   a user-initiated mode switch, and easing a layout property reflowed this
	   whole column — re-measuring every ECharts instance inside it — on every
	   frame. The rail's own toggle carries the state change (SidebarNav). */
	.app-content {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	/* Main grows so the footer sits at the foot of a short page; on a long one
	   it simply follows the content. */
	main {
		flex: 1 0 auto;
	}

	main:focus {
		outline: none;
	}

	.skip-link {
		position: fixed;
		top: var(--space-2);
		left: var(--space-2);
		z-index: calc(var(--z-overlay) + 10);
		padding: var(--space-2) var(--space-4);
		background: var(--surface-card-elevated);
		border: 1px solid var(--accent);
		border-radius: var(--radius-panel);
		color: var(--text-primary);
		font-weight: var(--font-weight-semibold);
		text-decoration: none;
		transform: translateY(calc(-100% - var(--space-4)));
	}

	/* Shown on any focus; the ring is the global :focus-visible outline. */
	.skip-link:focus {
		transform: none;
	}

	@media (min-width: 1024px) {
		.app-content {
			margin-left: var(--sidebar-width-collapsed);
		}

		.app-content[data-sidebar='expanded'] {
			margin-left: var(--sidebar-width-expanded);
		}
	}
</style>
