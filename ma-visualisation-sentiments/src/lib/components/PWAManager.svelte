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

	let updateAvailable = $state(false);
	let registration = $state<ExtendedServiceWorkerRegistration | null>(null);

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
				scope: basePath
			})) as ExtendedServiceWorkerRegistration;

			console.log('Service Worker registered successfully:', registration);

			// Listen for updates
			registration.addEventListener('updatefound', () => {
				const newWorker = registration?.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							// New content is available
							updateAvailable = true;
						}
					});
				}
			});

			// Listen for controlling service worker changes
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				// A new service worker has taken control
				window.location.reload();
			});

			// Request background sync permission (if supported)
			if ('sync' in window.ServiceWorkerRegistration.prototype && registration?.sync) {
				try {
					await registration.sync.register('background-sync-data');
				} catch (error) {
					console.log('Background sync registration failed:', error);
				}
			}

			// Request periodic sync (if supported)
			if ('periodicSync' in window.ServiceWorkerRegistration.prototype && registration?.periodicSync) {
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

	function updateApp() {
		if (registration?.waiting) {
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
	}
</script>

<!-- Update notification -->
{#if updateAvailable}
	<div class="fixed bottom-4 right-4 z-50">
		<div class="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
			<div class="flex-1">
				<p class="font-medium">Update Available</p>
				<p class="text-sm opacity-90">A new version of the app is ready.</p>
			</div>
			<button
				onclick={updateApp}
				class="bg-white text-blue-600 px-3 py-1 rounded font-medium hover:bg-blue-50 transition-colors"
			>
				Update
			</button>
		</div>
	</div>
{/if}