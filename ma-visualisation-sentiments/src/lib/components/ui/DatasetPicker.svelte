<script lang="ts">
	import { datasetState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';
	import { DropdownMenu } from '$lib/components/common';
	import { isDatasetId } from '$lib/domain/sentimentContract';

	let currentDataset = $derived(datasetState.available.find((d) => d.id === datasetState.selected));

	// Only the generation on screen. The archived models stay reachable by URL
	// and through the methodology card's archive link, never by browsing here.
	let menuItems = $derived(
		datasetState.availableInGeneration.map((dataset) => ({
			id: dataset.id,
			label: dataset.name,
			data: {
				logo: dataset.logo,
				icon: dataset.icon,
				color: dataset.color
			}
		}))
	);

	function handleSelect(id: string) {
		if (isDatasetId(id)) datasetState.selected = id;
	}
</script>

<DropdownMenu
	items={menuItems}
	selectedId={datasetState.selected}
	onSelect={handleSelect}
	sectionLabel={$t.datasets.availableModels}
	menuMinWidth="220px"
	buttonMinWidth="180px"
	zIndex={1001}
	ariaLabel={$t.datasets.selectModel}
>
	{#snippet trigger()}
		{#if currentDataset?.logo}
			<img
				src="{base}{currentDataset.logo}"
				alt="{currentDataset.name} logo"
				class="dataset-logo"
			/>
		{/if}
		<span class="picker-label">
			{currentDataset?.name || 'Select Dataset'}
		</span>
	{/snippet}

	{#snippet itemRenderer({ item, isSelected })}
		{#if item.data?.logo}
			<img src="{base}{item.data.logo}" alt="{item.label} logo" class="dataset-logo menu-logo" />
		{:else if item.data?.icon}
			<span class="dataset-icon">{item.data.icon}</span>
		{/if}
		<span class="dataset-name">{item.label}</span>
		{#if isSelected}
			<span class="check-mark">✓</span>
		{/if}
	{/snippet}
</DropdownMenu>

<style>
	.dataset-logo {
		width: var(--space-5);
		height: var(--space-5);
		object-fit: contain;
		flex-shrink: 0;
	}

	.dataset-logo.menu-logo {
		width: var(--space-6);
		height: var(--space-6);
	}

	.picker-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
	}

	.dataset-icon {
		font-size: var(--font-size-lg);
		width: var(--space-6);
		text-align: center;
	}

	.dataset-name {
		flex: 1;
		text-align: left;
	}

	.check-mark {
		color: var(--color-success-500);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-lg);
	}

	/* The model name is the whole point of this control — it says what every
	   number on screen means — so it is never hidden. Below 1024px the picker
	   lives in the nav drawer, where there is room for it at full size; the
	   header no longer mounts a second copy. */
	@media (min-width: 640px) {
		.picker-label {
			font-size: var(--font-size-base);
		}

		.dataset-icon {
			font-size: var(--font-size-2xl);
		}
	}
</style>
