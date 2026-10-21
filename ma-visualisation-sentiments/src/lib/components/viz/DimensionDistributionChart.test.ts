import { afterEach, expect, it, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import { currentLanguage } from '#lib/i18n/index.js';
import DimensionDistributionChart from './DimensionDistributionChart.svelte';
import type { Article } from '#lib/types/data.js';

vi.mock('svelte-echarts', async () => ({
	Chart: (await import('../../../mocks/echarts-chart-stub.svelte')).default
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
