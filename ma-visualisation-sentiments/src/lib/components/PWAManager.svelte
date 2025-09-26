<!-- PWA Service Worker Registration Component -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { BeforeInstallPromptEvent, ExtendedServiceWorkerRegistration } from '$lib/types/pwa.js';

	let updateAvailable = $state(false);
	let registration = $state<ExtendedServiceWorkerRegistration | null>(null);

	onMount(async () => {
		if (!browser || !('serviceWorker' in navigator)) {
			console.log('Service Worker not supported');
			return;
		}

		try {
			// Register service worker
			registration = (await navigator.serviceWorker.register('/sw.js', {
				scope: '/'
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

	// Install prompt handling
	let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	let showInstallPrompt = $state(false);

	onMount(() => {
		if (!browser) return;

		// Listen for the beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
			// Prevent the mini-infobar from appearing on mobile
			e.preventDefault();
			// Stash the event so it can be triggered later
			deferredPrompt = e;
			// Show install button
			showInstallPrompt = true;
		});

		// Listen for the install event
		window.addEventListener('appinstalled', () => {
			console.log('PWA was installed');
			showInstallPrompt = false;
			deferredPrompt = null;
		});
	});

	async function installPWA() {
		if (!deferredPrompt) return;

		// Show the prompt
		deferredPrompt.prompt();

		// Wait for the user to respond to the prompt
		const { outcome } = await deferredPrompt.userChoice;
		console.log(`User response to the install prompt: ${outcome}`);

		// We no longer need the prompt. Clear it up.
		deferredPrompt = null;
		showInstallPrompt = false;
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

<!-- Install prompt -->
{#if showInstallPrompt}
	<div class="fixed bottom-4 left-4 z-50">
		<div class="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
			<div class="flex-1">
				<p class="font-medium">Install App</p>
				<p class="text-sm opacity-90">Add IWAC Analysis to your home screen</p>
			</div>
			<button
				onclick={installPWA}
				class="bg-blue-600 text-white px-3 py-1 rounded font-medium hover:bg-blue-700 transition-colors"
			>
				Install
			</button>
			<button
				onclick={() => (showInstallPrompt = false)}
				class="text-slate-400 hover:text-white transition-colors"
				aria-label="Dismiss"
			>
				×
			</button>
		</div>
	</div>
{/if}