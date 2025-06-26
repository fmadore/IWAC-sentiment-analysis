# Lazy Loading Improvements

## Problem

The application was loading both JSON datasets (22MB total) on page load:
- `iwac_articles_chatgpt.json` (11MB)  
- `iwac_articles_gemini.json` (11MB)

This caused:
- Slow initial page load
- Unnecessary data transfer for users who only need one dataset
- High memory usage
- Poor mobile performance

## Solution: Load-on-Demand Strategy with Background Prefetching

### 1. **Dataset Loading Functions**

#### `loadCurrentDataset()`
- Loads only the currently selected dataset immediately
- Checks if dataset is already loaded before fetching
- **NEW**: Starts background prefetching of other datasets after main load
- Used for initial page load and dataset switching

#### `loadComparisonDatasets()`
- Loads both ChatGPT and Gemini datasets only when comparison mode is activated
- Loads missing datasets in parallel
- **NEW**: Benefits from background prefetching for instant switching
- Only triggered when user switches to comparison view

#### `prefetchOtherDatasets()` (NEW)
- Runs in background after initial dataset is loaded
- Loads remaining datasets without showing loading indicators
- Uses sequential loading with delays to maintain UI responsiveness
- Fails silently if network issues occur (optimization, not critical)

### 2. **Implementation Changes**

#### **Initial Page Load**
```typescript
// Before: Load all datasets (22MB)
await loadAllDatasets(fetch);

// After: Load only current dataset (11MB)
await loadCurrentDataset(fetch);
```

#### **Dataset Switching**
- Check if new dataset is already loaded
- Only fetch if not in memory
- Update UI immediately if already cached

#### **Comparison Mode**
- Datasets loaded only when user activates comparison view
- Parallel loading of missing datasets
- Seamless transition with loading indicator

### 3. **Performance Benefits**

#### **Initial Load Time**
- **50% reduction** in data transfer (11MB vs 22MB)
- Faster time to interactive
- Better mobile experience

#### **Memory Usage**
- Only loads data that's actually needed
- Datasets cached once loaded
- No redundant data in memory

#### **User Experience**
- **Instant switching**: Background prefetching makes dataset switching feel instant
- **Smart loading**: Critical data loads first, nice-to-have data loads in background
- **No waiting**: Comparison mode often has data ready thanks to prefetching
- **Responsive UI**: Sequential background loading doesn't block the interface
- **Graceful degradation**: Works even if background loading fails

### 4. **Caching Strategy**

- **Smart Caching**: Datasets remain in memory once loaded
- **Selective Loading**: Only missing datasets are fetched
- **Parallel Loading**: Multiple datasets loaded simultaneously when needed

### 5. **Additional Optimizations to Consider**

#### **Chunked Loading** (Future Enhancement)
```typescript
// Load articles in chunks for very large datasets
export const loadDatasetChunked = async (datasetId: string, chunkSize = 1000) => {
  // Implementation for progressive loading
};
```

#### **Service Worker Caching** (Future Enhancement)
- Cache datasets in service worker
- Offline support
- Background updates

#### **Virtual Scrolling** (Future Enhancement)
- For article tables with thousands of rows
- Only render visible items
- Reduce DOM memory usage

## Usage

The intelligent loading system is now automatic:

1. **Initial load**: Only loads the selected dataset (fast startup)
2. **Background prefetching**: Other datasets load silently in background
3. **Dataset switching**: Usually instant thanks to prefetching
4. **Comparison mode**: Often instant since datasets are pre-loaded
5. **Caching**: All loaded datasets remain in memory for instant access

### **Timing Strategy**
- **Immediate**: Load current dataset for fast initial experience
- **500ms delay**: Start background prefetching after UI settles
- **100ms intervals**: Sequential loading to maintain responsiveness
- **Silent failures**: Background loading doesn't interrupt user experience

## Monitoring

To monitor the improvements:
- Check Network tab in DevTools
- Initial page load should show only one JSON file
- Additional datasets load only when needed
- Total data transfer reduced by ~50% for typical usage 