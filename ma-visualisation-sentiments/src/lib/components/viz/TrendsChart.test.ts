/**
 * Smoke tests for the shared trends shell.
 *
 * TrendsChart backs both SentimentTrendsChart and SubjectivityTrendsChart, so
 * it is a single point of failure for two views. These tests exercise the
 * paths that do not need a canvas — the empty state, the toolbar, the aria
 * wiring and the count/share toggle — against the REAL stores rather than a
 * mocked barrel: mocking `#lib/stores` would have to stub every store any
 * child component happens to touch, and would stop testing the wiring that
 * actually breaks. Only the ECharts body is stubbed, since it needs a canvas
 * jsdom cannot provide; the rendering itself is covered by the browser pass.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { Article } from '#lib/types/data.js';

/**
 * A bare function component in place of the ECharts body: it renders nothing,
 * like the shared stub, but keeps its props so a test can call the tooltip
 * formatter (a function, which a JSON-serialising stub would drop).
 */
const chart = vi.hoisted(() => ({
	props: null as null | { options: { tooltip: { formatter: (params: unknown) => string } } }
}));
vi.mock('svelte-echarts', () => ({
	Chart: (_anchor: unknown, props: NonNullable<typeof chart.props>) => {
		chart.props = props;
	}
}));
const csv = vi.hoisted(() => ({ downloads: [] as Array<{ content: string; filename: string }> }));
vi.mock('#lib/utils/csv.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/utils/csv.js')>()),
	downloadCSVFile: (content: string, filename: string) => {
		csv.downloads.push({ content, filename });
	}
}));

import { articleState, datasetState } from '#lib/stores/index.js';
import TrendsChart from './TrendsChart.svelte';

function article(id: number, year: string, polarite: string): Article {
	return {
		'o:id': id,
		Newspaper: 'J',
		journal_source: 'J',
		publication_date: `${year}-01-01`,
		dataset_id: 'chatgpt',
		sentiment_analysis: {
			centralite_islam_musulmans: null,
			centralite_justification: null,
			subjectivite_score: null,
			subjectivite_justification: null,
			polarite,
			polarite_justification: null
		}
	} as Article;
}

function loadArticles(articles: Article[]) {
	articleState.updateDatasets(datasetState.selected, articles);
}

function renderChart(
	overrides: Partial<{
		stateKey: 'polarityTrend' | 'subjectivityTrend';
		seriesLabels: string[];
	}> = {}
) {
	return render(TrendsChart, {
		props: {
			stateKey: 'polarityTrend',
			frenchLabels: ['Positif', 'Neutre', 'Négatif'],
			seriesLabels: ['Positive', 'Neutral', 'Negative'],
			getKey: (a: Article) => a.sentiment_analysis?.polarite ?? null,
			getColor: () => '#E3AD4B',
			title: 'Sentiment trends',
			ariaLabel: 'Sentiment trends',
			...overrides
		}
	});
}

/** Open the data disclosure, export its CSV and return what was downloaded. */
async function exportCsv(): Promise<{ content: string; filename: string }> {
	await fireEvent.click(screen.getByRole('button', { name: /données|data/i }));
	await fireEvent.click(screen.getByRole('button', { name: /csv/i }));
	const download = csv.downloads.at(-1);
	if (!download) throw new Error('no CSV downloaded');
	return download;
}

beforeEach(() => {
	datasetState.isComparisonMode = false;
	loadArticles([]);
	csv.downloads = [];
	chart.props = null;
});

afterEach(cleanup);

/** The chart's own labelled region, not the DatasetBadge logo beside it. */
function chartRegion(): HTMLElement {
	const region = document.querySelector('.chart-container');
	if (!region) throw new Error('chart container not rendered');
	return region as HTMLElement;
}

