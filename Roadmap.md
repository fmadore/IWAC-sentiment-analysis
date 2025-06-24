Comprehensive Roadmap: Multi-Dataset Support & Comparison Features
Overview
This roadmap outlines the implementation of dataset selection (ChatGPT vs Gemini) and comparison capabilities for your IWAC sentiment analysis visualization app, maintaining the Cerberus theme and modular architecture.
Phase 1: Dataset Management Infrastructure
1.1 Enhanced Store System
File: src/lib/stores.ts
App

// New stores for dataset management
export const availableDatasets = writable<DatasetOption[]>([
  { id: 'chatgpt', name: 'ChatGPT Analysis', file: '/data/iwac_articles_chatgpt.json' },
  { id: 'gemini', name: 'Gemini Analysis', file: '/data/iwac_articles_gemini.json' }
]);

export const selectedDataset = writable<string>('chatgpt');
export const comparisonMode = writable<boolean>(false);
export const comparisonDatasets = writable<ComparisonData | null>(null);

// Store for discrepancy filters
export const discrepancyFilters = writable<DiscrepancyFilter>({
  minDifference: 0,
  maxDifference: 5,
  dimensions: ['polarity', 'subjectivity', 'centrality']
});

1.2 Enhanced Type Definitions
File: src/lib/types/data.ts

export interface DatasetOption {
  id: string;
  name: string;
  file: string;
  icon?: string;
  color?: string;
}

export interface ComparisonData {
  article: Article;
  chatgpt: SentimentAnalysis | null;
  gemini: SentimentAnalysis | null;
  discrepancies: DiscrepancyInfo;
}

export interface DiscrepancyInfo {
  polarityDiff: number;
  subjectivityDiff: number;
  centralityDiff: number;
  totalDiff: number;
  hasConflict: boolean;
}

export interface DiscrepancyFilter {
  minDifference: number;
  maxDifference: number;
  dimensions: ('polarity' | 'subjectivity' | 'centrality')[];
}

Phase 2: UI Components
2.1 Dataset Picker Component
File: src/lib/components/ui/DatasetPicker.svelte

<script lang="ts">
  import { selectedDataset, availableDatasets, comparisonMode } from '$lib/stores';
  import { t } from '$lib/i18n';
  import DatabaseIcon from '@lucide/svelte/icons/database';
  import CompareIcon from '@lucide/svelte/icons/git-compare';
</script>

