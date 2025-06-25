<script lang="ts">
  import { discrepancyFilters } from '$lib/stores';
  import { t } from '$lib/i18n';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import SlidersIcon from '@lucide/svelte/icons/sliders';
  
  let minDiff = $state(0);
  let maxDiff = $state(5);
  let selectedDimensions = $state<string[]>(['polarity', 'subjectivity', 'centrality']);
  let excludeNonApplicable = $state(false);
  
  // Sync with store
  $effect(() => {
    const filters = $discrepancyFilters;
    minDiff = filters.minDifference;
    maxDiff = filters.maxDifference;
    selectedDimensions = [...filters.dimensions];
    excludeNonApplicable = filters.excludeNonApplicable;
  });
  
  function updateFilters() {
    discrepancyFilters.set({
      minDifference: minDiff,
      maxDifference: maxDiff,
      dimensions: selectedDimensions as ('polarity' | 'subjectivity' | 'centrality')[],
      excludeNonApplicable: excludeNonApplicable
    });
  }
  
  function setRange(min: number, max: number) {
    minDiff = min;
    maxDiff = max;
    updateFilters();
  }
  
  function toggleDimension(dimension: string) {
    if (selectedDimensions.includes(dimension)) {
      selectedDimensions = selectedDimensions.filter(d => d !== dimension);
    } else {
      selectedDimensions = [...selectedDimensions, dimension];
    }
    updateFilters();
  }
  
  function resetFilters() {
    minDiff = 0;
    maxDiff = 5;
    selectedDimensions = ['polarity', 'subjectivity', 'centrality'];
    excludeNonApplicable = false;
    updateFilters();
  }

  function toggleExcludeNonApplicable() {
    excludeNonApplicable = !excludeNonApplicable;
    updateFilters();
  }
</script>

