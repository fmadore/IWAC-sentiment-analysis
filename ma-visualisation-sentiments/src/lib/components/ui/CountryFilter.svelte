<!--
  CountryFilter Component
  
  This component provides hierarchical filtering where:
  1. Users first select countries of interest
  2. The JournalFilter automatically updates to show only journals from selected countries
  3. Other filters (polarity, subjectivity, centrality) work on the filtered dataset
  
  This creates a natural filtering flow: Country → Journal → Sentiment criteria
-->
<script lang="ts">
  import { currentDatasetArticles, countryFilters } from '$lib/stores.ts';
  import type { Article } from '$lib/types/data';

  // Variables locales
  let selectedCountries = $state<string[]>([]);
  let countries = $derived([...new Set(
    ($currentDatasetArticles as Article[]).map(article => article.Country)
                                       .filter((country): country is string => !!country)
  )].sort((a, b) => a.localeCompare(b)));

  // Fonction pour appliquer le filtre
  function applyFilter() {
    countryFilters.set(selectedCountries);
  }

  function toggleCountry(country: string) {
    if (selectedCountries.includes(country)) {
      selectedCountries = selectedCountries.filter(c => c !== country);
    } else {
      selectedCountries = [...selectedCountries, country];
    }
    applyFilter();
  }

  function clearSelection() {
    selectedCountries = [];
    applyFilter();
  }
</script>

<div class="card variant-glass p-4">
  <h3 class="h4 mb-4 text-white">Pays</h3>
  
  <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
    {#each countries as country}
      <button 
        class="chip variant-soft-secondary {selectedCountries.includes(country) ? 'ring-2 ring-primary-500' : ''}" 
        onclick={() => toggleCountry(country)}
      >
        {country}
      </button>
    {/each}
  </div>

  {#if selectedCountries.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3" 
      onclick={clearSelection}
    >
      Effacer sélection
    </button>
  {/if}
</div>

<style>
  .chip {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .chip:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
</style> 