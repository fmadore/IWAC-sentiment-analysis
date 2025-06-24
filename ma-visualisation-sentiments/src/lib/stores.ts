// Stores Svelte pour la gestion d'état 
import { writable, derived } from 'svelte/store';
import type { Article, DatasetOption, ComparisonData, DiscrepancyFilter, SentimentAnalysis, DiscrepancyInfo } from './types/data';
import { base } from '$app/paths';
import { getJournalName } from './utils';

// Store pour les articles du dataset actuel
export const currentDatasetArticles = writable<Article[]>([]);

// Store pour l'article actuellement sélectionné
export const selectedArticle = writable<Article | null>(null);

// Store pour l'état de chargement
export const isLoadingDataset = writable<boolean>(false);

// Stores pour les filtres
export const countryFilters = writable<string[]>([]);
export const journalFilters = writable<string[]>([]);
export const polarityFilters = writable<string[]>([]);
export const subjectivityFilters = writable<number[]>([]);
export const centralityFilters = writable<string[]>([]);

// New stores for dataset management
export const availableDatasets = writable<DatasetOption[]>([
  { id: 'chatgpt', name: 'ChatGPT Analysis', file: '/data/iwac_articles_chatgpt.json', icon: '🤖', color: '#10a37f' },
  { id: 'gemini', name: 'Gemini Analysis', file: '/data/iwac_articles_gemini.json', icon: '✨', color: '#8e75b2' }
]);

export const selectedDataset = writable<string>('chatgpt');
export const comparisonMode = writable<boolean>(false);
export const datasetArticles = writable<Record<string, Article[]>>({});
export const comparisonDatasets = writable<ComparisonData[] | null>(null);

// Store for discrepancy filters
export const discrepancyFilters = writable<DiscrepancyFilter>({
  minDifference: 0,
  maxDifference: 5,
  dimensions: ['polarity', 'subjectivity', 'centrality']
});

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
        if (!subjectivities.includes(score)) {
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
export const loadDatasetArticles = async (filePath: string, datasetId: string, fetchFunction: (url: string) => Promise<Response>): Promise<Article[]> => {
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
export const loadSpecificDataset = async (datasetId: string, fetchFunction: (url: string) => Promise<Response>): Promise<void> => {
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
export const loadAllDatasets = async (fetchFunction: (url: string) => Promise<Response>): Promise<void> => {
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

// Filtered comparisons based on discrepancy filters
export const filteredComparisons = derived(
  [comparisonData, discrepancyFilters, countryFilters, journalFilters],
  ([$comparisons, $filters, $countries, $journals]) => {
    return $comparisons.filter(comparison => {
      // Apply country filter
      if ($countries.length > 0 && !$countries.includes(comparison.article.Country || '')) {
        return false;
      }
      
      // Apply journal filter
      const journalName = getJournalName(comparison.article);
      if ($journals.length > 0 && !$journals.includes(journalName)) {
        return false;
      }
      
      // Apply discrepancy filters
      const disc = comparison.discrepancies;
      
      // Check total difference range
      if (disc.totalDiff < $filters.minDifference || disc.totalDiff > $filters.maxDifference) {
        return false;
      }
      
      // Check selected dimensions
      let hasRelevantDiff = false;
      if ($filters.dimensions.includes('polarity') && disc.polarityDiff > 0) hasRelevantDiff = true;
      if ($filters.dimensions.includes('subjectivity') && disc.subjectivityDiff > 0) hasRelevantDiff = true;
      if ($filters.dimensions.includes('centrality') && disc.centralityDiff > 0) hasRelevantDiff = true;
      
      return hasRelevantDiff;
    });
  }
);

// Comparison statistics
export const comparisonStatistics = derived(
  filteredComparisons,
  ($comparisons) => {
    if ($comparisons.length === 0) {
      return {
        totalArticles: 0,
        totalDiscrepancies: 0,
        averageDiscrepancy: 0,
        polarityConflicts: 0,
        subjectivityConflicts: 0,
        centralityConflicts: 0,
        highConflictArticles: 0
      };
    }
    
    const stats = $comparisons.reduce((acc, comp) => {
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
      totalArticles: $comparisons.length,
      totalDiscrepancies: stats.totalDiscrepancies,
      averageDiscrepancy: stats.totalDiffSum / $comparisons.length,
      polarityConflicts: stats.polarityConflicts,
      subjectivityConflicts: stats.subjectivityConflicts,
      centralityConflicts: stats.centralityConflicts,
      highConflictArticles: stats.highConflictArticles
    };
  }
); 