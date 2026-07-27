/**
 * The map's visual scales, in one place.
 *
 * A legend that disagrees with the map is worse than no legend, and these
 * scales are consumed twice in incompatible forms: MapLibre wants declarative
 * paint expressions, the legend wants plain numbers it can draw SVG with. Both
 * are generated here so they cannot drift.
 *
 * Colours are hex on purpose — MapLibre's colour parser, like ECharts' zrender,
 * silently falls back to black on `oklch()` and `color-mix()`. `chartTheme.ts`
 * holds the sRGB translations of the app.css tokens.
 */

import type { ExpressionSpecification } from 'maplibre-gl';
import { centralityColors, polarityColors, subjectivityColors } from './chartTheme';
import type { MapDimension } from './placeAggregation';

/** Radius in px for a place with no articles, and for the busiest place. */
export const MIN_RADIUS = 3;
export const MAX_RADIUS = 34;

/**
 * Area-proportional sizing: perceived size tracks article count, and a circle's
 * area goes as r². Without the `sqrt`, a place with 100x the coverage would be
 * 100x wide and swallow the map.
 */
export function circleRadius(count: number, maxCount: number): number {
	const ceiling = Math.sqrt(Math.max(maxCount, 1));
	const ratio = Math.min(Math.sqrt(Math.max(count, 0)) / ceiling, 1);
	return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * ratio;
}

/** The MapLibre twin of `circleRadius`. Interpolation clamps outside the domain. */
export function circleRadiusExpression(maxCount: number): ExpressionSpecification {
	return [
		'interpolate',
		['linear'],
		['sqrt', ['get', 'count']],
		0,
		MIN_RADIUS,
		Math.sqrt(Math.max(maxCount, 1)),
		MAX_RADIUS
	] as ExpressionSpecification;
}

/**
 * Places whose articles all declined to take a stance (or were never analysed)
 * carry this sentinel in place of a mean, because MapLibre expressions cannot
 * branch on null.
 */
export const UNSCORED_MEAN = -1;

/** Fill for places with no scorable article on the active dimension. */
export const UNSCORED_COLOR = polarityColors['Non applicable'];

/** One legend swatch and one `step` stop. */
export interface RampStop {
	/** Lower bound of the bucket on the 1–5 mean scale. */
	threshold: number;
	color: string;
	/** Key into the dimension's i18n label group (see LABEL_GROUP below). */
	labelKey: string;
}

/**
 * Thresholds sit at the midpoints between the ordinal levels. Every dimension
 * is reported on the same 1–5 scale (see placeAggregation), so all three ramps
 * share these cut points and differ only in palette and labels.
 */
const THRESHOLDS = [1, 1.5, 2.5, 3.5, 4.5];

function ramp(colors: readonly string[], labelKeys: readonly string[]): RampStop[] {
	return colors.map((color, index) => ({
		threshold: THRESHOLDS[index],
		color,
		labelKey: labelKeys[index]
	}));
}

/**
 * Low-to-high ramps per dimension.
 *
 * polarity     — diverging red↔green; 'Non applicable' is NOT a stop here, it
 *                is excluded from the mean and rendered with UNSCORED_COLOR.
 * subjectivity — sequential cool→warm, scores 1–5.
 * centrality   — sequential amber; 'Non abordé' IS a stop, because it is a
 *                genuine bottom of the scale rather than a missing value.
 */
export const DIMENSION_RAMPS: Record<MapDimension, RampStop[]> = {
	polarity: ramp(
		[
			polarityColors['Très négatif'],
			polarityColors['Négatif'],
			polarityColors['Neutre'],
			polarityColors['Positif'],
			polarityColors['Très positif']
		],
		['veryNegative', 'negative', 'neutral', 'positive', 'veryPositive']
	),
	subjectivity: ramp(
		[
			subjectivityColors[1],
			subjectivityColors[2],
			subjectivityColors[3],
			subjectivityColors[4],
			subjectivityColors[5]
		],
		['factual', 'ratherFactual', 'mixed', 'ratherSubjective', 'subjective']
	),
	centrality: ramp(
		[
			centralityColors['Non abordé'],
			centralityColors['Marginal'],
			centralityColors['Secondaire'],
			centralityColors['Central'],
			centralityColors['Très central']
		],
		['notAddressed', 'marginal', 'secondary', 'central', 'veryCentral']
	)
};

/** Which i18n group holds each dimension's swatch labels. */
export const LABEL_GROUP: Record<MapDimension, 'sentiment' | 'subjectivity' | 'centrality'> = {
	polarity: 'sentiment',
	subjectivity: 'subjectivity',
	centrality: 'centrality'
};

/** Mean → ramp colour for one dimension, unscored sentinel handled first. */
export function circleColorExpression(dimension: MapDimension): ExpressionSpecification {
	const stops = DIMENSION_RAMPS[dimension];
	const steps = stops.flatMap((stop, index) =>
		index === 0 ? [stop.color] : [stop.threshold, stop.color]
	);
	// Double cast: the spread widens the tuple to a union array, which TS cannot
	// reconcile with the positional tuple `ExpressionSpecification` demands. The
	// shape is pinned by mapScales.test.ts instead.
	return [
		'case',
		['<', ['get', 'mean'], 0],
		UNSCORED_COLOR,
		['step', ['get', 'mean'], ...steps]
	] as unknown as ExpressionSpecification;
}

/** Round down to one significant figure: 552 → 500, 110 → 100, 7 → 7. */
function niceDown(value: number): number {
	if (value < 10) return Math.max(1, Math.floor(value));
	const magnitude = 10 ** Math.floor(Math.log10(value));
	return Math.floor(value / magnitude) * magnitude;
}

/**
 * Up to three ascending counts for the size legend, topped by the real maximum.
 *
 * The largest legend circle is the actual busiest place rather than a rounded
 * number, so it matches a bubble the reader can find on the map. The two below
 * it are rounded for legibility.
 */
export function legendCountStops(maxCount: number): number[] {
	const top = Math.max(Math.round(maxCount), 1);
	const candidates = [niceDown(top / 25), niceDown(top / 5), top];
	const stops: number[] = [];
	for (const value of candidates) {
		if (value >= 1 && !stops.includes(value) && value <= top) {
			stops.push(value);
		}
	}
	return stops.sort((a, b) => a - b);
}
