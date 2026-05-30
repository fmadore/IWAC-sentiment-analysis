// Service Worker for IWAC Sentiment Analysis PWA
// Provides caching and offline functionality.
//
// IMPORTANT — cache strategy:
//   • The HTML app shell is served NETWORK-FIRST. It must always be the latest,
//     because it references content-hashed /_app/ chunk URLs. Serving a stale
//     shell makes the browser load chunk hashes the server no longer has (or a
//     mismatched mix), which surfaces as "X is not a constructor" at runtime.
//   • Content-hashed build assets (/_app/, icons) are immutable, so cache-first
//     is correct for them.
//   • SW_VERSION is replaced at build time (see scripts/stamp-sw.mjs). Because it
//     changes every deploy, this file's bytes change too, so the browser detects
//     the updated worker and the old per-deploy caches are purged on activate.

const SW_VERSION = '__BUILD_VERSION__';

// App-shell + build assets change every deploy → version these per build so old
// copies are purged. The data JSON is large and network-first, so keep its cache
// stable to avoid re-downloading the whole corpus on every deploy.
const STATIC_CACHE_NAME = `iwac-static-${SW_VERSION}`;
const CACHE_NAME = `iwac-runtime-${SW_VERSION}`;
const DATA_CACHE_NAME = 'iwac-data-v4';

// Get base path for GitHub Pages deployment
const BASE_PATH = self.location.pathname.includes('/IWAC-sentiment-analysis')
	? '/IWAC-sentiment-analysis'
	: '';

// App-shell URL, served network-first and kept as the offline navigation fallback.
const APP_SHELL = `${BASE_PATH}/`;

// Files to cache on install (app shell first, then small static assets).
const STATIC_FILES = [
	APP_SHELL,
	`${BASE_PATH}/favicon.png`,
	`${BASE_PATH}/manifest.json`,
	`${BASE_PATH}/browserconfig.xml`,
	`${BASE_PATH}/icons/icon-192x192.png`,
	`${BASE_PATH}/icons/icon-512x512.png`
];

// Data files that should be cached - ordered by priority
// Smaller files first for faster initial cache population
const DATA_FILES_PRIORITY = [
	// Priority 1: Arbiter evaluations (smallest, needed for comparison view)
	`${BASE_PATH}/data/iwac_arbiter_evaluations_chatgpt-gemini.json`,
	`${BASE_PATH}/data/iwac_arbiter_evaluations_chatgpt-mistral.json`,
	`${BASE_PATH}/data/iwac_arbiter_evaluations_gemini-mistral.json`,
	// Priority 2: Main article datasets
	`${BASE_PATH}/data/iwac_articles_chatgpt.json`,
	`${BASE_PATH}/data/iwac_articles_gemini.json`,
	`${BASE_PATH}/data/iwac_articles_mistral.json`,
	// Priority 3: Extreme analysis data (larger files, used less frequently)
	`${BASE_PATH}/data/iwac_extreme_analysis_chatgpt.json`,
	`${BASE_PATH}/data/iwac_extreme_analysis_gemini.json`,
	`${BASE_PATH}/data/iwac_extreme_analysis_mistral.json`
];

// Legacy alias kept for the background-sync helper below.
const DATA_FILES = DATA_FILES_PRIORITY;

// Install event - cache static files (tolerantly), then data files progressively.
self.addEventListener('install', (event) => {
	console.log('[SW] Installing', SW_VERSION);

	event.waitUntil(
		(async () => {
			// Step 1: Cache static files. Do it tolerantly (per-file) so one missing
			// asset can never fail the whole install — a failed install would leave
			// the OLD worker in control and the stale cache unfixed.
			const staticCache = await caches.open(STATIC_CACHE_NAME);
			await Promise.all(
				STATIC_FILES.map(async (file) => {
					try {
						// `reload` bypasses the HTTP cache so the shell we store is fresh.
						const response = await fetch(file, { cache: 'reload' });
						if (response.ok) {
							await staticCache.put(file, response);
						} else {
							console.log(`[SW] Skipped (not ok): ${file}`);
						}
					} catch (error) {
						console.log(`[SW] Could not cache: ${file}`, error.message);
					}
				})
			);

			// Step 2: Cache data files progressively by priority (also tolerant).
			const dataCache = await caches.open(DATA_CACHE_NAME);
			for (const dataFile of DATA_FILES_PRIORITY) {
				try {
					const response = await fetch(dataFile);
					if (response.ok) {
						await dataCache.put(dataFile, response);
					}
				} catch (error) {
					console.log(`[SW] Could not cache: ${dataFile}`, error.message);
				}
			}

			console.log('[SW] Installation complete');
			// Activate immediately; PWAManager also messages SKIP_WAITING on update.
			return self.skipWaiting();
		})()
	);
});

// Activate event - delete any cache that isn't part of this version's set.
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating', SW_VERSION);

	event.waitUntil(
		(async () => {
			const keep = new Set([STATIC_CACHE_NAME, CACHE_NAME, DATA_CACHE_NAME]);
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames.map((cacheName) => {
					if (!keep.has(cacheName)) {
						console.log('[SW] Deleting old cache:', cacheName);
						return caches.delete(cacheName);
					}
					return undefined;
				})
			);
			console.log('[SW] Activation complete');
			// Take control of all open pages immediately.
			return self.clients.claim();
		})()
	);
});

