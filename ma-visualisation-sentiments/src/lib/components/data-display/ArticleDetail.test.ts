import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import type { Article } from '#lib/types/data.js';
import ArticleDetail from './ArticleDetail.svelte';
import { datasetIdsOf } from '#lib/domain/sentimentContract.js';

const stores = vi.hoisted(() => ({
	datasets: {} as Record<string, unknown[]>
}));

vi.mock('#lib/stores/index.js', () => ({
	loadJustifications: vi.fn(async () => {}),
	justificationsOf: () => ({ polarity: null, subjectivity: null, centrality: null }),
	articleState: {
		get datasets() {
			return stores.datasets;
		}
	},
	datasetState: { getById: (id: string) => ({ id, name: `Model ${id}`, color: 'var(--accent)' }) }
}));
afterEach(() => {
	cleanup();
	stores.datasets = {};
});

it('preserves a missing centrality as not annotated in article details', () => {
	const article: Article = {
		'o:id': 2248,
		'o:title': 'Article sans annotation',
		dataset_id: 'qwen',
		sentiment_analysis: {
			centralite_islam_musulmans: null,
			centralite_justification: null,
			polarite: null,
			polarite_justification: null,
			subjectivite_score: null,
			subjectivite_justification: null
		}
	};
	const { container } = render(ArticleDetail, { article });
	expect(container.querySelector('[data-centrality="not-annotated"]')?.textContent).toContain(
		'Non annoté'
	);
	expect(container.querySelector('[data-centrality="not-addressed"]')).toBeNull();
});

it('shows every model of the generation, loading or not annotated, with the selected one marked', () => {
	const rated = {
		centralite_islam_musulmans: 'Central',
		centralite_justification: null,
		polarite: 'Neutre',
		polarite_justification: null,
		subjectivite_score: 2,
		subjectivite_justification: null
	};
	const declined = { ...rated, polarite: null };
	const models = datasetIdsOf('v2');
	// Every model loaded but the last; the selected model declined polarity.
	for (const id of models.slice(0, -1)) {
		stores.datasets[id] = [
			{ 'o:id': 7, dataset_id: id, sentiment_analysis: id === models[0] ? declined : rated }
		];
	}
	const article = stores.datasets[models[0]][0] as Article;
	const { container } = render(ArticleDetail, { article });

	const strip = container.querySelector('.panel-ratings')!;
	const polarityChips = strip.querySelectorAll('.panel-dimension')[0].querySelectorAll('li');
	expect(polarityChips).toHaveLength(models.length);
	expect(polarityChips[0].getAttribute('data-highlighted')).toBe('true');
	expect(polarityChips[0].querySelector('[data-polarity="not-annotated"]')).not.toBeNull();
	expect(polarityChips[0].querySelector('[data-polarity="na"]')).toBeNull();
	expect(polarityChips[models.length - 1].querySelector('.sentiment-badge')).toBeNull();
	expect(polarityChips[1].getAttribute('data-highlighted')).toBe('false');
});
