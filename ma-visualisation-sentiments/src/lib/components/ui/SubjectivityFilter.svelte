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
</script>

<div class="card p-4">
  <h3 class="h4 mb-4">Score de subjectivité</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each scores as score}
      <button 
        class="chip {score <= 2 ? 'variant-soft-success' : score <= 4 ? 'variant-soft-warning' : 'variant-soft-error'} {selectedScores.includes(score) ? 'ring-2 ring-primary-500' : ''}" 
        on:click={() => toggleScore(score)}
      >
        {score}
      </button>
    {/each}
  </div>
  
  <div class="mt-2 text-sm">
    <div class="flex gap-2 items-center mt-1">
      <span class="badge variant-soft-success">1-2</span>
      <span>Plutôt objectif</span>
    </div>
    <div class="flex gap-2 items-center mt-1">
      <span class="badge variant-soft-warning">3-4</span>
      <span>Subjectivité mixte/modérée</span>
    </div>
    <div class="flex gap-2 items-center mt-1">
      <span class="badge variant-soft-error">5</span>
      <span>Très subjectif</span>
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