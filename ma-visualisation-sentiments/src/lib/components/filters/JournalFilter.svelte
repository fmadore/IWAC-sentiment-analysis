<!-- Composant JournalFilter.svelte --> 
<script lang="ts">
  import { availableJournals, journalFilters } from '$lib/stores';
  import { t } from '$lib/i18n';
  import { FilterCard, FilterChip, SearchInput } from '$lib/components/common';
  
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
  
  function toggleShowAll() {
    showAll = !showAll;
  }
  
  function clearAll() {
    selectedJournals = [];
    applyFilter();
  }
</script>

<FilterCard 
  title={$t.filters.journal}
  count={journals.length}
  showClear={selectedJournals.length > 0}
  onClear={clearAll}
>
  {#snippet beforeChips()}
    <!-- Search bar -->
    {#if journals.length > 6}
      <div class="search-container">
        <SearchInput
          bind:value={searchTerm}
          placeholder={$t.filters.searchJournals}
        />
      </div>
    {/if}
    
    <!-- Results counter -->
    {#if searchTerm}
      <div class="results-count">
        {$t.filters.showingJournals} {filteredJournals.length} {$t.filters.of} {journals.length}
      </div>
    {/if}
  {/snippet}
  
  {#snippet chips()}
    {#each displayedJournals as journal (journal)}
      <FilterChip 
        label={journal}
        selected={selectedJournals.includes(journal)}
        onclick={() => toggleJournal(journal)}
      />
    {/each}
  {/snippet}
  
  {#snippet footer()}
    <!-- Show more/less button -->
    {#if hasMoreJournals && !searchTerm}
      <button 
        class="toggle-btn" 
        onclick={toggleShowAll}
      >
        {showAll ? `${$t.common.viewLess} (${INITIAL_DISPLAY_COUNT})` : `${$t.common.viewMore} (+${filteredJournals.length - INITIAL_DISPLAY_COUNT})`}
      </button>
    {/if}
  {/snippet}
</FilterCard>

<style>
  .search-container {
    margin-bottom: 0.75rem;
  }

  .results-count {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
    margin-bottom: 0.5rem;
  }

  .toggle-btn {
    display: inline-flex;
    align-items: center;
    margin-top: 0.5rem;
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

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .toggle-btn {
      transition: none;
    }
  }
</style>