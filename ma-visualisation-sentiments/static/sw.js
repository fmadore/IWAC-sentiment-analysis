// Service Worker for IWAC Sentiment Analysis PWA
// Provides caching and offline functionality

const CACHE_NAME = 'iwac-sentiment-analysis-v2';
const STATIC_CACHE_NAME = 'iwac-static-v2';
const DATA_CACHE_NAME = 'iwac-data-v2';

// Get base path for GitHub Pages deployment
const BASE_PATH = self.location.pathname.includes('/IWAC-sentiment-analysis') ? '/IWAC-sentiment-analysis' : '';

// Files to cache immediately on install
const STATIC_FILES = [
  `${BASE_PATH}/`,
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
  `${BASE_PATH}/data/iwac_arbiter_evaluations.json`,
  // Priority 2: Main article datasets
  `${BASE_PATH}/data/iwac_articles_chatgpt.json`,
  `${BASE_PATH}/data/iwac_articles_gemini.json`,
  // Priority 3: Extreme analysis data (larger files, used less frequently)
  `${BASE_PATH}/data/iwac_extreme_analysis_chatgpt.json`,
  `${BASE_PATH}/data/iwac_extreme_analysis_gemini.json`
];

// Legacy DATA_FILES for backward compatibility
const DATA_FILES = DATA_FILES_PRIORITY;

// Install event - cache static files first, then data files progressively
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    (async () => {
      // Step 1: Cache static files immediately (critical for app shell)
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      console.log('[SW] Caching static files');
      await staticCache.addAll(STATIC_FILES);
      
      // Step 2: Cache data files progressively by priority
      // This allows the service worker to activate faster while still caching data
      const dataCache = await caches.open(DATA_CACHE_NAME);
      console.log('[SW] Caching data files progressively');
      
      // Cache each data file individually, don't fail if one fails
      for (const dataFile of DATA_FILES_PRIORITY) {
        try {
          const response = await fetch(dataFile);
          if (response.ok) {
            await dataCache.put(dataFile, response);
            console.log(`[SW] Cached: ${dataFile}`);
          } else {
            console.log(`[SW] Skipped (not found): ${dataFile}`);
          }
        } catch (error) {
          // Don't fail installation if a data file can't be cached
          // The file might not exist yet (e.g., arbiter evaluations)
          console.log(`[SW] Could not cache: ${dataFile}`, error.message);
        }
      }
      
      console.log('[SW] Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DATA_CACHE_NAME && 
              cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
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
  
  // Skip cross-origin requests that we can't cache
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }
  
  // Handle data files with network-first strategy
  if (DATA_FILES.some(file => url.pathname.includes(file.replace('/data/', '')))) {
    event.respondWith(
      networkFirstStrategy(request, DATA_CACHE_NAME)
    );
    return;
  }
  
  // Handle static files with cache-first strategy
  if (STATIC_FILES.some(file => url.pathname === file) || 
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/_app/')) {
    event.respondWith(
      cacheFirstStrategy(request, STATIC_CACHE_NAME)
    );
    return;
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstStrategy(request, CACHE_NAME, '/')
    );
    return;
  }
  
  // For all other requests, try network first, then cache
  event.respondWith(
    networkFirstStrategy(request, CACHE_NAME)
  );
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
  } catch (error) {
    console.log('[SW] Network failed for:', request.url);
  }
  
  // Network failed, try cache
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
    return new Response(`
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
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
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
  } catch (error) {
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
    } catch (error) {
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