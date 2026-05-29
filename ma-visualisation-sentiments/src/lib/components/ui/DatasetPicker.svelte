<script lang="ts">
	import { datasetState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';
	import { DropdownMenu } from '$lib/components/common';

	let currentDataset = $derived(datasetState.available.find((d) => d.id === datasetState.selected));

	// Transform datasets to DropdownMenu items
	let menuItems = $derived(
		datasetState.available.map((dataset) => ({
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
		datasetState.selected = id;
	}
</script>

<DropdownMenu
	items={menuItems}
	selectedId={datasetState.selected}
	onSelect={handleSelect}
	sectionLabel={$t.datasets?.availableModels || 'Available Models'}
	menuMinWidth="220px"
	buttonMinWidth="180px"
	zIndex={1001}
	ariaLabel={$t.datasets?.selectModel || 'Select model'}
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
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
	}

	.dataset-icon {
		font-size: var(--font-size-2xl);
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

	/* Responsive Design */
	@media (max-width: 640px) {
		.picker-label {
			font-size: var(--font-size-sm);
		}

		.dataset-icon {
			font-size: var(--font-size-lg);
		}
	}

	@media (max-width: 480px) {
		.picker-label {
			display: none;
		}
	}
</style>
