import { describe, expect, it } from 'vitest';
import { en } from '#lib/i18n/en.js';
import { fr } from '#lib/i18n/fr.js';
import { getConfidenceLabel } from './arbiter';

describe('getConfidenceLabel', () => {
	it('reads every level from the catalogue in both languages', () => {
		expect(['high', 'medium', 'low'].map((level) => getConfidenceLabel(level, en))).toEqual([
			'High',
			'Medium',
			'Low'
		]);
		expect(getConfidenceLabel('high', fr)).toBe(fr.arbiter.confidenceHigh);
		expect(getConfidenceLabel('high', fr)).not.toBe('High');
	});

	it('passes an unknown level through unchanged', () => {
		expect(getConfidenceLabel('unknown', en)).toBe('unknown');
	});
});