<div class="card variant-glass p-4 hover-lift">
  <div class="flex items-center gap-2 mb-4">
    <FilterIcon size={20} class="text-white/80" />
    <h3 class="h4 text-white">{$t.comparison?.filterByDiscrepancy || 'Filter by Discrepancy'}</h3>
  </div>
  
  <!-- Difference Range -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <label class="text-sm text-white/80 flex items-center gap-2">
        <SlidersIcon size={16} />
        {$t.comparison?.differenceRange || 'Difference Range'}: {minDiff} - {maxDiff}
      </label>
      <button
        class="btn btn-sm variant-soft-surface"
        onclick={resetFilters}
      >
        {$t.filters?.reset || 'Reset'}
      </button>
    </div>
    
    <div class="range-container">
      <div class="range-track"></div>
      <div 
        class="range-highlight"
        style="left: {minDiff * 20}%; width: {(maxDiff - minDiff) * 20}%"
      ></div>
      
      <input
        type="range"
        min="0"
        max="5"
        step="1"
        bind:value={minDiff}
        onchange={updateFilters}
        class="range-slider range-min"
      />
      <input
        type="range"
        min="0"
        max="5"
        step="1"
        bind:value={maxDiff}
        onchange={updateFilters}
        class="range-slider range-max"
      />
      
      <!-- Range labels -->
      <div class="range-labels">
        {#each [0, 1, 2, 3, 4, 5] as value}
          <span class="range-label" style="left: {value * 20}%">{value}</span>
        {/each}
      </div>
    </div>
  </div>
  
  <!-- Quick Filters -->
  <div class="mb-4">
    <span class="text-sm text-white/60 mb-2 block">{$t.comparison?.quickFilters || 'Quick Filters'}:</span>
    <div class="flex flex-wrap gap-2">
      <button 
        class="chip variant-soft-primary hover-lift {minDiff === 1 && maxDiff === 1 ? 'ring-2 ring-primary-500' : ''}"
        onclick={() => setRange(1, 1)}
      >
        1 {$t.comparison?.pointDifference || 'point difference'}
      </button>
      <button 
        class="chip variant-soft-primary hover-lift {minDiff === 2 && maxDiff === 2 ? 'ring-2 ring-primary-500' : ''}"
        onclick={() => setRange(2, 2)}
      >
        2 {$t.comparison?.pointsDifference || 'points difference'}
      </button>
      <button 
        class="chip variant-soft-primary hover-lift {minDiff === 3 && maxDiff === 5 ? 'ring-2 ring-primary-500' : ''}"
        onclick={() => setRange(3, 5)}
      >
        3+ {$t.comparison?.pointsDifference || 'points difference'}
      </button>
      <button 
        class="chip variant-soft-warning hover-lift {minDiff === 0 && maxDiff === 5 ? 'ring-2 ring-warning-500' : ''}"
        onclick={() => setRange(0, 5)}
      >
        {$t.common?.all || 'All'}
      </button>
    </div>
  </div>
  
  <!-- Dimension Filters -->
  <div class="mb-4">
    <span class="text-sm text-white/60 mb-2 block">{$t.comparison?.compareDimensions || 'Compare Dimensions'}:</span>
    <div class="flex flex-wrap gap-2">
      <button
        class="chip hover-lift {selectedDimensions.includes('polarity') ? 'variant-filled-primary hover-glow' : 'variant-soft-surface'}"
        onclick={() => toggleDimension('polarity')}
      >
        {$t.analysis?.polaritySection || 'Polarity'}
      </button>
      <button
        class="chip hover-lift {selectedDimensions.includes('subjectivity') ? 'variant-filled-primary hover-glow' : 'variant-soft-surface'}"
        onclick={() => toggleDimension('subjectivity')}
      >
        {$t.analysis?.subjectivitySection || 'Subjectivity'}
      </button>
      <button
        class="chip hover-lift {selectedDimensions.includes('centrality') ? 'variant-filled-primary hover-glow' : 'variant-soft-surface'}"
        onclick={() => toggleDimension('centrality')}
      >
        {$t.analysis?.centralitySection || 'Centrality'}
      </button>
    </div>
  </div>

  <!-- Non-Applicable Filter -->
  <div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-white/60">{$t.comparison?.excludeNonApplicable || 'Exclude "Non Applicable" Articles'}:</span>
      <button
        class="toggle-switch {excludeNonApplicable ? 'active' : ''}"
        onclick={toggleExcludeNonApplicable}
        aria-label="Toggle exclude non-applicable articles"
      >
        <div class="toggle-thumb"></div>
      </button>
    </div>
    <p class="text-xs text-white/50 mt-1">
      {$t.comparison?.excludeNonApplicableDescription || 'Hide articles where one model marked centrality as "Non applicable", which creates artificially high discrepancies.'}
    </p>
  </div>
</div>

<style>
  .range-container {
    position: relative;
    height: 60px;
    margin: 0 10px;
  }
  
  .range-track {
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  .range-highlight {
    position: absolute;
    top: 20px;
    height: 4px;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    border-radius: 2px;
    transition: all 0.2s ease;
  }
  
  .range-slider {
    position: absolute;
    top: 10px;
    width: 100%;
    height: 24px;
    background: transparent;
    pointer-events: none;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 2px solid var(--accent-primary);
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  .range-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
  
  .range-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 2px solid var(--accent-primary);
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  .range-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
  
  .range-min {
    z-index: 2;
  }
  
  .range-max {
    z-index: 1;
  }
  
  .range-labels {
    position: absolute;
    top: 40px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
  }
  
  .range-label {
    position: absolute;
    transform: translateX(-50%);
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .chip {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    transition: all var(--transition-fast);
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
  }
  
  .chip:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  /* Toggle switch styles */
  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    outline: none;
  }

  .toggle-switch:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .toggle-switch.active {
    background: var(--accent-primary);
  }

  .toggle-switch.active:hover {
    background: var(--accent-secondary);
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.active .toggle-thumb {
    transform: translateX(20px);
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .range-container {
      margin: 0 5px;
    }
    
    .chip {
      padding: 0.2rem 0.6rem;
      font-size: 0.7rem;
    }

    .toggle-switch {
      width: 40px;
      height: 22px;
    }

    .toggle-thumb {
      width: 18px;
      height: 18px;
    }

    .toggle-switch.active .toggle-thumb {
      transform: translateX(18px);
    }
  }
</style>
