<script lang="ts">
  import { filteredArticles } from '$lib/stores';
  import { getJournalName } from '$lib/utils';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
  import type { Article } from '$lib/types/data';
  import DownloadIcon from '@lucide/svelte/icons/download';

  let isExporting = $state(false);

  // Function to escape CSV fields that contain commas, quotes, or newlines
  function escapeCSVField(field: string | null | undefined): string {
    if (field === null || field === undefined) return '';
    
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Function to format date for CSV
  function formatDateForCSV(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      // Return in ISO format (YYYY-MM-DD)
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateStr || '';
    }
  }

  // Function to convert articles to CSV
  function convertToCSV(articles: Article[]): string {
    if (articles.length === 0) return '';

    // Define CSV headers based on current language
    const headers = [
      $t.table.articleTitle,
      $t.filters.country,
      $t.filters.journal,
      $t.table.date,
      $t.table.polarity,
      $t.table.subjectivity,
      $t.table.centrality,
      $t.export.polarityJustification,
      $t.export.subjectivityJustification,
      $t.export.centralityJustification,
      $t.export.articleId
    ];

    // Create CSV content
    const csvRows = [
      // Header row
      headers.map(header => escapeCSVField(header)).join(','),
      
      // Data rows
      ...articles.map(article => {
        const row = [
          escapeCSVField(article['o:title']),
          escapeCSVField(article.Country),
          escapeCSVField(getJournalName(article)),
          escapeCSVField(formatDateForCSV(article.publication_date)),
          escapeCSVField(translateSentimentValue(article.sentiment_analysis?.polarite, $currentLanguage)),
          escapeCSVField(translateSubjectivityScore(article.sentiment_analysis?.subjectivite_score, $currentLanguage)),
          escapeCSVField(translateSentimentValue(article.sentiment_analysis?.centralite_islam_musulmans, $currentLanguage)),
          escapeCSVField(article.sentiment_analysis?.polarite_justification),
          escapeCSVField(article.sentiment_analysis?.subjectivite_justification),
          escapeCSVField(article.sentiment_analysis?.centralite_justification),
          escapeCSVField(article['o:id']?.toString())
        ];
        return row.join(',');
      })
    ];

    return csvRows.join('\n');
  }

  // Function to generate filename with current date and filters info
  function generateFilename(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    
    return `iwac-articles-${dateStr}-${timeStr}.csv`;
  }

  // Function to download CSV
  async function downloadCSV() {
    if (isExporting) return;
    
    isExporting = true;
    
    try {
      const articles = $filteredArticles;
      
      if (articles.length === 0) {
        alert($t.export.noDataToExport);
        return;
      }

      const csvContent = convertToCSV(articles);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFilename();
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert($t.export.exportError);
    } finally {
      isExporting = false;
    }
  }

  // Get the count of filtered articles
  const articleCount = $derived($filteredArticles.length);
</script>

<button
  class="csv-export-btn"
  onclick={downloadCSV}
  disabled={isExporting || articleCount === 0}
  title={articleCount === 0 ? $t.export.noDataToExport : $t.export.downloadCSV}
>
  <DownloadIcon size={16} class={isExporting ? 'animate-bounce' : ''} />
  <span class="button-text">
    {#if isExporting}
      {$t.export.exporting}...
    {:else}
      {$t.export.exportCSV} ({articleCount})
    {/if}
  </span>
</button>

<style>
  .csv-export-btn {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.1));
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-lg);
    backdrop-filter: blur(12px);
    box-shadow: 
      0 4px 12px rgba(34, 197, 94, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .csv-export-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }

  .csv-export-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(22, 163, 74, 0.15));
    border-color: rgba(34, 197, 94, 0.5);
    color: #16a34a;
    transform: translateY(-2px);
    box-shadow: 
      0 8px 25px rgba(34, 197, 94, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .csv-export-btn:hover:not(:disabled)::before {
    left: 100%;
  }

  .csv-export-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 
      0 2px 8px rgba(34, 197, 94, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .csv-export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .csv-export-btn :global(svg) {
    transition: transform var(--transition-normal);
    flex-shrink: 0;
  }

  .csv-export-btn:hover:not(:disabled) :global(svg) {
    transform: scale(1.1);
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .csv-export-btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.875rem;
    }
  }

  @media (max-width: 480px) {
    .button-text {
      display: none;
    }
    
    .csv-export-btn {
      padding: 0.6rem;
      border-radius: 50%;
      width: 2.5rem;
      height: 2.5rem;
      justify-content: center;
    }
  }

  /* Animation for the download icon when exporting */
  :global(.animate-bounce) {
    animation: bounce 1s infinite;
  }

  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0,0,0);
    }
    40%, 43% {
      transform: translate3d(0,-8px,0);
    }
    70% {
      transform: translate3d(0,-4px,0);
    }
    90% {
      transform: translate3d(0,-2px,0);
    }
  }
</style> 