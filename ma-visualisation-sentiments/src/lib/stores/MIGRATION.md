# Component Migration to Runes-based State

Track progress of migrating components from legacy store syntax (`$store`) to new runes-based state accessors (`filterState.countryFilters`, `uiState.sidebarExpanded`, etc.).

## Migration Pattern

**Before (legacy):**
```svelte
<script lang="ts">
  import { countryFilters } from '$lib/stores';
  
  $effect(() => {
    const countries = $countryFilters;  // Auto-subscription
  });
  
  countryFilters.set(['Benin']);  // Legacy .set()
</script>
```

**After (runes):**
```svelte
<script lang="ts">
  import { filterState } from '$lib/stores';
  
  // Direct property access (reactive in .svelte files)
  const countries = filterState.countryFilters;
  
  filterState.setCountryFilters(['Benin']);  // Method call
</script>
```

---

## Filters (7 components)

| Component | Legacy Imports | New State | Status |
|-----------|----------------|-----------|--------|
| [CountryFilter.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/filters/CountryFilter.svelte) | `currentDatasetArticles`, `countryFilters` | `articleState`, `filterState` | [ ] |
| [JournalFilter.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/filters/JournalFilter.svelte) | `availableJournals`, `journalFilters` | `articleState`, `filterState` | [ ] |
| [PolarityFilter.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/filters/PolarityFilter.svelte) | `polarityFilters` | `filterState` | [ ] |
| [SubjectivityFilter.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/filters/SubjectivityFilter.svelte) | `subjectivityFilters` | `filterState` | [ ] |
| [CentralityFilter.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/filters/CentralityFilter.svelte) | `centralityFilters` | `filterState` | [ ] |
| [DiscrepancyFilter.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/filters/DiscrepancyFilter.svelte) | `discrepancyFilters` | `filterState` | [ ] |
| [SentimentCriteriaFilter.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/filters/SentimentCriteriaFilter.svelte) | `polarityFilters`, `subjectivityFilters` | `filterState` | [ ] |
| [ClearFiltersButton.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/filters/ClearFiltersButton.svelte) | multiple filters | `filterState` | [ ] |

---

## UI Components (5 components)

| Component | Legacy Imports | New State | Status |
|-----------|----------------|-----------|--------|
| [SidebarNav.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/layout/SidebarNav.svelte) | `sidebarExpanded`, `activeView`, `mobileMenuOpen` | `uiState` | [ ] |
| [AppHeader.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/layout/AppHeader.svelte) | `mobileMenuOpen` | `uiState` | [ ] |
| [DatasetPicker.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/ui/DatasetPicker.svelte) | `selectedDataset`, `availableDatasets` | `datasetState` | [ ] |
| [DatasetBadge.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/ui/DatasetBadge.svelte) | `selectedDataset`, `availableDatasets`, `comparisonMode` | `datasetState` | [ ] |
| [ModelPairPicker.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/ui/ModelPairPicker.svelte) | `comparisonPair`, `availableDatasets` | `datasetState` | [ ] |

---

## Data Display (6 components)

| Component | Legacy Imports | New State | Status |
|-----------|----------------|-----------|--------|
| [ArticleTable.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/data-display/ArticleTable.svelte) | `filteredArticles`, `selectedArticle` | `articleState` | [ ] |
| [AnalysisInfo.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/data-display/AnalysisInfo.svelte) | `selectedDataset`, `comparisonMode`, `datasetArticles` | `datasetState`, `articleState` | [ ] |
| [ComparisonView.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/data-display/ComparisonView.svelte) | `filteredComparisons`, `comparisonMode`, `selectedComparison`, etc. | `comparisonState`, `datasetState` | [ ] |
| [ComparisonTable.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/data-display/ComparisonTable.svelte) | `filteredComparisons`, `selectedComparison`, `availableDatasets` | `comparisonState`, `datasetState` | [ ] |
| [ComparisonStats.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/data-display/ComparisonStats.svelte) | `comparisonStatistics`, `arbiterStatistics`, etc. | `comparisonState`, `arbiterState` | [ ] |
| [ComparisonDetail.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/data-display/ComparisonDetail.svelte) | `availableDatasets`, `getArbiterForArticle` | `datasetState`, `arbiterState` | [ ] |

---

## Visualization & Other (4 components)

| Component | Legacy Imports | New State | Status |
|-----------|----------------|-----------|--------|
| [KeywordFrequencyChart.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/viz/KeywordFrequencyChart.svelte) | `currentExtremeAnalysis`, `extremeAnalysisData`, etc. | `extremeState`, `datasetState` | [ ] |
| [CSVExportButton.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/ui/CSVExportButton.svelte) | `filteredArticles` | `articleState` | [ ] |
| [ComparisonCSVExportButton.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/ui/ComparisonCSVExportButton.svelte) | `filteredComparisons`, `availableDatasets` | `comparisonState`, `datasetState` | [ ] |
| [ArbiterSection.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/lib/components/common/ArbiterSection.svelte) | `arbiterEvaluations`, `arbiterStatistics`, etc. | `arbiterState` | [ ] |

---

## Routes (1 file)

| Component | Legacy Imports | New State | Status |
|-----------|----------------|-----------|--------|
| [+layout.svelte](file:///c:/Users/frede/GitHub/IWAC-sentiment-analysis/ma-visualisation-sentiments/src/routes/+layout.svelte) | `sidebarExpanded` | `uiState` | [ ] |

---

## Summary

| Category | Total | Migrated |
|----------|-------|----------|
| Filters | 8 | 0 |
| UI | 5 | 0 |
| Data Display | 6 | 0 |
| Viz & Other | 4 | 0 |
| Routes | 1 | 0 |
| **Total** | **24** | **0** |
