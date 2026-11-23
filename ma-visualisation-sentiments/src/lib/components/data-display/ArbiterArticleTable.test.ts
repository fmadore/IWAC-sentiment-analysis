/**
 * The archived pairwise arbiter's article table.
 *
 * `overall_winner` names the judge's blind slots, not the pair's order. On
 * `gemini-mistral` the assignment is swapped (`arbiter_model_a` is Mistral), so
 * reading the raw value as pair order named the other model on every row
 * (issue #214). These rows reproduce that file's metadata.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/svelte';
import type { ArbiterAnalysis, ArbiterEvaluationData } from '#lib/types/data.js';
import { currentLanguage } from '#lib/i18n/index.js';
import { viewOptionsState, defaultViewOptions } from '#lib/stores/view-options.svelte.js';
import ArbiterArticleTable from './ArbiterArticleTable.svelte';

const mocks = vi.hoisted(() => ({
	arbiterEvaluations: { current: null as ArbiterEvaluationData | null },
	arbiterModelAIsFirst: { current: false },
	comparisonState: { data: [] as unknown[] },
	datasetState: {
		pair: 'gemini-mistral',
		available: [
			{ id: 'gemini', name: 'Gemini' },
			{ id: 'mistral', name: 'Mistral' }
		]
	},
	getActualModelName: (verdict: string) => verdict
}));

vi.mock('#lib/stores/index.js', () => mocks);

function dimension() {
	return { preferred_model: 'both', score: 'Neutre', explanation: '' };
}

function evaluation(articleId: string, winner: ArbiterAnalysis['overall_winner']) {
	return {
		article_id: articleId,
		arbiter: {
			article_id: articleId,
			polarity: dimension(),
			subjectivity: dimension(),
			centrality: dimension(),
			overall_winner: winner,
			overall_explanation: '',
			confidence_level: 'high',
			timestamp: '2026-01-01T00:00:00Z'
		},
		discrepancies: {
			polarity_diff: 0,
			subjectivity_diff: 0,
			centrality_diff: 0,
			total_diff: 0,
			has_significant_conflict: false
		}
	};
}

function data(
	modelAIsFirst: boolean,
	winners: Record<string, ArbiterAnalysis['overall_winner']>
): ArbiterEvaluationData {
	return {
		metadata: {
			arbiter_model_a: modelAIsFirst ? 'Gemini' : 'Mistral',
			arbiter_model_b: modelAIsFirst ? 'Mistral' : 'Gemini',
			pair: 'gemini-mistral',
			pair_first_model: 'Gemini',
			pair_second_model: 'Mistral'
		},
		evaluations: Object.entries(winners).map(([id, winner]) => evaluation(id, winner))
	} as unknown as ArbiterEvaluationData;
}

/** The verdict cell's text for the row whose title button reads `#<id>`. */
function verdictFor(articleId: string): string {
	const row = screen.getByText(`#${articleId}`).closest('tr');
	if (!row) throw new Error(`no row for ${articleId}`);
	const cells = within(row).getAllByRole('cell');
	return cells[3].textContent?.trim() ?? '';
}

beforeEach(() => {
	currentLanguage.set('en');
	Object.assign(viewOptionsState, defaultViewOptions());
});

afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
	Object.assign(viewOptionsState, defaultViewOptions());
});

describe('ArbiterArticleTable', () => {
	it('names the pair’s other model when the blind assignment is swapped', () => {
		mocks.arbiterModelAIsFirst.current = false;
		mocks.arbiterEvaluations.current = data(false, { '1': 'model_a', '2': 'model_b' });
		render(ArbiterArticleTable, { props: { onSelectArticle: () => {} } });

		// Blind Model A is Mistral, the pair's second model.
		expect(verdictFor('1')).toBe('Mistral');
		expect(verdictFor('2')).toBe('Gemini');
	});

	it('colours the badge by the pair-order verdict, not the blind slot', () => {
		mocks.arbiterModelAIsFirst.current = false;
		mocks.arbiterEvaluations.current = data(false, { '1': 'model_a' });
		render(ArbiterArticleTable, { props: { onSelectArticle: () => {} } });

		const badge = screen.getByText('Mistral').closest('.verdict-badge');
		expect(badge?.classList.contains('badge-verdict-loss')).toBe(true);
	});

	it('keeps the stored slots when the blind Model A is the pair’s first model', () => {
		mocks.arbiterModelAIsFirst.current = true;
		mocks.arbiterEvaluations.current = data(true, { '1': 'model_a', '2': 'model_b' });
		render(ArbiterArticleTable, { props: { onSelectArticle: () => {} } });

		expect(verdictFor('1')).toBe('Gemini');
		expect(verdictFor('2')).toBe('Mistral');
	});

	it('sorts the verdict column by pair order', () => {
		mocks.arbiterModelAIsFirst.current = false;
		mocks.arbiterEvaluations.current = data(false, { '1': 'model_a', '2': 'model_b' });
		viewOptionsState.arbiterSort = 'verdict';
		viewOptionsState.arbiterOrder = 'desc';
		render(ArbiterArticleTable, { props: { onSelectArticle: () => {} } });

		// Descending verdict puts the pair's first model (Gemini) on top: article
		// 2, whose blind `model_b` is Gemini. Reading the raw slot put article 1
		// first, under the wrong name, so the labels alone cannot tell them apart.
		const rows = screen.getAllByRole('row').slice(1);
		expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent?.trim())).toEqual([
			'#2',
			'#1'
		]);
		expect(verdictFor('2')).toBe('Gemini');
	});
});
