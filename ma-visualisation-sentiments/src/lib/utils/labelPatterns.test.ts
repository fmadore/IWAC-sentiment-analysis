import { describe, expect, it } from 'vitest';
import { buildLabelFlow, type ConsensusRow } from './consensus';
import { buildLabelPatterns, filterLabelPatterns } from './labelPatterns';

function row(id: string, values: number[] | null, declined = false): ConsensusRow {
	return {
		id,
		newspaper: 'Journal',
		country: 'Togo',
		year: 2020,
		values: { polarity: values, centrality: null, subjectivity: null },
		declined: { polarity: declined, centrality: false, subjectivity: false }
	};
}

describe('full label patterns', () => {
	it('distinguishes article paths with identical adjacent Sankey links', () => {
		const returns = [row('1', [1, 2, 1]), row('2', [3, 2, 3])];
		const crosses = [row('1', [1, 2, 3]), row('2', [3, 2, 1])];
		const sortedLinks = (rows: ConsensusRow[]) =>
			buildLabelFlow(rows, 'polarity', 3, false).links.sort((a, b) =>
				(a.source + a.target).localeCompare(b.source + b.target)
			);
		expect(sortedLinks(returns)).toEqual(sortedLinks(crosses));
		expect(buildLabelPatterns(returns, 'polarity', 3, false).patterns.map((p) => p.kind)).toEqual([
			'lone',
			'lone'
		]);
		expect(buildLabelPatterns(crosses, 'polarity', 3, false).patterns.map((p) => p.kind)).toEqual([
			'split',
			'split'
		]);
	});

	it('keeps 4–1, 3–2, and 2–2–1 patterns separate on the five-model panel', () => {
		const result = buildLabelPatterns(
			[
				row('1', [3, 3, 3, 3, 3]),
				row('2', [3, 3, 3, 3, 2]),
				row('3', [3, 3, 3, 2, 2]),
				row('4', [3, 3, 2, 2, 1]),
				row('5', [3, 3, 3, 3, 2])
			],
			'polarity',
			5,
			false
		);
		expect(result.n).toBe(5);
		expect(result.patterns[0]).toMatchObject({
			key: '3-3-3-3-2',
			count: 2,
			articleIds: ['2', '5'],
			splitSizes: [4, 1],
			kind: 'lone',
			share: 0.4
		});
		expect(result.patterns.find((p) => p.key === '3-3-3-2-2')?.splitSizes).toEqual([3, 2]);
		expect(result.patterns.find((p) => p.key === '3-3-2-2-1')?.splitSizes).toEqual([2, 2, 1]);
		expect(result.patterns.reduce((sum, p) => sum + p.share, 0)).toBeCloseTo(1);
		expect(filterLabelPatterns(result.patterns, 'lone')[0].share).toBe(0.4);
		expect(filterLabelPatterns(result.patterns, 'split')).toHaveLength(2);
	});

	it('excludes incomplete cases and respects the explicit not-applicable setting', () => {
		const rows = [
			row('1', [0, 3, 3], true),
			row('2', [3, 3, 3]),
			row('3', null),
			row('4', [3, 3, 3, 3, 3])
		];
		expect(buildLabelPatterns(rows, 'polarity', 3, false).n).toBe(1);
		expect(buildLabelPatterns(rows, 'polarity', 3, true).n).toBe(2);
		expect(buildLabelPatterns([], 'polarity', 5, false)).toEqual({ n: 0, patterns: [] });
	});
});
