<script lang="ts">
  import { comparisonStatistics } from '$lib/stores';
  import { t } from '$lib/i18n';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
  import GitCompareArrowsIcon from '@lucide/svelte/icons/git-compare-arrows';
  import InfoIcon from '@lucide/svelte/icons/info';
  
  const stats = $derived($comparisonStatistics);
</script>

<div class="stats-grid">
  <div class="stat-card card variant-glass p-4 hover-lift">
    <div class="stat-header">
      <GitCompareArrowsIcon size={24} class="text-blue-400" />
      <span class="stat-label">{$t.comparison?.totalArticles || 'Total Articles'}</span>
    </div>
    <div class="stat-value">{stats.totalArticles}</div>
    <div class="stat-detail">{$t.comparison?.articlesAnalyzed || 'Articles analyzed'}</div>
  </div>
  
  <div class="stat-card card variant-glass p-4 hover-lift">
    <div class="stat-header">
      <AlertCircleIcon size={24} class="text-yellow-400" />
      <span class="stat-label">{$t.comparison?.totalDiscrepancies || 'Total Discrepancies'}</span>
      <div class="info-tooltip" title={$t.comparison?.totalDiscrepanciesExplanation || 'Number of articles where ChatGPT and Gemini provide different analyses (any difference > 0 points)'}>
        <InfoIcon size={14} class="text-white/50 hover:text-white/80 cursor-help" />
      </div>
    </div>
    <div class="stat-value">{stats.totalDiscrepancies}</div>
    <div class="stat-detail">{$t.comparison?.articlesWithDifferences || 'Articles with differences'}</div>
  </div>
  
  <div class="stat-card card variant-glass p-4 hover-lift">
    <div class="stat-header">
      <TrendingUpIcon size={24} class="text-green-400" />
      <span class="stat-label">{$t.comparison?.averageDiscrepancy || 'Average Discrepancy'}</span>
      <div class="info-tooltip" title={$t.comparison?.averageDiscrepancyExplanation || 'Average total difference points per article across all three dimensions (polarity + subjectivity + centrality)'}>
        <InfoIcon size={14} class="text-white/50 hover:text-white/80 cursor-help" />
      </div>
    </div>
    <div class="stat-value">{stats.averageDiscrepancy.toFixed(2)}</div>
    <div class="stat-detail">{$t.comparison?.pointsPerArticle || 'Points per article'}</div>
  </div>
  
  <div class="stat-card card variant-glass p-4 hover-lift">
    <div class="stat-header">
      <BarChart3Icon size={24} class="text-purple-400" />
      <span class="stat-label">{$t.comparison?.highConflicts || 'High Conflicts'}</span>
      <div class="info-tooltip" title={$t.comparison?.significantDifferencesExplanation || 'Articles where any dimension (polarity, subjectivity, or centrality) differs by 3+ points between ChatGPT and Gemini analyses'}>
        <InfoIcon size={14} class="text-white/50 hover:text-white/80 cursor-help" />
      </div>
    </div>
    <div class="stat-value">{stats.highConflictArticles}</div>
    <div class="stat-detail">{$t.comparison?.significantDifferences || 'Significant differences'}</div>
  </div>
</div>

<!-- Breakdown by dimension -->
<div class="breakdown-section mt-6">
  <h4 class="h5 mb-3 text-white">{$t.comparison?.breakdownByDimension || 'Breakdown by Dimension'}</h4>
  
  <div class="breakdown-grid">
    <div class="breakdown-item">
      <div class="breakdown-bar" style="--progress: {(stats.polarityConflicts / stats.totalArticles * 100) || 0}%">
        <div class="breakdown-fill polarity"></div>
      </div>
      <div class="breakdown-info">
        <span class="breakdown-label">{$t.comparison?.polarity || 'Polarity'}</span>
        <span class="breakdown-value">{stats.polarityConflicts} ({((stats.polarityConflicts / stats.totalArticles * 100) || 0).toFixed(1)}%)</span>
      </div>
    </div>
    
    <div class="breakdown-item">
      <div class="breakdown-bar" style="--progress: {(stats.subjectivityConflicts / stats.totalArticles * 100) || 0}%">
        <div class="breakdown-fill subjectivity"></div>
      </div>
      <div class="breakdown-info">
        <span class="breakdown-label">{$t.comparison?.subjectivity || 'Subjectivity'}</span>
        <span class="breakdown-value">{stats.subjectivityConflicts} ({((stats.subjectivityConflicts / stats.totalArticles * 100) || 0).toFixed(1)}%)</span>
      </div>
    </div>
    
    <div class="breakdown-item">
      <div class="breakdown-bar" style="--progress: {(stats.centralityConflicts / stats.totalArticles * 100) || 0}%">
        <div class="breakdown-fill centrality"></div>
      </div>
      <div class="breakdown-info">
        <span class="breakdown-label">{$t.comparison?.centrality || 'Centrality'}</span>
        <span class="breakdown-value">{stats.centralityConflicts} ({((stats.centralityConflicts / stats.totalArticles * 100) || 0).toFixed(1)}%)</span>
      </div>
    </div>
  </div>
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .stat-card {
    position: relative;
    overflow: hidden;
  }
  
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--color-primary-500), var(--color-secondary-500));
    opacity: 0.8;
  }
  
  .stat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .info-tooltip {
    margin-left: auto;
    display: flex;
    align-items: center;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-surface-50);
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }
  
  .stat-detail {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
  }
  
  /* Breakdown section */
  .breakdown-section {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border-radius: 0.875rem;
    padding: 1.5rem;
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    box-shadow: 
      0 4px 16px color-mix(in oklab, black 8%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
  }
  
  .breakdown-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .breakdown-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .breakdown-bar {
    position: relative;
    height: 8px;
    background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .breakdown-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: var(--progress);
    border-radius: 4px;
    transition: width var(--timing-slow) var(--easing-default);
  }
  
  .breakdown-fill.polarity {
    background: linear-gradient(90deg, var(--sentiment-polarity-neutral), color-mix(in oklab, var(--sentiment-polarity-neutral) 70%, white));
  }
  
  .breakdown-fill.subjectivity {
    background: linear-gradient(90deg, var(--sentiment-subjectivity-3), color-mix(in oklab, var(--sentiment-subjectivity-3) 70%, white));
  }
  
  .breakdown-fill.centrality {
    background: linear-gradient(90deg, var(--sentiment-centrality-very-central), var(--sentiment-centrality-central));
  }
  
  .breakdown-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .breakdown-label {
    font-size: 0.875rem;
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    font-weight: 500;
  }
  
  .breakdown-value {
    font-size: 0.875rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .stat-value {
      font-size: 1.5rem;
    }
    
    .breakdown-section {
      padding: 1rem;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .breakdown-fill {
      transition: none;
    }
  }
</style>
