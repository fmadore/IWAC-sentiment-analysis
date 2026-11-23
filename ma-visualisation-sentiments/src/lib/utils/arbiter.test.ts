import { describe, expect, it } from 'vitest';
import { en } from '#lib/i18n/en.js';
import { fr } from '#lib/i18n/fr.js';
import { getConfidenceLabel, toPairOrderVerdict } from './arbiter';

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

describe('toPairOrderVerdict', () => {
	it('leaves every verdict alone when the blind Model A is the pair’s first model', () => {
		for (const verdict of ['model_a', 'model_b', 'both', 'neither'] as const) {
			expect(toPairOrderVerdict(verdict, true)).toBe(verdict);
		}
	});

	it('swaps the two model slots when the blind assignment is reversed', () => {
		expect(toPairOrderVerdict('model_a', false)).toBe('model_b');
		expect(toPairOrderVerdict('model_b', false)).toBe('model_a');
	});

	it('passes ties and unknown values through unchanged', () => {
		expect(toPairOrderVerdict('both', false)).toBe('both');
		expect(toPairOrderVerdict('neither', false)).toBe('neither');
		expect(toPairOrderVerdict('something-else', false)).toBe('something-else');
	});
});
