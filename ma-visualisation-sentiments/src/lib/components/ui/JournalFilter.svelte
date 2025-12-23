<!-- Composant JournalFilter.svelte --> 
<script lang="ts">
  import { availableJournals, journalFilters } from '$lib/stores.ts';
  import { t } from '$lib/i18n';

  // Propriété pour référence externe, pas pour l'injection de propriété
  export const class_name = '';
  
  // Variables locales
  let selectedJournals = $state<string[]>([]);
  let searchTerm = $state('');
  let showAll = $state(false);
  const INITIAL_DISPLAY_COUNT = 8;

  // Sync local state with store values
  $effect(() => {
    selectedJournals = $journalFilters;
  });
  
  let journals = $derived($availableJournals);
  
  // Filtrer les journaux selon le terme de recherche
  let filteredJournals = $derived(
    journals.filter(journal => 
      journal.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  // Journaux à afficher (limités ou tous selon showAll)
  let displayedJournals = $derived(
    showAll ? filteredJournals : filteredJournals.slice(0, INITIAL_DISPLAY_COUNT)
  );
  
  let hasMoreJournals = $derived(filteredJournals.length > INITIAL_DISPLAY_COUNT);

  // Fonction pour appliquer le filtre
  function applyFilter() {
    journalFilters.set(selectedJournals);
  }

  function toggleJournal(journal: string) {
    if (selectedJournals.includes(journal)) {
      selectedJournals = selectedJournals.filter(j => j !== journal);
    } else {
      selectedJournals = [...selectedJournals, journal];
    }
    applyFilter();
  }
  
  function clearSearch() {
    searchTerm = '';
  }
  
  function toggleShowAll() {
    showAll = !showAll;
  }

</script>

<div class="filter-card">
  <div class="filter-header">
    <h3 class="filter-title">{$t.filters.journal}</h3>
    <span class="filter-count">({journals.length})</span>
  </div>
  
  <!-- Search bar -->
  {#if journals.length > 6}
    <div class="search-container">
      <div class="search-wrapper">
        <input 
          type="text" 
          placeholder={$t.filters.searchJournals}
          bind:value={searchTerm}
          class="search-input"
        />
        {#if searchTerm}
          <button 
            onclick={clearSearch}
            class="search-clear"
            aria-label="Clear search"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Results counter -->
  {#if searchTerm}
    <div class="results-count">
      {$t.filters.showingJournals} {filteredJournals.length} {$t.filters.of} {journals.length}
    </div>
  {/if}
  
  <!-- Journals list -->
  <div class="filter-chips">
    {#each displayedJournals as journal}
      <button 
        class="filter-chip" 
        data-selected={selectedJournals.includes(journal)}
        onclick={() => toggleJournal(journal)}
        aria-pressed={selectedJournals.includes(journal)}
      >
        {journal}
      </button>
    {/each}
  </div>
  
  <!-- Show more/less button -->
  {#if hasMoreJournals && !searchTerm}
    <button 
      class="toggle-btn" 
      onclick={toggleShowAll}
    >
      {showAll ? `${$t.common.viewLess} (${INITIAL_DISPLAY_COUNT})` : `${$t.common.viewMore} (+${filteredJournals.length - INITIAL_DISPLAY_COUNT})`}
    </button>
  {/if}

  <!-- Clear selection button -->
  {#if selectedJournals.length > 0}
    <button 
      class="clear-btn" 
      onclick={() => {selectedJournals = []; applyFilter();}}
    >
      {$t.filters.clearAll} ({selectedJournals.length})
    </button>
  {/if}
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

  .filter-card:hover {
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
  }

  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.875rem;
  }

  .filter-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .filter-count {
    font-size: 0.8125rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
  }

  .search-container {
    margin-bottom: 0.75rem;
  }

  .search-wrapper {
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    font-size: 0.8125rem;
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    color: var(--color-surface-50);
    transition: all var(--timing-fast) var(--easing-default);
  }

  .search-input::placeholder {
    color: color-mix(in oklab, var(--color-surface-50) 40%, transparent);
  }

  .search-input:hover {
    border-color: color-mix(in oklab, var(--color-surface-50) 18%, transparent);
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary-500);
    background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
  }

  .search-clear {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.25rem;
    background: none;
    border: none;
    color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
    cursor: pointer;
    transition: color var(--timing-fast) var(--easing-default);
  }

  .search-clear:hover {
    color: var(--color-surface-50);
  }

  .results-count {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
    margin-bottom: 0.5rem;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .toggle-btn {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0.5rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    background: transparent;
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
  }

  .toggle-btn:hover {
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    color: var(--color-surface-50);
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    margin-top: 0.5rem;
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

  .clear-btn:hover {
    background: color-mix(in oklab, var(--color-error-500) 15%, transparent);
    border-color: color-mix(in oklab, var(--color-error-500) 30%, transparent);
    color: var(--color-error-400);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .filter-card {
      padding: 0.875rem;
    }

    .filter-title {
      font-size: 0.875rem;
    }

    .filter-chip {
      padding: 0.3125rem 0.625rem;
      font-size: 0.75rem;
    }

    .search-input {
      padding: 0.4375rem 1.75rem 0.4375rem 0.625rem;
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .filter-card {
      padding: 0.75rem;
    }

    .filter-title {
      font-size: 0.8125rem;
    }

    .filter-chip {
      padding: 0.25rem 0.5rem;
      font-size: 0.6875rem;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .filter-card,
    .search-input,
    .toggle-btn,
    .clear-btn {
      transition: none;
    }
  }
</style>