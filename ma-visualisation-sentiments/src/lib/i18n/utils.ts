import { derived } from 'svelte/store';
import type { Language } from './index.js';
import { currentLanguage, t, translate, translateFrom } from './index.js';
import type { Translations } from './types.js';
import { NOT_ANNOTATED } from '#lib/domain/sentimentContract.js';

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

/** Resolves a catalogue key to its label. */
type Lookup = (key: string) => string;

/** A one-shot lookup in a language's catalogue, read at call time. */
const lookupIn =
	(lang?: Language): Lookup =>
	(key) =>
		translate(key, lang);

/** A lookup in a catalogue already in hand (the value of `$t`). */
const lookupFrom =
	(catalogue: Translations): Lookup =>
	(key) =>
		translateFrom(catalogue, key);

type ScaleCategory = 'polarity' | 'subjectivity' | 'centrality';

function sentimentLabelWith(lookup: Lookup, frenchValue: string | null | undefined): string {
	if (!frenchValue) return frenchValue || '';

	const translationKey = SENTIMENT_VALUE_MAP[frenchValue as keyof typeof SENTIMENT_VALUE_MAP];
	if (translationKey) {
		return lookup(translationKey);
	}

	// If no mapping found, return the original value
	return frenchValue;
}

function subjectivityLabelWith(lookup: Lookup, score: number | null | undefined): string {
	if (score === null || score === undefined) return lookup('sentiment.notAnnotated');

	const translationKey = SUBJECTIVITY_SCORE_MAP[score as keyof typeof SUBJECTIVITY_SCORE_MAP];
	if (translationKey) {
		return lookup(translationKey);
	}

	// If no mapping found, return the score as string
	return score.toString();
}

function scaleLabelsWith(lookup: Lookup, category: ScaleCategory): string[] {
	switch (category) {
		case 'polarity':
			return [
				lookup('sentiment.veryPositive'),
				lookup('sentiment.positive'),
				lookup('sentiment.neutral'),
				lookup('sentiment.negative'),
				lookup('sentiment.veryNegative'),
				lookup('sentiment.notApplicable')
			];
		case 'subjectivity':
			return [
				lookup('subjectivity.factual'),
				lookup('subjectivity.ratherFactual'),
				lookup('subjectivity.mixed'),
				lookup('subjectivity.ratherSubjective'),
				lookup('subjectivity.subjective'),
				// The sixth bucket is a null score: no model emits "Non applicable" for
				// subjectivity, both generations store a 1-5 rank or nothing.
				lookup('sentiment.notAnnotated')
			];
		case 'centrality':
			return [
				lookup('centrality.veryCentral'),
				lookup('centrality.central'),
				lookup('centrality.secondary'),
				lookup('centrality.marginal'),
				lookup('centrality.notAddressed')
			];
		default:
			return [];
	}
}

/*
 * The three functions below read the catalogue once, at call time: right for
 * imperative work (a CSV built on click) and for tests, wrong in a component.
 * In a `$derived` or a template use the `sentimentLabel`, `subjectivityLabel`
 * and `scaleLabels` stores further down instead.
 */

/**
 * Translates a sentiment value from French to the given language (one-shot).
 * The French value is a data key and is never altered; only the label changes.
 */
export function translateSentimentValue(
	frenchValue: string | null | undefined,
	lang?: Language
): string {
	return sentimentLabelWith(lookupIn(lang), frenchValue);
}

/** Translates a numeric subjectivity score to the given language (one-shot). */
export function translateSubjectivityScore(
	score: number | null | undefined,
	lang?: Language
): string {
	return subjectivityLabelWith(lookupIn(lang), score);
}

/** All the labels of one scale, in rank order, in the given language (one-shot). */
export function getSentimentLabels(category: ScaleCategory, lang?: Language): string[] {
	return scaleLabelsWith(lookupIn(lang), category);
}

/**
 * The label helpers bound to the active catalogue, as stores:
 * `{$sentimentLabel('Très positif')}`, `{$subjectivityLabel(3)}`,
 * `$scaleLabels('polarity')`.
 *
 * They derive from `t`, not from `currentLanguage`. The language switches at
 * once while the English catalogue is still being fetched, so a reader that
 * subscribed to the language alone ran once against the French fallback and
 * never again: after the first switch to English the labels stayed French.
 * `t` emits again when the catalogue lands, and so do these.
 */
export const sentimentLabel = derived(t, ($t) => {
	const lookup = lookupFrom($t);
	return (frenchValue: string | null | undefined) => sentimentLabelWith(lookup, frenchValue);
});

export const subjectivityLabel = derived(t, ($t) => {
	const lookup = lookupFrom($t);
	return (score: number | null | undefined) => subjectivityLabelWith(lookup, score);
});

export const scaleLabels = derived(t, ($t) => {
	const lookup = lookupFrom($t);
	return (category: ScaleCategory) => scaleLabelsWith(lookup, category);
});

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
 * is British English.
 *
 * The date keeps the precision it was recorded with. A month-precision
 * `1997-10` reads `October 1997` / `octobre 1997`: `new Date('1997-10')` does
 * parse, as midnight UTC on the 1st, so formatting it as a full date invented a
 * day and, west of UTC, slid it into the previous month. A bare year and an ISO
 * range such as `1993-02/1993-03` are returned as they came. A missing date
 * reads as the localised "no data"; anything else unparseable is returned
 * unchanged, since it still tells the reader something.
 */
export function formatDate(dateStr: string | null | undefined, lang?: Language): string {
	return formatDateWith(lookupIn(lang), dateStr, lang);
}

const YEAR = /^\d{4}$/;
const YEAR_MONTH = /^\d{4}-\d{2}$/;
const ISO_RANGE = /^\d{4}(?:-\d{2}){0,2}\/\d{4}(?:-\d{2}){0,2}$/;

function formatDateWith(
	lookup: Lookup,
	dateStr: string | null | undefined,
	lang?: Language
): string {
	if (!dateStr) return lookup('messages.noData');
	// Explicit rather than left to `new Date`, whose parsing of non-ISO-date
	// strings differs between engines.
	if (YEAR.test(dateStr) || ISO_RANGE.test(dateStr)) return dateStr;
	if (YEAR_MONTH.test(dateStr)) {
		const month = new Date(`${dateStr}-01T00:00:00Z`);
		if (isNaN(month.getTime())) return dateStr;
		return month.toLocaleDateString(localeOf(lang), {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return dateStr;
	return date.toLocaleDateString(localeOf(lang), {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		// ISO date-only values are calendar dates, parsed by JavaScript at
		// midnight UTC. Formatting in a western timezone would show the day
		// before publication. Timestamps retain their local-time behaviour.
		timeZone: /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? 'UTC' : undefined
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
 * Same shape as the numeric formatters, for the same reason — plus `t`, since
 * the "no data" placeholder comes from the catalogue, which lands after the
 * language has switched (see `sentimentLabel`).
 */
export const fmtDate = derived([currentLanguage, t], ([$lang, $t]) => {
	const lookup = lookupFrom($t);
	return (value: string | null | undefined) => formatDateWith(lookup, value, $lang);
});
