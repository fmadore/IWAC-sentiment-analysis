# Component Refactoring Guide

This document tracks the ongoing component refactoring and reorganization effort for the IWAC Sentiment Analysis visualization app.

## Goals

1. **Reduce code duplication** - Extract repeated patterns into reusable components ✅
2. **Improve organization** - Logical folder structure with barrel exports ✅
3. **Consistent styling** - Centralized glass morphism and sentiment color patterns ✅
4. **Better maintainability** - Single source of truth for common UI patterns ✅
5. **Cleaner main page** - Extract view logic into dedicated components ✅

---

## ✅ Phase 1: Folder Reorganization (COMPLETE)

### New Structure

```
src/lib/components/
├── common/           # ✅ Base reusable components
│   ├── ArticleDetailModal.svelte  # NEW: Modal for article details
│   ├── FilterCard.svelte
│   ├── FilterChip.svelte
│   ├── GlassCard.svelte
│   ├── LoadingState.svelte        # NEW: Loading skeleton component
│   ├── SentimentBadge.svelte
│   └── index.ts
├── filters/          # ✅ All filter components
│   ├── CountryFilter.svelte
│   ├── JournalFilter.svelte
│   ├── PolarityFilter.svelte
│   ├── SubjectivityFilter.svelte
│   ├── CentralityFilter.svelte
│   ├── DiscrepancyFilter.svelte
│   ├── SentimentCriteriaFilter.svelte
│   ├── ClearFiltersButton.svelte
│   ├── ExtremeAnalysisControls.svelte
│   └── index.ts
├── data-display/     # ✅ Article & comparison views
│   ├── ArticleTable.svelte
│   ├── ArticleDetail.svelte
│   ├── AnalysisInfo.svelte
│   ├── ComparisonView.svelte
│   ├── ComparisonTable.svelte
│   ├── ComparisonDetail.svelte
│   ├── ComparisonStats.svelte
│   └── index.ts
├── layout/           # ✅ Page structure
│   ├── AppHeader.svelte
│   ├── FiltersPanel.svelte
│   ├── NavigationTabs.svelte
│   ├── ViewContent.svelte         # NEW: Main content view switcher
│   └── index.ts
├── viz/              # Charts (unchanged)
│   ├── SentimentChart.svelte
│   ├── SentimentTrendsChart.svelte
│   ├── SubjectivityChart.svelte
│   ├── CorrelationChart.svelte
│   ├── VolumeChart.svelte
│   ├── CentralityHeatmap.svelte
│   ├── KeywordFrequencyChart.svelte
│   └── index.ts
├── ui/               # ✅ General utilities & pickers
│   ├── DatasetPicker.svelte
│   ├── DatasetBadge.svelte
│   ├── LanguageSwitcher.svelte
│   ├── ChartCard.svelte           # Enhanced with class prop
│   ├── CSVExportButton.svelte
│   ├── ComparisonCSVExportButton.svelte
│   └── index.ts
├── PWAManager.svelte
├── SEOHead.svelte
└── index.ts          # Main barrel export
```

---

## ✅ Phase 2: Reusable Components (COMPLETE)

### ✅ Created: `src/lib/components/common/`

| Component | Purpose | Status |
|-----------|---------|--------|
| `ArticleDetailModal.svelte` | Reusable modal for displaying article details | ✅ Complete |
| `FilterCard.svelte` | Glass morphism wrapper for filter sections | ✅ Complete |
| `FilterChip.svelte` | Selectable toggle button with semantic variants | ✅ Complete |
| `GlassCard.svelte` | Generic glass morphism container | ✅ Complete |
| `LoadingState.svelte` | Loading skeleton with customizable message | ✅ Complete |
| `SentimentBadge.svelte` | Display badge for polarity/subjectivity/centrality | ✅ Complete |
| `index.ts` | Barrel export | ✅ Complete |

---

## ✅ Phase 3: Component Refactoring (COMPLETE)

### Filter Components (`src/lib/components/filters/`)

