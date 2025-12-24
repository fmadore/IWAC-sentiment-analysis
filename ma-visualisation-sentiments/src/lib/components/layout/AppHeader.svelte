<script lang="ts">
  import FullscreenIcon from '@lucide/svelte/icons/maximize';
  import MinimizeIcon from '@lucide/svelte/icons/minimize';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { t } from '$lib/i18n';
  import { LanguageSwitcher, DatasetPicker } from '$lib/components/ui';

  let isFullscreen = $state(false);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  onMount(() => {
    // Set initial fullscreen state
    isFullscreen = !!document.fullscreenElement;
    // Listen for fullscreen change events
    document.addEventListener('fullscreenchange', () => {
      isFullscreen = !!document.fullscreenElement;
    });
  });
</script>

<header class="app-header sticky top-0 z-10">
  <div class="header-toolbar">
    <!-- Lead: Logo/Brand Section -->
    <div class="header-lead">
      <div class="brand-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="url(#header-gradient)" />
          <path d="M8 12h16M8 16h12M8 20h8" stroke="white" stroke-width="2" stroke-linecap="round" />
          <defs>
            <linearGradient id="header-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--color-primary-500)" />
              <stop offset="100%" stop-color="var(--color-secondary-500)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-title">{$t.appTitle}</span>
        <span class="brand-subtitle hidden sm:block">{$t.appSubtitle}</span>
      </div>
    </div>

    <!-- Headline: Center Section with Dataset Picker (desktop only) -->
    <div class="header-headline hidden md:flex">
      <DatasetPicker />
    </div>

    <!-- Trail: Actions Section -->
    <div class="header-trail">
      <div class="md:hidden">
        <DatasetPicker />
      </div>
      <LanguageSwitcher />
      {#if browser}
        <button
          class="fullscreen-btn"
          onclick={toggleFullscreen}
          title={isFullscreen ? $t.exitFullscreen : $t.enterFullscreen}
          aria-label={isFullscreen ? $t.exitFullscreen : $t.enterFullscreen}
        >
          <div class="btn-content">
            {#if isFullscreen}
              <MinimizeIcon size={20} />
            {:else}
              <FullscreenIcon size={20} />
            {/if}
          </div>
        </button>
      {/if}
    </div>
  </div>
</header>

<style>
  /* App Header Container - using modern color-mix */
  .app-header {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    box-shadow: 
      0 4px 24px color-mix(in oklab, black 10%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    position: relative;
  }

  .app-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 10%, 
      var(--color-primary-500) 40%, 
      var(--color-secondary-500) 60%, 
      transparent 90%
    );
    opacity: 0.5;
  }

  /* Header Toolbar - Grid Layout */
  .header-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    max-width: 1400px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  /* On md and up, use grid for proper 3-column centering */
  @media (min-width: 768px) {
    .header-toolbar {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
    }
  }

  /* Lead Section */
  .header-lead {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Headline Section (Center) */
  /* Note: display is controlled by Tailwind's hidden/md:flex classes */
  .header-headline {
    align-items: center;
    justify-content: center;
  }

  /* Trail Section */
  .header-trail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  /* Brand Section */
  .brand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    transition: all var(--timing-normal, 0.2s) ease;
    flex-shrink: 0;
  }

  .brand-icon:hover {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px color-mix(in oklab, var(--color-primary-500) 20%, transparent);
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .brand-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-surface-50);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .brand-subtitle {
    font-size: 0.75rem;
    font-weight: 500;
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    line-height: 1.3;
    max-width: 280px;
  }

  /* Fullscreen Button - using btn-icon pattern */
  .fullscreen-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    cursor: pointer;
    transition: all var(--timing-normal, 0.2s) ease;
    flex-shrink: 0;
  }

  .fullscreen-btn:hover {
    background: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    color: var(--color-surface-50);
    transform: translateY(-1px);
  }

  .fullscreen-btn:active {
    transform: translateY(0);
  }

  .btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .header-toolbar {
      padding: 0.5rem 0.75rem;
      gap: 0.5rem;
    }

    .header-lead {
      gap: 0.5rem;
    }

    .brand-icon {
      width: 2rem;
      height: 2rem;
    }

    .brand-icon svg {
      width: 24px;
      height: 24px;
    }

    .fullscreen-btn {
      width: 2rem;
      height: 2rem;
    }

    .brand-title {
      font-size: 1rem;
    }

    .header-trail {
      gap: 0.375rem;
    }
  }

  @media (max-width: 480px) {
    .header-toolbar {
      padding: 0.5rem;
      gap: 0.25rem;
    }

    .header-lead {
      gap: 0.375rem;
    }

    .brand-icon {
      width: 1.75rem;
      height: 1.75rem;
    }

    .brand-icon svg {
      width: 20px;
      height: 20px;
    }

    .brand-title {
      font-size: 0.9rem;
    }

    .header-trail {
      gap: 0.25rem;
    }
  }

  /* Large screens enhancement */
  @media (min-width: 1024px) {
    .header-toolbar {
      padding: 0.875rem 2rem;
      gap: 1.5rem;
    }

    .brand-icon {
      width: 2.75rem;
      height: 2.75rem;
    }

    .brand-title {
      font-size: 1.375rem;
    }

    .brand-subtitle {
      font-size: 0.8125rem;
      max-width: 320px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .brand-icon,
    .fullscreen-btn {
      transition: none;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .brand-icon,
    .fullscreen-btn {
      border-width: 2px;
    }
  }
</style> 