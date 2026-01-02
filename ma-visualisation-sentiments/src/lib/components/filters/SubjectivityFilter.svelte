<!--
  SubjectivityFilter Component
  
  Filter for subjectivity scores (1-5) using reusable FilterCard and FilterChip components.
-->
<script lang="ts">
  import { subjectivityFilters } from '$lib/stores';
  import { t } from '$lib/i18n';
  import { FilterCard, FilterChip } from '$lib/components/common';

  // Scores with corresponding FilterChip variants
  const scores = [
    { value: 1, variant: 'subjectivity-1' as const },
    { value: 2, variant: 'subjectivity-2' as const },
    { value: 3, variant: 'subjectivity-3' as const },
    { value: 4, variant: 'subjectivity-4' as const },
    { value: 5, variant: 'subjectivity-5' as const }
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

<FilterCard 
  title={$t.filters.subjectivityScore}
  showClear={selectedScores.length > 0}
  onClear={clearSelection}
>
  {#snippet chips()}
    {#each scores as score (score.value)}
      <FilterChip 
        label={score.value.toString()}
        selected={selectedScores.includes(score.value.toString())}
        variant={score.variant}
        onclick={() => toggleScore(score.value)}
      />
    {/each}
  {/snippet}
  
  {#snippet footer()}
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
  {/snippet}
</FilterCard>

<style>
  .legend {
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

  .legend-badge.subjectivity-1 {
    background: var(--sentiment-subjectivity-1-bg);
    border: 1px solid var(--sentiment-subjectivity-1-border);
    color: var(--sentiment-subjectivity-1);
  }

  .legend-badge.subjectivity-3 {
    background: var(--sentiment-subjectivity-3-bg);
    border: 1px solid var(--sentiment-subjectivity-3-border);
    color: var(--sentiment-subjectivity-3);
  }

  .legend-badge.subjectivity-5 {
    background: var(--sentiment-subjectivity-5-bg);
    border: 1px solid var(--sentiment-subjectivity-5-border);
    color: var(--sentiment-subjectivity-5);
  }

  .legend-text {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
  }

  @media (max-width: 768px) {
    .legend-badge { 
      font-size: 0.625rem; 
      padding: 0.125rem 0.375rem; 
    }
    .legend-text { 
      font-size: 0.6875rem; 
    }
  }
</style>