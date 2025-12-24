<!--
  FullScreenModal Component
  
  A full-screen modal component with glass morphism styling for detailed views.
  Provides a rich, immersive experience for article and comparison details.
  
  Features:
  - Full viewport coverage with glass morphism backdrop
  - Responsive header with title, subtitle, and close button
  - Scrollable content area with custom scrollbar
  - Keyboard navigation (Escape to close)
  - Reduced motion support
  
  Usage:
  <FullScreenModal 
    open={showModal} 
    onClose={() => showModal = false}
    title="Article Details"
    subtitle="Optional subtitle"
  >
    <YourContentComponent />
  </FullScreenModal>
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import XIcon from '@lucide/svelte/icons/x';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  interface FullScreenModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when the modal should close */
    onClose: () => void;
    /** Title displayed in the header */
    title: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Optional header icon snippet */
    headerIcon?: Snippet;
    /** Optional header actions snippet (buttons, badges, etc.) */
    headerActions?: Snippet;
    /** The main content of the modal */
    children: Snippet;
    /** Accent color variant for the header line */
    accentVariant?: 'primary' | 'comparison' | 'extreme' | 'arbiter';
  }

  let { 
    open, 
    onClose,
    title,
    subtitle,
    headerIcon,
    headerActions,
    children,
    accentVariant = 'primary'
  }: FullScreenModalProps = $props();

  // Handle keyboard events
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  // Prevent scroll on body when modal is open
  $effect(() => {
    if (open && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="fullscreen-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <!-- Glass backdrop -->
    <div class="modal-backdrop" aria-hidden="true"></div>
    
    <!-- Modal container -->
    <div class="modal-container">
      <!-- Header with accent line -->
      <header class="modal-header" data-accent={accentVariant}>
        <div class="header-content">
          <!-- Back button and title -->
          <div class="header-left">
            <button 
              class="back-button"
              onclick={onClose}
              title="Close"
              aria-label="Close modal"
            >
              <ArrowLeftIcon size={20} />
              <span class="back-text">Back</span>
            </button>
            
            <div class="header-title-group">
              {#if headerIcon}
                <div class="header-icon">
                  {@render headerIcon()}
                </div>
              {/if}
              <div class="header-text">
                <h1 id="modal-title" class="modal-title">{title}</h1>
                {#if subtitle}
                  <p class="modal-subtitle">{subtitle}</p>
                {/if}
              </div>
            </div>
          </div>
          
          <!-- Header actions -->
          <div class="header-right">
            {#if headerActions}
              <div class="header-actions">
                {@render headerActions()}
              </div>
            {/if}
            <button 
              class="close-button"
              onclick={onClose}
              title="Close"
              aria-label="Close modal"
            >
              <XIcon size={24} />
            </button>
          </div>
        </div>
      </header>
      
      <!-- Scrollable content area -->
      <main class="modal-content custom-scrollbar">
        <div class="content-wrapper">
          {@render children()}
        </div>
      </main>
    </div>
  </div>
{/if}

<style>
  .fullscreen-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }

  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: color-mix(in oklab, var(--color-surface-950) 95%, transparent);
    backdrop-filter: blur(var(--glass-blur-xl));
    animation: fadeIn var(--timing-normal) var(--easing-default);
  }

  .modal-container {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    animation: slideUp var(--timing-normal) var(--easing-default);
  }

  /* Header styles */
  .modal-header {
    position: relative;
    flex-shrink: 0;
    background: color-mix(in oklab, var(--color-surface-900) 90%, transparent);
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
  }

  /* Accent line variants */
  .modal-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0.8;
  }

  .modal-header[data-accent="primary"]::before {
    background: var(--gradient-header);
  }

  .modal-header[data-accent="comparison"]::before {
    background: var(--gradient-comparison);
  }

  .modal-header[data-accent="extreme"]::before {
    background: var(--gradient-extreme);
  }

  .modal-header[data-accent="arbiter"]::before {
    background: linear-gradient(90deg, 
      var(--sentiment-arbiter), 
      var(--sentiment-arbiter-light), 
      var(--sentiment-arbiter)
    );
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    min-width: 0;
    flex: 1;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    color: var(--color-surface-50);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--timing-fast) var(--easing-default);
    flex-shrink: 0;
  }

  .back-button:hover {
    background: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    transform: translateX(-2px);
  }

  .back-text {
    display: none;
  }

  .header-title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .header-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-primary-500) 25%, transparent);
  }

  .header-text {
    min-width: 0;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-surface-50);
    line-height: 1.3;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .modal-subtitle {
    font-size: 0.8125rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
    margin: 0.25rem 0 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    color: var(--color-surface-50);
    cursor: pointer;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .close-button:hover {
    background: color-mix(in oklab, var(--color-error-500) 20%, transparent);
    border-color: color-mix(in oklab, var(--color-error-500) 40%, transparent);
    color: var(--color-error-400);
  }

  /* Content area */
  .modal-content {
    flex: 1;
    overflow-y: auto;
    background: color-mix(in oklab, var(--color-surface-950) 60%, transparent);
  }

  .content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  /* Responsive adjustments */
  @media (min-width: 640px) {
    .back-text {
      display: inline;
    }

    .header-content {
      padding: 1.25rem 2rem;
    }

    .modal-title {
      font-size: 1.5rem;
    }

    .content-wrapper {
      padding: 2rem;
    }
  }

  @media (min-width: 1024px) {
    .header-content {
      padding: 1.5rem 3rem;
    }

    .content-wrapper {
      padding: 2.5rem 3rem;
    }
  }

  /* Mobile optimizations */
  @media (max-width: 480px) {
    .header-content {
      padding: 0.75rem 1rem;
      gap: 0.5rem;
    }

    .header-left {
      gap: 0.75rem;
    }

    .back-button {
      padding: 0.5rem;
    }

    .header-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .modal-title {
      font-size: 1rem;
    }

    .modal-subtitle {
      font-size: 0.75rem;
    }

    .close-button {
      width: 36px;
      height: 36px;
    }

    .content-wrapper {
      padding: 1rem;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .modal-backdrop,
    .modal-container,
    .back-button,
    .close-button {
      animation: none;
      transition: none;
    }
  }

  /* Animations (defined in app.postcss but included here for completeness) */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(10px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
