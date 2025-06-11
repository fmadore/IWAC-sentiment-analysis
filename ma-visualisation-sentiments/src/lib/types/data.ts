// Définitions TypeScript pour vos données 

export interface SentimentAnalysis {
  centralite_islam_musulmans: 'Très central' | 'Central' | 'Secondaire' | 'Marginal' | 'Non abordé' | string | null; // string pour flexibilité si l'API renvoie autre chose
  centralite_justification: string | null;
  subjectivite: 'Factuel' | 'Plutôt factuel' | 'Mixte' | 'Plutôt subjectif' | 'Subjectif' | 'Non applicable' | string | null;
  subjectivite_score: number | null;
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