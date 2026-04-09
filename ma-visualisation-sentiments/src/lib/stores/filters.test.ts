/**
 * Filter Store Unit Tests
 *
 * Tests the filter store logic including:
 * - filterState object behavior
 * - Individual filter stores
 * - DiscrepancyFilter operations
 * - clearAll functionality
 * - hasActiveFilters computation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	filterState,
	countryFilters,
	journalFilters,
	polarityFilters,
	subjectivityFilters,
	centralityFilters,
	discrepancyFilters
} from '$lib/stores/filters.svelte';
import type { DiscrepancyFilter } from '$lib/types/data';

// ============================================
// Setup - Reset filters before each test
// ============================================

beforeEach(() => {
	// Reset all filter stores to initial state
	countryFilters.set([]);
	journalFilters.set([]);
	polarityFilters.set([]);
	subjectivityFilters.set([]);
	centralityFilters.set([]);
	discrepancyFilters.set({
		minDifference: 0,
		maxDifference: 5,
		dimensions: ['polarity', 'subjectivity', 'centrality'],
		excludeNonApplicable: true
	});
});

// ============================================
// Country Filter Tests
// ============================================

describe('countryFilters', () => {
	it('initializes with empty array', () => {
		expect(get(countryFilters)).toEqual([]);
	});

	it('can set country filters', () => {
		countryFilters.set(['Nigeria', 'Senegal']);
		expect(get(countryFilters)).toEqual(['Nigeria', 'Senegal']);
	});

	it('syncs with filterState', () => {
		countryFilters.set(['Benin']);
		expect(filterState.countries).toEqual(['Benin']);
	});
});

// ============================================
// Journal Filter Tests
// ============================================

describe('journalFilters', () => {
	it('initializes with empty array', () => {
		expect(get(journalFilters)).toEqual([]);
	});

	it('can set journal filters', () => {
		journalFilters.set(['Le Monde', 'Guardian']);
		expect(get(journalFilters)).toEqual(['Le Monde', 'Guardian']);
	});

	it('syncs with filterState', () => {
		journalFilters.set(['Daily Times']);
		expect(filterState.journals).toEqual(['Daily Times']);
	});
});

// ============================================
// Polarity Filter Tests
// ============================================

describe('polarityFilters', () => {
	it('initializes with empty array', () => {
		expect(get(polarityFilters)).toEqual([]);
	});

	it('can set polarity filters with French values', () => {
		polarityFilters.set(['Positif', 'Neutre']);
		expect(get(polarityFilters)).toEqual(['Positif', 'Neutre']);
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
		polarityFilters.set(allPolarities);
		expect(get(polarityFilters)).toEqual(allPolarities);
	});
});

// ============================================
// Subjectivity Filter Tests
// ============================================

describe('subjectivityFilters', () => {
	it('initializes with empty array', () => {
		expect(get(subjectivityFilters)).toEqual([]);
	});

	it('can set subjectivity filters', () => {
		subjectivityFilters.set(['1', '2', '3']);
		expect(get(subjectivityFilters)).toEqual(['1', '2', '3']);
	});
});

// ============================================
// Centrality Filter Tests
// ============================================

describe('centralityFilters', () => {
	it('initializes with empty array', () => {
		expect(get(centralityFilters)).toEqual([]);
	});

	it('can set centrality filters with French values', () => {
		centralityFilters.set(['Très central', 'Central']);
		expect(get(centralityFilters)).toEqual(['Très central', 'Central']);
	});

	it('handles all centrality values', () => {
		const allCentralities = ['Très central', 'Central', 'Secondaire', 'Marginal', 'Non abordé'];
		centralityFilters.set(allCentralities);
		expect(get(centralityFilters)).toEqual(allCentralities);
	});
});

// ============================================
// Discrepancy Filter Tests
// ============================================

describe('discrepancyFilters', () => {
	it('initializes with default values', () => {
		const defaults = get(discrepancyFilters);
		expect(defaults.minDifference).toBe(0);
		expect(defaults.maxDifference).toBe(5);
		expect(defaults.dimensions).toEqual(['polarity', 'subjectivity', 'centrality']);
		expect(defaults.excludeNonApplicable).toBe(true);
	});

	it('can update min/max difference range', () => {
		discrepancyFilters.set({
			...get(discrepancyFilters),
			minDifference: 2,
			maxDifference: 4
		});

		const filters = get(discrepancyFilters);
		expect(filters.minDifference).toBe(2);
		expect(filters.maxDifference).toBe(4);
	});

	it('can filter by specific dimensions', () => {
		discrepancyFilters.set({
			...get(discrepancyFilters),
			dimensions: ['polarity']
		});

		expect(get(discrepancyFilters).dimensions).toEqual(['polarity']);
	});

	it('can toggle excludeNonApplicable', () => {
		discrepancyFilters.set({
			...get(discrepancyFilters),
			excludeNonApplicable: false
		});

		expect(get(discrepancyFilters).excludeNonApplicable).toBe(false);
	});

	it('syncs with filterState.discrepancy', () => {
		const newFilter: DiscrepancyFilter = {
			minDifference: 1,
			maxDifference: 3,
			dimensions: ['subjectivity', 'centrality'],
			excludeNonApplicable: false
		};
		discrepancyFilters.set(newFilter);

		expect(filterState.discrepancy).toEqual(newFilter);
	});
});

// ============================================
// filterState Tests
// ============================================

describe('filterState', () => {
	describe('hasActiveFilters', () => {
		it('returns false when no filters are active', () => {
			expect(filterState.hasActiveFilters).toBe(false);
		});

		it('returns true when country filters are active', () => {
			countryFilters.set(['Nigeria']);
			expect(filterState.hasActiveFilters).toBe(true);
		});

		it('returns true when journal filters are active', () => {
			journalFilters.set(['Guardian']);
			expect(filterState.hasActiveFilters).toBe(true);
		});

		it('returns true when polarity filters are active', () => {
			polarityFilters.set(['Positif']);
			expect(filterState.hasActiveFilters).toBe(true);
		});

		it('returns true when subjectivity filters are active', () => {
			subjectivityFilters.set(['3']);
			expect(filterState.hasActiveFilters).toBe(true);
		});

		it('returns true when centrality filters are active', () => {
			centralityFilters.set(['Central']);
			expect(filterState.hasActiveFilters).toBe(true);
		});

		it('returns true when multiple filters are active', () => {
			countryFilters.set(['Nigeria']);
			polarityFilters.set(['Positif', 'Neutre']);
			expect(filterState.hasActiveFilters).toBe(true);
		});
	});

	describe('clearAll', () => {
		it('clears all filter stores', () => {
			// Set various filters
			countryFilters.set(['Nigeria', 'Senegal']);
			journalFilters.set(['Guardian']);
			polarityFilters.set(['Positif']);
			subjectivityFilters.set(['3', '4']);
			centralityFilters.set(['Central']);

			// Verify filters are set
			expect(filterState.hasActiveFilters).toBe(true);

			// Clear all
			filterState.clearAll();

			// Verify all are cleared
			expect(get(countryFilters)).toEqual([]);
			expect(get(journalFilters)).toEqual([]);
			expect(get(polarityFilters)).toEqual([]);
			expect(get(subjectivityFilters)).toEqual([]);
			expect(get(centralityFilters)).toEqual([]);
			expect(filterState.hasActiveFilters).toBe(false);
		});
	});

	describe('updateDiscrepancy', () => {
		it('partially updates discrepancy filters', () => {
			filterState.updateDiscrepancy({ minDifference: 2 });

			const filters = filterState.discrepancy;
			expect(filters.minDifference).toBe(2);
			expect(filters.maxDifference).toBe(5); // unchanged
			expect(filters.dimensions).toEqual(['polarity', 'subjectivity', 'centrality']); // unchanged
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

	describe('setters', () => {
		it('can set countries through filterState', () => {
			filterState.countries = ['Ghana'];
			expect(get(countryFilters)).toEqual(['Ghana']);
		});

		it('can set journals through filterState', () => {
			filterState.journals = ['Le Monde'];
			expect(get(journalFilters)).toEqual(['Le Monde']);
		});

		it('can set polarities through filterState', () => {
			filterState.polarities = ['Neutre'];
			expect(get(polarityFilters)).toEqual(['Neutre']);
		});

		it('can set subjectivities through filterState', () => {
			filterState.subjectivities = ['1', '5'];
			expect(get(subjectivityFilters)).toEqual(['1', '5']);
		});

		it('can set centralities through filterState', () => {
			filterState.centralities = ['Marginal'];
			expect(get(centralityFilters)).toEqual(['Marginal']);
		});
	});
});

// ============================================
// Filter Integration Tests
// ============================================

describe('Filter Integration', () => {
	it('filters work independently', () => {
		// Set different filters
		countryFilters.set(['Nigeria']);
		polarityFilters.set(['Positif', 'Négatif']);

		// Verify both are set correctly
		expect(get(countryFilters)).toEqual(['Nigeria']);
		expect(get(polarityFilters)).toEqual(['Positif', 'Négatif']);

		// Clear one, other should remain
		countryFilters.set([]);
		expect(get(countryFilters)).toEqual([]);
		expect(get(polarityFilters)).toEqual(['Positif', 'Négatif']);
	});

	it('clearAll does not affect discrepancy filters', () => {
		const customDiscrepancy: DiscrepancyFilter = {
			minDifference: 2,
			maxDifference: 4,
			dimensions: ['polarity'],
			excludeNonApplicable: false
		};

		discrepancyFilters.set(customDiscrepancy);
		countryFilters.set(['Nigeria']);

		filterState.clearAll();

		// Verify regular filters are cleared
		expect(get(countryFilters)).toEqual([]);

		// Discrepancy should remain
		expect(get(discrepancyFilters)).toEqual(customDiscrepancy);
	});
});
