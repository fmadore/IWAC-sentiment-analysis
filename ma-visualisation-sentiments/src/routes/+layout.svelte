<script lang="ts">
	import '../app.css';
	import { AppHeader, SidebarNav } from '$lib/components/layout';
	import { PWAManager } from '$lib/components';
	import { uiState } from '$lib/stores';

	let { children } = $props();

	// Reactive binding to sidebar state
	let isSidebarExpanded = $derived(uiState.sidebarExpanded);
</script>

<SidebarNav />

<div class="app-content" class:expanded={isSidebarExpanded}>
	<AppHeader />
	<main>
		{@render children()}
	</main>
</div>

<PWAManager />

<style>
	/* Main content wrapper - accounts for sidebar on desktop */
	.app-content {
		min-height: 100dvh;
		transition: margin-left var(--timing-normal) var(--easing-default);
		display: flex;
		flex-direction: column;
	}

	@media (min-width: 1024px) {
		.app-content {
			margin-left: 4.5rem; /* collapsed sidebar width — not a standard spacing token */
		}

		.app-content.expanded {
			margin-left: 14rem; /* expanded sidebar width — not a standard spacing token */
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.app-content {
			transition: none;
		}
	}
</style>
