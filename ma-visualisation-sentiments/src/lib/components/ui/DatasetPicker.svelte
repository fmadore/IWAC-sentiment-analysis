<script lang="ts">
  import { selectedDataset, availableDatasets } from '$lib/stores';
  import { t } from '$lib/i18n';
  import { base } from '$app/paths';

  let isOpen = $state(false);
  let pickerElement: HTMLDivElement;
  
  let currentDataset = $derived($availableDatasets.find(d => d.id === $selectedDataset));

  function selectDataset(datasetId: string) {
    selectedDataset.set(datasetId);
    isOpen = false;
  }

  function toggleDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    isOpen = !isOpen;
  }

  function handleMenuItemClick(event: Event, datasetId: string) {
    event.preventDefault();
    event.stopPropagation();
    selectDataset(datasetId);
  }

  function handleClickOutside(event: MouseEvent | TouchEvent) {
    const target = event.target as Element;
    if (pickerElement && !pickerElement.contains(target)) {
      isOpen = false;
    }
  }

  $effect(() => {
    if (isOpen) {
      // Add both mouse and touch event listeners for better mobile support
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  });
</script>

<div class="dataset-picker" bind:this={pickerElement}>
  <button
    class="picker-button glass-medium"
    onclick={toggleDropdown}
    ontouchend={toggleDropdown}
    aria-label={$t.datasets?.selectModel || 'Select model'}
    aria-expanded={isOpen}
    aria-haspopup={true}
    type="button"
  >
    <div class="button-content">
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
    <div class="dropdown-menu glass-heavy" role="menu" aria-label="Dataset selection menu">
      <div class="menu-section">
        <span class="section-label">{$t.datasets?.availableModels || 'Available Models'}</span>
        {#each $availableDatasets as dataset}
          <button
            class="menu-item {$selectedDataset === dataset.id ? 'active' : ''}"
            onclick={(e) => handleMenuItemClick(e, dataset.id)}
            ontouchend={(e) => handleMenuItemClick(e, dataset.id)}
            role="menuitem"
            tabindex="0"
          >
            {#if dataset.logo}
              <img 
                src="{base}{dataset.logo}" 
                alt="{dataset.name} logo" 
                class="dataset-logo menu-logo"
              />
            {:else if dataset.icon}
              <span class="dataset-icon">{dataset.icon}</span>
            {/if}
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
    z-index: 1001; /* Higher than LanguageSwitcher (1000) and page modal (999) */
  }

  .picker-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 180px;
    height: 2.5rem;
    padding: 0 0.875rem;
    border-radius: 0.75rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    color: var(--color-surface-50);
    cursor: pointer;
    transition: all var(--timing-normal) var(--easing-default);
    position: relative;
    overflow: hidden;
    /* Better mobile touch target */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    /* Ensure button is accessible */
    user-select: none;
    -webkit-user-select: none;
  }

  .picker-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-surface-50) 15%, transparent), transparent);
    transition: left var(--timing-slow) var(--easing-default);
  }

  .picker-button:hover::before {
    left: 100%;
  }

  .picker-button:hover {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 25%, transparent);
    transform: translateY(-1px);
    box-shadow: 
      0 8px 25px color-mix(in oklab, black 15%, transparent),
      0 0 20px color-mix(in oklab, var(--color-primary-500) 10%, transparent);
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
    transition: transform var(--timing-fast) var(--easing-default);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 220px;
    background: color-mix(in oklab, var(--color-surface-900) 95%, transparent);
    backdrop-filter: blur(var(--glass-blur-lg));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    border-radius: 0.75rem;
    box-shadow: 
      0 20px 40px color-mix(in oklab, black 30%, transparent),
      0 8px 16px color-mix(in oklab, black 20%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    overflow: hidden;
    animation: dropdownFadeIn var(--timing-fast) ease-out;
    z-index: 1002;
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
    color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
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
    color: var(--color-surface-50);
    cursor: pointer;
    transition: all var(--timing-fast) var(--easing-default);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    position: relative;
    /* Better mobile touch target */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    min-height: 44px;
  }

  .menu-item:hover:not(:disabled) {
    background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }

  .menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .menu-item.active {
    background: color-mix(in oklab, var(--color-primary-500) 20%, transparent);
    color: var(--color-primary-400);
  }

  .menu-item.active:hover {
    background: color-mix(in oklab, var(--color-primary-500) 30%, transparent);
  }

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
    .picker-button {
      min-width: 150px;
      height: 2.25rem;
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
      right: 0;
      left: auto;
      max-width: calc(100vw - 2rem);
    }

    .menu-item {
      padding: 0.75rem 0.5rem;
      font-size: 0.8125rem;
      min-height: 48px;
    }

    .dataset-icon {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .picker-button {
      min-width: 2.5rem;
      width: 2.5rem;
      height: 2rem;
      padding: 0 0.25rem;
    }

    .picker-label {
      display: none;
    }

    .button-content {
      gap: 0.25rem;
    }

    .dropdown-menu {
      right: -1rem;
      left: auto;
      min-width: 200px;
      max-width: calc(100vw - 1rem);
    }

    .menu-item {
      padding: 0.75rem 0.5rem;
      font-size: 0.75rem;
      min-height: 44px;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .picker-button {
      border-width: 2px;
      border-color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    }

    .dropdown-menu {
      border-width: 2px;
      border-color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .picker-button,
    .menu-item,
    .picker-button::before,
    .chevron {
      transition: none;
    }
  }
</style>
