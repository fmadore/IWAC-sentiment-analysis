import { afterEach, expect, it, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import { currentLanguage, loadCatalogue } from '#lib/i18n/index.js';
import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
import DimensionDistributionChart from './DimensionDistributionChart.svelte';
import type { Article } from '#lib/types/data.js';

/**
 * The ECharts body needs a canvas, so it is replaced by a bare function
 * component that renders nothing and keeps its props: the tooltip formatter is
 * a function, which the JSON-serialising stub used elsewhere would drop.
 */
const chart = vi.hoisted(() => ({
	props: null as null | { options: { tooltip: { formatter: (params: unknown) => string } } }
}));
vi.mock('svelte-echarts', () => ({
	Chart: (_anchor: unknown, props: NonNullable<typeof chart.props>) => {
		chart.props = props;
	}
}));
vi.mock('#lib/utils/echartsSetup.js', () => ({ init: vi.fn() }));
vi.mock('#lib/stores/index.js', () => ({
	articleState: {
		filtered: [
			{ 'o:id': 1, journal_source: 'A', publication_date: '2000-01-01' },
			{ 'o:id': 2, journal_source: 'B', publication_date: '2001-01-01' }
		]
	}
}));

afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
	viewOptionsState.polarityChart = 'bar';
	viewOptionsState.polarityGrouping = 'global';
});

function tooltip(params: unknown): string {
	if (!chart.props) throw new Error('chart not mounted');
	return chart.props.options.tooltip.formatter(params);
}

function renderDistribution(dimension: 'polarity' | 'centrality', translated: string[]) {
	return render(DimensionDistributionChart, {
		frenchLabels:
			dimension === 'polarity' ? ['Très positif', 'Neutre'] : ['Très central', 'Central'],
		translatedLabels: translated,
		getKey: () => (dimension === 'polarity' ? 'Très positif' : 'Très central'),
		getColor: () => '#aaaaaa',
		title: 'Distribution',
		seriesName: 'Series',
		dimension,
		seriesIdPrefix: 'test',
		ariaLabel: 'Distribution'
	});
}

it('draws polarity glyphs under English labels in every mode', async () => {
	await loadCatalogue('en');
	currentLanguage.set('en');
	const { getByRole } = renderDistribution('polarity', ['Very positive', 'Neutral']);
	await tick();

	// Global bar: the default tooltip had no swatch at all.
	const bar = tooltip({ name: 'Very positive', value: 2, color: '#aaaaaa' });
	expect(bar).toContain('▲');
	expect(bar).toContain('Very positive');
	expect(bar).toContain('Series');

	await fireEvent.click(getByRole('button', { name: 'Pie chart' }));
	await tick();
	expect(
		tooltip({ seriesName: 'Series', name: 'Neutral', value: 2, percent: 100, color: '#aaaaaa' })
	).toContain('■');

	await fireEvent.click(getByRole('button', { name: 'By newspaper' }));
	await tick();
	expect(
		tooltip([
			{
				dataIndex: 0,
				seriesName: 'Very positive',
				color: '#aaaaaa',
				data: { value: 100, rawCount: 1 }
			}
		])
	).toContain('▲');
});

it('keeps plain colour chips for a non-polarity dimension', async () => {
	await loadCatalogue('en');
	currentLanguage.set('en');
	renderDistribution('centrality', ['Very central', 'Central']);
	await tick();

	expect(tooltip({ name: 'Very central', value: 2, color: '#aaaaaa' })).not.toMatch(/[▲△■▽▼○]/);
});

it('presentation changes reuse the corpus aggregate and retain readable values', async () => {
	currentLanguage.set('en');
	const getKey = vi.fn((_article: Article) => 'Neutre');
	const { getByRole } = render(DimensionDistributionChart, {
		frenchLabels: ['Neutre'],
		translatedLabels: ['Neutral'],
		getKey,
		getColor: () => '#aaaaaa',
		title: 'Distribution',
		seriesName: 'Polarity',
		dimension: 'polarity',
		seriesIdPrefix: 'test',
		ariaLabel: 'Distribution'
	});
	await tick();
	expect(getKey).toHaveBeenCalledTimes(2);
	await fireEvent.click(getByRole('button', { name: 'Pie chart' }));
	expect(getKey).toHaveBeenCalledTimes(2);
	currentLanguage.set('fr');
	await tick();
	expect(getKey).toHaveBeenCalledTimes(2);
	await fireEvent.click(getByRole('button', { name: /données/i }));
	expect(getByRole('table').textContent).toContain('100');
});
