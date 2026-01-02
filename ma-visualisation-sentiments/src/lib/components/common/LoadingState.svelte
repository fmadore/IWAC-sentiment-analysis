<!--
  LoadingState Component
  
  A reusable loading skeleton component that displays placeholder content
  while data is being fetched. Helps prevent Cumulative Layout Shift (CLS).
  
  Usage:
  <LoadingState message={$t.messages.loadingData} />
-->
<script lang="ts">
  import { t } from '$lib/i18n';

  interface LoadingStateProps {
    /** Custom loading message (defaults to i18n loading message) */
    message?: string;
    /** Number of filter skeleton items to show */
    filterCount?: number;
    /** Whether to show filters skeleton */
    showFilters?: boolean;
    /** Whether to show content skeleton */
    showContent?: boolean;
  }

  let { 
    message,
    filterCount = 5,
    showFilters = true,
    showContent = true
  }: LoadingStateProps = $props();

  // Use provided message or default to i18n
  let displayMessage = $derived(message ?? $t.messages.loadingData);
</script>

<div class="loading-container animate-fade-in">
  <!-- Header skeleton to prevent CLS -->
  <div class="skeleton h-32 rounded-lg mb-4 sm:mb-6"></div>
  
  <!-- Loading message -->
  <div class="alert alert-warning p-4 mb-4 sm:mb-6">{displayMessage}</div>
  
  <!-- Reserve space for filters -->
  {#if showFilters}
    <div class="filters-skeleton mb-4 sm:mb-6">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {#each Array(filterCount) as _, i (i)}
          <div class="skeleton h-10 rounded-lg"></div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Reserve space for content -->
  {#if showContent}
    <div class="content-skeleton">
      <div class="skeleton h-96 rounded-lg"></div>
    </div>
  {/if}
</div>

<style>
  .loading-container {
    width: 100%;
  }

  .filters-skeleton {
    width: 100%;
  }

  .content-skeleton {
    width: 100%;
  }
</style>
