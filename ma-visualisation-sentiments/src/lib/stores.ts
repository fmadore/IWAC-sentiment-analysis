// Stores Svelte pour la gestion d'état 
import { writable, derived, get } from 'svelte/store';
import type { Article, DatasetOption, ComparisonData, DiscrepancyFilter, SentimentAnalysis, DiscrepancyInfo } from './types/data';
import type { ExtremeAnalysisData } from './types/extremeAnalysis';
import { loadExtremeAnalysisData } from './utils/extremeAnalysis';
import { base } from '$app/paths';
import { getJournalName } from './utils';

// Store pour les articles du dataset actuel
export const currentDatasetArticles = writable<Article[]>([]);

// Store pour indiquer si un dataset est en cours de chargement
export const isLoadingDataset = writable<boolean>(false);

// Store pour l'article sélectionné
export const selectedArticle = writable<Article | null>(null);

// Stores pour les filtres
export const countryFilters = writable<string[]>([]);
export const journalFilters = writable<string[]>([]);
export const polarityFilters = writable<string[]>([]);
export const subjectivityFilters = writable<string[]>([]);
export const centralityFilters = writable<string[]>([]);

// New stores for dataset management
export const availableDatasets = writable<DatasetOption[]>([
  { id: 'chatgpt', name: 'ChatGPT', file: '/data/iwac_articles_chatgpt.json', icon: '🤖', color: '#10a37f' },
  { id: 'gemini', name: 'Gemini', file: '/data/iwac_articles_gemini.json', icon: '✨', color: '#8e75b2' }
]);

export const selectedDataset = writable<string>('chatgpt');
export const comparisonMode = writable<boolean>(false);
export const datasetArticles = writable<Record<string, Article[]>>({});
export const comparisonDatasets = writable<ComparisonData[] | null>(null);

// Store for extreme analysis data
export const extremeAnalysisData = writable<Record<string, ExtremeAnalysisData | null>>({
  chatgpt: null,
  gemini: null
});

// Current extreme analysis data (derived from extremeAnalysisData and selectedDataset)
export const currentExtremeAnalysis = derived(
  [extremeAnalysisData, selectedDataset],
  ([$extremeAnalysisData, $selectedDataset]) => $extremeAnalysisData[$selectedDataset] || null
);

// Store to track which datasets have been loaded to avoid duplicate loading
// Store for discrepancy filters
export const discrepancyFilters = writable<DiscrepancyFilter>({
  minDifference: 0,
  maxDifference: 5,
  dimensions: ['polarity', 'subjectivity', 'centrality'],
  excludeNonApplicable: false
});

// Store for the currently selected comparison
export const selectedComparison = writable<ComparisonData | null>(null);

// Store dérivé pour les articles filtrés avec logique hiérarchique pays -> journaux
export const filteredArticles = derived(
  [datasetArticles, selectedDataset, countryFilters, journalFilters, polarityFilters, subjectivityFilters, centralityFilters, comparisonMode],
  ([datasets, currentDataset, countries, journals, polarities, subjectivities, centralities, isComparison]) => {
    // In comparison mode, we don't filter by dataset
    if (isComparison) {
      return [];
    }
    
    const articles = datasets[currentDataset] || [];
    
    return articles.filter(article => {
      // Filtre par pays (prioritaire)
      if (countries.length > 0 && !countries.includes(article.Country || '')) {
        return false;
      }

      // Filtre par journal (mais seulement parmi les journaux des pays sélectionnés)
      if (journals.length > 0) {
        const journalName = getJournalName(article);
        if (!journals.includes(journalName)) {
          return false;
        }
      }

      // Filtre par polarité
      if (polarities.length > 0 && !polarities.includes(article.sentiment_analysis?.polarite || 'Non applicable')) {
        return false;
      }

      // Filtre par subjectivité
      if (subjectivities.length > 0) {
        const score = article.sentiment_analysis?.subjectivite_score;
        if (score === null || score === undefined) {
          return false;
        }
        if (!subjectivities.includes(score.toString())) {
          return false;
        }
      }

      // Filtre par centralité
      if (centralities.length > 0 && !centralities.includes(article.sentiment_analysis?.centralite_islam_musulmans || 'Non abordé')) {
        return false;
      }

      return true;
    });
  }
);

