/**
 * Re-sorting the comparison table returns to its first page, as the article
 * and both arbiter tables already did (#232): a new order on page 3 shows rows
 * the reader never asked for.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import type { ComparisonData } from '#lib/types/data.js';
import { currentLanguage } from '#lib/i18n/index.js';
import { viewOptionsState, defaultViewOptions } from '#lib/stores/view-options.svelte.js';
import ComparisonTable from './ComparisonTable.svelte';

function comparison(id: number): ComparisonData {
	const analysis = {
		polarite: 'Neutre',
		polarite_justification: null,
		subjectivite_score: 3,
		subjectivite_justification: null,
		centralite_islam_musulmans: 'Central',
		centralite_justification: null
	};
	return {
		article: {
			'o:id': id,
			'o:title': `Article ${String(id).padStart(2, '0')}`,
			Newspaper: 'J',
			journal_source: 'J',
			publication_date: '2010-01-01'
		},
		modelA: analysis,
		modelB: analysis,
		discrepancies: { polarityDiff: 0, subjectivityDiff: 0, centralityDiff: 0, totalDiff: id % 7 }
	} as unknown as ComparisonData;
}

const mocks = vi.hoisted(() => ({
	comparisonState: { filtered: [] as unknown[], selected: null as unknown },
	datasetState: {
		pair: 'luna-mistral-small',
		available: [
			{ id: 'luna', name: 'Luna' },
			{ id: 'mistral-small', name: 'Mistral Small' }
		]
	},
	loadJustifications: async () => {}
}));

vi.mock('#lib/stores/index.js', () => mocks);

beforeEach(() => {
	currentLanguage.set('en');
	Object.assign(viewOptionsState, defaultViewOptions());
	mocks.comparisonState.filtered = Array.from({ length: 30 }, (_, i) => comparison(i + 1));
});

afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
	Object.assign(viewOptionsState, defaultViewOptions());
});

describe('ComparisonTable', () => {
	it.each([
		['Title', 'title'],
		['Total difference', 'discrepancy']
	])('returns to page 1 when sorted by %s', async (label, column) => {
		viewOptionsState.comparisonSize = '10';
		viewOptionsState.comparisonPage = 3;
		render(ComparisonTable);
		expect(viewOptionsState.comparisonPage).toBe(3);

		// The column header's button, not the rows' "Article NN" title buttons.
		const header = screen.getByRole('columnheader', { name: new RegExp(`^${label}`) });
		await fireEvent.click(within(header).getByRole('button'));

		expect(viewOptionsState.comparisonSort).toBe(column);
		expect(viewOptionsState.comparisonPage).toBe(1);
	});
});
