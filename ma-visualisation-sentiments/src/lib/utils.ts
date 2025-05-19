import type { Article, Dataset } from './types/data.ts';
import { base } from '$app/paths';

// Fonction pour charger un dataset spécifique (peut être appelée depuis un composant)
export async function fetchDataset(filePath: string, datasetId: string, appFetch = fetch): Promise<Dataset> {
    try {
        const resolvedPath = `${base}${filePath}`;
        const response = await appFetch(resolvedPath);
        if (!response.ok) {
            throw new Error(`Failed to load dataset ${resolvedPath}`);
        }
        // Temporarily type raw articles as any to handle potentially different structures from JSON
        const rawArticles: any[] = await response.json();
        
        // Map to the Article type, transforming fields as necessary
        return rawArticles.map((rawArticle): Article => ({
            // Spread known fields first to allow specific overrides
            'o:id': rawArticle['o:id'],
            'o:title': rawArticle['o:title'],
            // Map display_title from JSON to journal_source in Article type
            journal_source: rawArticle['display_title'] || rawArticle.journal_source,
            // Transform dcterms:date to publication_date
            publication_date: rawArticle['dcterms:date'], 
            sentiment_analysis: rawArticle.sentiment_analysis,
            // Add the dataset_id
            dataset_id: datasetId,
            // Spread the rest of the rawArticle. Be mindful of overwriting already mapped fields if keys clash.
            // It's generally safer to explicitly map all needed fields from rawArticle.
            ...rawArticle 
        }));
    } catch (error) {
        console.error(`Error fetching dataset ${base}${filePath}:`, error);
        return [];
    }
}

// Fonctions utilitaires 