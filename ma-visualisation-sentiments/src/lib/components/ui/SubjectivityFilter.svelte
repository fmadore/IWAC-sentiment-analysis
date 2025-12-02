<script lang="ts">
  import { subjectivityFilters } from '$lib/stores.ts';
  import { t } from '$lib/i18n';

  // Scores with corresponding CSS class names
  const scores = [
    { value: 1, cssClass: 'subjectivity-1' },
    { value: 2, cssClass: 'subjectivity-2' },
    { value: 3, cssClass: 'subjectivity-3' },
    { value: 4, cssClass: 'subjectivity-4' },
    { value: 5, cssClass: 'subjectivity-5' }
  ];
  
  let selectedScores = $state<string[]>([]);
  
  // Sync local state with store values
  $effect(() => {
    selectedScores = $subjectivityFilters;
  });
  
  function updateSubjectivitySelection() {
    subjectivityFilters.set(selectedScores);
  }
  
  function toggleScore(score: number) {
    const scoreStr = score.toString();
    if (selectedScores.includes(scoreStr)) {
      selectedScores = selectedScores.filter(s => s !== scoreStr);
    } else {
      selectedScores = [...selectedScores, scoreStr];
    }
    updateSubjectivitySelection();
  }

  function clearSelection() {
    selectedScores = [];
    updateSubjectivitySelection();
  }
</script>

<div class="filter-card">
  <h3 class="filter-title">{$t.filters.subjectivityScore}</h3>
  
  <div class="filter-chips">
    {#each scores as score}
      <button 
        class="filter-chip {score.cssClass}" 
        data-selected={selectedScores.includes(score.value.toString())}
        onclick={() => toggleScore(score.value)}
        aria-pressed={selectedScores.includes(score.value.toString())}
      >
        {score.value}
      </button>
    {/each}
  </div>

  {#if selectedScores.length > 0}
    <button 
      class="clear-btn" 
      onclick={clearSelection}
    >
      {$t.filters.clearAll}
    </button>
  {/if}
  
  <div class="legend">
    <div class="legend-item">
      <span class="legend-badge subjectivity-1">1-2</span>
      <span class="legend-text">{$t.filters.ratherObjective}</span>
    </div>
    <div class="legend-item">
      <span class="legend-badge subjectivity-3">3</span>
      <span class="legend-text">{$t.filters.mixedSubjectivity}</span>
    </div>
    <div class="legend-item">
      <span class="legend-badge subjectivity-5">4-5</span>
      <span class="legend-text">{$t.filters.ratherVerySubjective}</span>
    </div>
  </div>
</div>

<style>
  .filter-card {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(16px);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 0.875rem;
    padding: 1rem;
    box-shadow: 
      0 4px 16px color-mix(in oklab, black 8%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    transition: all var(--timing-normal, 0.2s) ease;
  }

  .filter-card:hover {
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
  }

  .filter-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0 0 0.875rem 0;
    letter-spacing: -0.01em;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    margin-top: 0.75rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    transition: all var(--timing-fast, 0.15s) ease;
  }

  .clear-btn:hover {
    background: color-mix(in oklab, var(--color-error-500) 15%, transparent);
    border-color: color-mix(in oklab, var(--color-error-500) 30%, transparent);
    color: var(--color-error-400);
  }

  .legend {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .legend-badge {
    padding: 0.1875rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 9999px;
  }

  .legend-text {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
  }

  @media (max-width: 768px) {
    .filter-card { padding: 0.875rem; }
    .filter-title { font-size: 0.875rem; margin-bottom: 0.75rem; }
    .legend-badge { font-size: 0.625rem; padding: 0.125rem 0.375rem; }
    .legend-text { font-size: 0.6875rem; }
  }

  @media (max-width: 480px) {
    .filter-card { padding: 0.75rem; }
    .filter-title { font-size: 0.8125rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .filter-card, .clear-btn { transition: none; }
  }
</style>