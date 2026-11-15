/**
 * The evaluation-scale rows the methodology cards list (badge + description).
 *
 * Both arbiter cards and AnalysisInfo spelled the same three lists out by
 * hand: the polarity and centrality steps, their French badge strings, and the
 * sentiment variant each one is coloured by. Only the descriptions and the
 * badge wording differ between cards, so those are the parameters; the steps,
 * their order and their variants live here once.
 *
 * Pure: the caller passes the copy object (`$t.arbiter`, or AnalysisInfo's
 * own `copy`), so this module never subscribes to a store.
 */
import type { ScaleItem } from '#lib/components/common/SentimentScaleList.svelte';
import type { SentimentVariant } from '#lib/utils/sentimentTokens.js';

interface ScaleStep<K extends string, V extends string | number> {
	variant: SentimentVariant;
	/** The value as the data files store it — also the default badge. */
	value: V;
	/** The key of this step's description in the copy object. */
	copyKey: K;
}

const POLARITY_STEPS = [
	{ variant: 'polarity-very-positive', value: 'Très positif', copyKey: 'polarityVeryPositive' },
	{ variant: 'polarity-positive', value: 'Positif', copyKey: 'polarityPositive' },
	{ variant: 'polarity-neutral', value: 'Neutre', copyKey: 'polarityNeutral' },
	{ variant: 'polarity-negative', value: 'Négatif', copyKey: 'polarityNegative' },
	{ variant: 'polarity-very-negative', value: 'Très négatif', copyKey: 'polarityVeryNegative' }
] as const satisfies readonly ScaleStep<string, string>[];

const POLARITY_NOT_APPLICABLE = {
	variant: 'polarity-na',
	value: 'Non applicable',
	copyKey: 'polarityNotApplicable'
} as const satisfies ScaleStep<string, string>;

const SUBJECTIVITY_STEPS = [
	{ variant: 'subjectivity-1', value: 1, copyKey: 'subjectivity1' },
	{ variant: 'subjectivity-2', value: 2, copyKey: 'subjectivity2' },
	{ variant: 'subjectivity-3', value: 3, copyKey: 'subjectivity3' },
	{ variant: 'subjectivity-4', value: 4, copyKey: 'subjectivity4' },
	{ variant: 'subjectivity-5', value: 5, copyKey: 'subjectivity5' }
] as const satisfies readonly ScaleStep<string, number>[];

const CENTRALITY_STEPS = [
	{ variant: 'centrality-very-central', value: 'Très central', copyKey: 'centralityVeryCentral' },
	{ variant: 'centrality-central', value: 'Central', copyKey: 'centralityCentral' },
	{ variant: 'centrality-secondary', value: 'Secondaire', copyKey: 'centralitySecondary' },
	{ variant: 'centrality-marginal', value: 'Marginal', copyKey: 'centralityMarginal' },
	{ variant: 'centrality-not-addressed', value: 'Non abordé', copyKey: 'centralityNotAddressed' }
] as const satisfies readonly ScaleStep<string, string>[];

type PolarityStep = (typeof POLARITY_STEPS)[number] | typeof POLARITY_NOT_APPLICABLE;
type SubjectivityStep = (typeof SUBJECTIVITY_STEPS)[number];
type CentralityStep = (typeof CENTRALITY_STEPS)[number];

export type PolarityCopy = Record<(typeof POLARITY_STEPS)[number]['copyKey'], string> &
	Partial<Record<typeof POLARITY_NOT_APPLICABLE.copyKey, string>>;
export type SubjectivityCopy = Record<SubjectivityStep['copyKey'], string>;
export type CentralityCopy = Record<CentralityStep['copyKey'], string>;

interface ScaleOptions<S> {
	/** Badge text for a step; defaults to the stored value. */
	badge?: (step: S) => string;
	/** Optional bold label between badge and description. */
	label?: (step: S) => string;
}

function toItems<S extends ScaleStep<string, string | number>>(
	steps: readonly S[],
	copy: Record<string, string | undefined>,
	{ badge = (step) => String(step.value), label }: ScaleOptions<S>
): ScaleItem[] {
	return steps.map((step) => ({
		variant: step.variant,
		badge: badge(step),
		...(label ? { label: label(step) } : {}),
		description: copy[step.copyKey] ?? ''
	}));
}

/** Polarity, most positive first. `Non applicable` only when asked for. */
export function polarityScaleItems(
	copy: PolarityCopy,
	options: ScaleOptions<PolarityStep> & { includeNotApplicable?: boolean } = {}
): ScaleItem[] {
	const steps: readonly PolarityStep[] = options.includeNotApplicable
		? [...POLARITY_STEPS, POLARITY_NOT_APPLICABLE]
		: POLARITY_STEPS;
	return toItems(steps, copy, options);
}

/** Subjectivity ranks 1–5; the badge defaults to the rank. */
export function subjectivityScaleItems(
	copy: SubjectivityCopy,
	options: ScaleOptions<SubjectivityStep> = {}
): ScaleItem[] {
	return toItems(SUBJECTIVITY_STEPS, copy, options);
}

/** Centrality, most central first. */
export function centralityScaleItems(
	copy: CentralityCopy,
	options: ScaleOptions<CentralityStep> = {}
): ScaleItem[] {
	return toItems(CENTRALITY_STEPS, copy, options);
}
