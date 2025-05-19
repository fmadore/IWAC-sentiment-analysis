import type { Article, Dataset } from './types/data.ts';

// Fonction pour charger un dataset spécifique (peut être appelée depuis un composant)
export async function fetchDataset(filePath: string, datasetId: string, appFetch = fetch): Promise<Dataset> {
    try {
        const response = await appFetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load dataset ${filePath}`);
        }
        // Temporarily type raw articles as any to handle potentially different structures from JSON
        const rawArticles: any[] = await response.json();
        
        // Map to the Article type, transforming fields as necessary
        return rawArticles.map((rawArticle): Article => ({
            // Spread known fields first to allow specific overrides
            'o:id': rawArticle['o:id'],
            'o:title': rawArticle['o:title'],
            journal_source: rawArticle.journal_source,
            // Transform dcterms:date to publication_date
            publication_date: rawArticle['dcterms:date'], 
            sentiment_analysis: rawArticle.sentiment_analysis,
            // Add the dataset_id
            dataset_id: datasetId,
            // Spread the rest of the rawArticle for any other fields not explicitly defined 
            // in Article but present in JSON, if desired, though this might not be type-safe.
            // For stricter typing, only map known fields.
            ...rawArticle 
        }));
    } catch (error) {
        console.error(`Error fetching dataset ${filePath}:`, error);
        return [];
    }
}

// Fonctions utilitaires 