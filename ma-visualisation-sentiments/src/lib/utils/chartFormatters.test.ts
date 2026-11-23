/**
 * Tooltip swatches carry a polarity glyph so the equal-lightness poles are not
 * told apart by hue alone. Series are named with translated labels, so the
 * glyph has to come from the stored French key the chart hands over, not from
 * the display text — which matched only in French.
 */
import { describe, expect, it } from 'vitest';
import {
	createPieTooltipFormatter,
	createTrendTooltipFormatter,
	polarityGlyphKeys,
	tooltipSeriesRow
} from './chartFormatters.js';

const french = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif'];
const english = ['Very positive', 'Positive', 'Neutral', 'Negative', 'Very negative'];
const GLYPHS = ['▲', '△', '■', '▽', '▼'];
const glyphKeys = polarityGlyphKeys(english, french);

/** True when the markup holds any polarity glyph at all. */
const hasGlyph = (html: string) => /[▲△■▽▼○]/.test(html);

describe('polarityGlyphKeys', () => {
	it('pairs each display label with the French key at the same index', () => {
		expect(glyphKeys).toEqual({
			'Very positive': 'Très positif',
			Positive: 'Positif',
			Neutral: 'Neutre',
			Negative: 'Négatif',
			'Very negative': 'Très négatif'
		});
	});

	it('ignores French keys that have no display label', () => {
		expect(polarityGlyphKeys(['Positive'], ['Positif', 'Neutre'])).toEqual({
			Positive: 'Positif'
		});
	});
});

describe('tooltipSeriesRow', () => {
	it('draws the glyph for an English polarity series when the key map is supplied', () => {
		english.forEach((name, index) => {
			expect(tooltipSeriesRow('#123456', name, '1', glyphKeys)).toContain(GLYPHS[index]);
		});
	});

	it('draws no glyph for an English polarity series without the map', () => {
		expect(hasGlyph(tooltipSeriesRow('#123456', 'Very positive', '1'))).toBe(false);
	});

	it('draws no glyph for a non-polarity series, map or not', () => {
		expect(hasGlyph(tooltipSeriesRow('#123456', 'Very central', '1', glyphKeys))).toBe(false);
		expect(hasGlyph(tooltipSeriesRow('#123456', 'Subjective', '1'))).toBe(false);
	});

	it('leaves French output unchanged, with or without the map', () => {
		const frenchMap = polarityGlyphKeys(french, french);
		french.forEach((name, index) => {
			const before = tooltipSeriesRow('#123456', name, '1');
			expect(before).toContain(GLYPHS[index]);
			expect(tooltipSeriesRow('#123456', name, '1', frenchMap)).toBe(before);
		});
	});
});

describe('createTrendTooltipFormatter', () => {
	const params = [
		{ seriesName: 'Very positive', value: 3, color: '#111111', axisValue: '2010' },
		{ seriesName: 'Very negative', value: 2, color: '#222222', axisValue: '2010' }
	];

	it('draws glyphs for English series names when given the key map', () => {
		const html = createTrendTooltipFormatter({
			getTotalLabel: () => 'Total',
			lang: () => 'en',
			glyphKeys: () => glyphKeys
		})(params);
		expect(html).toContain('▲');
		expect(html).toContain('▼');
	});

	it('is unchanged for callers that pass no map', () => {
		const html = createTrendTooltipFormatter({
			getTotalLabel: () => 'Total',
			lang: () => 'en'
		})(params);
		expect(hasGlyph(html)).toBe(false);
	});
});

describe('createPieTooltipFormatter', () => {
	it('draws the glyph for an English slice when given the key map', () => {
		const html = createPieTooltipFormatter({
			formatValue: String,
			lang: () => 'en',
			glyphKeys: () => glyphKeys
		})({ seriesName: 'Polarity', name: 'Negative', value: 4, percent: 40, color: '#333333' });
		expect(html).toContain('▽');
	});

	it('keeps the French glyph without a map', () => {
		const html = createPieTooltipFormatter({
			formatValue: String,
			lang: () => 'fr'
		})({ seriesName: 'Polarité', name: 'Négatif', value: 4, percent: 40, color: '#333333' });
		expect(html).toContain('▽');
	});
});
