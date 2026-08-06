/**
 * OKLCH → sRGB hex conversion.
 *
 * A TypeScript port of `scripts/oklch-to-hex.py`, which is the script that
 * originally produced the hex literals in `chartTheme.ts`. It exists here so
 * the conversion can run inside vitest: ECharts cannot parse `oklch()`, so the
 * chart palette has to be duplicated as hex, and a duplicate with no test is a
 * duplicate that drifts. See `chartTheme.palette.test.ts`.
 *
 * Pipeline: OKLCH → OKLab → linear sRGB → sRGB, per Björn Ottosson. Channels
 * are clamped rather than gamut-mapped; every colour this project uses sits
 * well inside sRGB, so the distinction never arises.
 */

/** An OKLCH triple: lightness 0–1, chroma, hue in degrees. */
export interface Oklch {
	l: number;
	c: number;
	h: number;
}

function oklchToLinearSrgb({ l, c, h }: Oklch): [number, number, number] {
	const hRad = (h * Math.PI) / 180;
	const a = c * Math.cos(hRad);
	const b = c * Math.sin(hRad);

	const lRoot = l + 0.3963377774 * a + 0.2158037573 * b;
	const mRoot = l - 0.1055613458 * a - 0.0638541728 * b;
	const sRoot = l - 0.0894841775 * a - 1.291485548 * b;

	const lCubed = lRoot ** 3;
	const mCubed = mRoot ** 3;
	const sCubed = sRoot ** 3;

	return [
		4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed,
		-1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed,
		-0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed
	];
}

function linearToSrgbChannel(value: number): number {
	return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

/**
 * Round-half-away-from-zero, matching Python's `round()` on the positive
 * values this deals with. JavaScript's `Math.round` rounds half *up*, which
 * agrees for positives — but the clamp is what keeps both in step at the ends.
 */
function toByte(value: number): number {
	return Math.max(0, Math.min(255, Math.round(value * 255)));
}

/** Convert an OKLCH triple to the `#RRGGBB` string ECharts can parse. */
export function oklchToHex(color: Oklch): string {
	const channels = oklchToLinearSrgb(color)
		.map(linearToSrgbChannel)
		.map(toByte)
		.map((byte) => byte.toString(16).padStart(2, '0').toUpperCase());

	return `#${channels.join('')}`;
}

/**
 * Parse the space-separated OKLCH form this project writes everywhere —
 * `oklch(0.62 0.18 150)`. Returns null for anything else, including the
 * `color-mix()` expressions and slash-alpha forms that app.css also contains;
 * callers filter those out rather than guessing at them.
 */
export function parseOklch(source: string): Oklch | null {
	const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(source.trim());
	if (!match) return null;

	return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}
