/**
 * Filter State Module
 *
 * Manages all filter-related state using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import type { DiscrepancyFilter } from '$lib/types/data';
import { TOTAL_DISCREPANCY_MAXIMUM } from '$lib/domain/sentimentContract';

// ============================================
// Svelte 5 Runes State
// ============================================

let _countryFilters = $state<string[]>([]);
let _journalFilters = $state<string[]>([]);
let _polarityFilters = $state<string[]>([]);
let _subjectivityFilters = $state<string[]>([]);
let _centralityFilters = $state<string[]>([]);
let _discrepancyFilters = $state<DiscrepancyFilter>({
	minDifference: 0,
	maxDifference: TOTAL_DISCREPANCY_MAXIMUM,
	dimensions: ['polarity', 'subjectivity', 'centrality'],
	excludeNonApplicable: true
});

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * Filter state object with reactive getters and setters.
 * Use this API for new code.
 *
 * @example
 * // Read state
 * const countries = filterState.countries;
 *
 * // Write state
 * filterState.countries = ['France', 'Canada'];
 *
 * // Check if filters active
 * if (filterState.hasActiveFilters) { ... }
 */
export const filterState = {
	// Country filters
	get countries() {
		return _countryFilters;
	},
	set countries(value: string[]) {
		_countryFilters = value;
	},

	// Journal filters
	get journals() {
		return _journalFilters;
	},
	set journals(value: string[]) {
		_journalFilters = value;
	},

	// Polarity filters
	get polarities() {
		return _polarityFilters;
	},
	set polarities(value: string[]) {
		_polarityFilters = value;
	},

	// Subjectivity filters
	get subjectivities() {
		return _subjectivityFilters;
	},
	set subjectivities(value: string[]) {
		_subjectivityFilters = value;
	},

	// Centrality filters
	get centralities() {
		return _centralityFilters;
	},
	set centralities(value: string[]) {
		_centralityFilters = value;
	},

	// Discrepancy filters
	get discrepancy() {
		return _discrepancyFilters;
	},
	set discrepancy(value: DiscrepancyFilter) {
		_discrepancyFilters = value;
	},
	updateDiscrepancy(updates: Partial<DiscrepancyFilter>) {
		_discrepancyFilters = { ..._discrepancyFilters, ...updates };
	},

	// Utility: Clear all filters
	clearAll() {
		_countryFilters = [];
		_journalFilters = [];
		_polarityFilters = [];
		_subjectivityFilters = [];
		_centralityFilters = [];
	},

	/**
	 * How many filter values are selected across every dimension.
	 *
	 * Read by the header's Filters trigger below 1024px, where the rail is an
	 * off-canvas drawer: without it the only way to know whether anything is
	 * filtered is to open the drawer and look.
	 */
	get activeCount() {
		return (
			_countryFilters.length +
			_journalFilters.length +
			_polarityFilters.length +
			_subjectivityFilters.length +
			_centralityFilters.length
		);
	},

	// Utility: Check if any filters are active
	get hasActiveFilters() {
		return (
			_countryFilters.length > 0 ||
			_journalFilters.length > 0 ||
			_polarityFilters.length > 0 ||
			_subjectivityFilters.length > 0 ||
			_centralityFilters.length > 0
		);
	}
};