<div class="dataset-picker">
  <div class="picker-container glass-medium">
    <div class="picker-header">
      <DatabaseIcon size={18} />
      <span class="picker-label">{$t.datasets.selectModel}</span>
    </div>
    
    <div class="dataset-options">
      {#each $availableDatasets as dataset}
        <button
          class="dataset-option {$selectedDataset === dataset.id ? 'active' : ''}"
          onclick={() => selectedDataset.set(dataset.id)}
          disabled={$comparisonMode}
        >
          <span class="dataset-icon">{dataset.id === 'chatgpt' ? '🤖' : '✨'}</span>
          <span class="dataset-name">{dataset.name}</span>
        </button>
      {/each}
    </div>
    
    <div class="comparison-toggle">
      <button
        class="btn btn-sm {$comparisonMode ? 'variant-filled-primary' : 'variant-soft-primary'}"
        onclick={() => comparisonMode.update(v => !v)}
      >
        <CompareIcon size={16} />
        <span>{$t.datasets.comparisonMode}</span>
      </button>
    </div>
  </div>
</div>

2.2 Update AppHeader
Add the DatasetPicker to the header for easy access:

<div class="header-content">
  <div class="brand-section">...</div>
  <div class="center-section">
    <DatasetPicker />
  </div>
  <div class="actions-section">
    <LanguageSwitcher />
    <button class="fullscreen-btn">...</button>
  </div>
</div>

Phase 3: Comparison Mode
3.1 Comparison View Component
File: src/lib/components/ComparisonView.svelte

<script lang="ts">
  import { filteredComparisons, discrepancyFilters } from '$lib/stores';
  import DiscrepancyFilter from './ui/DiscrepancyFilter.svelte';
  import ComparisonTable from './ComparisonTable.svelte';
  import ComparisonStats from './ComparisonStats.svelte';
  import { t } from '$lib/i18n';
</script>

<div class="comparison-view">
  <!-- Stats Overview -->
  <div class="stats-section mb-6">
    <ComparisonStats />
  </div>
  
  <!-- Filters -->
  <div class="filters-section mb-6">
    <DiscrepancyFilter />
  </div>
  
  <!-- Comparison Table/Cards -->
  <div class="comparison-content">
    <ComparisonTable />
  </div>
</div>

3.2 Discrepancy Filter Component
File: src/lib/components/ui/DiscrepancyFilter.svelte

<script lang="ts">
  import { discrepancyFilters } from '$lib/stores';
  import { t } from '$lib/i18n';
  
  let minDiff = $state(0);
  let maxDiff = $state(5);
  let selectedDimensions = $state(['polarity', 'subjectivity', 'centrality']);
</script>

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white">{$t.comparison.filterByDiscrepancy}</h3>
  
  <!-- Difference Range Slider -->
  <div class="mb-4">
    <label class="text-sm text-white/80 mb-2 block">
      {$t.comparison.differenceRange}: {minDiff} - {maxDiff}
    </label>
    <div class="range-slider">
      <input
        type="range"
        min="0"
        max="5"
        bind:value={minDiff}
        class="slider"
      />
      <input
        type="range"
        min="0"
        max="5"
        bind:value={maxDiff}
        class="slider"
      />
    </div>
  </div>
  
  <!-- Quick Filters -->
  <div class="quick-filters mb-4">
    <span class="text-sm text-white/60 mb-2 block">{$t.comparison.quickFilters}:</span>
    <div class="flex flex-wrap gap-2">
      <button class="chip variant-soft-primary" onclick={() => setRange(1, 1)}>
        1 {$t.comparison.pointDifference}
      </button>
      <button class="chip variant-soft-primary" onclick={() => setRange(2, 2)}>
        2 {$t.comparison.pointsDifference}
      </button>
      <button class="chip variant-soft-primary" onclick={() => setRange(3, 5)}>
        3+ {$t.comparison.pointsDifference}
      </button>
    </div>
  </div>
  
  <!-- Dimension Filters -->
  <div class="dimension-filters">
    <span class="text-sm text-white/60 mb-2 block">{$t.comparison.compareDimensions}:</span>
    <div class="flex flex-wrap gap-2">
      {#each ['polarity', 'subjectivity', 'centrality'] as dimension}
        <button
          class="chip {selectedDimensions.includes(dimension) ? 'hover-glow' : 'variant-soft-surface'}"
          onclick={() => toggleDimension(dimension)}
        >
          {$t.analysis[dimension + 'Section']}
        </button>
      {/each}
    </div>
  </div>
</div>

3.3 Comparison Table Component
File: src/lib/components/ComparisonTable.svelte

<script lang="ts">
  import { filteredComparisons } from '$lib/stores';
  import { t } from '$lib/i18n';
  import ComparisonRow from './ComparisonRow.svelte';
  
  let viewMode = $state<'table' | 'cards'>('table');
  let sortBy = $state<'discrepancy' | 'date' | 'title'>('discrepancy');
</script>

<div class="comparison-table-container">
  <!-- View Mode Toggle -->
  <div class="view-controls mb-4">
    <button
      class="btn btn-sm {viewMode === 'table' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => viewMode = 'table'}
    >
      📊 {$t.common.tableView}
    </button>
    <button
      class="btn btn-sm {viewMode === 'cards' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => viewMode = 'cards'}
    >
      🎴 {$t.common.cardView}
    </button>
  </div>
  
  {#if viewMode === 'table'}
    <div class="table-container card variant-glass">
      <table class="table">
        <thead>
          <tr>
            <th>{$t.table.articleTitle}</th>
            <th colspan="2">{$t.comparison.polarity}</th>
            <th colspan="2">{$t.comparison.subjectivity}</th>
            <th colspan="2">{$t.comparison.centrality}</th>
            <th>{$t.comparison.totalDiscrepancy}</th>
          </tr>
          <tr class="sub-header">
            <th></th>
            <th>ChatGPT</th>
            <th>Gemini</th>
            <th>ChatGPT</th>
            <th>Gemini</th>
            <th>ChatGPT</th>
            <th>Gemini</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each $filteredComparisons as comparison}
            <ComparisonRow {comparison} />
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="cards-grid">
      {#each $filteredComparisons as comparison}
        <ComparisonCard {comparison} />
      {/each}
    </div>
  {/if}
</div>

Phase 4: Enhanced Features
4.1 Comparison Statistics Component
File: src/lib/components/ComparisonStats.svelte

<script lang="ts">
  import { comparisonStatistics } from '$lib/stores';
  import { t } from '$lib/i18n';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
</script>

<div class="stats-grid">
  <div class="stat-card card variant-glass p-4">
    <div class="stat-header">
      <AlertCircleIcon size={20} class="text-yellow-400" />
      <span class="stat-label">{$t.comparison.totalDiscrepancies}</span>
    </div>
    <div class="stat-value">{$comparisonStatistics.totalDiscrepancies}</div>
    <div class="stat-detail">{$t.comparison.articlesWithDifferences}</div>
  </div>
  
  <div class="stat-card card variant-glass p-4">
    <div class="stat-header">
      <TrendingUpIcon size={20} class="text-blue-400" />
      <span class="stat-label">{$t.comparison.averageDiscrepancy}</span>
    </div>
    <div class="stat-value">{$comparisonStatistics.averageDiscrepancy.toFixed(2)}</div>
    <div class="stat-detail">{$t.comparison.pointsPerArticle}</div>
  </div>
  
  <!-- Add more statistics cards -->
</div>

4.2 URL State Management Update
File: src/lib/urlState.ts
Add support for dataset selection and comparison mode:

export function getUrlState(): URLState {
  const params = new URLSearchParams(window.location.search);
  
  return {
    // ... existing code ...
    dataset: params.get('dataset') || 'chatgpt',
    comparisonMode: params.get('compare') === 'true',
    discrepancyMin: parseInt(params.get('diffMin') || '0'),
    discrepancyMax: parseInt(params.get('diffMax') || '5'),
  };
}

## Implementation Timeline

### Week 1: Foundation ✅
- [x] Update stores with dataset management
- [x] Create enhanced type definitions
- [x] Implement dataset loading logic
- [x] Add URL state persistence

**Phase 1 Complete!** All foundational features are now implemented:
- Enhanced stores with dataset management
- Type definitions for comparison features
- Dataset loading system that loads both ChatGPT and Gemini datasets
- URL state persistence for dataset selection and comparison mode

### Week 2: UI Components ✅
- [x] Create DatasetPicker component
- [x] Update AppHeader integration
- [x] Add dataset badges to existing views
- [x] Update all visualizations for dataset switching

**Phase 2 Complete!** All UI components have been updated:
- Created DatasetPicker component with glassmorphism design
- Integrated DatasetPicker into AppHeader 
- Created reusable DatasetBadge component
- Added DatasetBadge to all 6 visualization components
- Added DatasetBadge to ArticleTable component
- All components now display the current dataset context

### Week 3: Comparison Mode ✅
- [x] Implement comparison data structures
- [x] Create ComparisonView component
- [x] Build DiscrepancyFilter component
- [x] Develop ComparisonTable with sorting

**Phase 3 Complete!** Comparison mode is now fully functional:
- Created comprehensive comparison data structures with discrepancy calculations
- Built ComparisonView as the main comparison interface
- Implemented DiscrepancyFilter with range sliders and quick filters
- Developed ComparisonTable with both table and card views
- Added sorting by title, date, and discrepancy level
- Integrated comparison mode into main navigation
- Mobile-responsive design with automatic view switching

### Week 4: Polish & Enhancement
- [ ] Add comparison statistics
- [ ] Implement CSV export for comparisons
- [ ] Create mobile-responsive views
- [ ] Add visual difference indicators
Key Design Principles
Modular Architecture: Each component is self-contained and reusable
Cerberus Theme: Maintain glassmorphism effects and dark theme aesthetics
Responsive Design: Mobile-first approach for all new components
Performance: Lazy load datasets and use derived stores for filtering
Accessibility: ARIA labels and keyboard navigation support
Internationalization: All new strings added to translation files
Next Steps
Start with Phase 1 to establish the data foundation
Incrementally add UI components
Test each phase thoroughly before moving to the next
Gather user feedback on comparison features
Optimize performance for large datasets
This roadmap provides a structured approach to adding multi-dataset support and comparison features while maintaining the app's existing design system and user experience.