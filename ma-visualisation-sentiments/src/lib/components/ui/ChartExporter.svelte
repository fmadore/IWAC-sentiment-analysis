<script lang="ts">
  import { onMount } from 'svelte';
  import { filteredArticles, countryFilters, journalFilters, polarityFilters, subjectivityFilters, centralityFilters } from '$lib/stores';
  import type { ECharts } from 'echarts';

  // Types de graphiques disponibles
  type ChartType = 'sentiment' | 'trends' | 'correlation' | 'volume' | 'centrality' | 'subjectivity';

  // Props
  interface ChartExporterProps {
    chartType: ChartType;
    chartTitle: string;
    chartInstance?: ECharts;
  }

  let { chartType, chartTitle, chartInstance }: ChartExporterProps = $props();

  // États locaux
  let isExporting = $state(false);
  let exportFormat = $state<'png' | 'jpeg' | 'svg'>('png');
  let includeFilters = $state(true);
  let resolution = $state<'low' | 'medium' | 'high'>('medium');
  let showExportModal = $state(false);

  // Configuration des résolutions
  const resolutions = {
    low: { width: 800, height: 600, pixelRatio: 1 },
    medium: { width: 1200, height: 900, pixelRatio: 2 },
    high: { width: 1920, height: 1440, pixelRatio: 3 }
  };

  // Mapping des types de graphiques vers des labels lisibles
  const chartTypeLabels: Record<ChartType, string> = {
    sentiment: 'Distribution des sentiments',
    trends: 'Tendances temporelles',
    correlation: 'Corrélation polarité-subjectivité',
    volume: 'Volume d\'articles par pays',
    centrality: 'Centralité par pays et année',
    subjectivity: 'Distribution de la subjectivité'
  };

  // Fonction pour générer le nom du fichier
  function generateFileName(): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const chartLabel = chartTypeLabels[chartType].replace(/\s+/g, '_').toLowerCase();
    const totalArticles = $filteredArticles.length;
    
    return `${chartLabel}_${totalArticles}articles_${timestamp}.${exportFormat}`;
  }

  // Fonction pour générer les informations sur les filtres actifs
  function getActiveFiltersInfo(): string {
    const filters: string[] = [];
    
    if ($countryFilters.length > 0) {
      filters.push(`Pays: ${$countryFilters.join(', ')}`);
    }
    
    if ($journalFilters.length > 0) {
      filters.push(`Journaux: ${$journalFilters.join(', ')}`);
    }
    
    if ($polarityFilters.length > 0) {
      filters.push(`Polarités: ${$polarityFilters.join(', ')}`);
    }
    
    if ($subjectivityFilters.length > 0) {
      const subjectivityLabels = {
        1: 'Très objectif',
        2: 'Plutôt objectif',
        3: 'Mixte',
        4: 'Plutôt subjectif',
        5: 'Très subjectif'
      };
      const labels = $subjectivityFilters.map(s => subjectivityLabels[s as keyof typeof subjectivityLabels]).join(', ');
      filters.push(`Subjectivité: ${labels}`);
    }
    
    if ($centralityFilters.length > 0) {
      filters.push(`Centralité: ${$centralityFilters.join(', ')}`);
    }

    return filters.length > 0 
      ? `Filtres actifs: ${filters.join(' | ')}` 
      : 'Aucun filtre actif';
  }

  // Fonction principale d'export
  async function exportChart() {
    if (!chartInstance) {
      console.error('Instance de graphique non disponible pour l\'export');
      return;
    }

    isExporting = true;

    try {
      const config = resolutions[resolution];
      
      // Configuration d'export ECharts
      const exportOptions = {
        type: exportFormat as 'png' | 'jpeg' | 'svg',
        pixelRatio: config.pixelRatio,
        backgroundColor: '#1e1e2e', // Couleur de fond sombre cohérente
        excludeComponents: ['toolbox']
      };

      // Obtenir l'URL de données du graphique
      let dataURL: string;
      
      if (exportFormat === 'svg') {
        dataURL = chartInstance.renderToSVGString();
        // Pour SVG, nous devons créer un blob
        const blob = new Blob([dataURL], { type: 'image/svg+xml' });
        dataURL = URL.createObjectURL(blob);
      } else {
        dataURL = chartInstance.getDataURL(exportOptions);
      }

      // Si on veut inclure les informations de filtres, on peut ajouter un canvas avec du texte
      if (includeFilters && exportFormat !== 'svg') {
        dataURL = await addFilterInfoToImage(dataURL, config);
      }

      // Télécharger le fichier
      await downloadFile(dataURL, generateFileName());

    } catch (error) {
      console.error('Erreur lors de l\'export du graphique:', error);
    } finally {
      isExporting = false;
      showExportModal = false;
    }
  }

  // Fonction pour ajouter les informations de filtres à l'image
  async function addFilterInfoToImage(dataURL: string, config: typeof resolutions.medium): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculer les dimensions finales (image + zone de texte)
        const textAreaHeight = 100 * config.pixelRatio;
        canvas.width = Math.max(img.width, 800 * config.pixelRatio);
        canvas.height = img.height + textAreaHeight;

        // Fond
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dessiner l'image du graphique
        const x = (canvas.width - img.width) / 2;
        ctx.drawImage(img, x, 0);

        // Ajouter les informations de filtres
        const fontSize = 14 * config.pixelRatio;
        ctx.fillStyle = '#ffffff';
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';

        const filterInfo = getActiveFiltersInfo();
        const articlesCount = `Articles analysés: ${$filteredArticles.length.toLocaleString('fr-FR')}`;
        const exportDate = `Exporté le: ${new Date().toLocaleString('fr-FR')}`;

        const textY = img.height + 30 * config.pixelRatio;
        const lineHeight = 25 * config.pixelRatio;

        ctx.fillText(articlesCount, canvas.width / 2, textY);
        ctx.fillText(filterInfo, canvas.width / 2, textY + lineHeight);
        ctx.fillText(exportDate, canvas.width / 2, textY + lineHeight * 2);

        resolve(canvas.toDataURL(`image/${exportFormat}`, 0.95));
      };

      img.src = dataURL;
    });
  }

  // Fonction pour télécharger le fichier
  async function downloadFile(dataURL: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Nettoyer l'URL si c'était un blob
    if (dataURL.startsWith('blob:')) {
      URL.revokeObjectURL(dataURL);
    }
  }

  // Fonction pour ouvrir la modal d'export
  function openExportModal() {
    showExportModal = true;
  }

  // Fonction pour fermer la modal
  function closeExportModal() {
    showExportModal = false;
  }
