import { afterEach, describe, expect, it } from 'vitest';
import type { ViewId } from '$lib/types/data';
import { defaultViewOptions, viewOptionsState, type ViewOptions } from '../view-options.svelte';
import { applyURLState } from './actions.svelte';
import { buildURLSearchParams } from './builder.svelte';
import { parseURLState } from './parser.svelte';
import { getCurrentState } from './state.svelte';

afterEach(() => applyURLState({}));
const restore = (query: string) => applyURLState(parseURLState(new URLSearchParams(query)));
const snapshot = () => parseURLState(buildURLSearchParams(getCurrentState()));

const examples: Array<{ view: ViewId; query: string; options: Partial<ViewOptions> }> = [
	{
		view: 'trends',
		query:
			'historyMeasure=subjective&historyPeriod=year&historyFacet=country&historyCohort=available&historyMinCount=25&historyPage=2',
		options: {
			historyMeasure: 'subjective',
			historyPeriod: 'year',
			historyFacet: 'country',
			historyCohort: 'available',
			historyMinCount: 25,
			historyPage: 2
		}
	},
	{
		view: 'volume',
		query: 'newspaperPeriod=decade&newspaperOrder=name&newspaperPage=2',
		options: { newspaperPeriod: 'decade', newspaperOrder: 'name', newspaperPage: 2 }
	},
	{
		view: 'agreement',
		query:
			'agreementMetric=weighted&patternKind=lone&patternLimit=25&labelPattern=3-2-3-3-3&patternArticles=50',
		options: {
			agreementMetric: 'weighted',
			patternKind: 'lone',
			patternLimit: '25',
			labelPattern: '3-2-3-3-3',
			patternArticles: 50
		}
	},
	{ view: 'heatmap', query: 'heatmapMinCount=10', options: { heatmapMinCount: 10 } }
];

describe('research view URL state', () => {
	it.each(examples)('restores and re-shares $view analysis choices', ({ view, query, options }) => {
		restore(`view=${view}&dataset=luna&lang=en&countries=Togo&${query}`);
		expect(viewOptionsState).toMatchObject(options);
		expect(snapshot()).toMatchObject({ view, dataset: 'luna', countries: ['Togo'], options });
		// A fresh history restoration must carry the same choices, not merely keep
		// the old option state that happened to be in memory.
		const shared = buildURLSearchParams(getCurrentState()).toString();
		applyURLState({});
		restore(shared);
		expect(viewOptionsState).toMatchObject(options);
	});

	it.each(examples)(
		'resets removed $view options during history navigation',
		({ view, query, options }) => {
			restore(`view=${view}&dataset=luna&${query}`);
			restore(`view=${view}&dataset=luna`);
			const defaults = defaultViewOptions();
			for (const key of Object.keys(options) as Array<keyof ViewOptions>)
				expect(viewOptionsState[key]).toEqual(defaults[key]);
			expect(snapshot().options).toEqual({});
		}
	);

	it('does not carry another view’s research controls into its citation', () => {
		const allOptions = examples.map(({ query }) => query).join('&');
		for (const { view, options } of examples) {
			restore(`view=${view}&dataset=luna&${allOptions}`);
			expect(snapshot().options).toEqual(options);
		}
		restore(`view=table&dataset=luna&${allOptions}`);
		expect(snapshot().options).toEqual({});
	});

	it.each([
		[
			'trends',
			'historyMeasure=polarity&historyPeriod=month&historyFacet=continent&historyCohort=union&historyMinCount=0&historyPage=1001'
		],
		['trends', 'historyMinCount=2.5&historyPage=-1'],
		['volume', 'newspaperPeriod=month&newspaperOrder=year&newspaperPage=NaN'],
		[
			'agreement',
			'agreementMetric=accuracy&patternKind=majority&patternLimit=20&patternArticles=24'
		],
		['agreement', 'patternArticles=1000001'],
		['heatmap', 'heatmapMinCount=1001'],
		['heatmap', 'heatmapMinCount=-1']
	])('rejects unsupported %s controls: %s', (view, query) => {
		restore(`view=${view}&dataset=luna&${query}`);
		expect(snapshot().options).toEqual({});
	});

	it.each(['3-2', '3-2-3-3', '3-2-3-3-3-3', '6-2-3', '3--2-3', '3.5-2-3'])(
		'rejects malformed label pattern %s',
		(pattern) => {
			restore(`view=agreement&dataset=luna&labelPattern=${pattern}`);
			expect(viewOptionsState.labelPattern).toBe('');
			expect(snapshot().options?.labelPattern).toBeUndefined();
		}
	);

	it.each([
		['chatgpt', '3-2-3'],
		['luna', '3-2-3-3-3']
	])('retains full model-order patterns for %s', (dataset, pattern) => {
		restore(`view=agreement&dataset=${dataset}&scope=panel&labelPattern=${pattern}`);
		expect(snapshot()).toMatchObject({
			dataset,
			scope: 'panel',
			options: { labelPattern: pattern }
		});
	});

	it('accepts boundary counts without confusing zero coverage thresholds with absence', () => {
		restore('view=heatmap&heatmapMinCount=1000');
		expect(snapshot().options).toEqual({ heatmapMinCount: 1000 });
		restore('view=heatmap&heatmapMinCount=0');
		expect(viewOptionsState.heatmapMinCount).toBe(0);
		expect(snapshot().options).toEqual({});
		restore('view=trends&historyMinCount=1&historyPage=1000');
		expect(snapshot().options).toEqual({ historyMinCount: 1, historyPage: 1000 });
	});
});
