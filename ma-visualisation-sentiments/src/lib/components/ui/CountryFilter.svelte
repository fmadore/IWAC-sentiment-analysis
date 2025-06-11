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

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white">Pays</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each countries as country}
      <button 
        class="chip hover-lift variant-soft-secondary {selectedCountries.includes(country) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
        onclick={() => toggleCountry(country)}
      >
        {country}
      </button>
    {/each}
  </div>

  {#if selectedCountries.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3 hover-lift" 
      onclick={clearSelection}
    >
      Effacer sélection
    </button>
  {/if}
</div>

<style>
  .chip {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    transition: all var(--transition-normal);
    white-space: nowrap;
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
  }
  
  .chip:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .chip.hover-glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
</style> 