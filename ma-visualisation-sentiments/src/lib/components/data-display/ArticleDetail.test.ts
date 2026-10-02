import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import type { Article } from '$lib/types/data';
import ArticleDetail from './ArticleDetail.svelte';

vi.mock('$lib/stores', () => ({
	loadJustifications: vi.fn(async () => {}),
	justificationsOf: () => ({ polarity: null, subjectivity: null, centrality: null })
}));
afterEach(cleanup);

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
