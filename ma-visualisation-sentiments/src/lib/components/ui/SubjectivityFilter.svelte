<script lang="ts">
  import { writable } from 'svelte/store';
  import { subjectivityFilters } from '$lib/stores.ts';

  const scores = [1, 2, 3, 4, 5];
  let selectedScores: number[] = [];
  
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

<div class="card variant-glass p-4">
  <h3 class="h4 mb-4 text-white">Score de subjectivité</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each scores as score}
      <button 
        class="chip {score === 1 ? 'variant-filled-success' : score === 2 ? 'variant-soft-success' : score === 3 ? 'variant-soft-primary' : score === 4 ? 'variant-soft-error' : 'variant-filled-error'} {selectedScores.includes(score) ? 'ring-2 ring-primary-500' : ''}" 
        on:click={() => toggleScore(score)}
      >
        {score}
      </button>
    {/each}
  </div>

  {#if selectedScores.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3" 
      on:click={clearSelection}
    >
      Effacer sélection
    </button>
  {/if}
  
  <div class="mt-2 text-sm text-white">
    <div class="flex gap-2 items-center mt-1">
      <span class="badge variant-soft-success">1-2</span>
      <span>Plutôt objectif</span>
    </div>
    <div class="flex gap-2 items-center mt-1">
      <span class="badge variant-soft-primary">3</span>
      <span>Subjectivité mixte</span>
    </div>
    <div class="flex gap-2 items-center mt-1">
      <span class="badge variant-soft-error">4-5</span>
      <span>Plutôt/très subjectif</span>
    </div>
  </div>
</div>

<style>
  .chip {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .chip:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 9999px;
  }
</style> 