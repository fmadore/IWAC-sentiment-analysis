// Stores Svelte pour la gestion d'état 
import { writable, derived } from 'svelte/store';
import type { Article, DatasetInfo } from './types/data.ts'; // Ajustez le chemin

export const availableDatasets = writable<DatasetInfo[]>([]);
export const selectedDatasetId = writable<string | null>(null);
export const currentDatasetArticles = writable<Article[]>([]); // Articles du dataset sélectionné
export const isLoadingDataset = writable<boolean>(false);

// Filtres
export const journalFilter = writable<string[]>([]); // Liste des journaux sélectionnés
export const polarityFilter = writable<string[]>([]); // Liste des polarités sélectionnées
export const subjectivityFilterRange = writable<[number, number] | null>([1, 5]); // [min, max]

// Données filtrées pour les graphiques
export const filteredArticles = derived(
    [currentDatasetArticles, journalFilter, polarityFilter, subjectivityFilterRange],
    ([$currentDatasetArticles, $journalFilter, $polarityFilter, $subjectivityFilterRange]) => {
        if (!$currentDatasetArticles) return [];
        return $currentDatasetArticles.filter(article => {
            const sa = article.sentiment_analysis;
            if (!sa) return false; // Ou inclure si on veut montrer les articles sans analyse

            const journalMatch = $journalFilter.length === 0 || ($journalFilter.includes(article.journal_source || ''));
            const polarityMatch = $polarityFilter.length === 0 || ($polarityFilter.includes(sa.polarite || ''));

            let subjectivityMatch = true;
            if ($subjectivityFilterRange && sa.subjectivite_score !== null) {
                subjectivityMatch = sa.subjectivite_score >= $subjectivityFilterRange[0] && sa.subjectivite_score <= $subjectivityFilterRange[1];
            } else if ($subjectivityFilterRange && sa.subjectivite_score === null) {
                subjectivityMatch = false; // Exclure si score null et filtre actif
            }

            return journalMatch && polarityMatch && subjectivityMatch;
        });
    }
); 