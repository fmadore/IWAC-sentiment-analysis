import { describe, it, expect } from 'vitest';
import {
	DIMENSION_RAMPS,
	LABEL_GROUP,
	MAX_RADIUS,
	MIN_RADIUS,
	UNSCORED_COLOR,
	UNSCORED_MEAN,
	circleColorExpression,
	circleRadius,
	circleRadiusExpression,
	legendCountStops
} from './mapScales';
import { MAP_DIMENSIONS, type MapDimension } from './placeAggregation';

/**
 * Mirror of MapLibre's `["interpolate", ["linear"], input, ...stops]` for the
 * two-stop case, including its clamping outside the domain. The legend draws
 * with `circleRadius` while the map paints with the expression, so the point of
 * these tests is that the two agree.
 */
function evaluateRadiusExpression(expression: unknown[], count: number): number {
	const [, , , inLow, outLow, inHigh, outHigh] = expression as [
		string,
		unknown,
		unknown,
		number,
		number,
		number,
		number
	];
	const input = Math.sqrt(count);
	if (input <= inLow) return outLow;
	if (input >= inHigh) return outHigh;
	return outLow + ((outHigh - outLow) * (input - inLow)) / (inHigh - inLow);
}

describe('circleRadius', () => {
	it('gives the busiest place the maximum radius', () => {
		expect(circleRadius(2761, 2761)).toBeCloseTo(MAX_RADIUS);
	});

	it('gives an unmentioned place the minimum radius', () => {
		expect(circleRadius(0, 2761)).toBeCloseTo(MIN_RADIUS);
	});

	it('scales by area, not by diameter', () => {
		// A place with 1/4 the articles should be half the way up the radius
		// ramp, not a quarter — that is what sqrt buys.
		const max = 400;
		const quarter = circleRadius(100, max);
		const expected = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * 0.5;
		expect(quarter).toBeCloseTo(expected);
	});

	it('clamps counts above the maximum', () => {
		expect(circleRadius(9999, 100)).toBeCloseTo(MAX_RADIUS);
	});

	it('survives a degenerate maximum of zero', () => {
		expect(Number.isFinite(circleRadius(0, 0))).toBe(true);
		expect(circleRadius(0, 0)).toBeCloseTo(MIN_RADIUS);
	});
});

describe('circleRadiusExpression', () => {
	it('agrees with circleRadius across the range — legend cannot drift from map', () => {
		const maxCount = 2761;
		const expression = circleRadiusExpression(maxCount);
		for (const count of [0, 1, 7, 100, 500, 1000, 2761]) {
			expect(evaluateRadiusExpression(expression, count)).toBeCloseTo(
				circleRadius(count, maxCount),
				6
			);
		}
	});

	it('is a two-stop linear interpolation over sqrt(count)', () => {
		const expression = circleRadiusExpression(400);
		expect(expression[0]).toBe('interpolate');
		expect(expression[1]).toEqual(['linear']);
		expect(expression[2]).toEqual(['sqrt', ['get', 'count']]);
		expect(expression.slice(3)).toEqual([0, MIN_RADIUS, 20, MAX_RADIUS]);
	});
});

describe('circleColorExpression', () => {
	it.each(MAP_DIMENSIONS)('routes the unscored sentinel to grey first (%s)', (dimension) => {
		const expression = circleColorExpression(dimension);
		expect(expression[0]).toBe('case');
		expect(expression[1]).toEqual(['<', ['get', 'mean'], 0]);
		expect(expression[2]).toBe(UNSCORED_COLOR);
		expect(UNSCORED_MEAN).toBeLessThan(0);
	});

	it.each(MAP_DIMENSIONS)('steps through every ramp colour in order (%s)', (dimension) => {
		const expression = circleColorExpression(dimension);
		const ramp = DIMENSION_RAMPS[dimension];
		const step = expression[3] as unknown[];

		expect(step[0]).toBe('step');
		expect(step[1]).toEqual(['get', 'mean']);

		// step: [op, input, default, t1, c1, t2, c2, ...] — so after slice(3) the
		// thresholds sit at even relative indices and the colours at odd ones.
		const tail = step.slice(3);
		const colors = [step[2], ...tail.filter((_, i) => i % 2 === 1)];
		expect(colors).toEqual(ramp.map((stop) => stop.color));

		const thresholds = tail.filter((_, i) => i % 2 === 0);
		expect(thresholds).toEqual(ramp.slice(1).map((stop) => stop.threshold));
	});
});

describe('DIMENSION_RAMPS', () => {
	it('covers every dimension the map can show', () => {
		expect(Object.keys(DIMENSION_RAMPS).sort()).toEqual([...MAP_DIMENSIONS].sort());
	});

	it.each(MAP_DIMENSIONS)('cuts %s at the midpoints of the 1-5 scale', (dimension) => {
		// Every dimension is reported on the same 1-5 scale, which is what lets
		// one set of thresholds and one legend layout serve all three.
		expect(DIMENSION_RAMPS[dimension].map((s) => s.threshold)).toEqual([1, 1.5, 2.5, 3.5, 4.5]);
	});

	it.each(MAP_DIMENSIONS)('gives %s five distinct colours', (dimension) => {
		const colors = DIMENSION_RAMPS[dimension].map((s) => s.color);
		expect(colors).toHaveLength(5);
		expect(new Set(colors).size).toBe(5);
	});

	it.each(MAP_DIMENSIONS)('never reuses the unscored grey inside the %s ramp', (dimension) => {
		expect(DIMENSION_RAMPS[dimension].map((s) => s.color)).not.toContain(UNSCORED_COLOR);
	});

	it('gives each dimension its own palette', () => {
		const [a, b, c] = MAP_DIMENSIONS.map((d) => DIMENSION_RAMPS[d].map((s) => s.color).join());
		expect(new Set([a, b, c]).size).toBe(3);
	});

	it('points every dimension at an i18n group', () => {
		for (const dimension of MAP_DIMENSIONS) {
			expect(LABEL_GROUP[dimension as MapDimension]).toBeTruthy();
		}
	});
});

describe('legendCountStops', () => {
	it('tops out at the real maximum so the biggest circle matches a real bubble', () => {
		expect(legendCountStops(2761).at(-1)).toBe(2761);
	});

	it('rounds the intermediate stops for legibility', () => {
		expect(legendCountStops(2761)).toEqual([100, 500, 2761]);
	});

	it('returns ascending, distinct values', () => {
		for (const max of [1, 2, 7, 23, 99, 100, 1234, 40630]) {
			const stops = legendCountStops(max);
			expect(new Set(stops).size).toBe(stops.length);
			expect([...stops].sort((a, b) => a - b)).toEqual(stops);
			expect(stops.at(-1)).toBe(max);
		}
	});

	it('collapses to a single stop for a tiny selection', () => {
		expect(legendCountStops(1)).toEqual([1]);
	});

	it('never emits a stop above the maximum', () => {
		for (const max of [3, 11, 26, 149]) {
			for (const stop of legendCountStops(max)) {
				expect(stop).toBeLessThanOrEqual(max);
				expect(stop).toBeGreaterThanOrEqual(1);
			}
		}
	});
});
