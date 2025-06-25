<script lang="ts">
  import { filteredComparisons } from '$lib/stores';
  import { getJournalName } from '$lib/utils';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue } from '$lib/i18n/utils';
  import type { ComparisonData } from '$lib/types/data';
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

  // Function to convert comparison data to CSV
  function convertToCSV(comparisons: ComparisonData[]): string {
    if (comparisons.length === 0) return '';

    // Define CSV headers based on current language
    const headers = [
      $t.table.articleTitle,
      $t.filters.country,
      $t.filters.journal,
      $t.table.date,
      // ChatGPT columns
      'ChatGPT - ' + $t.table.polarity,
      'ChatGPT - ' + $t.table.subjectivity,
      'ChatGPT - ' + $t.table.centrality,
      'ChatGPT - ' + $t.export.polarityJustification,
      'ChatGPT - ' + $t.export.subjectivityJustification,
      'ChatGPT - ' + $t.export.centralityJustification,
      // Gemini columns
      'Gemini - ' + $t.table.polarity,
      'Gemini - ' + $t.table.subjectivity,
      'Gemini - ' + $t.table.centrality,
      'Gemini - ' + $t.export.polarityJustification,
      'Gemini - ' + $t.export.subjectivityJustification,
      'Gemini - ' + $t.export.centralityJustification,
      // Discrepancy columns
      $t.comparison.polarity + ' ' + $t.comparison.pointsDifference,
      $t.comparison.subjectivity + ' ' + $t.comparison.pointsDifference,
      $t.comparison.centrality + ' ' + $t.comparison.pointsDifference,
      $t.comparison.totalDiscrepancy,
      $t.export.articleId
    ];

    // Create CSV content
    const csvRows = [
      // Header row
      headers.map(header => escapeCSVField(header)).join(','),
      
      // Data rows
      ...comparisons.map(comparison => {
        const row = [
          // Article info
          escapeCSVField(comparison.article['o:title']),
          escapeCSVField(comparison.article.Country),
          escapeCSVField(getJournalName(comparison.article)),
          escapeCSVField(formatDateForCSV(comparison.article.publication_date)),
          
          // ChatGPT analysis
          escapeCSVField(translateSentimentValue(comparison.chatgpt?.polarite, $currentLanguage)),
          escapeCSVField(comparison.chatgpt?.subjectivite_score?.toString()),
          escapeCSVField(translateSentimentValue(comparison.chatgpt?.centralite_islam_musulmans, $currentLanguage)),
          escapeCSVField(comparison.chatgpt?.polarite_justification),
          escapeCSVField(comparison.chatgpt?.subjectivite_justification),
          escapeCSVField(comparison.chatgpt?.centralite_justification),
          
          // Gemini analysis
          escapeCSVField(translateSentimentValue(comparison.gemini?.polarite, $currentLanguage)),
          escapeCSVField(comparison.gemini?.subjectivite_score?.toString()),
          escapeCSVField(translateSentimentValue(comparison.gemini?.centralite_islam_musulmans, $currentLanguage)),
          escapeCSVField(comparison.gemini?.polarite_justification),
          escapeCSVField(comparison.gemini?.subjectivite_justification),
          escapeCSVField(comparison.gemini?.centralite_justification),
          
          // Discrepancies
          escapeCSVField(comparison.discrepancies.polarityDiff.toString()),
          escapeCSVField(comparison.discrepancies.subjectivityDiff.toString()),
          escapeCSVField(comparison.discrepancies.centralityDiff.toString()),
          escapeCSVField(comparison.discrepancies.totalDiff.toString()),
          escapeCSVField(comparison.article['o:id']?.toString())
        ];
        return row.join(',');
      })
    ];

    return csvRows.join('\n');
  }

  // Function to generate filename with current date and comparison info
  function generateFilename(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    
    return `iwac-comparison-${dateStr}-${timeStr}.csv`;
  }

  // Function to download CSV
  async function downloadCSV() {
    if (isExporting) return;
    
    isExporting = true;
    
    try {
      const comparisons = $filteredComparisons;
      
      if (comparisons.length === 0) {
        alert($t.export.noDataToExport);
        return;
      }

      const csvContent = convertToCSV(comparisons);
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
      console.error('Error exporting comparison CSV:', error);
      alert($t.export.exportError);
    } finally {
      isExporting = false;
    }
  }

  // Get the count of filtered comparisons
  const comparisonCount = $derived($filteredComparisons.length);
</script>

<button
  class="csv-export-btn"
  onclick={downloadCSV}
  disabled={isExporting || comparisonCount === 0}
  title={comparisonCount === 0 ? $t.export.noDataToExport : $t.export.downloadCSV}
>
  <DownloadIcon size={16} class={isExporting ? 'animate-bounce' : ''} />
  <span class="button-text">
    {#if isExporting}
      {$t.export.exporting}...
    {:else}
      {$t.export.exportCSV} ({comparisonCount})
    {/if}
  </span>
</button>

<style>
  .csv-export-btn {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1));
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: #8b5cf6;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-lg);
    backdrop-filter: blur(12px);
    box-shadow: 
      0 4px 12px rgba(139, 92, 246, 0.15),
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
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(124, 58, 237, 0.15));
    border-color: rgba(139, 92, 246, 0.5);
    color: #7c3aed;
    transform: translateY(-2px);
    box-shadow: 
      0 8px 25px rgba(139, 92, 246, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .csv-export-btn:hover:not(:disabled)::before {
    left: 100%;
  }

  .csv-export-btn:active:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 
      0 4px 12px rgba(139, 92, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .csv-export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .button-text {
    transition: all var(--transition-fast);
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .csv-export-btn {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }
    
    .button-text {
      display: none;
    }
  }
</style> 