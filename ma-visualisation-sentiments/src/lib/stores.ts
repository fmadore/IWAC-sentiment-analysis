// Stores Svelte pour la gestion d'état 
import { writable, derived } from 'svelte/store';
import type { Article } from './types/data';
import { base } from '$app/paths';

// Store pour les articles du dataset actuel
export const currentDatasetArticles = writable<Article[]>([]);

// Store pour l'article actuellement sélectionné
export const selectedArticle = writable<Article | null>(null);

// Store pour l'état de chargement
export const isLoadingDataset = writable<boolean>(false);

// Stores pour les filtres
export const journalFilters = writable<string[]>([]);
export const polarityFilters = writable<string[]>([]);
export const subjectivityFilters = writable<number[]>([]);
export const centralityFilters = writable<string[]>([]);

// Store dérivé pour les articles filtrés
export const filteredArticles = derived(
  [currentDatasetArticles, journalFilters, polarityFilters, subjectivityFilters, centralityFilters],
  ([articles, journals, polarities, subjectivities, centralities]) => {
    return articles.filter(article => {
      // Filtre par journal
      if (journals.length > 0 && !journals.includes(article.journal_source || '')) {
        return false;
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

// Fonction utilitaire pour mapper les propriétés des articles depuis différents formats
function mapArticleProperties(item: any, datasetId: string): Article {
  return {
    // Propriétés standard requises
    'o:id': item['o:id'],
    'o:title': item['o:title'],
    // Mapper les noms de propriétés qui peuvent varier
    journal_source: item.journal_source || item.Newspaper || item.display_title || 'N/A',
    publication_date: item.publication_date || item['dcterms:date'] || 'N/A',
    sentiment_analysis: item.sentiment_analysis || null,
    dataset_id: datasetId,
    // Conserver toutes les propriétés originales
    ...item
  };
} 