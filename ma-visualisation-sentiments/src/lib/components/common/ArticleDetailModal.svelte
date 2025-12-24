<!--
  ArticleDetailModal Component
  
  A reusable modal component for displaying article details with glass morphism styling.
  Supports keyboard navigation (Escape to close) and click-outside-to-close.
  
  Usage:
  <ArticleDetailModal 
    article={selectedArticle} 
    open={showModal} 
    onClose={() => showModal = false} 
  />
-->
<script lang="ts">
  import type { Article } from '$lib/types/data';
  import { t } from '$lib/i18n';
  import { ArticleDetail } from '$lib/components/data-display';
  import XIcon from '@lucide/svelte/icons/x';

  interface ArticleDetailModalProps {
    /** The article to display */
    article: Article | null;
    /** Whether the modal is open */
    open: boolean;
    /** Callback when the modal should close */
    onClose: () => void;
    /** Maximum height of the modal (defaults to window height - 100) */
    maxHeight?: number;
  }

  let { 
    article, 
    open, 
    onClose,
    maxHeight
  }: ArticleDetailModalProps = $props();

  // Calculate max height dynamically
  let calculatedMaxHeight = $derived(
    maxHeight ?? (typeof window !== 'undefined' ? Math.min(window.innerHeight - 100, 800) : 800)
  );

  function handleBackdropClick() {
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  }

  function handleContentClick(e: MouseEvent) {
    e.stopPropagation();
  }
</script>

{#if open && article}
  <!-- Modal backdrop with proper glass effect -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="modal-backdrop glass-heavy" 
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    aria-label={$t.common.close}
    role="button"
    tabindex="0"
  >
    <!-- Modal container with enhanced positioning -->
    <div 
      class="modal-container"
      onclick={handleContentClick}
      role="document"
      tabindex="-1"
    >
      <!-- Enhanced modal with proper Skeleton classes -->
      <div class="details-modal preset-glass hover-lift" 
        style="max-height: {calculatedMaxHeight}px;">
        
        <!-- Header with gradient accent -->
        <div class="details-header preset-glass-sm">
          <h2 class="h3 m-0 text-white text-gradient-primary">{$t.article.details}</h2>
          <button 
            class="btn-icon preset-tonal-surface hover-glow" 
            onclick={onClose} 
            title={$t.common.close}
            aria-label={$t.common.close}
          >
            <XIcon size={20} />
          </button>
        </div>
        
        <!-- Content with custom scrollbar -->
        <div class="details-content custom-scrollbar">
          <ArticleDetail {article} />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Enhanced Modal System with modern color-mix */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: color-mix(in oklab, var(--color-surface-900) 80%, transparent);
    backdrop-filter: blur(var(--glass-blur-sm));
    animation: fadeIn var(--timing-normal) var(--easing-default);
  }
  
  .modal-container {
    width: 100%;
    max-width: 900px;
    max-height: 95vh;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: slideUp var(--timing-normal) var(--easing-default);
  }
  
  .details-modal {
    width: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 1rem;
    overflow: hidden;
    position: relative;
    background: color-mix(in oklab, var(--color-surface-900) 90%, transparent);
    backdrop-filter: blur(var(--glass-blur-lg));
    box-shadow: 
      0 16px 64px color-mix(in oklab, black 30%, transparent),
      0 0 40px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
  }
  
  .details-modal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent, 
      var(--color-primary-500), 
      var(--color-secondary-500), 
      transparent
    );
    opacity: 0.6;
    z-index: 1;
  }
  
  .details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    background: color-mix(in oklab, var(--color-surface-50) 4%, transparent);
    position: relative;
    z-index: 2;
  }
  
  .details-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: color-mix(in oklab, var(--color-surface-950) 50%, transparent);
  }
  
  /* Note: @keyframes fadeIn, slideUp and .btn-icon are defined globally in app.postcss */
  
  /* Enhanced Mobile Responsiveness */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }
    
    .modal-container {
      max-width: 100%;
      max-height: 100vh;
    }
    
    .details-modal {
      border-radius: 0.75rem;
      max-height: 95vh !important;
    }
    
    .details-header {
      padding: 1rem 1.25rem;
    }
    
    .details-content {
      padding: 0.75rem;
    }
  }
  
  @media (max-width: 480px) {
    .modal-backdrop {
      padding: 0.25rem;
    }
    
    .details-modal {
      border-radius: 0.625rem;
      max-height: 98vh !important;
    }
    
    .details-header {
      padding: 0.75rem 1rem;
    }
    
    .details-header .h3 {
      font-size: 1.125rem;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .modal-backdrop,
    .modal-container {
      transition: none;
      animation: none;
    }
  }
</style>
