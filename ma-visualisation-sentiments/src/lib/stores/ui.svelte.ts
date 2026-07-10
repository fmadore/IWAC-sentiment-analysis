/**
 * UI State Module
 *
 * Manages UI-related state using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import type { ViewId } from '$lib/types/data';

// ============================================
// Svelte 5 Runes State
// ============================================

let _sidebarExpanded = $state<boolean>(false);
let _activeView = $state<ViewId>('charts');
let _mobileMenuOpen = $state<boolean>(false);
let _filtersDrawerOpen = $state<boolean>(false);
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
	},
	toggleSidebar() {
		_sidebarExpanded = !_sidebarExpanded;
	},

	// Active view. Getter narrowed to the ViewId union; setter stays
	// permissive (string) so call sites holding plain strings keep compiling.
	get activeView(): ViewId {
		return _activeView;
	},
	set activeView(value: string) {
		_activeView = value as ViewId;
	},

	// Mobile menu
	get mobileMenuOpen() {
		return _mobileMenuOpen;
	},
	set mobileMenuOpen(value: boolean) {
		_mobileMenuOpen = value;
	},
	toggleMobileMenu() {
		_mobileMenuOpen = !_mobileMenuOpen;
	},

	// Mobile filters drawer (slide-out rail on < 1024px)
	get filtersDrawerOpen() {
		return _filtersDrawerOpen;
	},
	set filtersDrawerOpen(value: boolean) {
		_filtersDrawerOpen = value;
	},
	toggleFiltersDrawer() {
		_filtersDrawerOpen = !_filtersDrawerOpen;
	},

	// Loading states
	get isLoadingDataset() {
		return _isLoadingDataset;
	},
	set isLoadingDataset(value: boolean) {
		_isLoadingDataset = value;
	},

	get isLoadingExtremeAnalysis() {
		return _isLoadingExtremeAnalysis;
	},
	set isLoadingExtremeAnalysis(value: boolean) {
		_isLoadingExtremeAnalysis = value;
	},

	get isLoadingComparison() {
		return _isLoadingComparison;
	},
	set isLoadingComparison(value: boolean) {
		_isLoadingComparison = value;
	},

	get isLoadingArbiter() {
		return _isLoadingArbiter;
	},
	set isLoadingArbiter(value: boolean) {
		_isLoadingArbiter = value;
	},

	// Utility: Check if anything is loading
	get isLoading() {
		return (
			_isLoadingDataset || _isLoadingExtremeAnalysis || _isLoadingComparison || _isLoadingArbiter
		);
	}
};
