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
│   ├── ArticleDetailModal.svelte  # Full-screen modal for article details
│   ├── ComparisonDetailModal.svelte # NEW: Full-screen modal for comparison details
│   ├── DropdownMenu.svelte        # Reusable dropdown menu
│   ├── FilterCard.svelte
│   ├── FilterChip.svelte
│   ├── FullScreenModal.svelte     # NEW: Base full-screen modal wrapper
│   ├── GlassCard.svelte
│   ├── LoadingState.svelte        # Loading skeleton component
│   ├── SearchInput.svelte         # Glass morphism search input
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
| `DropdownMenu.svelte` | Reusable dropdown with glass morphism, custom triggers/items | ✅ Complete |
| `FilterCard.svelte` | Glass morphism wrapper for filter sections | ✅ Complete |
| `FilterChip.svelte` | Selectable toggle button with semantic variants | ✅ Complete |
| `GlassCard.svelte` | Generic glass morphism container | ✅ Complete |
| `LoadingState.svelte` | Loading skeleton with customizable message | ✅ Complete |
| `SearchInput.svelte` | Glass morphism search input with clear button | ✅ Complete |
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

## ✅ Phase 5: Large Component Refactoring (COMPLETE)

Refactored `AnalysisInfo.svelte` and `ComparisonDetail.svelte` by extracting reusable components.

### New Components Created

| Component | Location | Purpose | Lines |
|-----------|----------|---------|-------|
| `AccordionItem.svelte` | `common/` | Reusable accordion with data-state styling, animation, responsive design | ~120 |
| `ComparisonPanel.svelte` | `common/` | Side-by-side ChatGPT vs Gemini comparison for sentiment dimensions | ~115 |
| `ArbiterSection.svelte` | `common/` | Arbiter (Gemini 3 Pro) verdict display with collapsible header | ~415 |

### Before/After Comparison

**AnalysisInfo.svelte:**
- Before: 1,026 lines
- After: ~590 lines (43% reduction)
- Uses AccordionItem for 5 accordion sections

**ComparisonDetail.svelte:**
- Before: 866 lines
- After: ~335 lines (61% reduction)
- Uses ComparisonPanel for 3 dimension comparisons
- Uses ArbiterSection for arbiter verdict

### AccordionItem Component

Extracted the repeated accordion pattern with:
- `data-state` styling (active/inactive)
- SlideDown animation with CSS `@keyframes`
- Responsive design with mobile optimizations
- Reduced motion support

```svelte
<AccordionItem 
  title={$t.analysis.polaritySection}
  open={openSections.includes('polarity')}
  onToggle={() => toggleSection('polarity')}
>
  <!-- Content -->
</AccordionItem>
```

### ComparisonPanel Component

Extracted the side-by-side ChatGPT vs Gemini comparison:

```svelte
<ComparisonPanel 
  dimension="polarity"
  chatgptValue={comparison.chatgpt?.polarite}
  chatgptJustification={comparison.chatgpt?.polarite_justification}
  geminiValue={comparison.gemini?.polarite}
  geminiJustification={comparison.gemini?.polarite_justification}
  borderColorChatGPT="border-l-purple-400/50"
  borderColorGemini="border-l-purple-400/50"
/>
```

### ArbiterSection Component

Self-contained arbiter verdict display with:
- Fetches arbiter data internally via stores
- Collapsible header with toggle
- Overall verdict display
- Per-dimension verdict panels (polarity, subjectivity, centrality)
- Blind assignment decoding
- Loading and empty states

```svelte
<ArbiterSection articleId={article['o:id']} />
```

### Updated Barrel Exports

`components/common/index.ts` now exports:
- `AccordionItem`
- `ComparisonPanel`
- `ArbiterSection`

---

## 🔲 Phase 6: Optional Enhancements (LOW PRIORITY)

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
| `DatasetPicker.svelte` | Uses DropdownMenu | ✅ Complete |
| `LanguageSwitcher.svelte` | Uses DropdownMenu | ✅ Complete |

---

## Barrel Exports

### ✅ All Complete

| File | Exports |
|------|---------|
| `components/common/index.ts` | ArticleDetailModal, DropdownMenu, FilterCard, FilterChip, GlassCard, LoadingState, SearchInput, SentimentBadge |
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

1. ~~**Create DropdownMenu component**~~ ✅ Complete
   - Extracted pattern from DatasetPicker and LanguageSwitcher
   - Reusable dropdown with glass morphism styling
   - Supports custom trigger and item renderers via snippets

