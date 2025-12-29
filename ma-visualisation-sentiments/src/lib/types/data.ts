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
  /** Path to SVG logo (relative to static folder, e.g., '/logo/ChatGPT_logo.svg') */
  logo?: string;
  /** Fallback icon emoji (deprecated, use logo instead) */
  icon?: string;
  color?: string;
}

// Model pair type for comparison mode
export type ModelPair = 'chatgpt-gemini' | 'chatgpt-mistral' | 'gemini-mistral';

// Helper to get model IDs from a pair
export function getModelsFromPair(pair: ModelPair): [string, string] {
  switch (pair) {
    case 'chatgpt-gemini': return ['chatgpt', 'gemini'];
    case 'chatgpt-mistral': return ['chatgpt', 'mistral'];
    case 'gemini-mistral': return ['gemini', 'mistral'];
  }
}

export interface ComparisonData {
  article: Article;
  /** Model A sentiment analysis (first model in pair) */
  modelA: SentimentAnalysis | null;
  /** Model B sentiment analysis (second model in pair) */
  modelB: SentimentAnalysis | null;
  /** IDs of the models being compared */
  modelAId: string;
  modelBId: string;
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

// Arbiter (Gemini 3 Pro) evaluation types
export interface ArbiterDimensionScore {
  score: string;  // The arbiter's own score
  justification: string;  // Why the arbiter chose this score
  preferred_model: 'model_a' | 'model_b' | 'both' | 'neither';  // Blind assignment
  verdict_explanation: string;  // Why one model is preferred
}

export interface ArbiterAnalysis {
  article_id: string;
  polarity: ArbiterDimensionScore;
  subjectivity: ArbiterDimensionScore;
  centrality: ArbiterDimensionScore;
  overall_verdict: string;  // General assessment
  confidence_level: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface ArbiterEvaluationData {
  metadata: {
    generated: string;
    arbiter_model: string;
    blind_evaluation: boolean;
    model_a_is_chatgpt?: boolean;  // Legacy: Global key for ChatGPT vs Gemini
    model_a_is_first?: boolean;     // New: true = Model A is first model in pair
    model_a_name?: string;          // Display name of Model A
    model_b_name?: string;          // Display name of Model B
    pair?: string;                  // Model pair (e.g., 'chatgpt-gemini')
    total_articles: number;
    successful_evaluations: number;
    failed_evaluations: number;
  };
  evaluations: Array<{
    article_id: string;
    arbiter: ArbiterAnalysis;
    discrepancies: {
      polarity_diff: number;
      subjectivity_diff: number;
      centrality_diff: number;
      total_diff: number;
      has_significant_conflict: boolean;
    };
  }>;
} 