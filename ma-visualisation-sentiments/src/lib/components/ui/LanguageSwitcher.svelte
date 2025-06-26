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
          style="transition: transform 0.2s ease;"
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
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    transition: left 0.5s ease;
  }

  .language-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.1) 0%, 
      rgba(255, 255, 255, 0.05) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .language-btn:hover::before {
    left: 100%;
  }

  .language-btn:hover::after {
    opacity: 1;
  }

  .language-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.15),
      0 0 20px rgba(59, 130, 246, 0.1);
  }

  .language-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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



  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 120px;
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
    z-index: 1002; /* Ensure dropdown is above everything */
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
    color: white;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .dropdown-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .dropdown-item.active {
    background: rgba(59, 130, 246, 0.2);
    color: #60A5FA;
  }

  .dropdown-item.active:hover {
    background: rgba(59, 130, 246, 0.3);
  }

  .language-name {
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
      min-width: 2.5rem; /* Just enough for icon + chevron */
      width: 2.5rem;
      height: 2rem;
      padding: 0 0.25rem;
    }

    .language-label {
      display: none; /* Hide text on very small screens */
    }

    .btn-content {
      gap: 0.25rem; /* Reduce gap when text is hidden */
    }

    .btn-content :global(svg) {
      width: 16px;
      height: 16px;
    }

    .dropdown-menu {
      /* Better mobile positioning */
      right: 0;
      left: auto;
      min-width: 140px;
      max-width: calc(100vw - 2rem);
    }

    .dropdown-item {
      padding: 0.75rem 0.5rem; /* Better touch targets */
      font-size: 0.875rem; /* Larger text for readability */
      min-height: 44px; /* iOS recommended touch target */
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .language-btn {
      border-width: 2px;
      border-color: rgba(255, 255, 255, 0.8);
    }

    .dropdown-menu {
      border-width: 2px;
      border-color: rgba(255, 255, 255, 0.8);
    }

    .dropdown-item.active {
      background: rgba(59, 130, 246, 0.4);
    }
  }

  /* Animation for smooth transitions */
  @media (prefers-reduced-motion: no-preference) {
    .language-btn,
    .dropdown-item {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }


  }
</style> 