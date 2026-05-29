<!--
  PolarityFilter Component
  
  Filter for sentiment polarity values using reusable FilterCard and FilterChip components.
-->
<script lang="ts">
	import { filterState } from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import { getSentimentLabels, getFrenchSentimentValue } from '$lib/i18n/utils';
	import { FilterCard, FilterChip } from '$lib/components/common';

	// French values for data storage with corresponding CSS class names (used for FilterChip variant)
	const frenchPolarityOptions = [
		{ value: 'Très positif', variant: 'polarity-very-positive' as const },
		{ value: 'Positif', variant: 'polarity-positive' as const },
		{ value: 'Neutre', variant: 'polarity-neutral' as const },
		{ value: 'Négatif', variant: 'polarity-negative' as const },
		{ value: 'Très négatif', variant: 'polarity-very-negative' as const },
		{ value: 'Non applicable', variant: 'polarity-na' as const }
	];

	// Get translated labels
	let polarityLabels = $derived(getSentimentLabels('polarity', $currentLanguage));

	// Create options with translated labels
	let polarityOptions = $derived(
		frenchPolarityOptions.map((option, index) => ({
			...option,
			label: polarityLabels[index]
		}))
	);

	let selectedPolarities = $state<string[]>([]);

	// Sync local state with store values when language or store changes
	$effect(() => {
		// Convert French store values to translated labels for UI
		const storeValues = filterState.polarities;
		selectedPolarities = storeValues.map((frenchValue) => {
			// Find the index of the French value
			const index = frenchPolarityOptions.findIndex((option) => option.value === frenchValue);
			// Return the corresponding translated label
			return index >= 0 ? polarityLabels[index] : frenchValue;
		});
	});

	function updateSelection() {
		// Convert translated values back to French for data filtering
		const frenchValues = selectedPolarities.map((label) => getFrenchSentimentValue(label));
		filterState.polarities = frenchValues;
	}

	function togglePolarity(translatedLabel: string) {
		if (selectedPolarities.includes(translatedLabel)) {
			selectedPolarities = selectedPolarities.filter((p) => p !== translatedLabel);
		} else {
			selectedPolarities = [...selectedPolarities, translatedLabel];
		}
		updateSelection();
	}

	function clearSelection() {
		selectedPolarities = [];
		updateSelection();
	}
</script>

<FilterCard
	title={$t.filters.polarity}
	showClear={selectedPolarities.length > 0}
	onClear={clearSelection}
>
	{#snippet chips()}
		{#each polarityOptions as option (option.value)}
			<FilterChip
				label={option.label}
				selected={selectedPolarities.includes(option.label)}
				variant={option.variant}
				onclick={() => togglePolarity(option.label)}
			/>
		{/each}
	{/snippet}
</FilterCard>
