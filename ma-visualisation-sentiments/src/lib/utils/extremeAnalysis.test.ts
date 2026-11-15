import { describe, expect, it } from 'vitest';
import { getDistinctiveKeywords, getTopKeywords, OPPOSITE_CATEGORY } from './extremeAnalysis';

describe('distinctive keyword ranking', () => {
	// "Paix" is the commonest keyword on both sides; "Terrorisme" is rarer but
	// concentrated in the target. Raw counts rank Paix first, the contrast
	// must not.
	const target = { Paix: 100, Terrorisme: 40, Rare: 2 };
	const contrast = { Paix: 400, Terrorisme: 5, Commerce: 80 };

	it('ranks an over-represented keyword above a merely frequent one', () => {
		expect(getTopKeywords(target, 1)[0].keyword).toBe('Paix');
		const ranked = getDistinctiveKeywords(target, contrast, 10, 1);
		expect(ranked[0].keyword).toBe('Terrorisme');
		expect(ranked[0]).toMatchObject({ count: 40, contrastCount: 5 });
		expect(ranked[0].score).toBeGreaterThan(0);
	});

	it('drops keywords under-represented in the target and those below the minimum count', () => {
		const ranked = getDistinctiveKeywords(target, contrast, 10, 5);
		const keywords = ranked.map((row) => row.keyword);
		expect(keywords).not.toContain('Paix');
		expect(keywords).not.toContain('Rare');
		expect(keywords).not.toContain('Commerce');
	});

	it('returns nothing when either side is empty', () => {
		expect(getDistinctiveKeywords({}, contrast)).toEqual([]);
		expect(getDistinctiveKeywords(target, {})).toEqual([]);
	});

	it('pairs every category with the opposite pole of its own scale', () => {
		for (const [category, opposite] of Object.entries(OPPOSITE_CATEGORY)) {
			expect(OPPOSITE_CATEGORY[opposite]).toBe(category);
			expect(opposite.split('_')[0]).toBe(category.split('_')[0]);
		}
	});
});
