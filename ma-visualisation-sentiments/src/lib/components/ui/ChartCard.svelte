<script lang="ts">
  import type { Snippet } from 'svelte';

  interface ChartCardProps {
    title?: string;
    subtitle?: string;
    variant?: 'default' | 'large' | 'extreme';
    children: Snippet;
    header?: Snippet;
  }

  let { 
    title, 
    subtitle, 
    variant = 'default',
    children,
    header
  }: ChartCardProps = $props();
</script>

<div class="chart-card" data-variant={variant}>
  {#if title || header}
    <div class="chart-card-header">
      {#if header}
        {@render header()}
      {:else if title}
        <div class="header-content">
          <h2 class="chart-title">{title}</h2>
          {#if subtitle}
            <p class="chart-subtitle">{subtitle}</p>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  <div class="chart-card-body">
    {@render children()}
  </div>
</div>

<style>
  .chart-card {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 1rem;
    box-shadow: 
      0 4px 24px color-mix(in oklab, black 10%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    overflow: hidden;
    transition: all var(--timing-normal) var(--easing-default);
  }

  .chart-card:hover {
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    transform: translateY(-2px);
    box-shadow: 
      0 8px 32px color-mix(in oklab, black 15%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
  }

  .chart-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 8%, transparent);
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .chart-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .chart-subtitle {
    font-size: 0.8125rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
    margin: 0;
  }

  .chart-card-body {
    padding: 1.25rem;
  }

  /* Large variant */
  .chart-card[data-variant="large"] {
    min-height: 500px;
  }

  .chart-card[data-variant="large"] .chart-card-header {
    padding: 1.25rem 1.5rem;
  }

  .chart-card[data-variant="large"] .chart-title {
    font-size: 1.25rem;
  }

  .chart-card[data-variant="large"] .chart-card-body {
    padding: 1.5rem;
  }

  /* Extreme variant - for the extreme analysis view */
  .chart-card[data-variant="extreme"] {
    min-height: 850px;
  }

  .chart-card[data-variant="extreme"] .chart-card-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }

  .chart-card[data-variant="extreme"] .chart-title {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD23F 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .chart-card[data-variant="extreme"] .chart-subtitle {
    font-size: 0.9375rem;
    max-width: 800px;
    line-height: 1.5;
  }

  .chart-card[data-variant="extreme"] .chart-card-body {
    padding: 2rem;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .chart-card-header {
      padding: 0.75rem 1rem;
    }

    .chart-title {
      font-size: 1rem;
    }

    .chart-card-body {
      padding: 0.75rem;
    }

    .chart-card[data-variant="extreme"] .chart-card-header {
      padding: 1rem 1.25rem;
    }

    .chart-card[data-variant="extreme"] .chart-title {
      font-size: 1.375rem;
    }

    .chart-card[data-variant="extreme"] .chart-card-body {
      padding: 1rem;
    }
  }

  @media (min-width: 1024px) {
    .chart-card[data-variant="extreme"] {
      min-height: 950px;
    }

    .chart-card[data-variant="extreme"] .chart-title {
      font-size: 2rem;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .chart-card {
      transition: none;
    }
  }
</style>
