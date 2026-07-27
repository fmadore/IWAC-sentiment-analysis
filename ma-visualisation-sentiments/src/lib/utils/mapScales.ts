/**
 * The map's two visual scales, in one place.
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
import { polarityColors } from './chartTheme';

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
 * Places whose articles all declined to take a stance carry this sentinel in
 * place of a mean, because MapLibre expressions cannot branch on null.
 */
export const UNSCORED_MEAN = -1;

/**
 * The diverging ramp, low to high, cut at the midpoints between the ordinal
 * levels of `POLARITY_ORDER` (Très négatif 1 … Très positif 5). Each entry is
 * one legend swatch and one `step` stop.
 */
export const POLARITY_RAMP = [
	{ threshold: 0, color: polarityColors['Très négatif'], labelKey: 'veryNegative' },
	{ threshold: 1.5, color: polarityColors['Négatif'], labelKey: 'negative' },
	{ threshold: 2.5, color: polarityColors['Neutre'], labelKey: 'neutral' },
	{ threshold: 3.5, color: polarityColors['Positif'], labelKey: 'positive' },
	{ threshold: 4.5, color: polarityColors['Très positif'], labelKey: 'veryPositive' }
] as const;

/** Fill for places where no article expressed a stance. */
export const UNSCORED_COLOR = polarityColors['Non applicable'];

/** Mean polarity → ramp colour, with the unscored sentinel handled first. */
export function circleColorExpression(): ExpressionSpecification {
	const steps = POLARITY_RAMP.flatMap((stop, index) =>
		index === 0 ? [stop.color] : [stop.threshold, stop.color]
	);
	// Double cast: the spread widens the tuple to a union array, which TS cannot
	// reconcile with the positional tuple `ExpressionSpecification` demands. The
	// shape is pinned by mapScales.test.ts instead.
	return [
		'case',
		['<', ['get', 'meanPolarity'], 0],
		UNSCORED_COLOR,
		['step', ['get', 'meanPolarity'], ...steps]
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
