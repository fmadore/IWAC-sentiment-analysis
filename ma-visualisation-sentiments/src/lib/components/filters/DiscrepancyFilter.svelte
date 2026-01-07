<script lang="ts">
  import { discrepancyFilters } from '$lib/stores';
  import { t } from '$lib/i18n';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import SlidersIcon from '@lucide/svelte/icons/sliders';
  
  let minDiff = $state(0);
  let maxDiff = $state(5);
  let selectedDimensions = $state<string[]>(['polarity', 'subjectivity', 'centrality']);
  let excludeNonApplicable = $state(true);
  
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
    excludeNonApplicable = true;
    updateFilters();
  }

  function toggleExcludeNonApplicable() {
    excludeNonApplicable = !excludeNonApplicable;
    updateFilters();
  }
</script>

<div class="filter-card comparison-filter-card">
  <div class="filter-header">
    <div class="filter-icon-container">
      <FilterIcon size={20} class="header-icon" />
    </div>
    <h3 class="filter-title comparison-filter-title">{$t.comparison?.filterByDiscrepancy || 'Filter by Discrepancy'}</h3>
  </div>
  
  <!-- Difference Range -->
  <div class="filter-section">
    <div class="section-header">
      <label class="section-label">
        <SlidersIcon size={16} />
        {$t.comparison?.differenceRange || 'Difference Range'}: {minDiff} - {maxDiff}
      </label>
      <button
        class="reset-btn"
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
        {#each [0, 1, 2, 3, 4, 5] as value (value)}
          <span class="range-label" style="left: {value * 20}%">{value}</span>
        {/each}
      </div>
    </div>
  </div>
  
  <!-- Quick Filters -->
  <div class="filter-section">
    <span class="section-subtitle">{$t.comparison?.quickFilters || 'Quick Filters'}:</span>
    <div class="filter-chips">
      <button 
        class="filter-chip"
        data-selected={minDiff === 1 && maxDiff === 1}
        onclick={() => setRange(1, 1)}
      >
        1 {$t.comparison?.pointDifference || 'point difference'}
      </button>
      <button 
        class="filter-chip"
        data-selected={minDiff === 2 && maxDiff === 2}
        onclick={() => setRange(2, 2)}
      >
        2 {$t.comparison?.pointsDifference || 'points difference'}
      </button>
      <button 
        class="filter-chip"
        data-selected={minDiff === 3 && maxDiff === 5}
        onclick={() => setRange(3, 5)}
      >
        3+ {$t.comparison?.pointsDifference || 'points difference'}
      </button>
      <button 
        class="filter-chip warning"
        data-selected={minDiff === 0 && maxDiff === 5}
        onclick={() => setRange(0, 5)}
      >
        {$t.common?.all || 'All'}
      </button>
    </div>
  </div>
  
  <!-- Dimension Filters -->
  <div class="filter-section">
    <div class="section-header-inline">
      <span class="section-subtitle">{$t.comparison?.compareDimensions || 'Compare Dimensions'}:</span>
      <div class="info-tooltip">
        <span class="info-icon">ⓘ</span>
        <div class="tooltip-content">
          <p class="tooltip-text">
            {$t.comparison?.dimensionsExplanation || 'Select which dimensions to analyze for disagreements between models:'}
          </p>
          <ul class="tooltip-list">
            <li><strong>{$t.analysis?.polaritySection || 'Polarity'}:</strong> {$t.comparison?.polarityExplanation || 'Positive/Negative sentiment differences'}</li>
            <li><strong>{$t.analysis?.subjectivitySection || 'Subjectivity'}:</strong> {$t.comparison?.subjectivityExplanation || 'Objectivity vs. opinion differences (1-5 scale)'}</li>
            <li><strong>{$t.analysis?.centralitySection || 'Centrality'}:</strong> {$t.comparison?.centralityExplanation || 'How central Islam/Muslims are to the article'}</li>
          </ul>
          <p class="tooltip-note">
            {$t.comparison?.dimensionsNote || 'Tip: Select only one dimension to focus your analysis on specific types of disagreements. Discrepancy scores will be recalculated based on your selection.'}
          </p>
        </div>
      </div>
    </div>
    <div class="filter-chips">
      <button
        class="filter-chip"
        data-selected={selectedDimensions.includes('polarity')}
        onclick={() => toggleDimension('polarity')}
      >
        {$t.analysis?.polaritySection || 'Polarity'}
      </button>
      <button
        class="filter-chip"
        data-selected={selectedDimensions.includes('subjectivity')}
        onclick={() => toggleDimension('subjectivity')}
      >
        {$t.analysis?.subjectivitySection || 'Subjectivity'}
      </button>
      <button
        class="filter-chip"
        data-selected={selectedDimensions.includes('centrality')}
        onclick={() => toggleDimension('centrality')}
      >
        {$t.analysis?.centralitySection || 'Centrality'}
      </button>
    </div>
  </div>

  <!-- Non-Applicable Filter -->
  <div class="filter-section">
    <div class="toggle-row">
      <span class="section-subtitle">{$t.comparison?.excludeNonApplicable || 'Exclude "Non Applicable" Articles'}:</span>
      <button
        class="toggle-switch"
        data-active={excludeNonApplicable}
        onclick={toggleExcludeNonApplicable}
        aria-label="Toggle exclude non-applicable articles"
      >
        <div class="toggle-thumb"></div>
      </button>
    </div>
    <p class="helper-text">
      {$t.comparison?.excludeNonApplicableDescription || 'Hide articles where one model marked centrality as "Non applicable", which creates artificially high discrepancies.'}
    </p>
  </div>
</div>

<style>
  .filter-card {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 0.875rem;
    padding: 1rem;
    box-shadow: 
      0 4px 16px color-mix(in oklab, black 8%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    transition: all var(--timing-normal) var(--easing-default);
  }

  /* Comparison-specific filter card */
  .comparison-filter-card {
    background: color-mix(in oklab, var(--sentiment-comparison) 5%, transparent);
    border: 1px solid color-mix(in oklab, var(--sentiment-comparison) 15%, transparent);
    position: relative;
    overflow: hidden;
  }

  .comparison-filter-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--gradient-comparison);
  }

  .comparison-filter-card:hover {
    border-color: color-mix(in oklab, var(--sentiment-comparison) 25%, transparent);
    background: color-mix(in oklab, var(--sentiment-comparison) 8%, transparent);
  }

  .filter-card:hover {
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
  }

  .filter-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .filter-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--sentiment-comparison-icon-bg);
    border: 1px solid var(--sentiment-comparison-border);
  }

  .filter-header :global(svg) {
    color: var(--sentiment-comparison-light);
  }

  .filter-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0;
  }

  .comparison-filter-title {
    background: var(--gradient-comparison);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .filter-section {
    margin-bottom: 1.25rem;
  }

  .filter-section:last-child {
    margin-bottom: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .section-header-inline {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
  }

  .section-subtitle {
    font-size: 0.875rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
  }

  .reset-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
  }

  .reset-btn:hover {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    color: var(--color-surface-50);
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .filter-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    white-space: nowrap;
    background: color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 85%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
  }

  .filter-chip:hover {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 18%, transparent);
    color: var(--color-surface-50);
    transform: translateY(-1px);
  }

  .filter-chip[data-selected="true"] {
    background: var(--gradient-comparison);
    border-color: color-mix(in oklab, var(--sentiment-comparison-light) 40%, transparent);
    color: white;
    box-shadow: 0 2px 8px color-mix(in oklab, var(--sentiment-comparison) 30%, transparent);
  }

  .filter-chip.warning[data-selected="true"] {
    background: linear-gradient(135deg, var(--color-warning-500) 0%, var(--color-warning-600) 100%);
    box-shadow: 0 2px 8px color-mix(in oklab, var(--color-warning-500) 30%, transparent);
  }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .helper-text {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
    margin: 0.25rem 0 0 0;
  }

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
    background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 2px;
  }
  
  .range-highlight {
    position: absolute;
    top: 20px;
    height: 4px;
    background: var(--gradient-comparison);
    border-radius: 2px;
    transition: all var(--timing-fast) var(--easing-default);
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
    border: 2px solid var(--sentiment-comparison);
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 8px color-mix(in oklab, black 30%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
  }
  
  .range-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px color-mix(in oklab, var(--sentiment-comparison) 40%, transparent);
  }
  
  .range-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 2px solid var(--sentiment-comparison);
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 8px color-mix(in oklab, black 30%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
  }
  
  .range-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px color-mix(in oklab, var(--sentiment-comparison) 40%, transparent);
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
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
  }

  /* Toggle switch styles */
  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all var(--timing-normal) var(--easing-default);
    outline: none;
  }

  .toggle-switch:hover {
    background: color-mix(in oklab, var(--color-surface-50) 30%, transparent);
  }

  .toggle-switch[data-active="true"] {
    background: var(--sentiment-comparison);
  }

  .toggle-switch[data-active="true"]:hover {
    background: var(--sentiment-comparison-light);
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all var(--timing-normal) var(--easing-default);
    box-shadow: 0 2px 4px color-mix(in oklab, black 20%, transparent);
  }

  .toggle-switch[data-active="true"] .toggle-thumb {
    transform: translateX(20px);
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .filter-card {
      padding: 0.875rem;
    }

    .range-container {
      margin: 0 5px;
    }
    
    .filter-chip {
      padding: 0.3125rem 0.625rem;
      font-size: 0.6875rem;
    }

    .toggle-switch {
      width: 40px;
      height: 22px;
    }

    .toggle-thumb {
      width: 18px;
      height: 18px;
    }

    .toggle-switch[data-active="true"] .toggle-thumb {
      transform: translateX(18px);
    }
  }

  /* Info tooltip styles */
  .info-tooltip {
    position: relative;
    display: inline-block;
  }

  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    border-radius: 50%;
    font-size: 11px;
    font-weight: bold;
    cursor: help;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .info-icon:hover {
    background: color-mix(in oklab, var(--color-surface-50) 30%, transparent);
    color: var(--color-surface-50);
  }

  .tooltip-content {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    background: color-mix(in oklab, black 95%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    border-radius: 0.5rem;
    padding: 0.75rem;
    min-width: 320px;
    max-width: 400px;
    opacity: 0;
    visibility: hidden;
    transition: all var(--timing-normal) var(--easing-default);
    z-index: 1000;
    box-shadow: 0 8px 32px color-mix(in oklab, black 40%, transparent);
  }

  .info-tooltip:hover .tooltip-content {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-100%) translateY(-8px);
  }

  .tooltip-content::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: color-mix(in oklab, black 95%, transparent);
  }

  .tooltip-text {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 90%, transparent);
    margin: 0 0 0.5rem 0;
  }

  .tooltip-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
  }

  .tooltip-list li {
    margin-bottom: 0.25rem;
  }

  .tooltip-list strong {
    color: var(--color-primary-400);
  }

  .tooltip-note {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    margin: 0.5rem 0 0 0;
    font-style: italic;
  }

  /* Responsive tooltip */
  @media (max-width: 640px) {
    .tooltip-content {
      min-width: 280px;
      left: 0;
      transform: translateY(-100%);
    }

    .info-tooltip:hover .tooltip-content {
      transform: translateY(-100%) translateY(-8px);
    }

    .tooltip-content::after {
      left: 24px;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .filter-card,
    .filter-chip,
    .toggle-switch,
    .toggle-thumb,
    .range-highlight {
      transition: none;
    }
  }
</style>
