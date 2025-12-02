<script lang="ts">
  import { filteredComparisons, selectedComparison } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
  import { getJournalName } from '$lib/utils';
  import type { ComparisonData } from '$lib/types/data';
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import TableIcon from '@lucide/svelte/icons/table';
  import ComparisonCSVExportButton from './ui/ComparisonCSVExportButton.svelte';
  
  let viewMode = $state<'table' | 'cards'>('table');
  let sortBy = $state<'discrepancy' | 'date' | 'title'>('discrepancy');
  let sortDirection = $state<'asc' | 'desc'>('desc');
  let isMobile = $state(false);
  
  // Pagination
  let currentPage = $state(1);
  let itemsPerPage = $state(25);
  let itemsPerPageOptions = [10, 25, 50, 100];
  
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

  // Pagination functions
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function changeItemsPerPage(newItemsPerPage: number) {
    itemsPerPage = newItemsPerPage;
    currentPage = 1; // Reset to first page
  }

  // Generate visible page numbers
  const visiblePages = $derived.by(() => {
    const pages: number[] = [];
    const maxVisible = isMobile ? 3 : 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });
  
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
  
  // Semantic CSS classes for polarity (from app.postcss)
  const polarityClasses = {
    'Très positif': 'sentiment-very-positive',
    'Positif': 'sentiment-positive',
    'Neutre': 'sentiment-neutral',
    'Négatif': 'sentiment-negative',
    'Très négatif': 'sentiment-very-negative',
    'Non applicable': 'sentiment-na'
  };

  // Semantic CSS classes for centrality (from app.postcss)
  const centralityClasses = {
    'Très central': 'centrality-very-central',
    'Central': 'centrality-central',
    'Secondaire': 'centrality-secondary',
    'Marginal': 'centrality-marginal',
    'Non abordé': 'centrality-not-addressed'
  };
  
  // Semantic CSS classes for subjectivity (from app.postcss)
  const subjectivityClasses = {
    '1': 'subjectivity-1',
    '2': 'subjectivity-2',
    '3': 'subjectivity-3',
    '4': 'subjectivity-4',
    '5': 'subjectivity-5'
  };

  // Fonction d'aide pour obtenir la classe selon la polarité
  function getPolarityClass(polarity: string | null | undefined): string {
    if (!polarity) return 'variant-ghost';
    return polarityClasses[polarity as keyof typeof polarityClasses] || 'variant-ghost';
  }

  // Fonction d'aide pour obtenir la classe selon la centralité
  function getCentralityClass(centrality: string | null | undefined): string {
    if (!centrality) return 'variant-ghost';
    return centralityClasses[centrality as keyof typeof centralityClasses] || 'variant-ghost';
  }
  
  // Fonction d'aide pour obtenir la classe selon le score de subjectivité
  function getSubjectivityClass(score: string | number | null | undefined): string {
    if (!score) return 'variant-ghost';
    const scoreStr = String(score);
    return subjectivityClasses[scoreStr as keyof typeof subjectivityClasses] || 'variant-ghost';
  }
  
  function selectComparison(comparison: ComparisonData) {
    selectedComparison.set(comparison);
  }
</script>

