/**
 * UI State Module
 * 
 * Manages UI-related state.
 * Uses writable stores for proper Svelte reactivity.
 */

import { writable, get } from 'svelte/store';

// ============================================
// UI Stores
// ============================================

/** Whether the sidebar is expanded */
export const sidebarExpanded = writable<boolean>(false);

/** Currently active view (charts, table, comparison, extremes) */
export const activeView = writable<string>('charts');

/** Whether mobile menu is open */
export const mobileMenuOpen = writable<boolean>(false);

// ============================================
// Loading State Stores
// ============================================

/** Whether a dataset is currently loading */
export const isLoadingDataset = writable<boolean>(false);

/** Whether extreme analysis is loading */
export const isLoadingExtremeAnalysis = writable<boolean>(false);

/** Whether comparison data is loading */
export const isLoadingComparison = writable<boolean>(false);

/** Whether arbiter data is loading */
export const isLoadingArbiter = writable<boolean>(false);

// ============================================
// Modern State Accessors (for gradual migration)
// ============================================

/**
 * UI state object with getters and setters.
 * Provides a more ergonomic API for new code.
 */
export const uiState = {
    // Sidebar
    get sidebarExpanded() {
        return get(sidebarExpanded);
    },
    setSidebarExpanded(value: boolean) {
        sidebarExpanded.set(value);
    },
    toggleSidebar() {
        sidebarExpanded.update((v) => !v);
    },

    // Active view
    get activeView() {
        return get(activeView);
    },
    setActiveView(value: string) {
        activeView.set(value);
    },

    // Mobile menu
    get mobileMenuOpen() {
        return get(mobileMenuOpen);
    },
    setMobileMenuOpen(value: boolean) {
        mobileMenuOpen.set(value);
    },
    toggleMobileMenu() {
        mobileMenuOpen.update((v) => !v);
    },

    // Loading states
    get isLoadingDataset() {
        return get(isLoadingDataset);
    },
    setIsLoadingDataset(value: boolean) {
        isLoadingDataset.set(value);
    },

    get isLoadingExtremeAnalysis() {
        return get(isLoadingExtremeAnalysis);
    },
    setIsLoadingExtremeAnalysis(value: boolean) {
        isLoadingExtremeAnalysis.set(value);
    },

    get isLoadingComparison() {
        return get(isLoadingComparison);
    },
    setIsLoadingComparison(value: boolean) {
        isLoadingComparison.set(value);
    },

    get isLoadingArbiter() {
        return get(isLoadingArbiter);
    },
    setIsLoadingArbiter(value: boolean) {
        isLoadingArbiter.set(value);
    },

    // Utility: Check if anything is loading
    get isLoading() {
        return (
            get(isLoadingDataset) ||
            get(isLoadingExtremeAnalysis) ||
            get(isLoadingComparison) ||
            get(isLoadingArbiter)
        );
    }
};