| Component | Uses FilterCard | Uses FilterChip | CSS Removed | Status |
|-----------|-----------------|-----------------|-------------|--------|
| `CountryFilter.svelte` | ✅ | ✅ | ~60 lines | ✅ Complete |
| `PolarityFilter.svelte` | ✅ | ✅ | ~60 lines | ✅ Complete |
| `SubjectivityFilter.svelte` | ✅ | ✅ | ~50 lines | ✅ Complete |
| `CentralityFilter.svelte` | ✅ | ✅ | ~60 lines | ✅ Complete |
| `JournalFilter.svelte` | ✅ | ✅ | ~120 lines | ✅ Complete |
| `DiscrepancyFilter.svelte` | N/A (unique UI) | N/A | - | ✅ N/A |
| `SentimentCriteriaFilter.svelte` | N/A (deprecated) | N/A | - | ⚠️ Deprecated |

### Data Display Components (`src/lib/components/data-display/`)

| Component | Uses SentimentBadge | Uses GlassCard | Status |
|-----------|---------------------|----------------|--------|
| `ArticleDetail.svelte` | ✅ | ❌ | ✅ Complete |
| `ArticleTable.svelte` | ✅ | ❌ | ✅ Complete |
| `ComparisonDetail.svelte` | ✅ | ❌ | ✅ Complete |
| `ComparisonTable.svelte` | ✅ | ❌ | ✅ Complete |
| `ComparisonStats.svelte` | N/A (uses progress bars) | ❌ | ✅ N/A |
| `AnalysisInfo.svelte` | N/A (uses direct CSS classes) | ❌ | ✅ N/A |

---

## ✅ Phase 4: Main Page Refactoring (COMPLETE)

The main `+page.svelte` component was refactored to extract reusable components, reducing the file from **648 lines to 281 lines** (~57% reduction).

### Extracted Components

| Component | Location | Purpose | Lines Saved |
|-----------|----------|---------|-------------|
| `ArticleDetailModal.svelte` | `common/` | Modal dialog for article details with glass morphism | ~100 lines |
| `LoadingState.svelte` | `common/` | Loading skeleton with customizable message | ~25 lines |
| `ViewContent.svelte` | `layout/` | View switcher (charts, table, comparison, extremes) | ~80 lines |
| `ChartCard.svelte` | `ui/` | Enhanced with `class` prop for flexibility | ~50 lines |

### Before/After Comparison

**Before refactoring:**
- `+page.svelte`: 648 lines
- Mixed concerns: view logic, modal rendering, loading states, styling

**After refactoring:**
- `+page.svelte`: 281 lines (57% reduction)
- Clean separation: page orchestration only
- Reusable: Modal, loading, and view components can be reused elsewhere

### New Component Usage

```svelte
<!-- Article Details Modal -->
<ArticleDetailModal 
  article={detailedArticle} 
  open={showDetailsSidebar} 
  onClose={closeDetails} 
/>

<!-- Loading State -->
{#if $isLoadingDataset}
  <LoadingState />
{/if}

<!-- View Content -->
<ViewContent
  {activeView}
  {selectedCategory}
  {selectedKeywordType}
  {showTopN}
  onShowDetails={handleShowDetails}
/>
```

---

## 🔲 Phase 5: Optional Enhancements (LOW PRIORITY)

### ✅ UI Improvements (COMPLETE)

#### SVG Logo Integration

Replaced emoji icons (🤖, ✨) with actual SVG logos for ChatGPT and Gemini:

**Files Modified:**
- `src/lib/types/data.ts` - Added `logo` field to `DatasetOption` interface
- `src/lib/stores.ts` - Updated `availableDatasets` to use SVG paths
- `src/lib/components/ui/DatasetPicker.svelte` - Renders `<img>` with logo path
- `src/lib/components/ui/DatasetBadge.svelte` - Renders logo with size variations

**Before:**
```typescript
{ id: 'chatgpt', name: 'ChatGPT', file: '...', icon: '🤖', color: '#10a37f' }
{ id: 'gemini', name: 'Gemini', file: '...', icon: '✨', color: '#8e75b2' }
```

**After:**
```typescript
{ id: 'chatgpt', name: 'ChatGPT', file: '...', logo: '/logo/ChatGPT_logo.svg', color: '#10a37f' }
{ id: 'gemini', name: 'Gemini', file: '...', logo: '/logo/Gemini_logo.svg', color: '#8e75b2' }
```

