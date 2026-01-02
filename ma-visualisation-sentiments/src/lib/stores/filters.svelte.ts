/**
 * Filter State Module
 * 
 * Manages all filter-related state.
 * Uses writable stores for proper Svelte reactivity.
 */

import { writable, get } from 'svelte/store';
import type { DiscrepancyFilter } from '$lib/types/data';

// ============================================
// Filter Stores
// ============================================

/** Selected country filters */
export const countryFilters = writable<string[]>([]);

/** Selected journal filters */
export const journalFilters = writable<string[]>([]);

/** Selected polarity filters */
export const polarityFilters = writable<string[]>([]);

/** Selected subjectivity filters */
export const subjectivityFilters = writable<string[]>([]);

/** Selected centrality filters */
export const centralityFilters = writable<string[]>([]);

/** Discrepancy filter settings for comparison mode */
export const discrepancyFilters = writable<DiscrepancyFilter>({
    minDifference: 0,
    maxDifference: 5,
    dimensions: ['polarity', 'subjectivity', 'centrality'],
    excludeNonApplicable: true
});

// ============================================
// Modern State Accessors (for gradual migration)
// ============================================

/**
 * Filter state object with getters and setters.
 * Provides a more ergonomic API for new code.
 */
export const filterState = {
    // Country filters
    get countryFilters() {
        return get(countryFilters);
    },
    setCountryFilters(value: string[]) {
        countryFilters.set(value);
    },

    // Journal filters
    get journalFilters() {
        return get(journalFilters);
    },
    setJournalFilters(value: string[]) {
        journalFilters.set(value);
    },

    // Polarity filters
    get polarityFilters() {
        return get(polarityFilters);
    },
    setPolarityFilters(value: string[]) {
        polarityFilters.set(value);
    },

    // Subjectivity filters
    get subjectivityFilters() {
        return get(subjectivityFilters);
    },
    setSubjectivityFilters(value: string[]) {
        subjectivityFilters.set(value);
    },

    // Centrality filters
    get centralityFilters() {
        return get(centralityFilters);
    },
    setCentralityFilters(value: string[]) {
        centralityFilters.set(value);
    },

    // Discrepancy filters
    get discrepancyFilters() {
        return get(discrepancyFilters);
    },
    setDiscrepancyFilters(value: DiscrepancyFilter) {
        discrepancyFilters.set(value);
    },
    updateDiscrepancyFilters(updates: Partial<DiscrepancyFilter>) {
        discrepancyFilters.update((current) => ({ ...current, ...updates }));
    },

    // Utility: Clear all filters
    clearAll() {
        countryFilters.set([]);
        journalFilters.set([]);
        polarityFilters.set([]);
        subjectivityFilters.set([]);
        centralityFilters.set([]);
    },

    // Utility: Check if any filters are active
    get hasActiveFilters() {
        return (
            get(countryFilters).length > 0 ||
            get(journalFilters).length > 0 ||
            get(polarityFilters).length > 0 ||
            get(subjectivityFilters).length > 0 ||
            get(centralityFilters).length > 0
        );
    }
};
