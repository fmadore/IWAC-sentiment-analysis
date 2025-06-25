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

## Solution: Load-on-Demand Strategy

### 1. **Dataset Loading Functions**

#### `loadCurrentDataset()`
- Loads only the currently selected dataset
- Checks if dataset is already loaded before fetching
- Used for initial page load and dataset switching

#### `loadComparisonDatasets()`
- Loads both ChatGPT and Gemini datasets only when comparison mode is activated
- Loads missing datasets in parallel
- Only triggered when user switches to comparison view

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
- Instant switching between cached datasets
- Loading indicators for new data
- Progressive enhancement approach

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

The lazy loading is now automatic:

1. **Default behavior**: Only loads the selected dataset
2. **Dataset switching**: Loads new dataset if not cached
3. **Comparison mode**: Loads both datasets when comparison view is activated
4. **Caching**: Previously loaded datasets remain in memory

## Monitoring

To monitor the improvements:
- Check Network tab in DevTools
- Initial page load should show only one JSON file
- Additional datasets load only when needed
- Total data transfer reduced by ~50% for typical usage 