import { describe, expect, it } from 'vitest';
import { dataRequirements, type DataContext } from './dataRequirements';

const base: DataContext = {
	view: 'charts',
	dataset: 'luna',
	pair: 'luna-qwen',
	comparisonMode: false,
	generation: 'v2'
};

describe('dataRequirements', () => {
	it('always asks for the selected model, and nothing else on a single-model view', () => {
		expect(dataRequirements(base)).toEqual([{ kind: 'dataset', id: 'luna' }]);
	});

	it('asks for both pair members and the panel verdicts in v2 comparison mode', () => {
		expect(dataRequirements({ ...base, view: 'comparison', comparisonMode: true })).toEqual([
			{ kind: 'dataset', id: 'luna' },
			{ kind: 'pair', pair: 'luna-qwen' },
			{ kind: 'arbiterPanel' }
		]);
	});

	it('asks for the pairwise arbiter file for an archived pair, never the panel file', () => {
		const needs = dataRequirements({
			...base,
			view: 'arbiter',
			dataset: 'chatgpt',
			pair: 'chatgpt-gemini',
			comparisonMode: true,
			generation: 'v1'
		});
		expect(needs).toContainEqual({ kind: 'arbiter', pair: 'chatgpt-gemini' });
		expect(needs).not.toContainEqual({ kind: 'arbiterPanel' });
	});

	it('scopes the agreement panel to the generation on screen', () => {
		expect(
			dataRequirements({ ...base, view: 'agreement', dataset: 'chatgpt', generation: 'v1' })
		).toContainEqual({ kind: 'panel', generation: 'v1' });
	});

	it('asks for the selected model’s extremes only on the extremes view', () => {
		expect(dataRequirements({ ...base, view: 'extremes' })).toContainEqual({
			kind: 'extremes',
			id: 'luna'
		});
		expect(dataRequirements(base)).not.toContainEqual(
			expect.objectContaining({ kind: 'extremes' })
		);
	});

	it('asks for the panel arbiter and the whole panel on the v2 arbiter view', () => {
		const needs = dataRequirements({ ...base, view: 'arbiter' });
		expect(needs).toContainEqual({ kind: 'arbiterPanel' });
		expect(needs).toContainEqual({ kind: 'panel', generation: 'v2' });
	});
});
