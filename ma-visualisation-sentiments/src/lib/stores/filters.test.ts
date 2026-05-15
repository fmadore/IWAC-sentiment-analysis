/**
 * Filter Store Unit Tests
 *
 * Tests the runes-based filterState accessor:
 * - per-dimension getters/setters
 * - DiscrepancyFilter operations (set + partial update)
 * - clearAll behaviour
 * - hasActiveFilters computation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { filterState } from '$lib/stores/filters.svelte';
import type { DiscrepancyFilter } from '$lib/types/data';

beforeEach(() => {
	filterState.clearAll();
	filterState.discrepancy = {
		minDifference: 0,
		maxDifference: 5,
		dimensions: ['polarity', 'subjectivity', 'centrality'],
		excludeNonApplicable: true
	};
});

describe('filterState.countries', () => {
	it('initializes with empty array', () => {
		expect(filterState.countries).toEqual([]);
	});

	it('can set country filters', () => {
		filterState.countries = ['Nigeria', 'Senegal'];
		expect(filterState.countries).toEqual(['Nigeria', 'Senegal']);
	});
});

describe('filterState.journals', () => {
	it('initializes with empty array', () => {
		expect(filterState.journals).toEqual([]);
	});

	it('can set journal filters', () => {
		filterState.journals = ['Le Monde', 'Guardian'];
		expect(filterState.journals).toEqual(['Le Monde', 'Guardian']);
	});
});

describe('filterState.polarities', () => {
	it('initializes with empty array', () => {
		expect(filterState.polarities).toEqual([]);
	});

	it('handles all polarity values', () => {
		const allPolarities = [
			'Très positif',
			'Positif',
			'Neutre',
			'Négatif',
			'Très négatif',
			'Non applicable'
		];
		filterState.polarities = allPolarities;
		expect(filterState.polarities).toEqual(allPolarities);
	});
});

describe('filterState.subjectivities', () => {
	it('initializes with empty array', () => {
		expect(filterState.subjectivities).toEqual([]);
	});

	it('can set subjectivity filters', () => {
		filterState.subjectivities = ['1', '2', '3'];
		expect(filterState.subjectivities).toEqual(['1', '2', '3']);
	});
});

describe('filterState.centralities', () => {
	it('initializes with empty array', () => {
		expect(filterState.centralities).toEqual([]);
	});

	it('handles all centrality values', () => {
		const allCentralities = ['Très central', 'Central', 'Secondaire', 'Marginal', 'Non abordé'];
		filterState.centralities = allCentralities;
		expect(filterState.centralities).toEqual(allCentralities);
	});
});

describe('filterState.discrepancy', () => {
	it('initializes with default values', () => {
		const defaults = filterState.discrepancy;
		expect(defaults.minDifference).toBe(0);
		expect(defaults.maxDifference).toBe(5);
		expect(defaults.dimensions).toEqual(['polarity', 'subjectivity', 'centrality']);
		expect(defaults.excludeNonApplicable).toBe(true);
	});

	it('can update min/max difference range', () => {
		filterState.discrepancy = {
			...filterState.discrepancy,
			minDifference: 2,
			maxDifference: 4
		};
		expect(filterState.discrepancy.minDifference).toBe(2);
		expect(filterState.discrepancy.maxDifference).toBe(4);
	});

	it('can filter by specific dimensions', () => {
		filterState.discrepancy = { ...filterState.discrepancy, dimensions: ['polarity'] };
		expect(filterState.discrepancy.dimensions).toEqual(['polarity']);
	});

	it('can toggle excludeNonApplicable', () => {
		filterState.discrepancy = { ...filterState.discrepancy, excludeNonApplicable: false };
		expect(filterState.discrepancy.excludeNonApplicable).toBe(false);
	});

	it('can be replaced wholesale', () => {
		const newFilter: DiscrepancyFilter = {
			minDifference: 1,
			maxDifference: 3,
			dimensions: ['subjectivity', 'centrality'],
			excludeNonApplicable: false
		};
		filterState.discrepancy = newFilter;
		expect(filterState.discrepancy).toEqual(newFilter);
	});
});

describe('filterState.hasActiveFilters', () => {
	it('returns false when no filters are active', () => {
		expect(filterState.hasActiveFilters).toBe(false);
	});

	it('returns true when country filters are active', () => {
		filterState.countries = ['Nigeria'];
		expect(filterState.hasActiveFilters).toBe(true);
	});

	it('returns true when journal filters are active', () => {
		filterState.journals = ['Guardian'];
		expect(filterState.hasActiveFilters).toBe(true);
	});

	it('returns true when polarity filters are active', () => {
		filterState.polarities = ['Positif'];
		expect(filterState.hasActiveFilters).toBe(true);
	});

	it('returns true when subjectivity filters are active', () => {
		filterState.subjectivities = ['3'];
		expect(filterState.hasActiveFilters).toBe(true);
	});

	it('returns true when centrality filters are active', () => {
		filterState.centralities = ['Central'];
		expect(filterState.hasActiveFilters).toBe(true);
	});
});

describe('filterState.clearAll', () => {
	it('clears all dimension filters but not discrepancy', () => {
		filterState.countries = ['Nigeria', 'Senegal'];
		filterState.journals = ['Guardian'];
		filterState.polarities = ['Positif'];
		filterState.subjectivities = ['3', '4'];
		filterState.centralities = ['Central'];
		const customDiscrepancy: DiscrepancyFilter = {
			minDifference: 2,
			maxDifference: 4,
			dimensions: ['polarity'],
			excludeNonApplicable: false
		};
		filterState.discrepancy = customDiscrepancy;

		expect(filterState.hasActiveFilters).toBe(true);

		filterState.clearAll();

		expect(filterState.countries).toEqual([]);
		expect(filterState.journals).toEqual([]);
		expect(filterState.polarities).toEqual([]);
		expect(filterState.subjectivities).toEqual([]);
		expect(filterState.centralities).toEqual([]);
		expect(filterState.hasActiveFilters).toBe(false);
		// Discrepancy is intentionally preserved across clearAll
		expect(filterState.discrepancy).toEqual(customDiscrepancy);
	});
});

describe('filterState.updateDiscrepancy', () => {
	it('partially updates discrepancy filters', () => {
		filterState.updateDiscrepancy({ minDifference: 2 });
		const filters = filterState.discrepancy;
		expect(filters.minDifference).toBe(2);
		expect(filters.maxDifference).toBe(5);
		expect(filters.dimensions).toEqual(['polarity', 'subjectivity', 'centrality']);
	});

	it('can update multiple properties at once', () => {
		filterState.updateDiscrepancy({
			minDifference: 1,
			maxDifference: 3,
			excludeNonApplicable: false
		});
		const filters = filterState.discrepancy;
		expect(filters.minDifference).toBe(1);
		expect(filters.maxDifference).toBe(3);
		expect(filters.excludeNonApplicable).toBe(false);
	});
});

describe('Filter independence', () => {
	it('filters work independently', () => {
		filterState.countries = ['Nigeria'];
		filterState.polarities = ['Positif', 'Négatif'];

		expect(filterState.countries).toEqual(['Nigeria']);
		expect(filterState.polarities).toEqual(['Positif', 'Négatif']);

		filterState.countries = [];
		expect(filterState.countries).toEqual([]);
		expect(filterState.polarities).toEqual(['Positif', 'Négatif']);
	});
});
