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
</script>

<nav class="navigation-root">
  <div class="hidden lg:flex items-center justify-center">
    <div class="flex space-x-2">
      <button class="nav-tab-compact {activeView === 'charts' ? 'active' : ''}" onclick={() => change('charts')}><ChartIcon size={18} /> <span>{$t.nav.charts}</span></button>
      <button class="nav-tab-compact {activeView === 'trends' ? 'active' : ''}" onclick={() => change('trends')}><TrendingUpIcon size={18} /> <span>{$t.nav.trends}</span></button>
      <button class="nav-tab-compact {activeView === 'correlation' ? 'active' : ''}" onclick={() => change('correlation')}><BarChart3Icon size={18} /> <span>{$t.nav.distribution}</span></button>
      <button class="nav-tab-compact {activeView === 'volume' ? 'active' : ''}" onclick={() => change('volume')}><AreaChartIcon size={18} /> <span>{$t.nav.volume}</span></button>
      <button class="nav-tab-compact {activeView === 'heatmap' ? 'active' : ''}" onclick={() => change('heatmap')}><ActivityIcon size={18} /> <span>{$t.nav.heatmap}</span></button>
      <button class="nav-tab-compact {activeView === 'table' ? 'active' : ''}" onclick={() => change('table')}><TableIcon size={18} /> <span>{$t.nav.table}</span></button>
      <button class="nav-tab-compact {activeView === 'comparison' ? 'active' : ''}" onclick={() => change('comparison')}><GitCompareIcon size={18} /> <span>{$t.nav.comparison || 'Compare'}</span></button>
      <button class="nav-tab-compact {activeView === 'extremes' ? 'active' : ''}" onclick={() => change('extremes')}><FlameIcon size={18} /> <span>{$t.nav.extremes}</span></button>
    </div>
  </div>
  <div class="hidden md:flex lg:hidden items-center justify-center">
    <div class="flex flex-col gap-2">
      <div class="flex space-x-2 justify-center">
        <button class="nav-tab-compact {activeView === 'charts' ? 'active' : ''}" onclick={() => change('charts')}><ChartIcon size={16} /> <span class="text-sm">{$t.nav.charts}</span></button>
        <button class="nav-tab-compact {activeView === 'trends' ? 'active' : ''}" onclick={() => change('trends')}><TrendingUpIcon size={16} /> <span class="text-sm">{$t.nav.trends}</span></button>
        <button class="nav-tab-compact {activeView === 'correlation' ? 'active' : ''}" onclick={() => change('correlation')}><BarChart3Icon size={16} /> <span class="text-sm">{$t.nav.distribution}</span></button>
        <button class="nav-tab-compact {activeView === 'volume' ? 'active' : ''}" onclick={() => change('volume')}><AreaChartIcon size={16} /> <span class="text-sm">{$t.nav.volume}</span></button>
      </div>
      <div class="flex space-x-2 justify-center">
        <button class="nav-tab-compact {activeView === 'heatmap' ? 'active' : ''}" onclick={() => change('heatmap')}><ActivityIcon size={16} /> <span class="text-sm">{$t.nav.heatmap}</span></button>
        <button class="nav-tab-compact {activeView === 'table' ? 'active' : ''}" onclick={() => change('table')}><TableIcon size={16} /> <span class="text-sm">{$t.nav.table}</span></button>
        <button class="nav-tab-compact {activeView === 'comparison' ? 'active' : ''}" onclick={() => change('comparison')}><GitCompareIcon size={16} /> <span class="text-sm">{$t.nav.comparison || 'Compare'}</span></button>
        <button class="nav-tab-compact {activeView === 'extremes' ? 'active' : ''}" onclick={() => change('extremes')}><FlameIcon size={16} /> <span class="text-sm">{$t.nav.extremes}</span></button>
      </div>
    </div>
  </div>
  <div class="md:hidden">
    <div class="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
      <button class="nav-tab-mobile {activeView === 'charts' ? 'active' : ''}" onclick={() => change('charts')}><ChartIcon size={18} /> <span class="text-xs">{$t.nav.charts}</span></button>
      <button class="nav-tab-mobile {activeView === 'trends' ? 'active' : ''}" onclick={() => change('trends')}><TrendingUpIcon size={18} /> <span class="text-xs">{$t.nav.trends}</span></button>
      <button class="nav-tab-mobile {activeView === 'correlation' ? 'active' : ''}" onclick={() => change('correlation')}><BarChart3Icon size={18} /> <span class="text-xs">{$t.nav.distribution}</span></button>
      <button class="nav-tab-mobile {activeView === 'volume' ? 'active' : ''}" onclick={() => change('volume')}><AreaChartIcon size={18} /> <span class="text-xs">{$t.nav.volume}</span></button>
      <button class="nav-tab-mobile {activeView === 'heatmap' ? 'active' : ''}" onclick={() => change('heatmap')}><ActivityIcon size={18} /> <span class="text-xs">{$t.nav.heatmap}</span></button>
      <button class="nav-tab-mobile {activeView === 'table' ? 'active' : ''}" onclick={() => change('table')}><TableIcon size={18} /> <span class="text-xs">{$t.nav.table}</span></button>
      <button class="nav-tab-mobile {activeView === 'comparison' ? 'active' : ''}" onclick={() => change('comparison')}><GitCompareIcon size={18} /> <span class="text-xs">{$t.nav.comparison || 'Compare'}</span></button>
      <button class="nav-tab-mobile {activeView === 'extremes' ? 'active' : ''}" onclick={() => change('extremes')}><FlameIcon size={18} /> <span class="text-xs">{$t.nav.extremes}</span></button>
    </div>
  </div>
