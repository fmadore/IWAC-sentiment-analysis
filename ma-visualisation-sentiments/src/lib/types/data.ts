// Définitions TypeScript pour vos données 

export interface SentimentAnalysis {
  centralite_islam_musulmans: 'Très central' | 'Central' | 'Secondaire' | 'Marginal' | 'Non abordé' | string | null; // string pour flexibilité si l'API renvoie autre chose
  centralite_justification: string | null;
  subjectivite_score: 1 | 2 | 3 | 4 | 5 | number | null; // Score from 1 (very objective) to 5 (very subjective)
  subjectivite_justification: string | null;
  polarite: 'Très positif' | 'Positif' | 'Neutre' | 'Négatif' | 'Très négatif' | 'Non applicable' | string | null;
  polarite_justification: string | null;
}

export interface Article {
  'o:id': number | string;
  'o:title'?: string;
  journal_source?: string;
  Newspaper?: string; // Field from the JSON data
  Country?: string; // Field from the JSON data
  publication_date?: string; // YYYY-MM-DD
  // ... autres champs Omeka que vous souhaitez utiliser ...
  sentiment_analysis: SentimentAnalysis | null;
  // Propriété ajoutée dynamiquement pour savoir de quel dataset vient l'article
  dataset_id: string;
}

export type Dataset = Article[]; // Un fichier JSON est un Dataset

export interface DatasetInfo { // Pour le manifest
    id: string; // Nom du fichier sans .json
    name: string; // Nom lisible pour l'utilisateur (par ex., titre de l'item Omeka)
    filePath: string; // Chemin vers le fichier JSON
}

// New types for multi-dataset support
export interface DatasetOption {
  id: string;
  name: string;
  file: string;
  icon?: string;
  color?: string;
}

export interface ComparisonData {
  article: Article;
  chatgpt: SentimentAnalysis | null;
  gemini: SentimentAnalysis | null;
  discrepancies: DiscrepancyInfo;
}

export interface DiscrepancyInfo {
  polarityDiff: number;
  subjectivityDiff: number;
  centralityDiff: number;
  totalDiff: number;
  hasConflict: boolean;
}

export interface DiscrepancyFilter {
  minDifference: number;
  maxDifference: number;
  dimensions: ('polarity' | 'subjectivity' | 'centrality')[];
  excludeNonApplicable: boolean;
}

export interface ComparisonStatistics {
  totalArticles: number;
  totalDiscrepancies: number;
  averageDiscrepancy: number;
  polarityConflicts: number;
  subjectivityConflicts: number;
  centralityConflicts: number;
} 