import type { Article, Dataset } from './types/data.ts';

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

// Fonctions utilitaires 