// Store dérivé pour les journaux disponibles basé sur les pays sélectionnés
export const availableJournals = derived(
  [datasetArticles, selectedDataset, countryFilters, comparisonMode],
  ([datasets, currentDataset, countries, isComparison]) => {
    // In comparison mode, combine journals from both datasets
    let articles: Article[] = [];
    
    if (isComparison) {
      // Combine articles from both datasets
      articles = [...(datasets['chatgpt'] || []), ...(datasets['gemini'] || [])];
    } else {
      articles = datasets[currentDataset] || [];
    }
    
    let filteredArticles = articles;
    
    // Si des pays sont sélectionnés, filtrer d'abord par pays
    if (countries.length > 0) {
      filteredArticles = articles.filter(article => countries.includes(article.Country || ''));
    }
    
    // Extraire les journaux uniques des articles filtrés par pays
    return [...new Set(
      filteredArticles.map(article => getJournalName(article))
                      .filter((name): name is string => !!name)
    )].sort((a, b) => a.localeCompare(b));
  }
);

// Fonction pour charger un dataset, renommée pour éviter les conflits avec utils.ts
export const loadDatasetArticles = async (filePath: string, datasetId: string, fetchFunction: typeof fetch): Promise<Article[]> => {
  try {
    const resolvedPath = filePath.startsWith('http') ? filePath : `${base}${filePath}`;
    const response = await fetchFunction(resolvedPath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Vérifier si les données contiennent déjà un tableau d'articles
    if (Array.isArray(data)) {
      // Si c'est déjà un tableau, assurons-nous que chaque élément a le dataset_id
      return data.map((item: any) => mapArticleProperties(item, datasetId));
    } else if (data.articles && Array.isArray(data.articles)) {
      // Format { articles: [...] }
      return data.articles.map((item: any) => mapArticleProperties(item, datasetId));
    } else {
      // Pas de structure reconnue, retourner un tableau vide
      console.error('Format de données non reconnu:', data);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching dataset ${datasetId}:`, error);
    return [];
  }
};

// New function to load a specific dataset into the datasetArticles store
export const loadSpecificDataset = async (datasetId: string, fetchFunction: typeof fetch): Promise<void> => {
  isLoadingDataset.set(true);
  
  try {
    // Get dataset info
    const datasets = await new Promise<DatasetOption[]>(resolve => {
      availableDatasets.subscribe(value => {
        resolve(value);
      })();
    });
    
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) {
      throw new Error(`Dataset ${datasetId} not found`);
    }
    
    // Load the dataset
    const articles = await loadDatasetArticles(dataset.file, datasetId, fetchFunction);
    
    // Update the datasetArticles store
    datasetArticles.update(current => ({
      ...current,
      [datasetId]: articles
    }));
    
    // For backward compatibility, also update currentDatasetArticles if this is the selected dataset
    const currentSelected = await new Promise<string>(resolve => {
      selectedDataset.subscribe(value => {
        resolve(value);
      })();
    });
    
    if (currentSelected === datasetId) {
      currentDatasetArticles.set(articles);
    }
  } finally {
    isLoadingDataset.set(false);
  }
};

// Function to load all available datasets
export const loadAllDatasets = async (fetchFunction: typeof fetch): Promise<void> => {
  const datasets = await new Promise<DatasetOption[]>(resolve => {
    availableDatasets.subscribe(value => {
      resolve(value);
    })();
  });
  
  // Load all datasets in parallel
  await Promise.all(
    datasets.map(dataset => loadSpecificDataset(dataset.id, fetchFunction))
  );
};

// Function to load only the currently selected dataset (lazy loading)
export const loadCurrentDataset = async (fetchFunction: typeof fetch): Promise<void> => {
  const currentDatasetId = await new Promise<string>(resolve => {
    selectedDataset.subscribe(value => {
      resolve(value);
    })();
  });
  
  // Check if dataset is already loaded
  const currentDatasets = await new Promise<Record<string, Article[]>>(resolve => {
    datasetArticles.subscribe(value => {
      resolve(value);
    })();
  });
  
  if (currentDatasets[currentDatasetId] && currentDatasets[currentDatasetId].length > 0) {
    // Dataset already loaded, just update currentDatasetArticles
    currentDatasetArticles.set(currentDatasets[currentDatasetId]);
    return;
  }
  
  // Load only the current dataset
  await loadSpecificDataset(currentDatasetId, fetchFunction);
  
  // Update currentDatasetArticles
  const updatedDatasets = await new Promise<Record<string, Article[]>>(resolve => {
    datasetArticles.subscribe(value => {
      resolve(value);
    })();
  });
  currentDatasetArticles.set(updatedDatasets[currentDatasetId] || []);
};

// Function to ensure comparison datasets are loaded (only when needed)
export const loadComparisonDatasets = async (fetchFunction: typeof fetch): Promise<void> => {
  const currentDatasets = await new Promise<Record<string, Article[]>>(resolve => {
    datasetArticles.subscribe(value => {
      resolve(value);
    })();
  });
  
  const datasetsToLoad: string[] = [];
  
  // Check which datasets need to be loaded
  if (!currentDatasets['chatgpt'] || currentDatasets['chatgpt'].length === 0) {
    datasetsToLoad.push('chatgpt');
  }
  if (!currentDatasets['gemini'] || currentDatasets['gemini'].length === 0) {
    datasetsToLoad.push('gemini');
  }
  
  if (datasetsToLoad.length > 0) {
    // Use specific loading state for comparison
    isLoadingComparison.set(true);
    
    try {
      // Load only the missing datasets in parallel
      await Promise.all(
        datasetsToLoad.map(datasetId => loadSpecificDataset(datasetId, fetchFunction))
      );
    } finally {
      isLoadingComparison.set(false);
    }
  }
};

// Function to load extreme analysis data for the current dataset
export const loadCurrentExtremeAnalysis = async (fetchFunction: typeof fetch): Promise<void> => {
  // Get current dataset ID using get() helper
  const currentDatasetId = get(selectedDataset);
  
  // Check if extreme analysis is already loaded using get() helper
  const currentExtremeData = get(extremeAnalysisData);
  
  if (currentExtremeData[currentDatasetId]) {
    // Already loaded
    console.log(`Extreme analysis for ${currentDatasetId} already loaded`);
    return;
  }
  
  console.log(`Loading extreme analysis data for ${currentDatasetId}...`);
  
  // Use specific loading state for extreme analysis
  isLoadingExtremeAnalysis.set(true);
  
  try {
    const data = await loadExtremeAnalysisData(currentDatasetId as 'chatgpt' | 'gemini', fetchFunction);
    extremeAnalysisData.update(current => ({
      ...current,
      [currentDatasetId]: data
    }));
    console.log(`Successfully loaded extreme analysis data for ${currentDatasetId}`);
  } catch (error) {
    console.error(`Failed to load extreme analysis data for ${currentDatasetId}:`, error);
    extremeAnalysisData.update(current => ({
      ...current,
      [currentDatasetId]: null
    }));
  } finally {
    isLoadingExtremeAnalysis.set(false);
  }
};

// Fonction utilitaire pour mapper les propriétés des articles depuis différents formats
function mapArticleProperties(item: any, datasetId: string): Article {
  return {
    // Propriétés standard requises
    'o:id': item['o:id'],
    'o:title': item['o:title'],
    // Mapper les noms de propriétés qui peuvent varier
    journal_source: item.journal_source || item.Newspaper || item.display_title || 'N/A',
    // Keep the original Newspaper and Country fields from JSON
    Newspaper: item.Newspaper,
    Country: item.Country,
    publication_date: item.publication_date || item['dcterms:date'] || 'N/A',
    sentiment_analysis: item.sentiment_analysis || null,
    dataset_id: datasetId,
    // Conserver toutes les propriétés originales
    ...item
  };
}

// Derived store for comparison data
export const comparisonData = derived(
  [datasetArticles, comparisonMode],
  ([$datasets, $isComparison]) => {
    if (!$isComparison || !$datasets['chatgpt'] || !$datasets['gemini']) {
      return [];
    }
    
    // Create a map for quick lookup
    const geminiMap = new Map($datasets['gemini'].map(article => [article['o:id'], article]));
    
    // Build comparison data
    const comparisons: ComparisonData[] = [];
    
    $datasets['chatgpt'].forEach(chatgptArticle => {
      const geminiArticle = geminiMap.get(chatgptArticle['o:id']);
      
      if (geminiArticle) {
        const discrepancies = calculateDiscrepancies(
          chatgptArticle.sentiment_analysis,
          geminiArticle.sentiment_analysis
        );
        
        comparisons.push({
          article: chatgptArticle,
          chatgpt: chatgptArticle.sentiment_analysis || null,
          gemini: geminiArticle.sentiment_analysis || null,
          discrepancies
        });
      }
    });
    
    return comparisons;
  }
);

// Helper function to calculate discrepancies
function calculateDiscrepancies(
  chatgpt: SentimentAnalysis | null | undefined,
  gemini: SentimentAnalysis | null | undefined
): DiscrepancyInfo {
  if (!chatgpt || !gemini) {
    return {
      polarityDiff: 0,
      subjectivityDiff: 0,
      centralityDiff: 0,
      totalDiff: 0,
      hasConflict: false
    };
  }
  
  // Map polarity values to numeric scores
  const polarityScores: Record<string, number> = {
    'Très positif': 5,
    'Positif': 4,
    'Neutre': 3,
    'Négatif': 2,
    'Très négatif': 1,
    'Non applicable': 0
  };
  
  // Map centrality values to numeric scores
  const centralityScores: Record<string, number> = {
    'Très central': 5,
    'Central': 4,
    'Secondaire': 3,
    'Marginal': 2,
    'Non abordé': 1
  };
  
  const polarityDiff = Math.abs(
    (polarityScores[chatgpt.polarite || 'Non applicable'] || 0) -
    (polarityScores[gemini.polarite || 'Non applicable'] || 0)
  );
  
  const subjectivityDiff = Math.abs(
    (chatgpt.subjectivite_score || 0) -
    (gemini.subjectivite_score || 0)
  );
  
  const centralityDiff = Math.abs(
    (centralityScores[chatgpt.centralite_islam_musulmans || 'Non abordé'] || 0) -
    (centralityScores[gemini.centralite_islam_musulmans || 'Non abordé'] || 0)
  );
  
  const totalDiff = polarityDiff + subjectivityDiff + centralityDiff;
  
  // Check for significant conflicts (e.g., opposite polarities)
  const hasConflict = 
    (polarityDiff >= 3) || // Very different polarities
    (subjectivityDiff >= 3) || // Very different subjectivity
    (centralityDiff >= 3); // Very different centrality
  
  return {
    polarityDiff,
    subjectivityDiff,
    centralityDiff,
    totalDiff,
    hasConflict
  };
}

// Filtered comparisons based on discrepancy filters with dimension-aware scoring
export const filteredComparisons = derived(
  [comparisonData, discrepancyFilters, countryFilters, journalFilters],
  ([$comparisons, $filters, $countries, $journals]) => {
    return $comparisons.map(comparison => {
      // Calculate dimension-aware discrepancy based on selected dimensions
      const originalDisc = comparison.discrepancies;
      let filteredDiscrepancy = {
        polarityDiff: $filters.dimensions.includes('polarity') ? originalDisc.polarityDiff : 0,
        subjectivityDiff: $filters.dimensions.includes('subjectivity') ? originalDisc.subjectivityDiff : 0,
        centralityDiff: $filters.dimensions.includes('centrality') ? originalDisc.centralityDiff : 0,
        totalDiff: 0,
        hasConflict: false
      };
      
      // If no dimensions selected, use all dimensions
      if ($filters.dimensions.length === 0) {
        filteredDiscrepancy = originalDisc;
      } else {
        // Recalculate total based on selected dimensions
        filteredDiscrepancy.totalDiff = filteredDiscrepancy.polarityDiff + 
                                       filteredDiscrepancy.subjectivityDiff + 
                                       filteredDiscrepancy.centralityDiff;
        
        // Recalculate conflict status based on selected dimensions
        filteredDiscrepancy.hasConflict = 
          (filteredDiscrepancy.polarityDiff >= 3) || 
          (filteredDiscrepancy.subjectivityDiff >= 3) || 
          (filteredDiscrepancy.centralityDiff >= 3);
      }
      
      return {
        ...comparison,
        discrepancies: filteredDiscrepancy
      };
    }).filter(comparison => {
      // Apply country filter
      if ($countries.length > 0 && !$countries.includes(comparison.article.Country || '')) {
        return false;
      }
      
      // Apply journal filter
      const journalName = getJournalName(comparison.article);
      if ($journals.length > 0 && !$journals.includes(journalName)) {
        return false;
      }

      // Filter out articles where one model marked centrality as "Non applicable" or "Non abordé"
      if ($filters.excludeNonApplicable) {
        const chatgptCentrality = comparison.chatgpt?.centralite_islam_musulmans;
        const geminiCentrality = comparison.gemini?.centralite_islam_musulmans;
        
        if (chatgptCentrality === 'Non applicable' || chatgptCentrality === 'Non abordé' ||
            geminiCentrality === 'Non applicable' || geminiCentrality === 'Non abordé') {
          return false;
        }
      }
      
      // Apply discrepancy filters using the filtered discrepancy
      const disc = comparison.discrepancies;
      
      // Check total difference range
      if (disc.totalDiff < $filters.minDifference || disc.totalDiff > $filters.maxDifference) {
        return false;
      }
      
      // Check if there's any difference in the selected dimensions
      if ($filters.dimensions.length === 0) {
        return true; // Show all if no dimensions selected
      }
      
      // Only show articles that have differences in the selected dimensions
      return disc.totalDiff > 0;
    });
  }
);

// Comparison statistics
export const comparisonStatistics = derived(
  [comparisonData, filteredComparisons, countryFilters, journalFilters],
  ([$allComparisons, $filteredComparisons, $countries, $journals]) => {
    // Calculate total articles after applying country and journal filters
    let totalArticles = $allComparisons.length;
    
    // If country or journal filters are applied, count only articles that match those filters
    if ($countries.length > 0 || $journals.length > 0) {
      totalArticles = $allComparisons.filter(comparison => {
        // Apply country filter
        if ($countries.length > 0 && !$countries.includes(comparison.article.Country || '')) {
          return false;
        }
        
        // Apply journal filter
        const journalName = getJournalName(comparison.article);
        if ($journals.length > 0 && !$journals.includes(journalName)) {
          return false;
        }
        
        return true;
      }).length;
    }
    
    if ($filteredComparisons.length === 0) {
      return {
        totalArticles,
        totalDiscrepancies: 0,
        averageDiscrepancy: 0,
        polarityConflicts: 0,
        subjectivityConflicts: 0,
        centralityConflicts: 0,
        highConflictArticles: 0
      };
    }
    
    // Other statistics come from the filtered data
    const stats = $filteredComparisons.reduce((acc, comp) => {
      const disc = comp.discrepancies;
      
      acc.totalDiscrepancies += disc.totalDiff > 0 ? 1 : 0;
      acc.totalDiffSum += disc.totalDiff;
      acc.polarityConflicts += disc.polarityDiff > 0 ? 1 : 0;
      acc.subjectivityConflicts += disc.subjectivityDiff > 0 ? 1 : 0;
      acc.centralityConflicts += disc.centralityDiff > 0 ? 1 : 0;
      acc.highConflictArticles += disc.hasConflict ? 1 : 0;
      
      return acc;
    }, {
      totalDiscrepancies: 0,
      totalDiffSum: 0,
      polarityConflicts: 0,
      subjectivityConflicts: 0,
      centralityConflicts: 0,
      highConflictArticles: 0
    });
    
    return {
      totalArticles, // Respects country and journal filters
      totalDiscrepancies: stats.totalDiscrepancies,
      averageDiscrepancy: stats.totalDiffSum / $filteredComparisons.length,
      polarityConflicts: stats.polarityConflicts,
      subjectivityConflicts: stats.subjectivityConflicts,
      centralityConflicts: stats.centralityConflicts,
      highConflictArticles: stats.highConflictArticles
    };
  }
);

// Specific loading states for different data types
export const isLoadingExtremeAnalysis = writable<boolean>(false);
export const isLoadingComparison = writable<boolean>(false); 