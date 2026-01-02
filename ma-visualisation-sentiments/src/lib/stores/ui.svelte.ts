/**
 * UI State Module
 * 
 * Manages UI-related state using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { writable } from 'svelte/store';

// ============================================
// Svelte 5 Runes State
// ============================================

let _sidebarExpanded = $state<boolean>(false);
let _activeView = $state<string>('charts');
let _mobileMenuOpen = $state<boolean>(false);
let _isLoadingDataset = $state<boolean>(false);
let _isLoadingExtremeAnalysis = $state<boolean>(false);
let _isLoadingComparison = $state<boolean>(false);
let _isLoadingArbiter = $state<boolean>(false);

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * UI state object with reactive getters and setters.
 * Use this API for new code.
 * 
 * @example
 * // Read state
 * const view = uiState.activeView;
 * 
 * // Write state
 * uiState.activeView = 'table';
 * 
 * // Toggle
 * uiState.toggleSidebar();
 */
export const uiState = {
    // Sidebar
    get sidebarExpanded() {
        return _sidebarExpanded;
    },
    set sidebarExpanded(value: boolean) {
        _sidebarExpanded = value;
        sidebarExpanded.set(value);
    },
    toggleSidebar() {
        _sidebarExpanded = !_sidebarExpanded;
        sidebarExpanded.set(_sidebarExpanded);
    },

    // Active view
    get activeView() {
        return _activeView;
    },
    set activeView(value: string) {
        _activeView = value;
        activeView.set(value);
    },

    // Mobile menu
    get mobileMenuOpen() {
        return _mobileMenuOpen;
    },
    set mobileMenuOpen(value: boolean) {
        _mobileMenuOpen = value;
        mobileMenuOpen.set(value);
    },
    toggleMobileMenu() {
        _mobileMenuOpen = !_mobileMenuOpen;
        mobileMenuOpen.set(_mobileMenuOpen);
    },

    // Loading states
    get isLoadingDataset() {
        return _isLoadingDataset;
    },
    set isLoadingDataset(value: boolean) {
        _isLoadingDataset = value;
        isLoadingDataset.set(value);
    },

    get isLoadingExtremeAnalysis() {
        return _isLoadingExtremeAnalysis;
    },
    set isLoadingExtremeAnalysis(value: boolean) {
        _isLoadingExtremeAnalysis = value;
        isLoadingExtremeAnalysis.set(value);
    },

    get isLoadingComparison() {
        return _isLoadingComparison;
    },
    set isLoadingComparison(value: boolean) {
        _isLoadingComparison = value;
        isLoadingComparison.set(value);
    },

    get isLoadingArbiter() {
        return _isLoadingArbiter;
    },
    set isLoadingArbiter(value: boolean) {
        _isLoadingArbiter = value;
        isLoadingArbiter.set(value);
    },

    // Utility: Check if anything is loading
    get isLoading() {
        return (
            _isLoadingDataset ||
            _isLoadingExtremeAnalysis ||
            _isLoadingComparison ||
            _isLoadingArbiter
        );
    }
};

// ============================================
// Legacy Store Compatibility
// ============================================

/**
 * @deprecated Use uiState.sidebarExpanded instead
 */
export const sidebarExpanded = writable<boolean>(false);

/**
 * @deprecated Use uiState.activeView instead
 */
export const activeView = writable<string>('charts');

/**
 * @deprecated Use uiState.mobileMenuOpen instead
 */
export const mobileMenuOpen = writable<boolean>(false);

/**
 * @deprecated Use uiState.isLoadingDataset instead
 */
export const isLoadingDataset = writable<boolean>(false);

/**
 * @deprecated Use uiState.isLoadingExtremeAnalysis instead
 */
export const isLoadingExtremeAnalysis = writable<boolean>(false);

/**
 * @deprecated Use uiState.isLoadingComparison instead
 */
export const isLoadingComparison = writable<boolean>(false);

/**
 * @deprecated Use uiState.isLoadingArbiter instead
 */
export const isLoadingArbiter = writable<boolean>(false);

// Sync legacy stores to runes state
sidebarExpanded.subscribe(value => { _sidebarExpanded = value; });
activeView.subscribe(value => { _activeView = value; });
mobileMenuOpen.subscribe(value => { _mobileMenuOpen = value; });
isLoadingDataset.subscribe(value => { _isLoadingDataset = value; });
isLoadingExtremeAnalysis.subscribe(value => { _isLoadingExtremeAnalysis = value; });
isLoadingComparison.subscribe(value => { _isLoadingComparison = value; });
isLoadingArbiter.subscribe(value => { _isLoadingArbiter = value; });