2. ~~**Create SearchInput component**~~ ✅ Complete
   - Extracted from JournalFilter
   - Glass morphism styled search with clear button
   - Supports size variants and search icon

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
│   ├── DropdownMenu.svelte   # Reusable dropdown with glass morphism
│   ├── FilterCard.svelte     # Glass card wrapper for filters
│   ├── FilterChip.svelte     # Selectable chip button
│   ├── GlassCard.svelte      # Generic glass morphism card
│   ├── LoadingState.svelte   # Loading skeleton component
│   ├── SearchInput.svelte    # Glass morphism search input
│   ├── SentimentBadge.svelte # Polarity/subjectivity/centrality badges
│   └── index.ts
├── filters/                   # All filter components
│   ├── CountryFilter.svelte
│   ├── JournalFilter.svelte  # Uses SearchInput
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
│   ├── DatasetPicker.svelte   # Uses DropdownMenu
│   ├── DatasetBadge.svelte
│   ├── LanguageSwitcher.svelte # Uses DropdownMenu
│   ├── ChartCard.svelte      # Enhanced with class prop
│   ├── CSVExportButton.svelte
│   ├── ComparisonCSVExportButton.svelte
│   └── index.ts
├── SEOHead.svelte             # Utility components
├── PWAManager.svelte
└── index.ts                   # Main barrel export
```

---

## ✅ Phase 6: UI Component Refactoring (COMPLETE)

### DropdownMenu Component

Created a reusable dropdown component that consolidates the shared patterns from `DatasetPicker` and `LanguageSwitcher`.

**Features:**
- Glass morphism styling with blur effects
- Mobile-optimized touch handling
- Support for custom trigger content via snippets
- Support for custom item rendering via snippets
- Configurable menu/button widths and z-index
- Accessibility support (aria attributes, keyboard navigation)
- Reduced motion and high contrast mode support

**Usage Example:**
```svelte
<script lang="ts">
  import { DropdownMenu } from '$lib/components/common';
</script>

<DropdownMenu
  items={menuItems}
  selectedId={selected}
  onSelect={handleSelect}
  sectionLabel="Options"
