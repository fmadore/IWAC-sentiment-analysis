<script lang="ts">
  import { subjectivityFilters } from '$lib/stores.ts';

  const scores = [1, 2, 3, 4, 5];
  let selectedScores = $state<number[]>([]);
  
  function updateSubjectivitySelection() {
    subjectivityFilters.set(selectedScores);
  }
  
  function toggleScore(score: number) {
    if (selectedScores.includes(score)) {
      selectedScores = selectedScores.filter(s => s !== score);
    } else {
      selectedScores = [...selectedScores, score];
    }
    updateSubjectivitySelection();
  }

  function clearSelection() {
    selectedScores = [];
    updateSubjectivitySelection();
  }
</script>

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white responsive-title">Score de subjectivité</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each scores as score}
      <button 
        class="chip hover-lift {score === 1 ? 'variant-filled-success' : score === 2 ? 'variant-soft-success' : score === 3 ? 'variant-soft-primary' : score === 4 ? 'variant-soft-error' : 'variant-filled-error'} {selectedScores.includes(score) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
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
      Effacer sélection
    </button>
  {/if}
  
  <div class="mt-3 text-sm text-white/80 space-y-2">
    <div class="flex gap-2 items-center">
      <span class="badge variant-soft-success">1-2</span>
      <span>Plutôt objectif</span>
    </div>
    <div class="flex gap-2 items-center">
      <span class="badge variant-soft-primary">3</span>
      <span>Subjectivité mixte</span>
    </div>
    <div class="flex gap-2 items-center">
      <span class="badge variant-soft-error">4-5</span>
      <span>Plutôt/très subjectif</span>
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
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .chip.hover-glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  .badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    transition: all var(--transition-fast);
    
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