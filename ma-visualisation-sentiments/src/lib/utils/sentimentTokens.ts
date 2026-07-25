/**
 * The single source of truth for turning a sentiment value into the styling
 * hook that resolves its colours.
 *
 * Colours themselves live in `app.css`, which maps `[data-polarity]`,
 * `[data-subjectivity]` and `[data-centrality]` onto three custom properties:
 *
 *   --sentiment-fg      text colour
 *   --sentiment-bg      fill
 *   --sentiment-border  border colour
 *
 * A component that shows a sentiment value therefore needs exactly two things:
 * the data attribute from here, and one CSS rule reading those three
 * variables. Previously each component carried its own copy of all 16
 * value→token mappings (SentimentBadge, FilterChip, SentimentScaleList,
 * SubjectivityFilter and a set of standalone globals), so adding a scale value
 * or retuning a colour meant editing five files in lockstep.
 *
 * Values are stored in French, exactly as the models emit them.
 */

/** Polarity value (as stored) → the slug used in `data-polarity`. */
export const POLARITY_SLUGS = {
	'Très positif': 'very-positive',
	Positif: 'positive',
	Neutre: 'neutral',
	Négatif: 'negative',
	'Très négatif': 'very-negative',
	'Non applicable': 'na'
} as const;

/** Centrality value (as stored) → the slug used in `data-centrality`. */
export const CENTRALITY_SLUGS = {
	'Très central': 'very-central',
	Central: 'central',
	Secondaire: 'secondary',
	Marginal: 'marginal',
	'Non abordé': 'not-addressed'
} as const;

export type PolaritySlug = (typeof POLARITY_SLUGS)[keyof typeof POLARITY_SLUGS];
export type CentralitySlug = (typeof CENTRALITY_SLUGS)[keyof typeof CENTRALITY_SLUGS];
/** Subjectivity is already a 1–5 score; its slug is the score as a string. */
export type SubjectivitySlug = '1' | '2' | '3' | '4' | '5';

export const SENTIMENT_FAMILIES = ['polarity', 'subjectivity', 'centrality'] as const;

export type SentimentFamily = (typeof SENTIMENT_FAMILIES)[number];

/**
 * A resolved `{family}-{slug}` pair. Kept as one string because it is also the
 * public prop type of FilterChip, where a single exhaustively-typed `variant`
 * reads better at the call site than a family/value pair.
 */
export type SentimentVariant =
	`polarity-${PolaritySlug}` | `subjectivity-${SubjectivitySlug}` | `centrality-${CentralitySlug}`;

/**
 * Where each family lands when the value is missing or unrecognised. Polarity
 * and centrality have an explicit "no signal" step; subjectivity does not, so
 * it falls back to the midpoint.
 */
const FALLBACK_VARIANTS = {
	polarity: 'polarity-na',
	subjectivity: 'subjectivity-3',
	centrality: 'centrality-not-addressed'
} as const satisfies Record<SentimentFamily, SentimentVariant>;

/**
 * Resolve a stored sentiment value to its variant.
 *
 * Accepts `string | number | null | undefined` because callers hand over raw
 * article fields: subjectivity arrives as a number from the JSON but as a
 * string from URL state, and any field may be absent for an article a model
 * declined to score.
 */
export function sentimentVariant(
	family: SentimentFamily,
	value: string | number | null | undefined
): SentimentVariant {
	if (value === null || value === undefined || value === '') {
		return FALLBACK_VARIANTS[family];
	}

	switch (family) {
		case 'polarity': {
			const slug = POLARITY_SLUGS[String(value) as keyof typeof POLARITY_SLUGS];
			return slug ? `polarity-${slug}` : FALLBACK_VARIANTS.polarity;
		}
		case 'centrality': {
			const slug = CENTRALITY_SLUGS[String(value) as keyof typeof CENTRALITY_SLUGS];
			return slug ? `centrality-${slug}` : FALLBACK_VARIANTS.centrality;
		}
		case 'subjectivity': {
			const score = typeof value === 'number' ? value : parseInt(String(value), 10);
			return score >= 1 && score <= 5
				? (`subjectivity-${score}` as SentimentVariant)
				: FALLBACK_VARIANTS.subjectivity;
		}
	}
}

/**
 * Whether a string names one of the 16 sentiment variants, as opposed to a
 * component's own non-sentiment variant (FilterChip's `default` / `warning` /
 * `comparison`). Family prefixes are the discriminator, so this stays correct
 * as scale values are added.
 */
export function isSentimentVariant(value: string): value is SentimentVariant {
	return SENTIMENT_FAMILIES.some((family) => value.startsWith(`${family}-`));
}

export type SentimentDataAttributes =
	| { 'data-polarity': PolaritySlug }
	| { 'data-subjectivity': SubjectivitySlug }
	| { 'data-centrality': CentralitySlug };

/**
 * Split a variant into the data attribute that `app.css` keys its palette on,
 * ready to spread onto an element: `{...variantAttributes('polarity-neutral')}`
 * emits `data-polarity="neutral"`.
 */
export function variantAttributes(variant: SentimentVariant): SentimentDataAttributes {
	const separator = variant.indexOf('-');
	const family = variant.slice(0, separator);
	const slug = variant.slice(separator + 1);

	return { [`data-${family}`]: slug } as SentimentDataAttributes;
}

/** Convenience wrapper for the common "value straight from the data" case. */
export function sentimentAttributes(
	family: SentimentFamily,
	value: string | number | null | undefined
): SentimentDataAttributes {
	return variantAttributes(sentimentVariant(family, value));
}