>
  {#snippet trigger()}
    <span>Custom trigger content</span>
  {/snippet}
  
  {#snippet itemRenderer({ item, isSelected })}
    <img src={item.data.logo} alt="" />
    <span>{item.label}</span>
    {#if isSelected}<span>✓</span>{/if}
  {/snippet}
</DropdownMenu>
```

### SearchInput Component

Created a reusable search input component extracted from `JournalFilter`.

**Features:**
- Glass morphism styling
- Clear button with X icon
- Optional search icon on the left
- Size variants (`sm`, `md`)
- Bindable value with `$bindable()`
- Escape key to clear
- Responsive design

**Usage Example:**
```svelte
<script lang="ts">
  import { SearchInput } from '$lib/components/common';
  let searchTerm = $state('');
</script>

<SearchInput
  bind:value={searchTerm}
  placeholder="Search..."
  showSearchIcon
/>
```

### Refactored Components

| Component | Before (lines) | After (lines) | Reduction |
|-----------|----------------|---------------|-----------|
| `DatasetPicker.svelte` | 387 | 107 | ~72% |
| `LanguageSwitcher.svelte` | 320 | 77 | ~76% |
| `JournalFilter.svelte` | 221 | 149 | ~33% |

---

## CSS Reduction Summary

| Component | Lines Removed | Notes |
|-----------|---------------|-------|
| CountryFilter | ~60 | Full filter-card + clear-btn styles |
| PolarityFilter | ~60 | Full filter-card + clear-btn styles |
| SubjectivityFilter | ~50 | Kept legend-specific styles |
| CentralityFilter | ~60 | Full filter-card + clear-btn styles |
| JournalFilter | ~50 | Search input styles moved to SearchInput |
| DatasetPicker | ~270 | Dropdown styles moved to DropdownMenu |
| LanguageSwitcher | ~200 | Dropdown styles moved to DropdownMenu |
| +page.svelte | ~370 | Modal, loading, view content, chart card styles |
| **Total** | **~1120** | Significant codebase reduction |

---

## How to Continue Refactoring

### Step 1: Identify Duplicate Patterns

Look for components with:
- Same `.filter-card` CSS
- Same badge/chip styling patterns
- Same glass morphism backgrounds
- Same hover/transition effects
- Same dropdown menu patterns

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

## ✅ Phase 7: CSS Variable Centralization (COMPLETE)

### New CSS Custom Properties Added

Added centralized CSS variables for additional semantic colors in `app.postcss`:

#### Arbiter Colors (AI Judge/Evaluator)
```css
--sentiment-arbiter: #F59E0B;           /* Primary amber */
--sentiment-arbiter-light: #FBBF24;     /* Light amber */
--sentiment-arbiter-bg                   /* 15% opacity background */
--sentiment-arbiter-border               /* 30% opacity border */
--sentiment-arbiter-icon-bg              /* Gradient for icons */
```

#### Discrepancy Colors
```css
--sentiment-discrepancy: #EF4444;       /* Primary red */
--sentiment-discrepancy-light: #F97316; /* Orange accent */
--sentiment-discrepancy-bg               /* 15% opacity background */
--sentiment-discrepancy-border           /* 30% opacity border */
```

#### Gradient Definitions
```css
--gradient-extreme    /* Orange/gold gradient for extreme analysis */
--gradient-header     /* Blue/purple gradient for headers */
--gradient-comparison /* Blue/purple/pink gradient for comparison */
```

### Chart Theme Improvements

Added `getAxisPointerConfig()` function to `chartTheme.ts` for consistent tooltip axis pointer styling across all line/area charts:

```typescript
export function getAxisPointerConfig() {
  return {
    type: 'cross' as const,
    label: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.9)'
    },
    crossStyle: {
      color: 'rgba(255, 255, 255, 0.3)'
    }
  };
}
```

### Components Updated

| Component | Changes | Lines Saved |
|-----------|---------|-------------|
| `ComparisonDetail.svelte` | Use CSS variables for arbiter/discrepancy colors | ~20 lines |
| `ComparisonTable.svelte` | Use `--gradient-comparison` variable | ~5 lines |
| `ViewContent.svelte` | Use `--gradient-extreme` variable | ~5 lines |
| `VolumeChart.svelte` | Use `getAxisPointerConfig()` | ~10 lines |
| `SentimentTrendsChart.svelte` | Use `getAxisPointerConfig()` | ~10 lines |

---

## ✅ Phase 8: Full-Screen Detail Components (COMPLETE)

### Overview

Refactored article and comparison detail views from centered modals/inline views to immersive full-screen experiences with consistent glass morphism styling.

### New Components

#### `FullScreenModal.svelte` (common/)

A reusable full-screen modal wrapper component with:

- **Full viewport coverage** with glass morphism backdrop (95% opacity, xl blur)
- **Responsive header** with accent line variants (primary, comparison, extreme, arbiter)
- **Back button** with arrow icon and optional text
- **Title and subtitle** with optional header icon
- **Header actions slot** for badges, buttons, etc.
- **Scrollable content area** with custom scrollbar
- **Keyboard navigation** (Escape to close)
- **Reduced motion support**

```svelte
<FullScreenModal 
  open={showModal}
  onClose={() => showModal = false}
  title="Article Details"
  subtitle="Journal • Date"
  accentVariant="primary"
>
  {#snippet headerIcon()}
    <NewspaperIcon size={20} />
  {/snippet}
  
  <YourContent />
</FullScreenModal>
```

**Accent Variants:**
| Variant | Color | Use Case |
|---------|-------|----------|
| `primary` | Blue/purple gradient | Article details |
| `comparison` | Blue/purple/pink gradient | Comparison details |
| `extreme` | Orange/gold gradient | Extreme analysis |
| `arbiter` | Amber gradient | Arbiter verdicts |

#### `ComparisonDetailModal.svelte` (common/)

Full-screen modal for comparison details:
- Uses `FullScreenModal` with `comparison` accent variant
- Shows comparison icon in header
- Displays discrepancy badge when conflicts exist
- Wraps `ComparisonDetail` content component

### Components Refactored

| Component | Before | After |
|-----------|--------|-------|
| `ArticleDetailModal` | Centered modal (900px max) | Full-screen using `FullScreenModal` |
| `ComparisonView` | Inline detail replaces list | Modal-based using `ComparisonDetailModal` |

### Barrel Export Updates

Added to `common/index.ts`:
```typescript
export { default as ComparisonDetailModal } from './ComparisonDetailModal.svelte';
export { default as FullScreenModal } from './FullScreenModal.svelte';
```

### UX Improvements

1. **Immersive Experience**: Full-screen modals provide better focus on content
2. **Consistent Navigation**: Back button always visible in header
3. **Better Mobile Support**: Full viewport usage on all screen sizes
4. **Context Preservation**: Comparison list remains visible behind modal

---

## Notes

- All new components follow Svelte 5 runes patterns (`$props`, `$state`, `$derived`, `$bindable`)
- CSS uses centralized variables from `app.postcss`
- Semantic color variants match CSS custom properties (`--sentiment-polarity-*`, etc.)
- Main page reduced from 648 lines to 281 lines (~57% reduction)
- DatasetPicker and LanguageSwitcher reduced by ~70%+ using DropdownMenu
- JournalFilter reduced by ~33% using SearchInput
- Total codebase reduction: ~1120 lines of CSS/component code
- **New:** Arbiter, discrepancy, and gradient colors centralized in CSS variables
- **New:** Chart axis pointer configuration centralized in `chartTheme.ts`
- **New:** Full-screen modal system for article and comparison details
- Documentation updated in `.github/copilot-instructions.md`

---

*Last updated: December 24, 2025*
