import type { Language } from './index.js';
import { translate } from './index.js';

// Mapping of French sentiment values to translation keys
export const SENTIMENT_VALUE_MAP = {
  // Polarity values
  'Très positif': 'sentiment.veryPositive',
  'Positif': 'sentiment.positive',
  'Neutre': 'sentiment.neutral',
  'Négatif': 'sentiment.negative',
  'Très négatif': 'sentiment.veryNegative',
  'Non applicable': 'sentiment.notApplicable',
  
  // Subjectivity values
  'Factuel': 'subjectivity.factual',
  'Plutôt factuel': 'subjectivity.ratherFactual',
  'Mixte': 'subjectivity.mixed',
  'Plutôt subjectif': 'subjectivity.ratherSubjective',
  'Subjectif': 'subjectivity.subjective',
  
  // Centrality values
  'Très central': 'centrality.veryCentral',
  'Central': 'centrality.central',
  'Secondaire': 'centrality.secondary',
  'Marginal': 'centrality.marginal',
  'Non abordé': 'centrality.notAddressed'
} as const;

// Reverse mapping from translation keys to French values (for data storage)
export const TRANSLATION_KEY_TO_FRENCH_MAP = Object.fromEntries(
  Object.entries(SENTIMENT_VALUE_MAP).map(([french, key]) => [key, french])
);

/**
 * Translates a sentiment value from French to the current language
 */
export function translateSentimentValue(frenchValue: string | null | undefined, lang?: Language): string {
  if (!frenchValue) return frenchValue || '';
  
  const translationKey = SENTIMENT_VALUE_MAP[frenchValue as keyof typeof SENTIMENT_VALUE_MAP];
  if (translationKey) {
    return translate(translationKey, lang);
  }
  
  // If no mapping found, return the original value
  return frenchValue;
}

/**
 * Gets all sentiment labels for a given category in the current language
 */
export function getSentimentLabels(category: 'polarity' | 'subjectivity' | 'centrality', lang?: Language): string[] {
  switch (category) {
    case 'polarity':
      return [
        translate('sentiment.veryPositive', lang),
        translate('sentiment.positive', lang),
        translate('sentiment.neutral', lang),
        translate('sentiment.negative', lang),
        translate('sentiment.veryNegative', lang),
        translate('sentiment.notApplicable', lang)
      ];
    case 'subjectivity':
      return [
        translate('subjectivity.factual', lang),
        translate('subjectivity.ratherFactual', lang),
        translate('subjectivity.mixed', lang),
        translate('subjectivity.ratherSubjective', lang),
        translate('subjectivity.subjective', lang),
        translate('subjectivity.notApplicable', lang)
      ];
    case 'centrality':
      return [
        translate('centrality.veryCentral', lang),
        translate('centrality.central', lang),
        translate('centrality.secondary', lang),
        translate('centrality.marginal', lang),
        translate('centrality.notAddressed', lang)
      ];
    default:
      return [];
  }
}

/**
 * Gets the French equivalent of a translated sentiment value
 * This is useful for filtering and data operations that expect French values
 */
export function getFrenchSentimentValue(translatedValue: string): string {
  // First, try to find the translation key that matches this translated value
  for (const [frenchValue, translationKey] of Object.entries(SENTIMENT_VALUE_MAP)) {
    if (translate(translationKey) === translatedValue) {
      return frenchValue;
    }
  }
  
  // If no match found, return the original value (might already be French)
  return translatedValue;
}

/**
 * Formats a number according to the current language locale
 */
export function formatNumber(num: number, lang?: Language): string {
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  return num.toLocaleString(locale);
}

/**
 * Gets the appropriate locale string for the current language
 */
export function getLocale(lang?: Language): string {
  return lang === 'en' ? 'en-US' : 'fr-FR';
} 