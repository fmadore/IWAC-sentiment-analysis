<script lang="ts">
  import { subjectivityFilters } from '$lib/stores.ts';
  import { t } from '$lib/i18n';

  const scores = [1, 2, 3, 4, 5];
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

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white responsive-title">{$t.filters.subjectivityScore}</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each scores as score}
      <button 
        class="chip hover-lift {score === 1 ? 'variant-filled-success' : score === 2 ? 'variant-soft-success' : score === 3 ? 'variant-soft-primary' : score === 4 ? 'variant-soft-error' : 'variant-filled-error'} {selectedScores.includes(score.toString()) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
        onclick={() => toggleScore(score)}
      >
        {score}
      </button>
    {/each}
  </div>

  {#if selectedScores.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3 hover-lift" 
      onclick={clearSelection}
    >
      {$t.filters.clearAll}
    </button>
  {/if}
  
  <div class="mt-3 text-sm text-white/80 space-y-2">
    <div class="flex gap-2 items-center">
      <span class="badge variant-soft-success">1-2</span>
      <span>{$t.filters.ratherObjective}</span>
    </div>
    <div class="flex gap-2 items-center">
      <span class="badge variant-soft-primary">3</span>
      <span>{$t.filters.mixedSubjectivity}</span>
    </div>
    <div class="flex gap-2 items-center">
      <span class="badge variant-soft-error">4-5</span>
      <span>{$t.filters.ratherVerySubjective}</span>
    </div>
  </div>
</div>

<style>
  .chip {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      padding: 0.2rem 0.6rem;
      font-size: 0.7rem;
    }
    
    @media (max-width: 480px) {
      padding: 0.15rem 0.5rem;
      font-size: 0.65rem;
    }
  }
  
  .chip::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity var(--transition-normal);
  }
  
  /* Responsive title adjustments */
  .responsive-title {
    @media (max-width: 768px) {
      font-size: 1rem !important;
      margin-bottom: 0.75rem !important;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9rem !important;
      margin-bottom: 0.5rem !important;
    }
  }
  
  .chip:hover {
    background: var(--glass-hover-bg);
    border-color: var(--glass-hover-border);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .chip:hover::before {
    opacity: 1;
  }
  
  .chip.hover-glow {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 
      var(--shadow-lg),
      0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  .badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    transition: all var(--transition-fast);
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      padding: 0.2rem 0.4rem;
      font-size: 0.7rem;
    }
    
    @media (max-width: 480px) {
      padding: 0.15rem 0.35rem;
      font-size: 0.65rem;
    }
  }
</style>