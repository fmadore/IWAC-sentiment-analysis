<script lang="ts">
  import { selectedDataset, availableDatasets } from '$lib/stores';
  import { t } from '$lib/i18n';
  import DatabaseIcon from '@lucide/svelte/icons/database';

  let isOpen = $state(false);

  function selectDataset(datasetId: string) {
    selectedDataset.set(datasetId);
    isOpen = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    const picker = document.querySelector('.dataset-picker');
    if (picker && !picker.contains(target)) {
      isOpen = false;
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
</script>

<div class="dataset-picker">
  <button
    class="picker-button glass-medium"
    onclick={() => isOpen = !isOpen}
    aria-label={$t.datasets?.selectModel || 'Select model'}
    aria-expanded={isOpen}
    aria-haspopup={true}
  >
    <div class="button-content">
      <DatabaseIcon size={18} />
      <span class="picker-label">
        {$availableDatasets.find(d => d.id === $selectedDataset)?.name || 'Select Dataset'}
      </span>
      <svg
        class="chevron {isOpen ? 'rotate-180' : ''}"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </button>

  {#if isOpen}
    <div class="dropdown-menu glass-heavy">
      <div class="menu-section">
        <span class="section-label">{$t.datasets?.availableModels || 'Available Models'}</span>
        {#each $availableDatasets as dataset}
          <button
            class="menu-item {$selectedDataset === dataset.id ? 'active' : ''}"
            onclick={() => selectDataset(dataset.id)}
          >
            <span class="dataset-icon">{dataset.icon}</span>
            <span class="dataset-name">{dataset.name}</span>
            {#if $selectedDataset === dataset.id}
              <div class="check-mark">✓</div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .dataset-picker {
    position: relative;
    z-index: 100;
  }

  .picker-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 180px;
    height: 2.5rem;
    padding: 0 0.875rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .picker-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    transition: left 0.5s ease;
  }

  .picker-button:hover::before {
    left: 100%;
  }

  .picker-button:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.15),
      0 0 20px rgba(59, 130, 246, 0.1);
  }

  .button-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 1;
  }

  .picker-label {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .chevron {
    transition: transform 0.2s ease;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 220px;
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.75rem;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 8px 16px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    overflow: hidden;
    animation: dropdownFadeIn 0.2s ease-out;
  }

  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .menu-section {
    padding: 0.5rem;
  }

  .section-label {
    display: block;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    position: relative;
  }

  .menu-item:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  .menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .menu-item.active {
    background: rgba(59, 130, 246, 0.2);
    color: #60A5FA;
  }

  .menu-item.active:hover {
    background: rgba(59, 130, 246, 0.3);
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
    color: #10B981;
    font-weight: bold;
    font-size: 1rem;
  }



  /* Responsive Design */
  @media (max-width: 640px) {
    .picker-button {
      min-width: 150px;
      height: 2rem;
      padding: 0 0.625rem;
    }

    .picker-label {
      font-size: 0.8125rem;
    }

    .button-content :global(svg) {
      width: 16px;
      height: 16px;
    }

    .dropdown-menu {
      min-width: 180px;
    }

    .menu-item {
      padding: 0.5rem;
      font-size: 0.8125rem;
    }

    .dataset-icon {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .picker-button {
      min-width: 120px;
      height: 1.75rem;
      padding: 0 0.5rem;
    }

    .picker-label {
      font-size: 0.75rem;
    }

    .menu-item {
      padding: 0.375rem 0.5rem;
      font-size: 0.75rem;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .picker-button {
      border-width: 2px;
      border-color: rgba(255, 255, 255, 0.8);
    }

    .dropdown-menu {
      border-width: 2px;
      border-color: rgba(255, 255, 255, 0.8);
    }
  }
</style>
