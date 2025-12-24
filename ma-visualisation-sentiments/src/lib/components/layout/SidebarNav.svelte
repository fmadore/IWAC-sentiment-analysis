<script lang="ts">
  import { t } from '$lib/i18n';
  import { sidebarExpanded, activeView } from '$lib/stores';
  import ChartIcon from '@lucide/svelte/icons/bar-chart-2';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
  import AreaChartIcon from '@lucide/svelte/icons/area-chart';
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import TableIcon from '@lucide/svelte/icons/table';
  import GitCompareIcon from '@lucide/svelte/icons/git-compare';
  import FlameIcon from '@lucide/svelte/icons/flame';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import MenuIcon from '@lucide/svelte/icons/menu';
  import XIcon from '@lucide/svelte/icons/x';

  // Sidebar state
  let isMobileOpen = $state(false);

  function change(view: string) {
    if (view !== $activeView) $activeView = view;
    // Close mobile menu after selection
    if (isMobileOpen) isMobileOpen = false;
  }

  function toggleSidebar() {
    $sidebarExpanded = !$sidebarExpanded;
  }

  function toggleMobile() {
    isMobileOpen = !isMobileOpen;
  }

  const navItems = [
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

<!-- Mobile Toggle Button (fixed position) -->
<button 
  class="mobile-toggle"
  onclick={toggleMobile}
  aria-label={isMobileOpen ? 'Close navigation' : 'Open navigation'}
  aria-expanded={isMobileOpen}
>
  {#if isMobileOpen}
    <XIcon size={24} />
  {:else}
    <MenuIcon size={24} />
  {/if}
</button>

<!-- Mobile Overlay -->
{#if isMobileOpen}
  <button 
    class="mobile-overlay" 
    onclick={toggleMobile}
    aria-label="Close navigation"
  ></button>
{/if}

<!-- Sidebar Navigation -->
<nav 
  class="sidebar"
  class:expanded={$sidebarExpanded}
  class:mobile-open={isMobileOpen}
  aria-label="Main navigation"
>
  <!-- Desktop Toggle Button -->
  <button 
    class="toggle-btn desktop-only"
    onclick={toggleSidebar}
    aria-label={$sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
    aria-expanded={$sidebarExpanded}
  >
    {#if $sidebarExpanded}
      <ChevronLeftIcon size={18} />
    {:else}
      <ChevronRightIcon size={18} />
    {/if}
  </button>

  <!-- Navigation Items -->
  <div class="nav-items" role="navigation">
    {#each navItems as item (item.id)}
      <button 
        class="nav-item"
        data-state={$activeView === item.id ? 'active' : 'inactive'}
        onclick={() => change(item.id)}
        role="menuitem"
        aria-current={$activeView === item.id ? 'page' : undefined}
        title={!$sidebarExpanded ? ($t.nav[item.labelKey] || item.id) : undefined}
      >
        <span class="nav-icon">
          <item.icon size={20} />
        </span>
        <span class="nav-label">
          {$t.nav[item.labelKey] || item.id}
        </span>
      </button>
    {/each}
  </div>
</nav>

<style>
  /* ===== Mobile Toggle Button ===== */
  .mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    bottom: 1.5rem;
    left: 1.5rem;
    z-index: 60;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 1rem;
    background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 25%, transparent);
    color: white;
    box-shadow: 
      0 8px 32px color-mix(in oklab, var(--color-primary-500) 40%, transparent),
      0 4px 16px color-mix(in oklab, black 20%, transparent);
    cursor: pointer;
    transition: all var(--timing-normal) var(--easing-default);
  }

  .mobile-toggle:hover {
    transform: scale(1.05);
    box-shadow: 
      0 12px 40px color-mix(in oklab, var(--color-primary-500) 50%, transparent),
      0 6px 20px color-mix(in oklab, black 25%, transparent);
  }

  .mobile-toggle:active {
    transform: scale(0.95);
  }

  @media (min-width: 1024px) {
    .mobile-toggle {
      display: none;
    }
  }

  /* ===== Mobile Overlay ===== */
  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    background: color-mix(in oklab, black 60%, transparent);
    backdrop-filter: blur(4px);
    border: none;
    cursor: pointer;
  }

  @media (min-width: 1024px) {
    .mobile-overlay {
      display: none;
    }
  }

  /* ===== Sidebar Container ===== */
  .sidebar {
    position: fixed;
    top: 0; /* Full height starting from top */
    left: 0;
    z-index: 60; /* Higher than header (50) */
    height: 100dvh;
    padding-top: 1rem;
    
    /* Collapsed width */
    width: 4.5rem;
    
    /* Glass morphism styling */
    background: color-mix(in oklab, var(--color-surface-900) 92%, transparent);
    backdrop-filter: blur(var(--glass-blur-xl));
    border-right: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    box-shadow: 
      4px 0 24px color-mix(in oklab, black 8%, transparent),
      inset 1px 0 0 color-mix(in oklab, var(--color-surface-50) 5%, transparent);
    
    /* Smooth transition */
    transition: width var(--timing-normal) var(--easing-default),
                transform var(--timing-normal) var(--easing-default);
    
    /* Hidden on mobile by default */
    transform: translateX(-100%);
  }

  .sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 1px;
    background: linear-gradient(180deg, 
      var(--color-primary-500) 0%, 
      var(--color-secondary-500) 50%, 
      transparent 100%
    );
    opacity: 0.3;
  }

  /* Expanded state */
  .sidebar.expanded {
    width: 14rem;
  }

  /* Mobile open state */
  .sidebar.mobile-open {
    transform: translateX(0);
    width: 16rem;
  }

  /* Desktop: always visible */
  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
    }
  }

  /* ===== Toggle Button (Desktop) ===== */
  .toggle-btn {
    position: absolute;
    top: 1.5rem;
    right: -0.75rem;
    z-index: 10;
    
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    
    border-radius: 50%;
    background: var(--color-surface-800);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    cursor: pointer;
    
    transition: all var(--timing-fast) var(--easing-default);
  }

  .toggle-btn:hover {
    background: var(--color-surface-700);
    color: var(--color-surface-50);
    border-color: color-mix(in oklab, var(--color-surface-50) 25%, transparent);
  }

  .desktop-only {
    display: none;
  }

  @media (min-width: 1024px) {
    .desktop-only {
      display: flex;
    }
  }

  /* ===== Navigation Items Container ===== */
  .nav-items {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    overflow-y: auto;
    max-height: calc(100dvh - 2rem);
  }

  /* ===== Navigation Item ===== */
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.75rem;
    
    background: transparent;
    border: 1px solid transparent;
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    
    font-weight: 500;
    font-size: 0.875rem;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
    
    transition: all var(--timing-normal) var(--easing-default);
  }

  .nav-item:hover {
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    color: var(--color-surface-50);
    transform: translateX(2px);
  }

  .nav-item[data-state="active"] {
    background: linear-gradient(135deg, 
      color-mix(in oklab, var(--color-primary-500) 25%, transparent) 0%, 
      color-mix(in oklab, var(--color-secondary-500) 20%, transparent) 100%
    );
    border-color: color-mix(in oklab, var(--color-primary-400) 40%, transparent);
    color: var(--color-surface-50);
    box-shadow: 
      0 4px 16px color-mix(in oklab, var(--color-primary-500) 20%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }

  .nav-item[data-state="active"] .nav-icon {
    color: var(--color-primary-400);
  }

  .nav-item[data-state="active"]:hover {
    transform: translateX(2px);
    box-shadow: 
      0 6px 20px color-mix(in oklab, var(--color-primary-500) 30%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
  }

  /* ===== Icon ===== */
  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    transition: color var(--timing-fast) var(--easing-default);
  }

  /* ===== Label ===== */
  .nav-label {
    opacity: 0;
    width: 0;
    overflow: hidden;
    transition: opacity var(--timing-normal) var(--easing-default),
                width var(--timing-normal) var(--easing-default);
  }

  .sidebar.expanded .nav-label,
  .sidebar.mobile-open .nav-label {
    opacity: 1;
    width: auto;
  }

  /* ===== Reduced Motion ===== */
  @media (prefers-reduced-motion: reduce) {
    .sidebar,
    .nav-item,
    .toggle-btn,
    .mobile-toggle,
    .nav-label {
      transition: none;
    }
  }
</style>