// Fetch event
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') {
		return;
	}

	// Skip requests with unsupported schemes (chrome-extension, etc.)
	if (!url.protocol.startsWith('http')) {
		return;
	}

	// Skip Vite HMR and dev server requests in development
	if (
		url.pathname.includes('/@') ||
		url.pathname.includes('__vite') ||
		url.pathname.includes('.hot-update') ||
		url.pathname.includes('node_modules')
	) {
		return;
	}

	// Skip cross-origin requests that we can't cache.
	// Use exact hostname matching to prevent subdomain attacks.
	const allowedExternalHosts = ['fonts.googleapis.com', 'fonts.gstatic.com'];
	const isAllowedExternalHost = allowedExternalHosts.some(
		(host) => url.hostname === host || url.hostname.endsWith('.' + host)
	);
	if (url.origin !== self.location.origin && !isAllowedExternalHost) {
		return;
	}

	// 1) HTML / navigation → NETWORK-FIRST. This must come before the static rule:
	//    the app shell must always be the latest so its hashed chunk references
	//    match what the server actually serves. Falls back to the cached shell
	//    when offline.
	if (request.mode === 'navigate') {
		event.respondWith(networkFirstStrategy(request, CACHE_NAME, APP_SHELL));
		return;
	}

	// 2) Data files → network-first (fresh data when online, cached fallback offline)
	const isDataFile =
		url.pathname.includes('/data/') &&
		(url.pathname.includes('iwac_articles_') ||
			url.pathname.includes('iwac_arbiter_evaluations_') ||
			url.pathname.includes('iwac_extreme_analysis_'));
	if (isDataFile) {
		event.respondWith(networkFirstStrategy(request, DATA_CACHE_NAME));
		return;
	}

	// 3) Content-hashed build assets + icons + small static images → cache-first.
	//    These are immutable (hashed filenames), so cache-first is safe and fast.
	//    The app shell ('/') is intentionally excluded — it's handled above.
	const isImmutableAsset = url.pathname.includes('/_app/') || url.pathname.includes('/icons/');
	const isStaticAsset = STATIC_FILES.some(
		(file) => file !== APP_SHELL && (url.pathname === file || url.pathname.endsWith(file))
	);
	if (isImmutableAsset || isStaticAsset) {
		event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
		return;
	}

	// 4) Everything else → network-first, cache fallback.
	event.respondWith(networkFirstStrategy(request, CACHE_NAME));
});

// Network-first strategy: try network, fallback to cache
async function networkFirstStrategy(request, cacheName, fallbackUrl = null) {
	const requestUrl = new URL(request.url);
	const canCache = requestUrl.protocol.startsWith('http');

	try {
		// Try network first
		const networkResponse = await fetch(request);

		// If successful, update cache and return response
		if (networkResponse.ok && canCache) {
			const cache = await caches.open(cacheName);
			cache.put(request, networkResponse.clone());
		}
		if (networkResponse.ok) {
			return networkResponse;
		}
	} catch (_error) {
		console.log('[SW] Network failed for:', request.url);
	}

	// Network failed, try cache (searches all caches)
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	// If we have a fallback URL (for navigation), try that
	if (fallbackUrl) {
		const fallbackResponse = await caches.match(fallbackUrl);
		if (fallbackResponse) {
			return fallbackResponse;
		}
	}

	// Return a basic offline page if nothing else works
	if (request.mode === 'navigate') {
		return new Response(
			`
      <!DOCTYPE html>
      <html>
        <head>
          <title>IWAC - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center;
              padding: 2rem;
              background: #0f172a;
              color: #e2e8f0;
            }
            .container {
              max-width: 400px;
              margin: 2rem auto;
              padding: 2rem;
              background: #1e293b;
              border-radius: 8px;
            }
            .icon { font-size: 3rem; margin-bottom: 1rem; }
            h1 { margin-bottom: 1rem; }
            p { margin-bottom: 1.5rem; line-height: 1.5; }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📊</div>
            <h1>You're Offline</h1>
            <p>The IWAC Sentiment Analysis app isn't available right now. Check your connection or try again later.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `,
			{
				headers: { 'Content-Type': 'text/html' }
			}
		);
	}

	// For other requests, return a 404
	return new Response('Not found', { status: 404 });
}

// Cache-first strategy: check cache first, fallback to network
async function cacheFirstStrategy(request, cacheName) {
	const requestUrl = new URL(request.url);
	const canCache = requestUrl.protocol.startsWith('http');

	// Try cache first
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	// Cache miss, try network
	try {
		const networkResponse = await fetch(request);
		if (networkResponse.ok && canCache) {
			const cache = await caches.open(cacheName);
			cache.put(request, networkResponse.clone());
		}
		if (networkResponse.ok) {
			return networkResponse;
		}
	} catch (_error) {
		console.log('[SW] Network failed for:', request.url);
	}

	return new Response('Not found', { status: 404 });
}

// Background sync for data updates (if supported)
if ('sync' in self.registration) {
	self.addEventListener('sync', (event) => {
		if (event.tag === 'background-sync-data') {
			event.waitUntil(updateDataCache());
		}
	});
}

// Update data cache in background
async function updateDataCache() {
	const cache = await caches.open(DATA_CACHE_NAME);

	const updatePromises = DATA_FILES.map(async (file) => {
		try {
			const response = await fetch(file);
			if (response.ok) {
				await cache.put(file, response);
				console.log('[SW] Updated cache for:', file);
			}
		} catch (_error) {
			console.log('[SW] Failed to update cache for:', file);
		}
	});

	await Promise.all(updatePromises);
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
	self.addEventListener('periodicsync', (event) => {
		if (event.tag === 'daily-data-sync') {
			event.waitUntil(updateDataCache());
		}
	});
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		console.log('[SW] Received SKIP_WAITING message');
		self.skipWaiting();
	}
});