</script>

<!-- Bouton principal d'export -->
<button
  class="btn variant-soft-primary hover-lift"
  onclick={openExportModal}
  disabled={!chartInstance}
  title={chartInstance ? 'Télécharger ce graphique' : 'Graphique non disponible'}
>
  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
  Télécharger
</button>

<!-- Modal d'export -->
{#if showExportModal}
  <div 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
    onclick={closeExportModal}
    onkeydown={(e) => e.key === 'Escape' && closeExportModal()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="export-modal-title"
    tabindex="-1"
  >
    <div 
      class="glass-strong rounded-lg p-6 max-w-md w-full mx-4" 
      role="document"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 id="export-modal-title" class="text-lg font-semibold text-white">
          Télécharger le graphique
        </h3>
        <button 
          onclick={closeExportModal} 
          class="text-white/60 hover:text-white"
          aria-label="Fermer la modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <!-- Type de graphique -->
        <div>
          <div class="block text-sm font-medium text-white/80 mb-1">
            Graphique
          </div>
          <div class="text-sm text-white/60 bg-surface-800 rounded p-2">
            {chartTypeLabels[chartType]}
          </div>
        </div>

        <!-- Format d'export -->
        <div>
          <fieldset>
            <legend class="block text-sm font-medium text-white/80 mb-2">
              Format
            </legend>
          <div class="flex gap-2">
            <label class="flex items-center cursor-pointer">
              <input 
                type="radio" 
                bind:group={exportFormat} 
                value="png" 
                class="mr-2"
              />
              <span class="text-sm text-white/80">PNG</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input 
                type="radio" 
                bind:group={exportFormat} 
                value="jpeg" 
                class="mr-2"
              />
              <span class="text-sm text-white/80">JPEG</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input 
                type="radio" 
                bind:group={exportFormat} 
                value="svg" 
                class="mr-2"
              />
              <span class="text-sm text-white/80">SVG</span>
            </label>
            </div>
          </fieldset>
        </div>

        <!-- Résolution -->
        <div>
          <label for="resolution-select" class="block text-sm font-medium text-white/80 mb-2">
            Qualité
          </label>
          <select id="resolution-select" bind:value={resolution} class="select w-full">
            <option value="low">Basse (800x600)</option>
            <option value="medium">Moyenne (1200x900)</option>
            <option value="high">Haute (1920x1440)</option>
          </select>
        </div>

        <!-- Options -->
        <div>
          <label class="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              bind:checked={includeFilters} 
              class="mr-2"
              disabled={exportFormat === 'svg'}
            />
            <span class="text-sm text-white/80">
              Inclure les informations de filtres
              {#if exportFormat === 'svg'}
                <span class="text-xs text-white/50">(non disponible en SVG)</span>
              {/if}
            </span>
          </label>
        </div>

        <!-- Aperçu des filtres actifs -->
        {#if includeFilters && exportFormat !== 'svg'}
          <div class="text-xs text-white/60 bg-surface-800 rounded p-2">
            <div class="font-medium mb-1">Informations qui seront ajoutées:</div>
            <div>Articles: {$filteredArticles.length.toLocaleString('fr-FR')}</div>
            <div class="truncate">{getActiveFiltersInfo()}</div>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mt-6">
        <button 
          onclick={closeExportModal}
          class="btn variant-soft-surface flex-1"
        >
          Annuler
        </button>
        <button 
          onclick={exportChart}
          disabled={isExporting}
          class="btn variant-filled-primary flex-1"
        >
          {#if isExporting}
            <svg class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Export...
          {:else}
            Télécharger
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .glass-strong {
    background: rgba(30, 30, 46, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .hover-lift {
    transition: transform 0.2s ease;
  }

  .hover-lift:hover {
    transform: translateY(-2px);
  }
</style> 