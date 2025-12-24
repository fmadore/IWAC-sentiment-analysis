<script lang="ts">
  import '../app.postcss';
  import { AppHeader } from '$lib/components/layout';
  import { PWAManager } from '$lib/components';

  let { children } = $props();
</script>

<AppHeader />

<div class="app-content">
  {@render children()}
</div>

<PWAManager />

<style>
  /* Main content wrapper - accounts for sidebar on desktop */
  .app-content {
    min-height: calc(100dvh - 4rem);
    transition: margin-left var(--timing-normal) var(--easing-default);
  }

  @media (min-width: 1024px) {
    .app-content {
      margin-left: 4.5rem; /* Matches collapsed sidebar width */
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .app-content {
      transition: none;
    }
  }
</style>

