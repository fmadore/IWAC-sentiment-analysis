import type { PageLoad } from './$types';
import type { DatasetInfo, Article, Dataset } from '$lib/types/data'; // Ajustez le chemin

export const load: PageLoad = async ({ fetch }) => {
  try {
    const manifestResponse = await fetch('/data/manifest.json'); // SvelteKit fetch peut accéder à static
    if (!manifestResponse.ok) {
      throw new Error('Failed to load manifest');
    }
    const availableDatasets: DatasetInfo[] = await manifestResponse.json();
    return {
      availableDatasets
    };
  } catch (error) {
    console.error("Error loading manifest:", error);
    return {
      availableDatasets: [],
      error: "Could not load dataset list."
    };
  }
};

// Fonction pour charger un dataset spécifique (peut être appelée depuis un composant)
export async function fetchDataset(filePath: string, datasetId: string, appFetch = fetch): Promise<Dataset> {
    try {
        const response = await appFetch(filePath); // Utiliser le fetch de SvelteKit ou le fetch global
        if (!response.ok) {
            throw new Error(`Failed to load dataset ${filePath}`);
        }
        const articles: Article[] = await response.json();
        // Injecter le dataset_id dans chaque article pour référence future
        return articles.map(article => ({ ...article, dataset_id: datasetId }));
    } catch (error) {
        console.error(`Error fetching dataset ${filePath}:`, error);
        return [];
    }
} 