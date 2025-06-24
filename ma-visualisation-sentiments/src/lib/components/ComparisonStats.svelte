<script lang="ts">
  import { comparisonStatistics } from '$lib/stores';
  import { t } from '$lib/i18n';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
  import GitCompareArrowsIcon from '@lucide/svelte/icons/git-compare-arrows';
  
  const stats = $comparisonStatistics;
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
    </div>
    <div class="stat-value">{stats.totalDiscrepancies}</div>
    <div class="stat-detail">{$t.comparison?.articlesWithDifferences || 'Articles with differences'}</div>
  </div>
  
  <div class="stat-card card variant-glass p-4 hover-lift">
    <div class="stat-header">
      <TrendingUpIcon size={24} class="text-green-400" />
      <span class="stat-label">{$t.comparison?.averageDiscrepancy || 'Average Discrepancy'}</span>
    </div>
    <div class="stat-value">{stats.averageDiscrepancy.toFixed(2)}</div>
    <div class="stat-detail">{$t.comparison?.pointsPerArticle || 'Points per article'}</div>
  </div>
  
  <div class="stat-card card variant-glass p-4 hover-lift">
    <div class="stat-header">
      <BarChart3Icon size={24} class="text-purple-400" />
      <span class="stat-label">{$t.comparison?.highConflicts || 'High Conflicts'}</span>
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
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    opacity: 0.8;
  }
  
  .stat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }
  
  .stat-detail {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Breakdown section */
  .breakdown-section {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
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
    background: rgba(255, 255, 255, 0.1);
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
    transition: width 0.5s ease;
  }
  
  .breakdown-fill.polarity {
    background: linear-gradient(90deg, #3B82F6, #60A5FA);
  }
  
  .breakdown-fill.subjectivity {
    background: linear-gradient(90deg, #8B5CF6, #A78BFA);
  }
  
  .breakdown-fill.centrality {
    background: linear-gradient(90deg, #10B981, #34D399);
  }
  
  .breakdown-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .breakdown-label {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }
  
  .breakdown-value {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
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
</style>