### Visualization Components (`src/lib/components/viz/`)

These components have chart-specific styling and low duplication. Refactoring is optional.

| Component | Uses ChartCard/GlassCard | Status |
|-----------|--------------------------|--------|
| `SentimentChart.svelte` | ❌ | 🔲 Optional |
| `SentimentTrendsChart.svelte` | ❌ | 🔲 Optional |
| `SubjectivityChart.svelte` | ❌ | 🔲 Optional |
| `CorrelationChart.svelte` | ❌ | 🔲 Optional |
| `VolumeChart.svelte` | ❌ | 🔲 Optional |
| `CentralityHeatmap.svelte` | ❌ | 🔲 Optional |
| `KeywordFrequencyChart.svelte` | ❌ | 🔲 Optional |

### UI Components (`src/lib/components/ui/`)

| Component | Needs Refactoring | Status |
|-----------|-------------------|--------|
| `ChartCard.svelte` | May merge with GlassCard | 🔲 Optional |
| `DatasetPicker.svelte` | Extract dropdown pattern | 🔲 TODO |
| `LanguageSwitcher.svelte` | Extract dropdown pattern | 🔲 TODO |

---

## Barrel Exports

### ✅ All Complete

| File | Exports |
|------|---------|
| `components/common/index.ts` | ArticleDetailModal, FilterCard, FilterChip, GlassCard, LoadingState, SentimentBadge |
| `components/filters/index.ts` | All 9 filter components |
| `components/data-display/index.ts` | All 7 data display components |
| `components/layout/index.ts` | AppHeader, FiltersPanel, NavigationTabs, ViewContent |
| `components/viz/index.ts` | All chart components |
| `components/ui/index.ts` | Utilities and pickers |
| `components/index.ts` | Main barrel (re-exports all) |

### Import Pattern

```svelte
<script lang="ts">
  // ✅ Preferred: Use folder-specific barrel exports
  import { ArticleDetailModal, LoadingState, FilterCard } from '$lib/components/common';
  import { CountryFilter, PolarityFilter } from '$lib/components/filters';
  import { ArticleTable, ArticleDetail } from '$lib/components/data-display';
  import { FiltersPanel, NavigationTabs, ViewContent } from '$lib/components/layout';
  import { SentimentChart, VolumeChart } from '$lib/components/viz';
  import { DatasetPicker, CSVExportButton, ChartCard } from '$lib/components/ui';
  
  // ✅ Also valid: Main barrel
  import { FilterCard, SentimentChart, ArticleTable } from '$lib/components';
  
  // ❌ Avoid: Direct file imports
  import FilterCard from '$lib/components/common/FilterCard.svelte';
</script>
```

---

## Future Refactoring Tasks

### ✅ Completed

1. **ArticleDetail.svelte** - Uses SentimentBadge ✅
2. **ArticleTable.svelte** - Uses SentimentBadge ✅
3. **ComparisonDetail.svelte** - Uses SentimentBadge ✅
4. **ComparisonTable.svelte** - Uses SentimentBadge ✅
5. **Main page extraction** - ArticleDetailModal, LoadingState, ViewContent ✅

### Medium Priority

1. **Create DropdownMenu component**
   - Extract pattern from DatasetPicker and LanguageSwitcher
   - Reusable dropdown with glass morphism styling

2. **Create SearchInput component**
   - Extract from JournalFilter
   - Glass morphism styled search with clear button

### Low Priority

3. **Create StatCard component**
   - Extract from ComparisonStats
   - Reusable stat display with icon, value, label

4. **Create TabGroup component**
   - Potentially extract from NavigationTabs
   - Reusable tab navigation pattern
   - Or keep flat structure for simplicity

---

## Component Hierarchy

