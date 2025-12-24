<script lang="ts">
  import { selectedDataset, availableDatasets } from '$lib/stores';
  import { t } from '$lib/i18n';
  import { base } from '$app/paths';
  import { DropdownMenu } from '$lib/components/common';

  let currentDataset = $derived($availableDatasets.find(d => d.id === $selectedDataset));

  // Transform datasets to DropdownMenu items
  let menuItems = $derived(
    $availableDatasets.map(dataset => ({
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
    selectedDataset.set(id);
  }
</script>

<DropdownMenu
  items={menuItems}
  selectedId={$selectedDataset}
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
      <img 
        src="{base}{item.data.logo}" 
        alt="{item.label} logo" 
        class="dataset-logo menu-logo"
      />
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
    width: 1.25rem;
    height: 1.25rem;
    object-fit: contain;
    flex-shrink: 0;
  }

  .dataset-logo.menu-logo {
    width: 1.5rem;
    height: 1.5rem;
  }

  .picker-label {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .dataset-icon {
    font-size: 1.25rem;
    width: 1.5rem;
    text-align: center;
  }

  .dataset-name {
    flex: 1;
    text-align: left;
  }

  .check-mark {
    color: var(--color-success-500);
    font-weight: bold;
    font-size: 1rem;
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .picker-label {
      font-size: 0.8125rem;
    }

    .dataset-icon {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .picker-label {
      display: none;
    }
  }
</style>
