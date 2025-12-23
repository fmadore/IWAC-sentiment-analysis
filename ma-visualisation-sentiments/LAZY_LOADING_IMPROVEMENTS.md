# Lazy Loading & Pre-caching Strategy

## Data Overview

The application manages multiple JSON data files:

| File | Raw Size | Brotli | Priority | Usage |
|------|----------|--------|----------|-------|
| `iwac_arbiter_evaluations.json` | ~1-2 MB | ~100-200 KB | 🔴 High | Comparison view |
| `iwac_articles_chatgpt.json` | 10.9 MB | 1.15 MB | 🔴 High | Main dataset |
| `iwac_articles_gemini.json` | 12.1 MB | 1.17 MB | 🟡 Medium | Alt/Comparison |
| `iwac_extreme_analysis_chatgpt.json` | 11.4 MB | 0.88 MB | 🟢 Low | Extreme view |
| `iwac_extreme_analysis_gemini.json` | 14.3 MB | 1.01 MB | 🟢 Low | Extreme view |

**Total with Brotli: ~4.5 MB** (excellent compression, 90%+ ratio)

## Loading Strategy

### Phase 1: Critical Path (Immediate)
- Load **only the selected dataset** (ChatGPT or Gemini)
- Show loading skeleton during fetch
- Time to interactive: ~1-2 seconds on 4G

### Phase 2: Smart Prefetching (Background)
After initial render, prefetch data in priority order:

1. **Arbiter Evaluations** (P1) - Small file, needed for comparison
2. **Alternate Dataset** (P2) - For instant dataset switching
3. **Extreme Analysis** (P3) - Only for current dataset initially

### Phase 3: Service Worker Caching
- Progressive caching during SW install
- Network-first for data freshness
- Offline fallback from cache

## Implementation Details

### 1. Priority-Based Prefetching (stores.ts)

```typescript
interface PrefetchTask {
  id: string;
  type: 'dataset' | 'extreme' | 'arbiter';
  priority: number; // Lower = higher priority
  loader: () => Promise<void>;
}

// Priority queue: arbiter (1) → datasets (2) → extreme (3)
```

#### Smart Scheduling Features:
- **`requestIdleCallback`**: Prefetch during browser idle time
- **Network-aware**: Skips prefetching on slow 2G or data-saver mode
- **Deduplication**: Tracks in-progress and completed prefetches
- **150ms delays**: Maintains UI responsiveness between loads

### 2. Service Worker Caching (sw.js)

```javascript
// Priority-ordered caching
const DATA_FILES_PRIORITY = [
  'iwac_arbiter_evaluations.json',    // Priority 1: Smallest
  'iwac_articles_chatgpt.json',        // Priority 2: Main
  'iwac_articles_gemini.json',         // Priority 2: Alt
  'iwac_extreme_analysis_chatgpt.json', // Priority 3: Large
  'iwac_extreme_analysis_gemini.json'   // Priority 3: Large
];
```

#### Progressive Installation:
- Static files cached synchronously (app shell)
- Data files cached progressively (non-blocking)
- Graceful handling of missing files (arbiter may not exist yet)

### 3. Loading State Management

```typescript
// Separate loading states for different data types
export const isLoadingDataset = writable<boolean>(false);
export const isLoadingExtremeAnalysis = writable<boolean>(false);
export const isLoadingComparison = writable<boolean>(false);
export const isLoadingArbiter = writable<boolean>(false);
```

## Performance Benefits

| Metric | Before | After |
|--------|--------|-------|
| Initial data transfer | 22+ MB | **1.15-1.17 MB** |
| Time to interactive | 5-8s | **1-2s** |
| Dataset switching | 2-3s | **Instant** (prefetched) |
| Comparison mode activation | 5-6s | **<500ms** (prefetched) |

## Network-Aware Loading

```typescript
// Check network conditions before prefetching
const connection = (navigator as any).connection;
if (connection) {
  if (connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' || 
      connection.saveData) {
    // Skip non-critical prefetching
    return;
  }
}
```

## User Experience Flow

```
┌─────────────────────────────────────────────────────────┐
│ Page Load                                               │
├─────────────────────────────────────────────────────────┤
│ 1. [IMMEDIATE] Load selected dataset (ChatGPT)          │
│    └─ Show loading skeleton (1-2s)                      │
│                                                         │
│ 2. [RENDER] Display charts and data                     │
│                                                         │
│ 3. [IDLE] requestIdleCallback triggered                 │
│    ├─ P1: Load arbiter evaluations (~100KB)             │
│    ├─ P2: Load alternate dataset (~1.1MB)               │
│    └─ P3: Load extreme analysis (~0.9MB)                │
│                                                         │
│ 4. [READY] All data prefetched                          │
│    └─ User actions are instant                          │
└─────────────────────────────────────────────────────────┘
```

## Arbiter Data Integration

The arbiter evaluations file is lightweight and loaded with high priority:

- **When loaded**: During background prefetch (P1 priority)
- **Used in**: Comparison view for arbiter verdict display
- **Fallback**: App works without it (optional data)
- **Caching**: Progressive SW caching with graceful fallback

## Future Optimizations

### 1. Streaming JSON Parsing
```typescript
// Parse large JSON files progressively
async function streamParse(url: string) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  // Progressive parsing...
}
```

### 2. IndexedDB for Persistent Cache
```typescript
// Store parsed data in IndexedDB for faster subsequent loads
// Skip JSON parsing on repeat visits
```

### 3. Virtual Scrolling
- For article tables with 10,000+ rows
- Only render visible items
- Reduces DOM memory usage

### 4. Data Chunking
```typescript
// Load articles in chunks for progressive rendering
export const loadDatasetChunked = async (datasetId: string, chunkSize = 1000) => {
  // Progressive loading implementation
};
```

## Monitoring

### DevTools Checks:
1. **Network tab**: Verify only one main JSON on initial load
2. **Performance tab**: Check for idle-time prefetching
3. **Application tab**: Verify Service Worker caching

### Console Logs:
```
[Prefetch] Queue: arbiter(P1), gemini(P2), extreme-chatgpt(P3)
[Prefetch] Loading: arbiter
[Prefetch] Completed: arbiter
[Prefetch] Loading: gemini
...
[Prefetch] All prefetching completed
```