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

// Base path, derived from the worker's own URL rather than a hardcoded literal.
// PWAManager registers this file at `${base}/sw.js` with scope `${base}/`, so the
// directory holding it IS the base: `/sentiment-analysis/sw.js` → `/sentiment-analysis`,
// and `/sw.js` in dev → ``. Deriving it means a change to DEPLOY_PATH (see
// deploy.config.js) can't leave the worker caching a stale prefix.
const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, '');

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

// Every corpus filename prefix under /data/. SINGLE SOURCE OF TRUTH: both the
// install-time precache list and the runtime fetch rule derive from this, so a
// new data file can never be routed to the wrong (per-build, purged-on-deploy)
// cache the way `iwac_sentiment_*` silently was.
const DATA_FILE_PREFIXES = [
	'iwac_articles_base',
	'iwac_sentiment_',
	'iwac_justifications_',
	'iwac_arbiter_evaluations_',
	'iwac_extreme_analysis_',
	'iwac_places',
	// The map's Natural Earth basemap. Not an `iwac_` payload, but it belongs in
	// the same deploy-stable cache: it is 170 kB that changes only when Natural
	// Earth itself does, so re-fetching it on every release would be pure waste.
	'world-110m'
];

/** True when a pathname points at one of the corpus JSON payloads. */
function isDataFilePath(pathname) {
	return (
		pathname.includes('/data/') && DATA_FILE_PREFIXES.some((prefix) => pathname.includes(prefix))
	);
}

// Precached at install: only the small files every session needs regardless of
// which view the user opens. The per-model sentiment payloads and the
// extreme-analysis files are deliberately NOT here — they are large, view- and
// model-specific, and the runtime rule below caches them into the same stable
// DATA_CACHE_NAME the moment they're actually requested. Precaching them cost a
// first-time visitor tens of MB before they had opened anything.
const DATA_FILES_PRIORITY = [
	`${BASE_PATH}/data/iwac_articles_base.json`,
	`${BASE_PATH}/data/iwac_arbiter_evaluations_chatgpt-gemini.json`,
	`${BASE_PATH}/data/iwac_arbiter_evaluations_chatgpt-mistral.json`,
	`${BASE_PATH}/data/iwac_arbiter_evaluations_gemini-mistral.json`
];

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

			// The data cache is deliberately NOT versioned (re-downloading the
			// corpus on every deploy would be brutal), so stale entries have to be
			// evicted by name instead. Anything in there that no longer looks like a
			// current data file is a leftover from a previous data layout — e.g. the
			// pre-normalization `iwac_articles_{model}.json` payloads, tens of MB of
			// dead weight in the caches of anyone who visited before that refactor.
			const dataCache = await caches.open(DATA_CACHE_NAME);
			const staleDataEntries = (await dataCache.keys()).filter(
				(request) => !isDataFilePath(new URL(request.url).pathname)
			);
			await Promise.all(
				staleDataEntries.map((request) => {
					console.log('[SW] Evicting stale data entry:', request.url);
					return dataCache.delete(request);
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
		event.respondWith(networkFirstStrategy(request, CACHE_NAME, APP_SHELL, event));
		return;
	}

	// 2) Data files → network-first (fresh data when online, cached fallback
	//    offline), stored in the deploy-stable DATA_CACHE_NAME so a new release
	//    doesn't force a re-download of the whole corpus.
	if (isDataFilePath(url.pathname)) {
		event.respondWith(networkFirstStrategy(request, DATA_CACHE_NAME, null, event));
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
		event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME, event));
		return;
	}

	// 4) Everything else → network-first, cache fallback.
	event.respondWith(networkFirstStrategy(request, CACHE_NAME, null, event));
});

/**
 * Write a response clone to the cache without racing the worker's lifetime.
 *
 * `response.clone()` tees one stream into two readers. If the cache write is
 * still draining its branch when respondWith() settles, the browser is free to
 * consider the fetch event finished and idle the worker out — which kills the
 * tee and surfaces on the page as `TypeError: Failed to fetch`
 * (net::ERR_ABORTED). Small assets finish before that ever happens; the 5MB
 * extreme-analysis payloads did not, and aborted on roughly every first visit
 * to that view.
 *
 * Passing the FetchEvent through so the put can be handed to waitUntil() is
 * what actually keeps the worker alive for the write.
 */
function cacheResponse(event, cacheName, request, response) {
	const write = caches
		.open(cacheName)
		.then((cache) => cache.put(request, response))
		.catch((error) => console.log('[SW] Cache write failed:', request.url, error.message));

	if (event && typeof event.waitUntil === 'function') {
		event.waitUntil(write);
	}
	return write;
}

// Network-first strategy: try network, fallback to cache
async function networkFirstStrategy(request, cacheName, fallbackUrl = null, event = null) {
	const requestUrl = new URL(request.url);
	const canCache = requestUrl.protocol.startsWith('http');

	try {
		// Try network first
		const networkResponse = await fetch(request);

		// If successful, update cache and return response
		if (networkResponse.ok && canCache) {
			cacheResponse(event, cacheName, request, networkResponse.clone());
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
              background: #0a0d12;
              color: #e8eaed;
            }
            .container {
              max-width: 400px;
              margin: 2rem auto;
              padding: 2rem;
              background: #10141a;
              border-radius: 8px;
            }
            .icon { font-size: 3rem; margin-bottom: 1rem; }
            h1 { margin-bottom: 1rem; }
            p { margin-bottom: 1.5rem; line-height: 1.5; }
            button {
              background: #e49900;
              color: #0a0d12;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: #f3b94c; }
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
async function cacheFirstStrategy(request, cacheName, event = null) {
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
			// Same lifetime hazard as networkFirstStrategy — see cacheResponse.
			cacheResponse(event, cacheName, request, networkResponse.clone());
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

// Update data cache in background.
//
// Refreshes whatever this client has ALREADY cached rather than a hardcoded
// file list: the entries present are exactly the datasets this user has opened,
// so we never re-download a 14MB model payload for someone who only ever looks
// at one model — and the list can't drift out of sync with static/data/ again.
async function updateDataCache() {
	const cache = await caches.open(DATA_CACHE_NAME);
	const cachedRequests = await cache.keys();

	const updatePromises = cachedRequests.map(async (request) => {
		try {
			const response = await fetch(request);
			if (response.ok) {
				await cache.put(request, response);
				console.log('[SW] Updated cache for:', request.url);
			}
		} catch (_error) {
			console.log('[SW] Failed to update cache for:', request.url);
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
