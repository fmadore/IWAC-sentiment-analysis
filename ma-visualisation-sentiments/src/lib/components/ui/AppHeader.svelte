<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
  import FullscreenIcon from '@lucide/svelte/icons/maximize';
  import MinimizeIcon from '@lucide/svelte/icons/minimize';
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import DatasetPicker from './DatasetPicker.svelte';

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
    // Listen for fullscreen change events
    document.addEventListener('fullscreenchange', () => {
      isFullscreen = !!document.fullscreenElement;
    });
  });
</script>

<AppBar
  background="bg-transparent"
  shadow=""
  padding="p-0"
  classes="sticky top-0 z-10 app-header"
>
  {#snippet headline()}
    <div class="flex items-center justify-between w-full px-4 py-3">
      <!-- Logo/Brand Section -->
      <div class="flex items-center gap-4">
        <div class="brand-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#gradient)" />
            <path d="M8 12h16M8 16h12M8 20h8" stroke="white" stroke-width="2" stroke-linecap="round" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3B82F6" />
                <stop offset="100%" style="stop-color:#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-title">{$t.appTitle}</span>
          <span class="brand-subtitle hidden sm:block">{$t.appSubtitle}</span>
        </div>
      </div>

      <!-- Center Section with Dataset Picker -->
      <div class="center-section hidden md:flex items-center justify-center flex-1">
        <DatasetPicker />
      </div>

      <!-- Actions Section -->
      <div class="header-actions">
        <div class="md:hidden">
          <DatasetPicker />
        </div>
        <LanguageSwitcher />
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
      </div>
    </div>
  {/snippet}
</AppBar>

<style>
  /* Brand Section */
  .brand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .brand-icon::before {
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

  .brand-icon:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.15),
      0 0 20px rgba(59, 130, 246, 0.1);
  }

  .brand-icon:hover::before {
    opacity: 1;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .brand-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  .brand-subtitle {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.3;
    max-width: 280px;
  }

  /* Actions Section */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .fullscreen-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
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

  .fullscreen-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    transition: left 0.5s ease;
  }

  .fullscreen-btn::after {
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

  .fullscreen-btn:hover::before {
    left: 100%;
  }

  .fullscreen-btn:hover::after {
    opacity: 1;
  }

  .fullscreen-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.15),
      0 0 20px rgba(59, 130, 246, 0.1);
  }

  .fullscreen-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  /* Global App Header Styles */
  :global(.app-header) {
    background: rgba(30, 41, 59, 0.85);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    position: relative;
    padding: 0 !important;
  }

  /* Force override any Skeleton AppBar default padding */
  :global(.app-header > *) {
    padding: 0 !important;
  }

  :global(.app-header::before) {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(59, 130, 246, 0.4), 
      rgba(139, 92, 246, 0.4), 
      transparent
    );
  }

  :global(.app-header::after) {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(59, 130, 246, 0.08) 0%, 
      rgba(139, 92, 246, 0.06) 50%,
      rgba(16, 185, 129, 0.04) 100%
    );
    pointer-events: none;
    z-index: -1;
  }

  /* Responsive Design */
  @media (max-width: 640px) {
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
  }

  @media (max-width: 480px) {
    .brand-icon {
      width: 1.75rem;
      height: 1.75rem;
    }

    .brand-icon svg {
      width: 20px;
      height: 20px;
    }

    .fullscreen-btn {
      width: 2rem; /* Match other buttons */
      height: 2rem;
    }

    .fullscreen-btn :global(svg) {
      width: 16px;
      height: 16px;
    }

    .brand-title {
      font-size: 0.9rem;
    }

    .header-actions {
      gap: 0.25rem; /* Reduce gap between buttons on very small screens */
    }
  }

  /* Medium screens optimization */
  @media (min-width: 641px) and (max-width: 1024px) {
    .brand-title {
      font-size: 1.125rem;
    }

    .brand-subtitle {
      font-size: 0.6875rem;
      max-width: 240px;
    }
  }

  /* Large screens enhancement */
  @media (min-width: 1025px) {
    .brand-title {
      font-size: 1.375rem;
    }

    .brand-subtitle {
      font-size: 0.8125rem;
      max-width: 320px;
    }
  }

  /* Animation for smooth transitions */
  @media (prefers-reduced-motion: no-preference) {
    .brand-icon,
    .fullscreen-btn {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .brand-title,
    .brand-subtitle {
      transition: color 0.2s ease;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .brand-icon,
    .fullscreen-btn {
      border-width: 2px;
      border-color: rgba(255, 255, 255, 0.8);
    }

    .brand-title {
      color: #ffffff;
    }

    .brand-subtitle {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  /* Center section styles */
  .center-section {
    padding: 0 1rem;
  }
</style> 