import type { Article } from './types/data.ts';

// Fonction utilitaire pour obtenir le nom du journal de manière cohérente
export function getJournalName(article: Article): string {
  return article.journal_source || article.Newspaper || 'Inconnu';
}