<script lang="ts">
  import { t } from '$lib/i18n';
  import ChartIcon from '@lucide/svelte/icons/bar-chart-2';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
  import AreaChartIcon from '@lucide/svelte/icons/area-chart';
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import TableIcon from '@lucide/svelte/icons/table';
  import GitCompareIcon from '@lucide/svelte/icons/git-compare';
  import FlameIcon from '@lucide/svelte/icons/flame';

  let { activeView, onChange } = $props<{ activeView: string; onChange: (view: string) => void }>();
  function change(view: string) { if (view !== activeView) onChange(view); }

  const tabs = [
    { id: 'charts', icon: ChartIcon, labelKey: 'charts' as const },
    { id: 'trends', icon: TrendingUpIcon, labelKey: 'trends' as const },
    { id: 'correlation', icon: BarChart3Icon, labelKey: 'distribution' as const },
    { id: 'volume', icon: AreaChartIcon, labelKey: 'volume' as const },
    { id: 'heatmap', icon: ActivityIcon, labelKey: 'heatmap' as const },
    { id: 'table', icon: TableIcon, labelKey: 'table' as const },
    { id: 'comparison', icon: GitCompareIcon, labelKey: 'comparison' as const },
    { id: 'extremes', icon: FlameIcon, labelKey: 'extremes' as const },
  ];
</script>

<nav class="nav-container" aria-label="View navigation">
  <!-- Desktop: Single row -->
  <div class="nav-desktop" role="tablist">
    {#each tabs as tab (tab.id)}
      <button 
        class="nav-tab" 
        data-state={activeView === tab.id ? 'active' : 'inactive'}
        onclick={() => change(tab.id)}
        role="tab"
        aria-selected={activeView === tab.id}
      >
        <tab.icon size={18} />
        <span>{$t.nav[tab.labelKey] || tab.id}</span>
      </button>
    {/each}
  </div>

  <!-- Tablet: Two rows -->
  <div class="nav-tablet" role="tablist">
    <div class="nav-tablet-row">
      {#each tabs.slice(0, 4) as tab (tab.id)}
        <button 
          class="nav-tab" 
          data-state={activeView === tab.id ? 'active' : 'inactive'}
          onclick={() => change(tab.id)}
          role="tab"
          aria-selected={activeView === tab.id}
        >
          <tab.icon size={16} />
          <span>{$t.nav[tab.labelKey] || tab.id}</span>
        </button>
      {/each}
    </div>
    <div class="nav-tablet-row">
      {#each tabs.slice(4) as tab (tab.id)}
        <button 
          class="nav-tab" 
          data-state={activeView === tab.id ? 'active' : 'inactive'}
          onclick={() => change(tab.id)}
          role="tab"
          aria-selected={activeView === tab.id}
        >
          <tab.icon size={16} />
          <span>{$t.nav[tab.labelKey] || tab.id}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Mobile: Horizontal scroll -->
  <div class="nav-mobile" role="tablist">
    {#each tabs as tab (tab.id)}
      <button 
        class="nav-tab-mobile" 
        data-state={activeView === tab.id ? 'active' : 'inactive'}
        onclick={() => change(tab.id)}
        role="tab"
        aria-selected={activeView === tab.id}
      >
        <tab.icon size={18} />
        <span>{$t.nav[tab.labelKey] || tab.id}</span>
      </button>
    {/each}
  </div>
</nav>

<style>
  /* Navigation Container */
  .nav-container {
    background: color-mix(in oklab, var(--color-surface-900) 90%, transparent);
    backdrop-filter: blur(var(--glass-blur-lg));
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    box-shadow: 
      0 4px 24px color-mix(in oklab, black 10%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    padding: 1rem;
    margin-bottom: 1.5rem;
    position: relative;
  }

  .nav-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 10%, var(--color-surface-50) 50%, transparent 90%);
    opacity: 0.2;
  }

  /* Desktop Layout */
  .nav-desktop {
    display: none;
    justify-content: center;
    gap: 0.5rem;
  }

  @media (min-width: 1024px) {
    .nav-desktop { display: flex; }
    .nav-tablet { display: none !important; }
    .nav-mobile { display: none !important; }
  }

  /* Tablet Layout */
  .nav-tablet {
    display: none;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }

  .nav-tablet-row {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .nav-tablet { display: flex; }
    .nav-mobile { display: none !important; }
  }

  /* Mobile Layout */
  .nav-mobile {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .nav-mobile::-webkit-scrollbar { display: none; }

  @media (min-width: 768px) {
    .nav-mobile { display: none; }
  }

  /* Tab Button - Desktop/Tablet */
  .nav-tab {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    border-radius: 0.625rem;
    background: color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 85%, transparent);
    font-weight: 500;
    font-size: 0.8125rem;
    white-space: nowrap;
    cursor: pointer;
    transition: all var(--timing-normal) var(--easing-default);
  }

  .nav-tab:hover {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 18%, transparent);
    color: var(--color-surface-50);
    transform: translateY(-2px);
  }

  .nav-tab[data-state="active"] {
    background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%);
    border-color: color-mix(in oklab, var(--color-surface-50) 25%, transparent);
    color: white;
    box-shadow: 
      0 4px 16px color-mix(in oklab, var(--color-primary-500) 30%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    transform: translateY(-1px);
  }

  .nav-tab[data-state="active"]:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 6px 24px color-mix(in oklab, var(--color-primary-500) 40%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 20%, transparent);
  }

  /* Tab Button - Mobile */
  .nav-tab-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: 0.625rem;
    background: color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 85%, transparent);
    font-weight: 500;
    font-size: 0.75rem;
    white-space: nowrap;
    min-width: 72px;
    flex-shrink: 0;
    cursor: pointer;
    transition: all var(--timing-normal) var(--easing-default);
  }

  .nav-tab-mobile:hover {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 18%, transparent);
    color: var(--color-surface-50);
    transform: translateY(-2px);
  }

  .nav-tab-mobile[data-state="active"] {
    background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%);
    border-color: color-mix(in oklab, var(--color-surface-50) 25%, transparent);
    color: white;
    box-shadow: 
      0 4px 16px color-mix(in oklab, var(--color-primary-500) 30%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    transform: translateY(-1px);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .nav-tab,
    .nav-tab-mobile {
      transition: none;
    }
  }
</style>
