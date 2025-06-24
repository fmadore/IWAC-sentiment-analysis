<script lang="ts">
  import { filteredComparisons, selectedArticle } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue } from '$lib/i18n/utils';
  import { getJournalName } from '$lib/utils';
  import type { ComparisonData } from '$lib/types/data';
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import TableIcon from '@lucide/svelte/icons/table';
  
  let viewMode = $state<'table' | 'cards'>('table');
  let sortBy = $state<'discrepancy' | 'date' | 'title'>('discrepancy');
  let sortDirection = $state<'asc' | 'desc'>('desc');
  let isMobile = $state(false);
  
  // Pagination
  let currentPage = $state(1);
  let itemsPerPage = $state(50);
  
  // Check mobile on mount
  $effect(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
  
  // Switch to card view on mobile
  $effect(() => {
    if (isMobile) {
      viewMode = 'cards';
    }
  });
  
  // Sort comparisons
  const sortedComparisons = $derived(
    [...$filteredComparisons].sort((a, b) => {
      let valA, valB;
      
      switch (sortBy) {
        case 'title':
          valA = a.article['o:title'] || '';
          valB = b.article['o:title'] || '';
          break;
        case 'date':
          valA = a.article.publication_date ? new Date(a.article.publication_date).getTime() : 0;
          valB = b.article.publication_date ? new Date(b.article.publication_date).getTime() : 0;
          break;
        case 'discrepancy':
        default:
          valA = a.discrepancies.totalDiff;
          valB = b.discrepancies.totalDiff;
          break;
      }
      
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    })
  );
  
  // Pagination
  const totalItems = $derived(sortedComparisons.length);
  const totalPages = $derived(Math.ceil(totalItems / itemsPerPage));
  const startIndex = $derived((currentPage - 1) * itemsPerPage);
  const endIndex = $derived(Math.min(startIndex + itemsPerPage, totalItems));
  const paginatedComparisons = $derived(sortedComparisons.slice(startIndex, endIndex));
  
  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }
  
  function getDiffClass(diff: number): string {
    if (diff === 0) return 'text-white/40';
    if (diff === 1) return 'text-yellow-400';
    if (diff === 2) return 'text-orange-400';
    return 'text-red-400';
  }
  
  function getDiffBadgeClass(diff: number): string {
    if (diff === 0) return 'variant-ghost';
    if (diff === 1) return 'variant-soft-warning';
    if (diff === 2) return 'variant-soft-error';
    return 'variant-filled-error';
  }
  
  function selectComparison(comparison: ComparisonData) {
    selectedArticle.set(comparison.article);
  }
</script>

