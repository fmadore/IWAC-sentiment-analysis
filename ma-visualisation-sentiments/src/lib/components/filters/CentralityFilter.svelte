<!--
  CentralityFilter Component
  
  Filter for centrality values using reusable FilterCard and FilterChip components.
-->
<script lang="ts">
	import { filterState } from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import { NOT_ANNOTATED } from '$lib/domain/sentimentContract';
	import { FilterCard, FilterChip } from '$lib/components/common';

	// French values (stored in data) with their FilterChip variants
	const centralityOptions = [
		{ value: 'Très central', variant: 'centrality-very-central' as const },
		{ value: 'Central', variant: 'centrality-central' as const },
		{ value: 'Secondaire', variant: 'centrality-secondary' as const },
		{ value: 'Marginal', variant: 'centrality-marginal' as const },
		{ value: 'Non abordé', variant: 'centrality-not-addressed' as const },
		// A rating the model never produced, apart from "Non abordé", which is one
		{ value: NOT_ANNOTATED, variant: 'centrality-not-annotated' as const }
	];

	let selectedCentralities = $derived(filterState.centralities);

	// Get translated labels for display
	const translatedOptions = $derived(
		centralityOptions.map((option) => ({
			value: option.value, // Keep French value for data operations
			label: translateSentimentValue(option.value, $currentLanguage), // Translated label for display
			variant: option.variant
		}))
	);

	// Toggle centrality selection
	function toggleCentrality(centrality: string) {
		const updated = selectedCentralities.includes(centrality)
			? selectedCentralities.filter((c) => c !== centrality)
			: [...selectedCentralities, centrality];
		filterState.centralities = updated;
	}

	function clearSelection() {
		filterState.centralities = [];
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
