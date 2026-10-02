import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { datasetIdsOf } from '$lib/domain/sentimentContract';
import type { Article, DatasetId } from '$lib/types/data';
import { articleState } from '$lib/stores/articles.svelte';
import { datasetState } from '$lib/stores/datasets.svelte';
import { analysisState } from '$lib/stores/analysis.svelte';
import { viewOptionsState } from '$lib/stores/view-options.svelte';
import { applyURLState } from '$lib/stores/url/actions.svelte';
import { buildURLSearchParams, getCurrentState, parseURLState } from '$lib/stores/url';
import { currentLanguage, loadCatalogue } from '$lib/i18n';
import { buildConsensusRows } from '$lib/utils/consensus';
import ModelAgreementOverview from './ModelAgreementOverview.svelte';
import LabelPatternExplorer from './LabelPatternExplorer.svelte';

function article(id: number, model: DatasetId): Article {
	return {
		'o:id': id,
		'o:title': `Article ${id}`,
		Newspaper: 'Journal',
		Country: 'Togo',
		publication_date: '2020-01-01',
		dataset_id: model,
		sentiment_analysis: {
			polarite: id === 1 && model === 'luna' ? 'Non applicable' : id === 2 ? 'Neutre' : 'Positif',
			polarite_justification: null,
			centralite_islam_musulmans: 'Central',
			centralite_justification: null,
			subjectivite_score: 2,
			subjectivite_justification: null
		}
	};
}

beforeEach(async () => {
	await loadCatalogue('en');
	applyURLState({ view: 'agreement', dataset: 'luna', scope: 'panel', lang: 'en' });
	currentLanguage.set('en');
	for (const model of datasetIdsOf('v2'))
		articleState.updateDatasets(
			model,
			[1, 2, 3].map((id) => article(id, model))
		);
	await tick();
});
afterEach(() => {
	cleanup();
	applyURLState({});
});

describe('agreement research panels', () => {
	it('makes patterns beyond the first fifty available through the shareable All option', async () => {
		const models = datasetIdsOf('v2');
		const base = buildConsensusRows(articleState.datasets, models)[1];
		const rows = Array.from({ length: 55 }, (_, index) => ({
			...base,
			id: String(index),
			values: {
				...base.values,
				polarity: Array.from({ length: 5 }, (_, digit) => 1 + (Math.floor(index / 5 ** digit) % 5))
			}
		}));
		viewOptionsState.patternLimit = '50';
		const view = render(LabelPatternExplorer, {
			rows,
			models,
			dimension: 'polarity',
			includeDeclined: false
		});
		expect(view.container.querySelectorAll('.pattern-table tbody tr')).toHaveLength(50);
		await fireEvent.change(view.getByLabelText('Patterns shown'), { target: { value: 'all' } });
		expect(view.container.querySelectorAll('.pattern-table tbody tr')).toHaveLength(55);
		expect(parseURLState(buildURLSearchParams(getCurrentState())).options?.patternLimit).toBe(
			'all'
		);
	});

	it('adapts the overview and full pattern columns to the archived three-model panel', async () => {
		datasetState.selected = 'chatgpt';
		const models = datasetIdsOf('v1');
		for (const model of models)
			articleState.updateDatasets(
				model,
				[1, 2].map((id) => article(id, model))
			);
		await tick();
		const overview = render(ModelAgreementOverview, { dimension: 'polarity' });
		expect(overview.container.querySelectorAll('.matrix-cell')).toHaveLength(6);
		const patterns = render(LabelPatternExplorer, {
			rows: buildConsensusRows(articleState.datasets, models),
			models,
			dimension: 'polarity',
			includeDeclined: false
		});
		expect(patterns.container.querySelectorAll('.pattern-table thead th')).toHaveLength(7);
	});

	it('shows the metric-specific sample and opens the selected pair using a native button', async () => {
		const view = render(ModelAgreementOverview, { dimension: 'polarity' });
		expect(view.container.querySelectorAll('.matrix-cell')).toHaveLength(20);
		await fireEvent.change(view.getByLabelText('Agreement measure'), {
			target: { value: 'weighted' }
		});
		const pair = view.getByRole('button', { name: /Inspect GPT-5.6 Luna and Gemma 4 31B/ });
		expect(pair.textContent).toContain('n = 2');
		expect(viewOptionsState.agreementMetric).toBe('weighted');
		await fireEvent.click(pair);
		expect(datasetState.pair).toBe('luna-gemma');
		expect(analysisState.scope).toBe('pair');
	});

	it('retains the exact pattern in a shared link and opens an article annotation', async () => {
		const models = datasetIdsOf('v2');
		const rows = buildConsensusRows(articleState.datasets, models);
		const view = render(LabelPatternExplorer, {
			rows,
			models,
			dimension: 'polarity',
			includeDeclined: false
		});
		await fireEvent.click(
			view.getByRole('button', {
				name: 'Show articles for pattern Neutral / Neutral / Neutral / Neutral / Neutral'
			})
		);
		expect(viewOptionsState.labelPattern).toBe('3-3-3-3-3');
		const snapshot = parseURLState(buildURLSearchParams(getCurrentState()));
		expect(snapshot.options?.labelPattern).toBe('3-3-3-3-3');
		await fireEvent.click(view.getByRole('button', { name: 'Open annotation for Article 2' }));
		expect(articleState.selected?.['o:id']).toBe(2);
	});

	it('reports a selected pattern that does not exist instead of showing a stale article list', () => {
		viewOptionsState.labelPattern = '1-1-1-1-1';
		const models = datasetIdsOf('v2');
		const rows = buildConsensusRows(articleState.datasets, models);
		const view = render(LabelPatternExplorer, {
			rows,
			models,
			dimension: 'polarity',
			includeDeclined: false
		});
		expect(
			view.getByText(
				'The selected pattern is absent under the current dimension, generation or filters.'
			)
		).toBeTruthy();
		expect(view.queryByRole('button', { name: /Open annotation/ })).toBeNull();
	});
});
