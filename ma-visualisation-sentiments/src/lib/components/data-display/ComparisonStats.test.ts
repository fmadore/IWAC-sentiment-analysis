/**
 * The arbiter summary is a disclosure: its toggle is a button inside the
 * heading (WAI-ARIA disclosure pattern), not a heading inside a button, which
 * is invalid markup and strips the heading of its role.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import ComparisonStats from './ComparisonStats.svelte';
import { fr } from '#lib/i18n/fr.js';
import { viewOptionsState, defaultViewOptions } from '#lib/stores/view-options.svelte.js';

const mocks = vi.hoisted(() => ({
	comparisonState: {
		statistics: {
			totalArticles: 100,
			totalDiscrepancies: 40,
			averageDiscrepancy: 1.2,
			highConflictArticles: 0,
			polarityConflicts: 10,
			subjectivityConflicts: 20,
			centralityConflicts: 10,
			highConflictBy: { polarity: 0, subjectivity: 0, centrality: 0, subjectivityOnly: 0 }
		}
	},
	arbiterStatistics: {
		current: {
			totalEvaluated: 12,
			modelAPreferred: 5,
			modelBPreferred: 4,
			bothEqual: 2,
			neitherAccurate: 1,
			modelAPercentage: 41.7,
			modelBPercentage: 33.3,
			bothPercentage: 16.7,
			neitherPercentage: 8.3,
			overallModelAWins: 5,
			overallModelBWins: 4,
			overallTies: 3,
			modelAName: 'Alpha',
			modelBName: 'Beta',
			hasData: true
		}
	},
	datasetState: { pair: 'chatgpt-gemini', available: [] }
}));
vi.mock('#lib/stores/index.js', () => mocks);

afterEach(() => {
	cleanup();
	Object.assign(viewOptionsState, defaultViewOptions());
});

describe('ComparisonStats arbiter summary', () => {
	it('puts the toggle button inside a level-4 heading', () => {
		render(ComparisonStats);
		const heading = screen.getByRole('heading', {
			level: 4,
			name: new RegExp(fr.arbiter.summaryTitle)
		});
		const button = within(heading).getByRole('button', {
			name: new RegExp(fr.arbiter.summaryTitle)
		});
		expect(button.getAttribute('type')).toBe('button');
		expect(button.querySelector('h1, h2, h3, h4, h5, h6, div, p')).toBeNull();
	});

	it('reports and toggles its expanded state', async () => {
		render(ComparisonStats);
		const button = screen.getByRole('button', { name: new RegExp(fr.arbiter.summaryTitle) });
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByText(fr.arbiter.blindEvaluationNote)).toBeNull();

		await fireEvent.click(button);
		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(viewOptionsState.arbiterSummary).toBe(true);
		expect(screen.getByText(fr.arbiter.blindEvaluationNote)).toBeTruthy();

		await fireEvent.click(button);
		expect(button.getAttribute('aria-expanded')).toBe('false');
	});
});
