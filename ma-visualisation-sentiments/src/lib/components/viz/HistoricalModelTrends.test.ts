import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { Article, DatasetId, LoadState } from '$lib/types/data';
import { datasetIdsOf } from '$lib/domain/sentimentContract';
import { currentLanguage, loadCatalogue } from '$lib/i18n';
import { defaultViewOptions, viewOptionsState } from '$lib/stores/view-options.svelte';
import { uiState } from '$lib/stores/ui.svelte';
import {
	chartInteractionsState,
	parseChartInteractions
} from '$lib/stores/chart-interactions.svelte';
import HistoricalModelTrends from './HistoricalModelTrends.svelte';

const mocks = vi.hoisted(() => ({
	articleState: {
		datasets: {} as Record<string, Article[]>,
		loadStates: {} as Partial<Record<DatasetId, LoadState<Article[]>>>
	},
	filterState: { countries: [] as string[], journals: [] as string[], polarities: ['Neutre'] },
	datasetState: {
		generation: 'v2',
		getById: (id: string) => ({ name: id })
	}
}));
vi.mock('$lib/stores/articles.svelte', () => ({
	articleState: mocks.articleState,
	loadSpecificDataset: vi.fn(async () => {})
}));
vi.mock('$lib/stores/filters.svelte', () => ({ filterState: mocks.filterState }));
vi.mock('$lib/stores/datasets.svelte', () => ({ datasetState: mocks.datasetState }));
vi.mock('$lib/utils/echartsSetup', () => ({ init: vi.fn() }));
vi.mock('svelte-echarts', async () => ({
	Chart: (await import('../../../mocks/interactive-chart-stub.svelte')).default
}));

const models = datasetIdsOf('v2');
function article(id: number, journal: string, polarity: 'Négatif' | 'Positif' | null): Article {
	return {
		'o:id': id,
		'o:title': `Article ${id}`,
		dataset_id: 'luna',
		Country: 'Bénin',
		Newspaper: journal,
		publication_date: '2020-01',
		sentiment_analysis: {
			polarite: polarity,
			polarite_justification: null,
			centralite_islam_musulmans: 'Central',
			centralite_justification: null,
			subjectivite_score: 2,
			subjectivite_justification: null
		}
	};
}
function load(rows: (model: DatasetId) => Article[]) {
	for (const model of models) {
		mocks.articleState.datasets[model] = rows(model);
		mocks.articleState.loadStates[model] = {
			status: 'ready',
			data: mocks.articleState.datasets[model]
		};
	}
}
beforeEach(async () => {
	await loadCatalogue('en');
	currentLanguage.set('en');
	Object.assign(viewOptionsState, defaultViewOptions(), { historyMinCount: 2 });
	mocks.filterState.countries = [];
	mocks.filterState.journals = [];
	uiState.activeView = 'trends';
	chartInteractionsState.trends = {};
});
afterEach(() => {
	cleanup();
	Object.assign(viewOptionsState, defaultViewOptions());
	currentLanguage.set('fr');
});

it('keeps source-only cohorts, minimum gaps and raw denominators visible', async () => {
	load((model) => [
		article(1, 'Le Journal', 'Négatif'),
		article(2, 'Le Journal', model === 'qwen' ? null : 'Négatif')
	]);
	const { getByTestId, getByRole } = render(HistoricalModelTrends);
	const options = () => JSON.parse(getByTestId('chart-options').getAttribute('data-options')!);
	// A polarity filter exists in the mocked rail but must not discard negatives.
	expect(options().series.find((series: { id: string }) => series.id === 'luna').data).toEqual([
		null
	]);
	await fireEvent.click(getByRole('button', { name: 'Data' }));
	const rows = getByRole('table').querySelectorAll('tbody tr');
	expect(rows).toHaveLength(5);
	expect(rows[0].textContent).toContain('luna');
	expect([...rows[0].querySelectorAll('td')].map((cell) => cell.textContent)).toEqual([
		'luna',
		'2',
		'1',
		'1',
		'—',
		'—',
		'—'
	]);
	await fireEvent.change(getByRole('combobox', { name: 'Article cohort' }), {
		target: { value: 'available' }
	});
	expect(options().series.find((series: { id: string }) => series.id === 'luna').data).toEqual([
		100
	]);
	expect(options().series.find((series: { id: string }) => series.id === 'qwen').data).toEqual([
		null
	]);
	expect(
		options().series.find((series: { id: string }) => series.id === 'range-width').data
	).toEqual([null]);
});

it('restores later newspaper pages, keeps every group reachable and cites accented names', async () => {
	load(() =>
		Array.from({ length: 7 }, (_, index) => article(index, `L’Écho ${index + 1}`, 'Positif'))
	);
	viewOptionsState.historyFacet = 'journal';
	viewOptionsState.historyPage = 2;
	const { getByRole, getByText, container } = render(HistoricalModelTrends);
	expect(container.querySelectorAll('.history-panel')).toHaveLength(1);
	expect(getByRole('heading', { name: 'L’Écho 7' })).toBeTruthy();
	expect(viewOptionsState.historyPage).toBe(2);
	await fireEvent.click(getByText('Hide first series'));
	await tick();
	const captured = chartInteractionsState.trends!;
	expect(Object.keys(captured)).toHaveLength(1);
	expect(parseChartInteractions(JSON.stringify(captured))).toEqual(captured);
	await fireEvent.click(getByRole('button', { name: 'Previous panels' }));
	expect(container.querySelectorAll('.history-panel')).toHaveLength(6);
	await fireEvent.click(getByRole('button', { name: 'Next panels' }));
	expect(getByRole('heading', { name: 'L’Écho 7' })).toBeTruthy();
	await fireEvent.change(getByRole('combobox', { name: 'Measure' }), {
		target: { value: 'central' }
	});
	expect(viewOptionsState.historyPage).toBe(1);
});

it('discloses a failed panel model instead of drawing a partial comparison', () => {
	load(() => [article(1, 'Journal', 'Positif')]);
	mocks.articleState.loadStates.qwen = { status: 'error', error: new Error('offline') };
	const { getByRole, queryByTestId } = render(HistoricalModelTrends);
	expect(getByRole('alert').textContent).toContain('qwen');
	expect(queryByTestId('chart-options')).toBeNull();
});