describe('TrendsChart', () => {
	it('shows the empty state when filters exclude everything', () => {
		renderChart();

		expect(document.querySelector('.chart-container')).toBeNull();
		expect(document.querySelector('.chart-empty')).not.toBeNull();
	});

	it('renders the chart region with an accessible label when data is present', () => {
		loadArticles([article(1, '2010', 'Positif'), article(2, '2011', 'Neutre')]);
		renderChart();

		// Scoped to the chart container: the DatasetBadge also renders an <img>
		// (the model logo), which shares the role.
		expect(chartRegion().getAttribute('aria-label')).toBe('Sentiment trends');
	});

	it('offers the count/share toggle with exactly one mode active', () => {
		loadArticles([article(1, '2010', 'Positif')]);
		renderChart();

		expect(screen.getByRole('group')).toBeTruthy();

		const pressed = screen
			.getAllByRole('button')
			.filter((b) => b.getAttribute('aria-pressed') === 'true');
		expect(pressed).toHaveLength(1);
	});

	it('switches to share mode and says so in the accessible label', async () => {
		loadArticles([article(1, '2010', 'Positif'), article(2, '2010', 'Neutre')]);
		renderChart();

		const shareButton = screen
			.getAllByRole('button')
			.find((b) => b.getAttribute('aria-pressed') === 'false');
		expect(shareButton).toBeTruthy();

		shareButton!.click();
		await Promise.resolve();

		expect(shareButton!.getAttribute('aria-pressed')).toBe('true');
		// A screen reader cannot see which mode the canvas is in, so the label
		// has to carry it.
		const label = chartRegion().getAttribute('aria-label');
		expect(label).toContain('Sentiment trends');
		expect(label).not.toBe('Sentiment trends');
	});

	it('gives the data table one header per row cell when the scale carries a sixth label', async () => {
		loadArticles([article(1, '2010', 'Positif'), article(2, '2011', 'Négatif')]);
		// The shared scale lists end with "Not applicable" / "Not annotated",
		// which has no trend line.
		renderChart({ seriesLabels: ['Positive', 'Neutral', 'Negative', 'Not applicable'] });

		const { content } = await exportCsv();
		const table = screen.getByRole('table');
		const headers = table.querySelectorAll('thead th');
		const firstRow = table.querySelector('tbody tr')!;
		expect(headers).toHaveLength(firstRow.children.length);
		expect(headers).toHaveLength(4);
		expect(table.querySelector('thead')!.textContent).not.toContain('Not applicable');

		const [headerLine, rowLine] = content.split(/\r?\n/);
		expect(headerLine.split(',')).toHaveLength(rowLine.split(',').length);
	});

	it('names the polarity and subjectivity CSVs differently', async () => {
		loadArticles([article(1, '2010', 'Positif')]);
		renderChart({ stateKey: 'polarityTrend' });
		const polarity = (await exportCsv()).filename;
		cleanup();

		renderChart({ stateKey: 'subjectivityTrend' });
		const subjectivity = (await exportCsv()).filename;

		const stem = (filename: string) => filename.replace(/-\d{4}-\d{2}-\d{2}\.csv$/, '');
		expect(stem(polarity)).not.toBe(stem(subjectivity));
		expect(stem(polarity)).toContain('polarity');
		expect(stem(subjectivity)).toContain('subjectivity');
	});

	it('draws the polarity glyph for translated series names in the tooltip', async () => {
		loadArticles([article(1, '2010', 'Positif')]);
		renderChart();
		await tick();

		const html = chart.props!.options.tooltip.formatter([
			{ seriesName: 'Positive', value: 1, color: '#E3AD4B', axisValue: '2010' }
		]);
		expect(html).toContain('△');
	});

	it('draws no glyph on the subjectivity trends', async () => {
		loadArticles([article(1, '2010', 'Positif')]);
		renderChart({ stateKey: 'subjectivityTrend' });
		await tick();

		const html = chart.props!.options.tooltip.formatter([
			{ seriesName: 'Positive', value: 1, color: '#E3AD4B', axisValue: '2010' }
		]);
		expect(html).not.toMatch(/[▲△■▽▼○]/);
	});
});
