import { afterEach, describe, expect, it } from 'vitest';
import { applyURLState, reconcileSelectionContext } from './actions.svelte';
import { getCurrentState } from './state.svelte';
import { buildURLSearchParams } from './builder.svelte';
import { parseURLState } from './parser.svelte';
import { DATASET_IDS, MODEL_PAIR_IDS, VIEW_IDS } from '$lib/types/data';
import { generationOf, getPairModels } from '$lib/domain/sentimentContract';
import { datasetState } from '../datasets.svelte';
import { filterState } from '../filters.svelte';
import { viewOptionsState } from '../view-options.svelte';

afterEach(() => applyURLState({}));
const restore = (query: string) => applyURLState(parseURLState(new URLSearchParams(query)));
const snapshot = () => parseURLState(buildURLSearchParams(getCurrentState()));

describe('citable research snapshots', () => {
	it.each(VIEW_IDS)('restores view %s', (view) => {
		restore(`view=${view}&dataset=luna&lang=en`);
		expect(snapshot().view).toBe(view);
	});
	it.each(DATASET_IDS)('keeps the exact model and generation for %s', (dataset) => {
		restore(`view=table&dataset=${dataset}&articleId=99999999`);
		expect(snapshot()).toMatchObject({ dataset, articleId: 99999999 });
		expect(datasetState.generation).toBe(generationOf(dataset));
	});
	it.each(MODEL_PAIR_IDS)('resolves an explicit pair over conflicting model state: %s', (pair) => {
		const conflicting = generationOf(pair) === 'v1' ? 'luna' : 'chatgpt';
		restore(`view=comparison&dataset=${conflicting}&pair=${pair}&comparisonArticleId=99999999`);
		expect(datasetState.selected).toBe(getPairModels(pair)[0]);
		expect(snapshot()).toMatchObject({ view: 'comparison', pair, comparisonArticleId: 99999999 });
	});
	it('keeps panel arbiter details while loading without inventing a pair', () => {
		restore('view=arbiter&dataset=luna&arbiterArticleId=12345&panelSort=title&panelPage=3');
		expect(snapshot()).toMatchObject({
			view: 'arbiter',
			dataset: 'luna',
			arbiterArticleId: '12345',
			options: { panelSort: 'title', panelPage: 3 }
		});
		expect(snapshot().compare).toBeUndefined();
		expect(snapshot().pair).toBeUndefined();
	});
	it('keeps archived arbiter details attached to the exact pair', () => {
		restore('view=arbiter&pair=gemini-mistral&arbiterArticleId=12345&arbiterDimension=centrality');
		expect(snapshot()).toMatchObject({
			pair: 'gemini-mistral',
			arbiterArticleId: '12345',
			options: { arbiterDimension: 'centrality' }
		});
	});
	it('restores agreement in pair mode regardless of the previous comparison mode', () => {
		restore('view=comparison&pair=chatgpt-gemini');
		restore('view=agreement&dataset=luna&pair=luna-gemma&scope=pair&compare=true');
		expect(datasetState.isComparisonMode).toBe(false);
		expect(snapshot()).toMatchObject({ view: 'agreement', dataset: 'luna', pair: 'luna-gemma' });
	});
	it('preserves a single literal comma facet and non-ASCII punctuation', () => {
		const state = {
			view: 'table' as const,
			journals: ['Foi, société & culture + débat'],
			countries: ['Côte d’Ivoire']
		};
		expect(parseURLState(buildURLSearchParams(state))).toMatchObject(state);
		expect(parseURLState(new URLSearchParams('journals=One,Two')).journals).toEqual(['One', 'Two']);
	});
	it('canonicalizes duplicate facets and selection order', () => {
		expect(buildURLSearchParams({ countries: ['Togo', 'Bénin', 'Togo'] }).toString()).toBe(
			buildURLSearchParams({ countries: ['Bénin', 'Togo'] }).toString()
		);
	});
	it('restores absent controls and pagination to defaults on history navigation', () => {
		restore(
			'view=table&dataset=luna&tablePage=4&tableSize=100&tableSort=date&tableOrder=desc&countries=Togo'
		);
		restore('view=table&dataset=luna');
		expect(viewOptionsState).toMatchObject({
			tablePage: 1,
			tableSize: '50',
			tableSort: 'titre',
			tableOrder: 'asc'
		});
		expect(filterState.countries).toEqual([]);
	});
	it('preserves a restored page but resets it after a new filter action', () => {
		restore('view=table&dataset=luna&tablePage=4&countries=Togo');
		reconcileSelectionContext();
		expect(viewOptionsState.tablePage).toBe(4);
		filterState.countries = ['Bénin'];
		reconcileSelectionContext();
		expect(viewOptionsState.tablePage).toBe(1);
	});
	it('does not carry an old detail into a different model', () => {
		restore('view=table&dataset=luna&articleId=99999999');
		datasetState.selected = 'gemma';
		reconcileSelectionContext();
		expect(snapshot().articleId).toBeUndefined();
	});
	it.each([
		[
			'charts',
			'polarityChart=pie&polarityGrouping=journal&subjectivityChart=pie',
			{ polarityChart: 'pie', polarityGrouping: 'journal', subjectivityChart: 'pie' }
		],
		[
			'trends',
			'polarityTrend=share&subjectivityTrend=share',
			{ polarityTrend: 'share', subjectivityTrend: 'share' }
		],
		['volume', 'volumeChart=line', { volumeChart: 'line' }],
		['seasonality', 'seasonalityChart=bar', { seasonalityChart: 'bar' }],
		['ranking', 'rankingMeasure=centrality', { rankingMeasure: 'centrality' }],
		[
			'map',
			'mapDimension=subjectivity&placeId=42&mapCamera=2.5,6.2,5',
			{ mapDimension: 'subjectivity', placeId: 42, mapCamera: '2.5,6.2,5' }
		],
		[
			'extremes',
			'category=centrality_very_central&keywordType=spatial&topN=25',
			{ category: 'centrality_very_central', keywordType: 'spatial', topN: 25 }
		],
		[
			'comparison',
			'comparisonLayout=cards&comparisonSort=date&comparisonPage=3&breakdown=country',
			{ comparisonLayout: 'cards', comparisonSort: 'date', comparisonPage: 3, breakdown: 'country' }
		],
		['agreement', 'dissent=ternary', { dissent: 'ternary' }]
	])('restores controls for %s', (view, query, options) => {
		restore(`view=${view}&dataset=luna&${query}`);
		expect(snapshot().options).toMatchObject(options);
	});
	it('rejects malformed flags, numbers, camera positions and foreign view controls', () => {
		restore(
			'view=table&lang=constructor&tablePage=-1&tableSize=30&tableSort=bad&topN=NaN&mapCamera=999,2,1'
		);
		expect(snapshot().options).toEqual({});
		expect(snapshot().lang).not.toBe('constructor');
	});
	it('restores chart selections and zoom without accepting invalid ranges', () => {
		const params = new URLSearchParams({
			view: 'trends',
			chartState: JSON.stringify({
				'polarity-trend': { hidden: [2, 0], zoom: [20, 80] },
				bad: { zoom: [99, 0] }
			})
		});
		applyURLState(parseURLState(params));
		expect(snapshot().chartState).toEqual({ 'polarity-trend': { hidden: [0, 2], zoom: [20, 80] } });
	});
});
