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

	function updateApp() {
		if (registration?.waiting) {
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
	}
</script>

<!-- Update notification -->
{#if updateAvailable}
	<div class="fixed bottom-4 right-4 z-50">
		<div class="pwa-update-banner">
			<div class="flex-1">
				<p class="pwa-update-title">Update Available</p>
				<p class="pwa-update-detail">A new version of the app is ready.</p>
			</div>
			<button onclick={updateApp} class="pwa-update-button">Update</button>
		</div>
	</div>
{/if}

<style>
	.pwa-update-banner {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-default);
		border-top: 2px solid var(--accent);
		box-shadow: var(--shadow-lg);
		max-width: 24rem;
	}

	.pwa-update-title {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		margin: 0 0 var(--space-1);
	}

	.pwa-update-detail {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin: 0;
	}

	.pwa-update-button {
		flex-shrink: 0;
		background: transparent;
		border: 1px solid var(--accent);
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: var(--space-2) var(--space-3);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.pwa-update-button:hover {
		background: var(--accent);
		color: var(--app-bg);
	}
</style>