</nav>

<style>
  .navigation-root { background:rgba(30,41,59,.9);backdrop-filter:blur(20px);border-radius:var(--radius-xl);border:1px solid rgba(255,255,255,.1);box-shadow:var(--shadow-xl);padding:var(--spacing-lg);position:relative;overflow:hidden;margin-bottom:var(--spacing-2xl); }
  .navigation-root::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent); }
  .nav-tab-compact { display:flex;align-items:center;gap:.375rem;padding:.5rem .875rem;border-radius:var(--radius-md);background:var(--glass-bg);border:1px solid var(--glass-border);color:rgba(255,255,255,.9);transition:all var(--transition-normal);font-weight:500;font-size:.8125rem;white-space:nowrap;position:relative;overflow:hidden;cursor:pointer; }
  .nav-tab-compact::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.05));opacity:0;transition:opacity var(--transition-normal); }
  .nav-tab-compact:hover { background:var(--glass-hover-bg);border-color:var(--glass-hover-border);transform:translateY(-2px);box-shadow:var(--shadow-lg);color:#fff; }
  .nav-tab-compact:hover::before { opacity:1; }
  .nav-tab-compact.active { background:linear-gradient(135deg,#3B82F6 0%,#8B5CF6 100%);border-color:rgba(255,255,255,.3);color:#fff;box-shadow:0 8px 32px rgba(59,130,246,.3),inset 0 1px 0 rgba(255,255,255,.2);transform:translateY(-1px); }
  .nav-tab-compact.active:hover { transform:translateY(-3px);box-shadow:0 12px 40px rgba(59,130,246,.4),inset 0 1px 0 rgba(255,255,255,.3); }
  .nav-tab-mobile { display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.75rem 1rem;border-radius:var(--radius-md);background:var(--glass-bg);border:1px solid var(--glass-border);color:rgba(255,255,255,.9);transition:all var(--transition-normal);font-weight:500;white-space:nowrap;min-width:80px;flex-shrink:0;position:relative;overflow:hidden;cursor:pointer; }
  .nav-tab-mobile::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.05));opacity:0;transition:opacity var(--transition-normal); }
  .nav-tab-mobile:hover { background:var(--glass-hover-bg);border-color:var(--glass-hover-border);transform:translateY(-2px);box-shadow:var(--shadow-lg);color:#fff; }
  .nav-tab-mobile:hover::before { opacity:1; }
  .nav-tab-mobile.active { background:linear-gradient(135deg,#3B82F6 0%,#8B5CF6 100%);border-color:rgba(255,255,255,.3);color:#fff;box-shadow:0 8px 32px rgba(59,130,246,.3),inset 0 1px 0 rgba(255,255,255,.2);transform:translateY(-1px); }
  .nav-tab-mobile.active:hover { transform:translateY(-3px);box-shadow:0 12px 40px rgba(59,130,246,.4),inset 0 1px 0 rgba(255,255,255,.3); }
  .nav-tab-mobile :global(svg){opacity:.9;transition:opacity var(--transition-fast);} .nav-tab-mobile:hover :global(svg), .nav-tab-mobile.active :global(svg){opacity:1;}
  .scrollbar-hide { -ms-overflow-style:none;scrollbar-width:none; }
  .scrollbar-hide::-webkit-scrollbar { display:none; }
</style>
