/**
 * Smoke tests for the shared trends shell.
 *
 * TrendsChart backs both SentimentTrendsChart and SubjectivityTrendsChart, so
 * it is a single point of failure for two views. These tests exercise the
 * paths that do not need a canvas — the empty state, the toolbar, the aria
 * wiring and the count/share toggle — against the REAL stores rather than a
 * mocked barrel: mocking `$lib/stores` would have to stub every store any
 * child component happens to touch, and would stop testing the wiring that
 * actually breaks. Only the ECharts body is stubbed, since it needs a canvas
 * jsdom cannot provide; the rendering itself is covered by the browser pass.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import type { Article } from '$lib/types/data';

vi.mock('svelte-echarts', async () => ({
	Chart: (await import('../../../mocks/echarts-chart-stub.svelte')).default
}));

import { articleState, datasetState } from '$lib/stores';
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

function renderChart() {
	return render(TrendsChart, {
		props: {
			frenchLabels: ['Positif', 'Neutre', 'Négatif'],
			seriesLabels: ['Positive', 'Neutral', 'Negative'],
			legendData: ['Positive', 'Neutral', 'Negative'],
			getKey: (a: Article) => a.sentiment_analysis?.polarite ?? null,
			getColor: () => '#E3AD4B',
			title: 'Sentiment trends',
			ariaLabel: 'Sentiment trends'
		}
	});
}

beforeEach(() => {
	datasetState.isComparisonMode = false;
	loadArticles([]);
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
});