<div class="comparison-table-container">
  <!-- Controls -->
  <div class="controls-section mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
    <!-- View Mode Toggle -->
    <div class="view-controls flex gap-2">
      <button
        class="btn btn-sm {viewMode === 'table' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => viewMode = 'table'}
        disabled={isMobile}
      >
        <TableIcon size={16} />
        <span>{$t.common?.tableView || 'Table'}</span>
      </button>
      <button
        class="btn btn-sm {viewMode === 'cards' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => viewMode = 'cards'}
      >
        <LayoutGridIcon size={16} />
        <span>{$t.common?.cardView || 'Cards'}</span>
      </button>
    </div>
    
    <!-- Results info -->
    <div class="text-sm text-white/60">
      {$t.table?.showingItems || 'Showing'} {startIndex + 1}-{endIndex} {$t.common?.of || 'of'} {totalItems}
    </div>
  </div>
  
  {#if viewMode === 'table' && !isMobile}
    <!-- Table View -->
    <div class="table-container card variant-glass overflow-hidden">
      <table class="table">
        <thead>
          <tr class="bg-surface-800">
            <th class="text-white sortable-header" onclick={() => { sortBy = 'title'; sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'; }}>
              {$t.table?.articleTitle || 'Article'} 
              {#if sortBy === 'title'}
                <ArrowUpDownIcon size={14} class="inline ml-1" />
              {/if}
            </th>
            <th class="text-white text-center" colspan="2">{$t.comparison?.polarity || 'Polarity'}</th>
            <th class="text-white text-center" colspan="2">{$t.comparison?.subjectivity || 'Subjectivity'}</th>
            <th class="text-white text-center" colspan="2">{$t.comparison?.centrality || 'Centrality'}</th>
            <th class="text-white sortable-header text-center" onclick={() => { sortBy = 'discrepancy'; sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'; }}>
              {$t.comparison?.totalDiscrepancy || 'Total'} 
              {#if sortBy === 'discrepancy'}
                <ArrowUpDownIcon size={14} class="inline ml-1" />
              {/if}
            </th>
          </tr>
          <tr class="bg-surface-700/50 text-xs">
            <th></th>
            <th class="text-white/60 text-center font-normal">ChatGPT</th>
            <th class="text-white/60 text-center font-normal">Gemini</th>
            <th class="text-white/60 text-center font-normal">ChatGPT</th>
            <th class="text-white/60 text-center font-normal">Gemini</th>
            <th class="text-white/60 text-center font-normal">ChatGPT</th>
            <th class="text-white/60 text-center font-normal">Gemini</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedComparisons as comparison}
            <tr 
              class="hover:bg-surface-700/30 cursor-pointer transition-colors"
              onclick={() => selectComparison(comparison)}
            >
              <td class="max-w-xs">
                <div class="flex flex-col gap-1">
                  <span class="text-white font-medium line-clamp-2">{comparison.article['o:title']}</span>
                  <span class="text-xs text-white/60">{getJournalName(comparison.article)} • {formatDate(comparison.article.publication_date)}</span>
                </div>
              </td>
              <td class="text-center">
                <span class="badge badge-sm {comparison.chatgpt?.polarite ? `variant-soft-${comparison.chatgpt.polarite.includes('positif') ? 'success' : comparison.chatgpt.polarite.includes('Neutre') ? 'primary' : 'error'}` : 'variant-ghost'}">
                  {translateSentimentValue(comparison.chatgpt?.polarite, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm {comparison.gemini?.polarite ? `variant-soft-${comparison.gemini.polarite.includes('positif') ? 'success' : comparison.gemini.polarite.includes('Neutre') ? 'primary' : 'error'}` : 'variant-ghost'}">
                  {translateSentimentValue(comparison.gemini?.polarite, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm variant-soft-primary">
                  {comparison.chatgpt?.subjectivite_score || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm variant-soft-primary">
                  {comparison.gemini?.subjectivite_score || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm variant-soft-tertiary">
                  {translateSentimentValue(comparison.chatgpt?.centralite_islam_musulmans, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm variant-soft-tertiary">
                  {translateSentimentValue(comparison.gemini?.centralite_islam_musulmans, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-lg {getDiffBadgeClass(comparison.discrepancies.totalDiff)}">
                  {comparison.discrepancies.totalDiff}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <!-- Card View -->
    <div class="cards-grid">
      {#each paginatedComparisons as comparison}
                 <div 
           class="comparison-card card variant-glass p-4 hover-lift cursor-pointer"
           onclick={() => selectComparison(comparison)}
           onkeydown={(e) => {
             if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault();
               selectComparison(comparison);
             }
           }}
           role="button"
           tabindex="0"
           aria-label="View comparison details for {comparison.article['o:title']}"
         >
          <!-- Header -->
          <div class="mb-3">
            <h3 class="text-white font-semibold line-clamp-2 mb-1">{comparison.article['o:title']}</h3>
            <p class="text-xs text-white/60">{getJournalName(comparison.article)} • {formatDate(comparison.article.publication_date)}</p>
          </div>
          
          <!-- Comparison Grid -->
          <div class="comparison-grid">
            <!-- Polarity -->
            <div class="comparison-row">
              <span class="dimension-label">{$t.comparison?.polarity || 'Polarity'}</span>
              <div class="values-grid">
                                 <div class="value-cell">
                   <span class="model-label">ChatGPT</span>
                   <span class="badge badge-sm variant-soft-primary">
                     {translateSentimentValue(comparison.chatgpt?.polarite, $currentLanguage) || 'N/A'}
                   </span>
                 </div>
                 <div class="diff-indicator {getDiffClass(comparison.discrepancies.polarityDiff)}">
                   {comparison.discrepancies.polarityDiff > 0 ? `±${comparison.discrepancies.polarityDiff}` : '='}
                 </div>
                 <div class="value-cell">
                   <span class="model-label">Gemini</span>
                   <span class="badge badge-sm variant-soft-primary">
                     {translateSentimentValue(comparison.gemini?.polarite, $currentLanguage) || 'N/A'}
                   </span>
                 </div>
              </div>
            </div>
            
            <!-- Subjectivity -->
            <div class="comparison-row">
              <span class="dimension-label">{$t.comparison?.subjectivity || 'Subjectivity'}</span>
              <div class="values-grid">
                <div class="value-cell">
                  <span class="model-label">ChatGPT</span>
                  <span class="badge badge-sm variant-soft-secondary">
                    {comparison.chatgpt?.subjectivite_score || 'N/A'}
                  </span>
                </div>
                <div class="diff-indicator {getDiffClass(comparison.discrepancies.subjectivityDiff)}">
                  {comparison.discrepancies.subjectivityDiff > 0 ? `±${comparison.discrepancies.subjectivityDiff}` : '='}
                </div>
                <div class="value-cell">
                  <span class="model-label">Gemini</span>
                  <span class="badge badge-sm variant-soft-secondary">
                    {comparison.gemini?.subjectivite_score || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Centrality -->
            <div class="comparison-row">
              <span class="dimension-label">{$t.comparison?.centrality || 'Centrality'}</span>
              <div class="values-grid">
                                 <div class="value-cell">
                   <span class="model-label">ChatGPT</span>
                   <span class="badge badge-sm variant-soft-tertiary text-xs">
                     {translateSentimentValue(comparison.chatgpt?.centralite_islam_musulmans, $currentLanguage) || 'N/A'}
                   </span>
                 </div>
                 <div class="diff-indicator {getDiffClass(comparison.discrepancies.centralityDiff)}">
                   {comparison.discrepancies.centralityDiff > 0 ? `±${comparison.discrepancies.centralityDiff}` : '='}
                 </div>
                 <div class="value-cell">
                   <span class="model-label">Gemini</span>
                   <span class="badge badge-sm variant-soft-tertiary text-xs">
                     {translateSentimentValue(comparison.gemini?.centralite_islam_musulmans, $currentLanguage) || 'N/A'}
                   </span>
                 </div>
              </div>
            </div>
          </div>
          
          <!-- Total Discrepancy -->
          <div class="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <span class="text-sm text-white/60">{$t.comparison?.totalDiscrepancy || 'Total Discrepancy'}</span>
            <span class="badge badge-lg {getDiffBadgeClass(comparison.discrepancies.totalDiff)}">
              {comparison.discrepancies.totalDiff}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="pagination-controls mt-6 flex items-center justify-center gap-2">
      <button 
        class="btn btn-sm variant-soft-surface"
        onclick={() => currentPage = Math.max(1, currentPage - 1)}
        disabled={currentPage === 1}
      >
        {$t.common?.previous || 'Previous'}
      </button>
      
      <span class="text-sm text-white/60 px-4">
        {currentPage} / {totalPages}
      </span>
      
      <button 
        class="btn btn-sm variant-soft-surface"
        onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {$t.common?.next || 'Next'}
      </button>
    </div>
  {/if}
</div>

<style>
  .table-container {
    max-height: 600px;
    overflow-y: auto;
  }
  
  .sortable-header {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }
  
  .sortable-header:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }
  
  .comparison-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .comparison-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .dimension-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }
  
  .values-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0.5rem;
    align-items: center;
  }
  
  .value-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  
  .model-label {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .diff-indicator {
    font-size: 0.875rem;
    font-weight: 600;
    text-align: center;
  }
  
  .badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
  }
  
  .badge-lg {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
    
    .comparison-card {
      padding: 0.75rem;
    }
  }
</style>
