/**
 * The archived pairwise arbiter cards.
 *
 * The lead line used to compare a locale-formatted string with a number:
 * `Number("12,3")` is NaN, so in French — the default language — the line
 * never rendered, and in English it was a hard-coded sentence with a literal
 * "%". These tests render the component in French on purpose.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import ArbiterStatsCards from './ArbiterStatsCards.svelte';
import { currentLanguage } from '#lib/i18n/index.js';
import type { ArbiterStatistics } from '#lib/stores/arbiter.svelte.js';
import { leadPoints } from '#lib/utils/arbiter.js';

afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
});

function stats(overrides: Partial<ArbiterStatistics> = {}): ArbiterStatistics {
	return {
		totalEvaluated: 100,
		modelAPreferred: 50,
		modelBPreferred: 30,
		bothEqual: 15,
		neitherAccurate: 5,
		modelAPercentage: 50,
		modelBPercentage: 37.7,
		bothPercentage: 15,
		neitherPercentage: 5,
		overallModelAWins: 40,
		overallModelBWins: 25,
		overallTies: 35,
		modelAName: 'Alpha',
		modelBName: 'Beta',
		hasData: true,
		...overrides
	};
}

describe('ArbiterStatsCards', () => {
	it('renders the lead in French, formatted for display only', () => {
		currentLanguage.set('fr');
		render(ArbiterStatsCards, {
			props: { stats: stats(), modelAName: 'Alpha', modelBName: 'Beta' }
		});
		const lead = screen.getByText(/mène les préférences globales/);
		expect(lead.textContent).toContain('Alpha');
		// A French decimal comma, and percentage points rather than a bare "%".
		expect(lead.textContent).toContain('12,3');
		expect(lead.textContent).toContain('points de pourcentage');
	});

	it('leaves the lead out when the two shares are within a point', () => {
		render(ArbiterStatsCards, {
			props: {
				stats: stats({ modelAPercentage: 40.5, modelBPercentage: 40 }),
				modelAName: 'Alpha',
				modelBName: 'Beta'
			}
		});
		expect(screen.queryByText(/mène les préférences globales/)).toBeNull();
	});

	it('names the head-to-head counts in text, not only as bar widths', () => {
		render(ArbiterStatsCards, {
			props: { stats: stats(), modelAName: 'Alpha', modelBName: 'Beta' }
		});
		const list = screen.getByRole('list');
		expect(list.textContent).toContain('Alpha');
		expect(list.textContent).toContain('40');
		expect(list.textContent).toContain('25');
	});
});

describe('leadPoints', () => {
	it('stays numeric', () => {
		expect(leadPoints(50, 37.7)).toBeCloseTo(12.3, 10);
		expect(leadPoints(30, 45)).toBe(15);
	});
});
