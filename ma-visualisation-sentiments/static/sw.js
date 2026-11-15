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

// The content-addressed data release this build serves, stamped alongside the
// version (scripts/stamp-sw.mjs). Production data lives only under
// `data/releases/<release>/`; this is what tells the worker which release is
// current, so it can precache it and evict every other one.
const DATA_RELEASE = '__DATA_RELEASE__';
const RELEASE_PREFIX = `/data/releases/${DATA_RELEASE}/`;

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

// Data routing. Every data file the app fetches in production lives under
// `data/releases/<release>/` (scripts/publish-data-release.mjs moves them
// there, and check-build-artifact.mjs fails a build that ships one anywhere
// else), and the worker only runs in production (PWAManager skips registration
// in dev). So the release rule in the fetch handler is the one data rule: it
// sends every payload, the map's Natural Earth basemap included, to the
// deploy-stable DATA_CACHE_NAME. A flat-file prefix list used to sit beside it
// and could never match; it was removed rather than kept as a second source of
// truth that nothing exercised. `data/release.json` is deliberately outside the
// release directory and takes the network-first fallback, so a new release is
// noticed as soon as the network allows.

// Precached at install: only the small files every session needs regardless of
// which view the user opens. The per-model sentiment payloads and the
// extreme-analysis files are deliberately NOT here — they are large, view- and
// model-specific, and the runtime rule below caches them into the same stable
// DATA_CACHE_NAME the moment they're actually requested. Precaching them cost a
// first-time visitor tens of MB before they had opened anything.
// Release-scoped: the flat `data/iwac_articles_base.json` stopped existing when
// data moved under content-addressed release directories, and precaching it
// 404ed on every install.
const DATA_FILES_PRIORITY = [`${BASE_PATH}${RELEASE_PREFIX}iwac_articles_base.json`];

/**
 * The build chunks the app shell loads before anything renders: its
 * modulepreload links, its entry `import("…")` calls and its stylesheets, all
 * under `_app/`. Read from the shell's own HTML at install, so the list is
 * exactly what this deploy's shell asks for, with no build step to keep in
 * sync. Precaching them makes a first visit work offline on reload; lazy view
 * chunks are still cached the first time each view is opened.
 */
function shellAssetUrls(html, shellUrl) {
	const urls = new Set();
	for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
		if (!/\brel=["']?(?:modulepreload|stylesheet)\b/.test(tag)) continue;
		const href = /\bhref=["']([^"']+)["']/.exec(tag)?.[1];
		if (href) urls.add(href);
	}
	for (const [, specifier] of html.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) {
		urls.add(specifier);
	}
	return [...urls]
		.map((href) => new URL(href, shellUrl))
		.filter((url) => url.origin === self.location.origin && url.pathname.includes('/_app/'))
		.map((url) => url.pathname);
}

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

			// Step 1b: the chunks the shell needs to boot (see shellAssetUrls), so a
			// first visit survives going offline. Same per-file tolerance.
			const shell = await staticCache.match(APP_SHELL);
			if (shell) {
				const shellUrl = new URL(APP_SHELL, self.location.origin).href;
				const assets = shellAssetUrls(await shell.clone().text(), shellUrl);
				await Promise.all(
					assets.map(async (asset) => {
						try {
							const response = await fetch(asset);
							if (response.ok) await staticCache.put(asset, response);
						} catch (error) {
							console.log(`[SW] Could not cache: ${asset}`, error.message);
						}
					})
				);
			}

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

// CacheStorage is shared by the whole origin, even when workers have different
// scopes. Only retire names this application has used; another dashboard's
// offline cache must survive a sentiment-analysis deployment.
function isOwnedCacheName(name) {
	return /^(?:iwac-static-|iwac-runtime-|iwac-data-v\d+$)/.test(name);
}

// Activate event - retire this application's superseded caches.
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating', SW_VERSION);

	event.waitUntil(
		(async () => {
			const keep = new Set([STATIC_CACHE_NAME, CACHE_NAME, DATA_CACHE_NAME]);
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames.map((cacheName) => {
					if (isOwnedCacheName(cacheName) && !keep.has(cacheName)) {
						console.log('[SW] Deleting old cache:', cacheName);
						return caches.delete(cacheName);
					}
					return undefined;
				})
			);

			// The data cache is deliberately NOT versioned by deploy (a code-only
			// deploy keeps its data release, and re-downloading the corpus then
			// would be brutal), so stale entries are evicted by name instead: every
			// entry outside the current release. That covers superseded releases —
			// several MB each, and they used to accumulate with every regeneration
			// because they still looked like data files — as well as leftovers of
			// older layouts, such as the flat pre-release files and the
			// pre-normalization `iwac_articles_{model}.json` payloads.
			const dataCache = await caches.open(DATA_CACHE_NAME);
			const staleDataEntries = (await dataCache.keys()).filter(
				(request) => !new URL(request.url).pathname.includes(RELEASE_PREFIX)
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

	// 2) Data → CACHE-FIRST in the deploy-stable DATA_CACHE_NAME. A release
	//    directory is content-addressed, so its files never change and never
	//    fall back to another release's copy; a code-only deploy keeps them.
	if (url.pathname.includes('/data/releases/')) {
		event.respondWith(cacheFirstStrategy(request, DATA_CACHE_NAME, event));
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
	let networkResponse;

	try {
		// Try network first
		networkResponse = await fetch(request);

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

	// Only consult the cache belonging to this request strategy.
	const cachedResponse = await (await caches.open(cacheName)).match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	// If we have a fallback URL (for navigation), try that
	if (fallbackUrl) {
		const fallbackResponse = await (await caches.open(STATIC_CACHE_NAME)).match(fallbackUrl);
		if (fallbackResponse) {
			return fallbackResponse;
		}
	}
	// Preserve genuine HTTP errors. In particular, a 503 must never masquerade
	// as a 404: optional payload loaders interpret the latter as unpublished.
	if (networkResponse) return networkResponse;

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
				status: 503,
				headers: { 'Content-Type': 'text/html' }
			}
		);
	}

	return new Response('Service unavailable', { status: 503 });
}

// Cache-first strategy: check cache first, fallback to network
async function cacheFirstStrategy(request, cacheName, event = null) {
	const requestUrl = new URL(request.url);
	const canCache = requestUrl.protocol.startsWith('http');

	// Try cache first
	const cachedResponse = await (await caches.open(cacheName)).match(request);
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
		// A missing file remains 404; server errors remain retryable errors.
		return networkResponse;
	} catch (_error) {
		console.log('[SW] Network failed for:', request.url);
	}

	return new Response('Service unavailable', { status: 503 });
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		console.log('[SW] Received SKIP_WAITING message');
		self.skipWaiting();
	}
});
