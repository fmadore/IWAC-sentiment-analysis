<!-- PWA Service Worker Registration Component -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { DEV } from 'esm-env';
	import { createControllerChangeTracker } from '$lib/utils/swUpdate';
	let registration = $state<ServiceWorkerRegistration | null>(null);

	onMount(async () => {
		if (!browser || !('serviceWorker' in navigator)) {
			return;
		}

		// Skip service worker registration in development mode
		// to avoid conflicts with Vite's HMR
		if (DEV) {
			console.log('[PWA] Skipping Service Worker registration in development mode');
			// Unregister any existing service workers in dev mode
			const registrations = await navigator.serviceWorker.getRegistrations();
			for (const reg of registrations) {
				await reg.unregister();
				console.log('[PWA] Unregistered existing Service Worker');
			}
			return;
		}

		try {
			// Register service worker with proper base path for GitHub Pages
			// Ensure basePath ends with a slash for proper URL construction
			const basePath = base ? (base.endsWith('/') ? base : `${base}/`) : '/';
			registration = await navigator.serviceWorker.register(`${basePath}sw.js`, {
				scope: basePath,
				// Always revalidate the worker script against the network so a new
				// deploy is detected immediately (never served from the HTTP cache).
				updateViaCache: 'none'
			});

			// When a new worker finishes installing, apply it right away. The active
			// view/dataset/filters live in the URL, so the reload below restores state.
			registration.addEventListener('updatefound', () => {
				const newWorker = registration?.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							newWorker.postMessage({ type: 'SKIP_WAITING' });
						}
					});
				}
			});

			// A new worker took control. Whether that warrants a reload depends on
			// which of the two very different `controllerchange` cases this is —
			// see createControllerChangeTracker, where the decision is unit-tested.
			const tracker = createControllerChangeTracker(!!navigator.serviceWorker.controller);
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				if (tracker.onControllerChange()) {
					window.location.reload();
				}
			});

			// A worker updated on a previous visit may already be waiting — apply it.
			if (registration.waiting && navigator.serviceWorker.controller) {
				registration.waiting.postMessage({ type: 'SKIP_WAITING' });
			}
		} catch (error) {
			console.error('Service Worker registration failed:', error);
		}
	});
</script>

<!-- No UI: service-worker updates are applied automatically (see updatefound /
     controllerchange handlers above), so there is no manual "update" banner. -->
