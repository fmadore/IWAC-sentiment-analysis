<!-- PWA Service Worker Registration Component -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { DEV } from 'esm-env';
	interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
		sync?: { register(tag: string): Promise<void> };
		periodicSync?: { register(tag: string, options: { minInterval: number }): Promise<void> };
	}

	let registration = $state<ExtendedServiceWorkerRegistration | null>(null);
	// Guards against a reload loop when the new worker takes control.
	let refreshing = false;

	onMount(async () => {
		if (!browser || !('serviceWorker' in navigator)) {
			console.log('Service Worker not supported');
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
			registration = (await navigator.serviceWorker.register(`${basePath}sw.js`, {
				scope: basePath,
				// Always revalidate the worker script against the network so a new
				// deploy is detected immediately (never served from the HTTP cache).
				updateViaCache: 'none'
			})) as ExtendedServiceWorkerRegistration;

			console.log('Service Worker registered successfully:', registration);

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

			// A new worker took control → reload once to run the latest assets.
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				if (refreshing) return;
				refreshing = true;
				window.location.reload();
			});

			// A worker updated on a previous visit may already be waiting — apply it.
			if (registration.waiting && navigator.serviceWorker.controller) {
				registration.waiting.postMessage({ type: 'SKIP_WAITING' });
			}

			// Request background sync permission (if supported)
			if ('sync' in window.ServiceWorkerRegistration.prototype && registration?.sync) {
				try {
					await registration.sync.register('background-sync-data');
				} catch (error) {
					console.log('Background sync registration failed:', error);
				}
			}

			// Request periodic sync (if supported)
			if (
				'periodicSync' in window.ServiceWorkerRegistration.prototype &&
				registration?.periodicSync
			) {
				try {
					const status = await navigator.permissions.query({
						name: 'periodic-background-sync' as PermissionName
					});
					if (status.state === 'granted') {
						await registration.periodicSync.register('daily-data-sync', {
							minInterval: 24 * 60 * 60 * 1000 // 24 hours
						});
					}
				} catch (error) {
					console.log('Periodic sync registration failed:', error);
				}
			}
		} catch (error) {
			console.error('Service Worker registration failed:', error);
		}
	});
</script>

<!-- No UI: service-worker updates are applied automatically (see updatefound /
     controllerchange handlers above), so there is no manual "update" banner. -->
