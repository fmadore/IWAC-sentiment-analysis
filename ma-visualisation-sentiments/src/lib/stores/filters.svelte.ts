/**
 * Filter State Module
 *
 * Manages all filter-related state using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { writable } from 'svelte/store';
import type { DiscrepancyFilter } from '$lib/types/data';

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
	maxDifference: 5,
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
		countryFilters.set(value);
	},

	// Journal filters
	get journals() {
		return _journalFilters;
	},
	set journals(value: string[]) {
		_journalFilters = value;
		journalFilters.set(value);
	},

	// Polarity filters
	get polarities() {
		return _polarityFilters;
	},
	set polarities(value: string[]) {
		_polarityFilters = value;
		polarityFilters.set(value);
	},

	// Subjectivity filters
	get subjectivities() {
		return _subjectivityFilters;
	},
	set subjectivities(value: string[]) {
		_subjectivityFilters = value;
		subjectivityFilters.set(value);
	},

	// Centrality filters
	get centralities() {
		return _centralityFilters;
	},
	set centralities(value: string[]) {
		_centralityFilters = value;
		centralityFilters.set(value);
	},

	// Discrepancy filters
	get discrepancy() {
		return _discrepancyFilters;
	},
	set discrepancy(value: DiscrepancyFilter) {
		_discrepancyFilters = value;
		discrepancyFilters.set(value);
	},
	updateDiscrepancy(updates: Partial<DiscrepancyFilter>) {
		_discrepancyFilters = { ..._discrepancyFilters, ...updates };
		discrepancyFilters.set(_discrepancyFilters);
	},

	// Utility: Clear all filters
	clearAll() {
		_countryFilters = [];
		_journalFilters = [];
		_polarityFilters = [];
		_subjectivityFilters = [];
		_centralityFilters = [];
		countryFilters.set([]);
		journalFilters.set([]);
		polarityFilters.set([]);
		subjectivityFilters.set([]);
		centralityFilters.set([]);
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

// ============================================
// Legacy Store Compatibility
// ============================================

/**
 * @deprecated Use filterState.countries instead
 */
export const countryFilters = writable<string[]>([]);

/**
 * @deprecated Use filterState.journals instead
 */
export const journalFilters = writable<string[]>([]);

/**
 * @deprecated Use filterState.polarities instead
 */
export const polarityFilters = writable<string[]>([]);

/**
 * @deprecated Use filterState.subjectivities instead
 */
export const subjectivityFilters = writable<string[]>([]);

/**
 * @deprecated Use filterState.centralities instead
 */
export const centralityFilters = writable<string[]>([]);

/**
 * @deprecated Use filterState.discrepancy instead
 */
export const discrepancyFilters = writable<DiscrepancyFilter>({
	minDifference: 0,
	maxDifference: 5,
	dimensions: ['polarity', 'subjectivity', 'centrality'],
	excludeNonApplicable: true
});

// Sync legacy stores to runes state
countryFilters.subscribe((value) => {
	_countryFilters = value;
});
journalFilters.subscribe((value) => {
	_journalFilters = value;
});
polarityFilters.subscribe((value) => {
	_polarityFilters = value;
});
subjectivityFilters.subscribe((value) => {
	_subjectivityFilters = value;
});
centralityFilters.subscribe((value) => {
	_centralityFilters = value;
});
discrepancyFilters.subscribe((value) => {
	_discrepancyFilters = value;
});