```
src/lib/components/
├── common/                    # Base reusable components
│   ├── ArticleDetailModal.svelte  # Modal for article details
│   ├── FilterCard.svelte     # Glass card wrapper for filters
│   ├── FilterChip.svelte     # Selectable chip button
│   ├── GlassCard.svelte      # Generic glass morphism card
│   ├── LoadingState.svelte   # Loading skeleton component
│   ├── SentimentBadge.svelte # Polarity/subjectivity/centrality badges
│   └── index.ts
├── filters/                   # All filter components
│   ├── CountryFilter.svelte
│   ├── JournalFilter.svelte
│   ├── PolarityFilter.svelte
│   ├── SubjectivityFilter.svelte
│   ├── CentralityFilter.svelte
│   ├── DiscrepancyFilter.svelte
│   ├── SentimentCriteriaFilter.svelte
│   ├── ClearFiltersButton.svelte
│   ├── ExtremeAnalysisControls.svelte
│   └── index.ts
├── layout/                    # Layout components
│   ├── AppHeader.svelte
│   ├── FiltersPanel.svelte
│   ├── NavigationTabs.svelte
│   ├── ViewContent.svelte    # Main content view switcher
│   └── index.ts
├── data-display/              # Article/comparison display components
│   ├── ArticleTable.svelte
│   ├── ArticleDetail.svelte
│   ├── ComparisonTable.svelte
│   ├── ComparisonDetail.svelte
│   ├── ComparisonStats.svelte
│   ├── ComparisonView.svelte
│   ├── AnalysisInfo.svelte
│   └── index.ts
├── viz/                       # Charts
│   ├── SentimentChart.svelte
│   ├── SentimentTrendsChart.svelte
│   ├── SubjectivityChart.svelte
│   ├── CorrelationChart.svelte
│   ├── VolumeChart.svelte
│   ├── CentralityHeatmap.svelte
│   ├── KeywordFrequencyChart.svelte
│   └── index.ts
├── ui/                        # General UI utilities
│   ├── DatasetPicker.svelte
│   ├── DatasetBadge.svelte
│   ├── LanguageSwitcher.svelte
│   ├── ChartCard.svelte      # Enhanced with class prop
│   ├── CSVExportButton.svelte
│   ├── ComparisonCSVExportButton.svelte
│   └── index.ts
├── SEOHead.svelte             # Utility components
├── PWAManager.svelte
└── index.ts                   # Main barrel export
```

---

## CSS Reduction Summary

| Component | Lines Removed | Notes |
|-----------|---------------|-------|
| CountryFilter | ~60 | Full filter-card + clear-btn styles |
| PolarityFilter | ~60 | Full filter-card + clear-btn styles |
| SubjectivityFilter | ~50 | Kept legend-specific styles |
| CentralityFilter | ~60 | Full filter-card + clear-btn styles |
| +page.svelte | ~370 | Modal, loading, view content, chart card styles |
| **Total** | **~600** | Significant codebase reduction |

---

## How to Continue Refactoring

### Step 1: Identify Duplicate Patterns

Look for components with:
- Same `.filter-card` CSS
- Same badge/chip styling patterns
- Same glass morphism backgrounds
- Same hover/transition effects

### Step 2: Use Existing Common Components

```svelte
<!-- Instead of custom card styling -->
<div class="my-custom-card">...</div>

<!-- Use GlassCard -->
<GlassCard variant="default" hover>...</GlassCard>

<!-- Instead of custom badge styling -->
<span class="polarity-badge {polarityClass}">{value}</span>

<!-- Use SentimentBadge -->
<SentimentBadge type="polarity" value={value} />

<!-- Instead of inline chart card styling -->
<div class="chart-card">...</div>

<!-- Use ChartCard -->
<ChartCard variant="default" class="mb-6">
  <MyChart />
</ChartCard>

<!-- Instead of inline modal code -->
{#if showModal}
  <div class="modal-backdrop">...</div>
{/if}

<!-- Use ArticleDetailModal -->
<ArticleDetailModal article={article} open={showModal} onClose={close} />
```

### Step 3: Test After Each Change

```bash
npm run check  # TypeScript/Svelte validation
npm run dev    # Visual testing
```

---

## Notes

- All new components follow Svelte 5 runes patterns (`$props`, `$state`, `$derived`)
- CSS uses centralized variables from `app.postcss`
- Semantic color variants match CSS custom properties (`--sentiment-polarity-*`, etc.)
- Main page reduced from 648 lines to 281 lines (~57% reduction)
- Documentation updated in `.github/copilot-instructions.md`

---

*Last updated: December 24, 2025*
