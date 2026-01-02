<!--
  CentralityFilter Component
  
  Filter for centrality values using reusable FilterCard and FilterChip components.
-->
<script lang="ts">
  import { centralityFilters } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue } from '$lib/i18n/utils';
  import { FilterCard, FilterChip } from '$lib/components/common';

  // French values (stored in data) with their FilterChip variants
  const centralityOptions = [
    { value: 'Très central', variant: 'centrality-very-central' as const },
    { value: 'Central', variant: 'centrality-central' as const },
    { value: 'Secondaire', variant: 'centrality-secondary' as const },
    { value: 'Marginal', variant: 'centrality-marginal' as const },
    { value: 'Non abordé', variant: 'centrality-not-addressed' as const }
  ];

  let selectedCentralities: string[] = $state([]);

  // Sync local state with store values
  $effect(() => {
    selectedCentralities = $centralityFilters;
  });

  // Get translated labels for display
  const translatedOptions = $derived(
    centralityOptions.map(option => ({
      value: option.value, // Keep French value for data operations
      label: translateSentimentValue(option.value, $currentLanguage), // Translated label for display
      variant: option.variant
    }))
  );

  // Toggle centrality selection
  function toggleCentrality(centrality: string) {
    if (selectedCentralities.includes(centrality)) {
      selectedCentralities = selectedCentralities.filter(c => c !== centrality);
    } else {
      selectedCentralities = [...selectedCentralities, centrality];
    }
    centralityFilters.set(selectedCentralities);
  }

  function clearSelection() {
    selectedCentralities = [];
    centralityFilters.set(selectedCentralities);
  }
</script>

<FilterCard 
  title={$t.analysis.centralitySection}
  showClear={selectedCentralities.length > 0}
  onClear={clearSelection}
>
  {#snippet chips()}
    {#each translatedOptions as option (option.value)}
      <FilterChip 
        label={option.label}
        selected={selectedCentralities.includes(option.value)}
        variant={option.variant}
        onclick={() => toggleCentrality(option.value)}
      />
    {/each}
  {/snippet}
</FilterCard>