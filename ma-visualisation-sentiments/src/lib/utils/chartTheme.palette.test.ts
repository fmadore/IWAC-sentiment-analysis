/**
 * Guards the one duplication this design system cannot avoid.
 *
 * ECharts (zrender) has no modern-colour-space parser, so `chartTheme.ts`
 * restates the OKLCH sentiment ramps from `app.css` as sRGB hex. That is
 * documented and unavoidable. What was missing is the guard: nothing stopped
 * the two copies disagreeing, and a chart whose green differs from the badge
 * beside it reads to a reader as a claim about the data.
 *
 * Two independent failure modes, two tests:
 *
 *  1. The hex no longer matches the OKLCH it is annotated with — someone
 *     hand-edited a hex, or mis-ran the conversion.
 *  2. The annotated OKLCH is no longer a colour app.css actually defines —
 *     someone retuned a token and left the chart palette behind.
 *
 * Both read `chartTheme.ts` and `app.css` as text on purpose. Importing the
 * module would only compare it against itself.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { oklchToHex, parseOklch, type Oklch } from './oklch';

const readSource = (relativePath: string) =>
	readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

const chartThemeSource = readSource('./chartTheme.ts');
const appCssSource = readSource('../../app.css');

/** A hex literal in chartTheme.ts annotated with the OKLCH it came from. */
interface AnnotatedColor {
	hex: string;
	oklch: Oklch;
	raw: string;
	line: number;
}

/**
 * Collect every `'#RRGGBB', // oklch(L C h)` pair. The trailing comma is
 * optional — the last entry of each object literal has none.
 */
function collectAnnotatedColors(source: string): AnnotatedColor[] {
	const found: AnnotatedColor[] = [];

	source.split('\n').forEach((text, index) => {
		const match = /'(#[0-9A-Fa-f]{6})',?\s*\/\/\s*(oklch\([^)]*\))/.exec(text);
		if (!match) return;

		const oklch = parseOklch(match[2]);
		if (!oklch) return;

		found.push({ hex: match[1].toUpperCase(), oklch, raw: match[2], line: index + 1 });
	});

	return found;
}

/** Every plain `oklch(L C h)` value app.css declares, keyed for lookup. */
function collectAppCssColors(source: string): Map<string, string[]> {
	const byValue = new Map<string, string[]>();

	for (const match of source.matchAll(/(--[\w-]+):\s*(oklch\([^)]*\))/g)) {
		const oklch = parseOklch(match[2]);
		if (!oklch) continue;

		const key = colorKey(oklch);
		byValue.set(key, [...(byValue.get(key) ?? []), match[1]]);
	}

	return byValue;
}

/** Numeric identity, so `0.7` and `0.70` compare equal. */
const colorKey = ({ l, c, h }: Oklch) => `${l}|${c}|${h}`;

const annotatedColors = collectAnnotatedColors(chartThemeSource);
const appCssColors = collectAppCssColors(appCssSource);

describe('chart palette', () => {
	it('annotates enough of the palette to be worth guarding', () => {
		// A rewrite that dropped the `// oklch(...)` annotations would otherwise
		// make both tests below pass vacuously.
		expect(annotatedColors.length).toBeGreaterThanOrEqual(20);
		expect(appCssColors.size).toBeGreaterThanOrEqual(20);
	});

	it.each(annotatedColors)(
		'chartTheme.ts:$line — $hex is the sRGB translation of $raw',
		({ hex, oklch }) => {
			expect(oklchToHex(oklch)).toBe(hex);
		}
	);

	it('every colour the chart palette claims to mirror is still defined in app.css', () => {
		const orphans = annotatedColors
			.filter(({ oklch }) => !appCssColors.has(colorKey(oklch)))
			.map(({ hex, raw, line }) => `chartTheme.ts:${line} ${hex} ${raw}`);

		// A miss means app.css was retuned and the chart palette was not — the
		// charts and the badges are about to disagree.
		expect(orphans).toEqual([]);
	});
});
