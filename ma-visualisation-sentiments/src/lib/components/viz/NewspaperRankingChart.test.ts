/**
 * The newspaper ranking's measure toggle must survive its own empty state.
 *
 * It sat inside `{#if ranks.length > 0}`, so switching to a measure no title
 * reaches the threshold on (here: subjectivity, which these articles lack)
 * left only the empty message and no way back but changing filters (#232).
 * Real stores, as in TrendsChart.test.ts; only the ECharts body is stubbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import type { Article } from '#lib/types/data.js';
import { currentLanguage } from '#lib/i18n/index.js';
import { defaultViewOptions, viewOptionsState } from '#lib/stores/view-options.svelte.js';

vi.mock('svelte-echarts', () => ({ Chart: () => {} }));

import { articleState, datasetState } from '#lib/stores/index.js';
import NewspaperRankingChart from './NewspaperRankingChart.svelte';

function article(id: number): Article {
	return {
		'o:id': id,
		Newspaper: 'J',
		journal_source: 'J',
		publication_date: '2010-01-01',
		dataset_id: datasetState.selected,
		sentiment_analysis: {
			centralite_islam_musulmans: null,
			centralite_justification: null,
			subjectivite_score: null,
			subjectivite_justification: null,
			polarite: 'Positif',
			polarite_justification: null
		}
	} as Article;
}

function measureToggle(): HTMLElement {
	return screen.getByRole('group', { name: 'Newspapers ranked' });
}

beforeEach(() => {
	currentLanguage.set('en');
	Object.assign(viewOptionsState, defaultViewOptions());
	datasetState.isComparisonMode = false;
	articleState.updateDatasets(datasetState.selected, [article(1), article(2), article(3)]);
});

afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
	Object.assign(viewOptionsState, defaultViewOptions());
	articleState.updateDatasets(datasetState.selected, []);
});

describe('NewspaperRankingChart', () => {
	it('keeps the measure toggle in the empty state, so the reader can switch back', async () => {
		render(NewspaperRankingChart, { props: { minArticles: 2 } });
		expect(document.querySelector('.chart-container')).not.toBeNull();

		await fireEvent.click(within(measureToggle()).getByRole('button', { name: 'Subjectivity' }));
		expect(viewOptionsState.rankingMeasure).toBe('subjectivity');
		expect(document.querySelector('.chart-container')).toBeNull();
		expect(document.querySelector('.chart-empty')).not.toBeNull();

		await fireEvent.click(within(measureToggle()).getByRole('button', { name: 'Polarity' }));
		expect(viewOptionsState.rankingMeasure).toBe('polarity');
		expect(document.querySelector('.chart-container')).not.toBeNull();
	});

	it('offers the toggle when the very first render is empty', () => {
		viewOptionsState.rankingMeasure = 'subjectivity';
		render(NewspaperRankingChart, { props: { minArticles: 2 } });

		expect(document.querySelector('.chart-empty')).not.toBeNull();
		expect(within(measureToggle()).getAllByRole('button')).toHaveLength(3);
	});
});
