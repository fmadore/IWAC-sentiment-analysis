import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { currentLanguage } from '$lib/i18n';
import { articleState, datasetState, filterState } from '$lib/stores';
import { viewOptionsState } from '$lib/stores/view-options.svelte';
import type { Article, CentralityValue } from '$lib/types/data';
import CentralityHeatmap from './CentralityHeatmap.svelte';
import HijriSeasonalityChart from './HijriSeasonalityChart.svelte';

vi.mock('svelte-echarts', async () => ({
	Chart: (await import('../../../mocks/interactive-chart-stub.svelte')).default
}));
vi.mock('$lib/utils/echartsSetup', () => ({ init: vi.fn() }));

function article(id: number, centrality: CentralityValue | null, country = 'Bénin'): Article {
	return {
		'o:id': id,
		Newspaper: 'J',
		journal_source: 'J',
		Country: country,
		publication_date: '2024-03-11',
		dataset_id: 'luna',
		sentiment_analysis: {
			centralite_islam_musulmans: centrality,
			centralite_justification: null,
			subjectivite_score: null,
			subjectivite_justification: null,
			polarite: null,
			polarite_justification: null
		}
	} as Article;
}

beforeEach(() => {
	currentLanguage.set('en');
	datasetState.isComparisonMode = false;
	datasetState.selected = 'luna';
	filterState.clearAll();
	viewOptionsState.heatmapMinCount = 0;
	viewOptionsState.seasonalityChart = 'bar';
});

afterEach(() => {
	cleanup();
	articleState.updateDatasets('luna', []);
	viewOptionsState.heatmapMinCount = 0;
	viewOptionsState.seasonalityChart = 'polar';
	currentLanguage.set('fr');
});

it('keeps the heatmap chart and accessible table aligned when hiding small cells', async () => {
	articleState.updateDatasets('luna', [
		article(1, 'Non abordé'),
		article(2, 'Non abordé'),
		article(3, 'Très central', 'Togo'),
		article(4, null, 'Togo')
	]);
	const chart = render(CentralityHeatmap);
	const options = () =>
		JSON.parse(chart.getByTestId('chart-options').getAttribute('data-options')!);
	expect(options().visualMap).toMatchObject({ min: 1, max: 5, dimension: 2 });
	expect(options().series[0].data).toEqual([
		[0, 0, 1, 2],
		[0, 1, 5, 1]
	]);
	await fireEvent.click(chart.getByRole('button', { name: 'Data' }));
	expect(chart.getByRole('table').textContent).toContain('Togo');
	await fireEvent.change(chart.getByRole('spinbutton'), { target: { value: '2' } });
	expect(viewOptionsState.heatmapMinCount).toBe(2);
	expect(options().series[0].data).toEqual([[0, 0, 1, 2]]);
	expect(chart.getByRole('table').textContent).not.toContain('Togo');
	expect(chart.getByRole('status').textContent).toContain('1 cells');
});

it('renders missing seasonality means as gaps on the pinned 1–5 axis', () => {
	articleState.updateDatasets('luna', [article(1, null), article(2, 'Non applicable')]);
	const chart = render(HijriSeasonalityChart);
	const options = JSON.parse(chart.getByTestId('chart-options').getAttribute('data-options')!);
	expect(options.yAxis[1]).toMatchObject({ min: 1, max: 5 });
	expect(options.series[1]).toMatchObject({ connectNulls: false, data: Array(12).fill(null) });
	expect(options.series[0].data[8].value).toBe(2);
});
