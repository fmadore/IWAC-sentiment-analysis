<script lang="ts">
  import { currentLanguage, switchLanguage, getAvailableLanguages, t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  let isOpen = $state(false);
  let languages = getAvailableLanguages();

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function selectLanguage(langCode: string) {
    switchLanguage(langCode as any);
    isOpen = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    const dropdown = document.querySelector('.language-dropdown');
    if (dropdown && !dropdown.contains(target)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="language-switcher">
  <div class="language-dropdown relative">
    <button
      class="language-btn"
      onclick={toggleDropdown}
      aria-label="Change language"
      aria-expanded={isOpen}
      aria-haspopup={true}
    >
      <div class="btn-content">
        <GlobeIcon size={18} />
        <span class="language-label">
          {languages.find(lang => lang.code === $currentLanguage)?.name || 'Language'}
        </span>
        <ChevronDownIcon 
          size={16} 
          class={isOpen ? 'rotate-180' : ''}
        />
      </div>
    </button>

    {#if isOpen}
      <div class="dropdown-menu">
        {#each languages as language}
          <button
            class="dropdown-item {$currentLanguage === language.code ? 'active' : ''}"
            onclick={() => selectLanguage(language.code)}
          >
            <span class="language-name">{language.name}</span>
            {#if $currentLanguage === language.code}
              <div class="check-mark">✓</div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .language-switcher {
    position: relative;
    z-index: 1000;
  }

  .language-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    height: 2.5rem;
    padding: 0 0.75rem;
    border-radius: 0.75rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    color: var(--color-surface-50);
    cursor: pointer;
    transition: all var(--timing-normal) var(--easing-default);
    position: relative;
    overflow: hidden;
  }

  .language-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-surface-50) 15%, transparent), transparent);
    transition: left var(--timing-slow) var(--easing-default);
  }

  .language-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      color-mix(in oklab, var(--color-surface-50) 10%, transparent) 0%, 
      color-mix(in oklab, var(--color-surface-50) 5%, transparent) 100%
    );
    opacity: 0;
    transition: opacity var(--timing-normal) var(--easing-default);
  }

  .language-btn:hover::before {
    left: 100%;
  }

  .language-btn:hover::after {
    opacity: 1;
  }

  .language-btn:hover {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 25%, transparent);
    transform: translateY(-1px);
    box-shadow: 
      0 8px 25px color-mix(in oklab, black 15%, transparent),
      0 0 20px color-mix(in oklab, var(--color-primary-500) 10%, transparent);
  }

  .language-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px color-mix(in oklab, black 10%, transparent);
  }

  .btn-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 1;
  }

  .language-label {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .btn-content :global(svg) {
    transition: transform var(--timing-fast) var(--easing-default);
  }

  .btn-content :global(.rotate-180) {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 120px;
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

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem;
    color: var(--color-surface-50);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--timing-fast) var(--easing-default);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .dropdown-item:hover {
    background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }

  .dropdown-item.active {
    background: color-mix(in oklab, var(--color-primary-500) 20%, transparent);
    color: var(--color-primary-400);
  }

  .dropdown-item.active:hover {
    background: color-mix(in oklab, var(--color-primary-500) 30%, transparent);
  }

  .language-name {
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
    .language-btn {
      min-width: 100px;
      height: 2rem;
      padding: 0 0.5rem;
    }

    .language-label {
      font-size: 0.8125rem;
    }

    .btn-content :global(svg) {
      width: 16px;
      height: 16px;
    }

    .dropdown-item {
      padding: 0.625rem;
      font-size: 0.8125rem;
    }
  }

  @media (max-width: 480px) {
    .language-btn {
      min-width: 2.5rem;
      width: 2.5rem;
      height: 2rem;
      padding: 0 0.25rem;
    }

    .language-label {
      display: none;
    }

    .btn-content {
      gap: 0.25rem;
    }

    .btn-content :global(svg) {
      width: 16px;
      height: 16px;
    }

    .dropdown-menu {
      right: 0;
      left: auto;
      min-width: 140px;
      max-width: calc(100vw - 2rem);
    }

    .dropdown-item {
      padding: 0.75rem 0.5rem;
      font-size: 0.875rem;
      min-height: 44px;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .language-btn {
      border-width: 2px;
      border-color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    }

    .dropdown-menu {
      border-width: 2px;
      border-color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    }

    .dropdown-item.active {
      background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .language-btn,
    .dropdown-item,
    .language-btn::before,
    .language-btn::after {
      transition: none;
    }
  }
</style> 