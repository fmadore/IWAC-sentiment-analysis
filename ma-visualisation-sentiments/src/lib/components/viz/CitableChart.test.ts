import { afterEach, expect, it, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import CitableChart from './CitableChart.svelte';
import { chartInteractionsState } from '$lib/stores/chart-interactions.svelte';
import { uiState } from '$lib/stores/ui.svelte';
import { getCurrentState, buildURLSearchParams, parseURLState } from '$lib/stores/url';
import { applyURLState } from '$lib/stores/url/actions.svelte';
import type { init } from 'echarts';

vi.mock('svelte-echarts', async () => ({
	Chart: (await import('../../../mocks/interactive-chart-stub.svelte')).default
}));
afterEach(() => {
	cleanup();
	applyURLState({});
});

it('captures legend and zoom actions and restores the rendered chart after a shared link', async () => {
	uiState.activeView = 'trends';
	const props = {
		chartId: 'polarity-trend',
		init: vi.fn() as unknown as typeof init,
		options: {
			legend: { data: ['First', 'Second'] },
			dataZoom: [{ type: 'slider' as const }],
			series: []
		}
	};
	const chart = render(CitableChart, props);
	await fireEvent.click(chart.getByText('Hide first series'));
	await fireEvent.click(chart.getByText('Zoom'));
	const url = buildURLSearchParams(getCurrentState());
	expect(parseURLState(url).chartState).toEqual({
		'polarity-trend': { hidden: [0], zoom: [12.346, 89.765] }
	});
	cleanup();
	applyURLState(parseURLState(url));
	const restored = render(CitableChart, props);
	const options = JSON.parse(restored.getByTestId('chart-options').getAttribute('data-options')!);
	expect(options.legend[0].selected).toEqual({ First: false, Second: true });
	expect(options.dataZoom[0]).toMatchObject({ start: 12.346, end: 89.765 });
	chartInteractionsState.trends = {};
	await tick();
	const cleared = JSON.parse(restored.getByTestId('chart-options').getAttribute('data-options')!);
	expect(cleared.legend[0].selected).toBeUndefined();
	expect(cleared.dataZoom[0].start).toBeUndefined();
});

it('restores implicit pie legends by position across translated names', () => {
	uiState.activeView = 'arbiter';
	chartInteractionsState.arbiter = { confidence: { hidden: [1] } };
	const chart = render(CitableChart, {
		chartId: 'confidence',
		init: vi.fn() as unknown as typeof init,
		options: {
			legend: {},
			series: [
				{
					type: 'pie',
					data: [
						{ name: 'Élevée', value: 5 },
						{ name: 'Moyenne', value: 4 }
					]
				}
			]
		}
	});
	const options = JSON.parse(chart.getByTestId('chart-options').getAttribute('data-options')!);
	expect(options.legend[0].selected).toEqual({ Élevée: true, Moyenne: false });
});
