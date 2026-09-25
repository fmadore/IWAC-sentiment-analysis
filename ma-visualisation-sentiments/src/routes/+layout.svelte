<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { AppHeader, SidebarNav } from '$lib/components/layout';
	import PWAManager from '$lib/components/PWAManager.svelte';
	import { uiState } from '$lib/stores';
	import { readStorage, removeStorage } from '$lib/utils/safeStorage';

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
			goto(target, { replaceState: true, keepFocus: true, noScroll: true });
		} catch (err) {
			console.error('Failed to parse SPA redirect data:', err);
		}
	});
</script>

<SidebarNav />

<div class="app-content" data-sidebar={isSidebarExpanded ? 'expanded' : 'collapsed'}>
	<AppHeader />
	<main>
		{@render children()}
	</main>
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

	@media (min-width: 1024px) {
		.app-content {
			margin-left: var(--sidebar-width-collapsed);
		}

		.app-content[data-sidebar='expanded'] {
			margin-left: var(--sidebar-width-expanded);
		}
	}
</style>