<div class="comparison-table-container">
  <!-- Header with title and export button -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
    <h2 class="h3 m-0 text-white text-gradient">{$t.datasets?.compareModels || 'Model Comparison'}</h2>
    <ComparisonCSVExportButton />
  </div>

  <!-- Controls and Pagination Info -->
  <div class="controls-section mb-4">
    <!-- First row: View controls and results info -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
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
      
      <!-- Results info and items per page -->
      <div class="flex items-center gap-4">
        <div class="text-sm text-white/60">
          {$t.table?.showingItems || 'Showing'} {startIndex + 1}-{endIndex} {$t.common?.of || 'of'} {totalItems}
        </div>
        <div class="flex items-center gap-2">
          <label for="items-per-page" class="text-sm text-white whitespace-nowrap">{$t.table?.itemsPerPage || 'Items per page'}:</label>
          <select 
            id="items-per-page"
            bind:value={itemsPerPage}
            onchange={(e) => changeItemsPerPage(Number((e.target as HTMLSelectElement)?.value))}
            class="select select-sm bg-surface-700 text-white border-surface-500"
          >
            {#each itemsPerPageOptions as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
    
    <!-- Second row: Pagination controls -->
    {#if totalPages > 1}
      <div class="flex justify-center">
        <div class="pagination-controls flex items-center gap-2">
          <button 
            class="btn btn-sm variant-soft-surface" 
            onclick={previousPage}
            disabled={currentPage === 1}
            title={$t.common?.previous || 'Previous page'}
          >
            ← {isMobile ? '' : ($t.common?.previous || 'Previous')}
          </button>
          
          {#each visiblePages as page}
            <button 
              class="btn btn-sm {page === currentPage ? 'variant-filled-primary' : 'variant-soft-surface'}"
              onclick={() => goToPage(page)}
            >
              {page}
            </button>
          {/each}
          
          <button 
            class="btn btn-sm variant-soft-surface" 
            onclick={nextPage}
            disabled={currentPage === totalPages}
            title={$t.common?.next || 'Next page'}
          >
            {isMobile ? '' : ($t.common?.next || 'Next')} →
          </button>
        </div>
      </div>
    {/if}
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
                <span class="badge badge-sm {getPolarityClass(comparison.chatgpt?.polarite)}">
                  {translateSentimentValue(comparison.chatgpt?.polarite, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm {getPolarityClass(comparison.gemini?.polarite)}">
                  {translateSentimentValue(comparison.gemini?.polarite, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm {getSubjectivityClass(comparison.chatgpt?.subjectivite_score)}">
                  {translateSubjectivityScore(comparison.chatgpt?.subjectivite_score, $currentLanguage)}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm {getSubjectivityClass(comparison.gemini?.subjectivite_score)}">
                  {translateSubjectivityScore(comparison.gemini?.subjectivite_score, $currentLanguage)}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm {getCentralityClass(comparison.chatgpt?.centralite_islam_musulmans)}">
                  {translateSentimentValue(comparison.chatgpt?.centralite_islam_musulmans, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td class="text-center">
                <span class="badge badge-sm {getCentralityClass(comparison.gemini?.centralite_islam_musulmans)}">
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
                   <span class="badge badge-sm {getPolarityClass(comparison.chatgpt?.polarite)}">
                     {translateSentimentValue(comparison.chatgpt?.polarite, $currentLanguage) || 'N/A'}
                   </span>
                 </div>
                 <div class="diff-indicator {getDiffClass(comparison.discrepancies.polarityDiff)}">
                   {comparison.discrepancies.polarityDiff > 0 ? `±${comparison.discrepancies.polarityDiff}` : '='}
                 </div>
                 <div class="value-cell">
                   <span class="model-label">Gemini</span>
                   <span class="badge badge-sm {getPolarityClass(comparison.gemini?.polarite)}">
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
                  <span class="badge badge-sm {getSubjectivityClass(comparison.chatgpt?.subjectivite_score)}">
                    {translateSubjectivityScore(comparison.chatgpt?.subjectivite_score, $currentLanguage)}
                  </span>
                </div>
                <div class="diff-indicator {getDiffClass(comparison.discrepancies.subjectivityDiff)}">
                  {comparison.discrepancies.subjectivityDiff > 0 ? `±${comparison.discrepancies.subjectivityDiff}` : '='}
                </div>
                <div class="value-cell">
                  <span class="model-label">Gemini</span>
                  <span class="badge badge-sm {getSubjectivityClass(comparison.gemini?.subjectivite_score)}">
                    {translateSubjectivityScore(comparison.gemini?.subjectivite_score, $currentLanguage)}
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
                   <span class="badge badge-sm {getCentralityClass(comparison.chatgpt?.centralite_islam_musulmans)} text-xs">
                     {translateSentimentValue(comparison.chatgpt?.centralite_islam_musulmans, $currentLanguage) || 'N/A'}
                   </span>
                 </div>
                 <div class="diff-indicator {getDiffClass(comparison.discrepancies.centralityDiff)}">
                   {comparison.discrepancies.centralityDiff > 0 ? `±${comparison.discrepancies.centralityDiff}` : '='}
                 </div>
                 <div class="value-cell">
                   <span class="model-label">Gemini</span>
                   <span class="badge badge-sm {getCentralityClass(comparison.gemini?.centralite_islam_musulmans)} text-xs">
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

  /* Sticky table headers */
  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: rgb(38, 41, 65); /* Solid color for header */
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  /* Ensure all clickable elements have pointer cursor */
  .comparison-card {
    cursor: pointer;
  }

  .comparison-card:hover {
    cursor: pointer;
  }

  /* Table rows */
  tbody tr {
    cursor: pointer;
  }

  tbody tr:hover {
    cursor: pointer;
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
    cursor: inherit; /* Inherit cursor from parent */
  }
  
  .badge-lg {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    cursor: inherit; /* Inherit cursor from parent */
  }

  .badge-sm {
    padding: 0.125rem 0.375rem;
    font-size: 0.625rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: inherit; /* Inherit cursor from parent */
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Pagination styles */
  .controls-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }

  .pagination-controls button {
    min-width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .pagination-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-controls button:not(:disabled):hover {
    cursor: pointer;
  }

  .select-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    border-radius: 0.375rem;
  }
  
  /* Text gradient styling */
  .text-gradient {
    background: linear-gradient(135deg, #60A5FA, #A78BFA, #F472B6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* View controls and other buttons */
  .view-controls button {
    cursor: pointer;
  }

  .view-controls button:disabled {
    cursor: not-allowed;
  }

  /* Select elements */
  select {
    cursor: pointer;
  }

  /* Ensure all buttons have pointer cursor */
  button {
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
  }

  /* Labels for form elements */
  label {
    cursor: pointer;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
    
    .comparison-card {
      padding: 0.75rem;
    }

    .controls-section {
      padding: 0.75rem;
    }
    
    .pagination-controls {
      gap: 0.25rem;
    }
    
    .pagination-controls button {
      min-width: 2rem;
      height: 2rem;
      font-size: 0.75rem;
      padding: 0.25rem;
    }
  }
</style>
