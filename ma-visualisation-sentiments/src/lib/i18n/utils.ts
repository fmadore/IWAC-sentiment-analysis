import { derived } from 'svelte/store';
import type { Language } from './index.js';
import { currentLanguage, translate } from './index.js';
import { NOT_ANNOTATED } from '$lib/domain/sentimentContract';

// Mapping of French sentiment values to translation keys
export const SENTIMENT_VALUE_MAP = {
	// Polarity values
	'Très positif': 'sentiment.veryPositive',
	Positif: 'sentiment.positive',
	Neutre: 'sentiment.neutral',
	Négatif: 'sentiment.negative',
	'Très négatif': 'sentiment.veryNegative',
	'Non applicable': 'sentiment.notApplicable',

	// Centrality values
	'Très central': 'centrality.veryCentral',
	Central: 'centrality.central',
	Secondaire: 'centrality.secondary',
	Marginal: 'centrality.marginal',
	'Non abordé': 'centrality.notAddressed',

	// The filter rail's bucket for a rating that does not exist (not a stored value)
	[NOT_ANNOTATED]: 'sentiment.notAnnotated'
} as const;

// Mapping for numeric subjectivity scores to translation keys
export const SUBJECTIVITY_SCORE_MAP = {
	1: 'subjectivity.factual', // Very objective
	2: 'subjectivity.ratherFactual', // Rather objective
	3: 'subjectivity.mixed', // Mixed
	4: 'subjectivity.ratherSubjective', // Rather subjective
	5: 'subjectivity.subjective' // Very subjective
} as const;

/**
 * Translates a sentiment value from French to the current language
 */
export function translateSentimentValue(
	frenchValue: string | null | undefined,
	lang?: Language
): string {
	if (!frenchValue) return frenchValue || '';

	const translationKey = SENTIMENT_VALUE_MAP[frenchValue as keyof typeof SENTIMENT_VALUE_MAP];
	if (translationKey) {
		return translate(translationKey, lang);
	}

	// If no mapping found, return the original value
	return frenchValue;
}

/**
 * Translates a numeric subjectivity score to the current language
 */
export function translateSubjectivityScore(
	score: number | null | undefined,
	lang?: Language
): string {
	if (score === null || score === undefined) return translate('sentiment.notAnnotated', lang);

	const translationKey = SUBJECTIVITY_SCORE_MAP[score as keyof typeof SUBJECTIVITY_SCORE_MAP];
	if (translationKey) {
		return translate(translationKey, lang);
	}

	// If no mapping found, return the score as string
	return score.toString();
}

/**
 * Gets all sentiment labels for a given category in the current language
 */
export function getSentimentLabels(
	category: 'polarity' | 'subjectivity' | 'centrality',
	lang?: Language
): string[] {
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
				// The sixth bucket is a null score: no model emits "Non applicable" for
				// subjectivity, both generations store a 1-5 rank or nothing.
				translate('sentiment.notAnnotated', lang)
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
 * Formats a number for display in the active language: `12,356` in English,
 * `12 356` in French (a narrow no-break space, which is the French convention).
 *
 * Always pass `lang`. A bare `num.toLocaleString()` follows the *browser's*
 * locale, not the language the reader chose, so an English page on a French
 * machine grouped its thousands the French way and vice versa — wrong one way
 * or the other for everyone.
 */
export function formatNumber(num: number, lang?: Language): string {
	return num.toLocaleString(localeOf(lang));
}

/** The BCP 47 tag behind every locale-aware format in the app. */
export function localeOf(lang?: Language): 'en-GB' | 'fr-FR' {
	return lang === 'en' ? 'en-GB' : 'fr-FR';
}

/**
 * A number with a fixed number of decimal places, in the active language:
 * `0.359` in English, `0,359` in French.
 *
 * `toFixed` always emits a full stop, which is not a decimal separator in
 * French. Non-finite input formats as `NaN`, exactly as `toFixed` does, so the
 * guards call sites already have keep working.
 */
export function formatDecimal(value: number, digits: number, lang?: Language): string {
	return new Intl.NumberFormat(localeOf(lang), {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	}).format(value);
}

/**
 * A percentage, from a fraction between 0 and 1: `58.1%` in English,
 * `58,1 %` in French.
 *
 * Intl supplies the French narrow no-break space before the sign, which is why
 * this goes through `style: 'percent'` rather than formatting the number and
 * appending a literal `%`. Call sites holding a 0–100 value pass `value / 100`.
 */
export function formatPercent(fraction: number, digits: number, lang?: Language): string {
	return new Intl.NumberFormat(localeOf(lang), {
		style: 'percent',
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	}).format(fraction);
}

/**
 * A publication date in the active language: `19 October 2011` in English,
 * `19 octobre 2011` in French. en-GB rather than en-US because the interface
 * is British English. A missing date reads as the localised "no data"; an
 * unparseable one is returned as it came, since a partial ISO date such as
 * `1998-03` still tells the reader something.
 */
export function formatDate(dateStr: string | null | undefined, lang?: Language): string {
	if (!dateStr) return translate('messages.noData', lang);
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return dateStr;
	return date.toLocaleDateString(localeOf(lang), {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

/**
 * The formatters bound to the active language, as stores: `{$num(12356)}`,
 * `{$dec(0.359, 3)}`, `{$pct(0.581, 1)}`, `{$fmtDate(article.publication_date)}`.
 *
 * Stores rather than plain functions so that a template — or an ECharts option
 * object built inside a `$derived` — re-runs when the language changes. Reading
 * the language with a one-shot `get()` would format correctly on first paint
 * and then silently keep the old separators after a switch.
 */
export const num = derived(
	currentLanguage,
	($lang) => (value: number) => formatNumber(value, $lang)
);

export const dec = derived(
	currentLanguage,
	($lang) => (value: number, digits: number) => formatDecimal(value, digits, $lang)
);

export const pct = derived(
	currentLanguage,
	($lang) => (fraction: number, digits: number) => formatPercent(fraction, digits, $lang)
);

/**
 * Dates went through a plain function that read the language with a one-shot
 * `get()`. That is not a reactive read, so a table's dates kept the previous
 * locale after a language switch until something else re-rendered the row.
 * Same shape as the numeric formatters, for the same reason.
 */
export const fmtDate = derived(
	currentLanguage,
	($lang) => (value: string | null | undefined) => formatDate(value, $lang)
);
