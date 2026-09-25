/**
 * UI State Module
 *
 * Manages UI-related state using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { VIEW_IDS, type ViewId } from '$lib/types/data';

// ============================================
// Svelte 5 Runes State
// ============================================

let _sidebarExpanded = $state<boolean>(false);
let _activeView = $state<ViewId>('charts');
let _mobileMenuOpen = $state<boolean>(false);
let _filtersDrawerOpen = $state<boolean>(false);
// The one page-level spinner: a foreground dataset load. Optional payloads
// (extremes, map, arbiters) report their own per-resource state instead.
let _isLoadingDataset = $state<boolean>(false);

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

	// Active view. URL parsing validates strings before they reach this setter.
	get activeView(): ViewId {
		return _activeView;
	},
	set activeView(value: ViewId) {
		if (!VIEW_IDS.includes(value)) throw new Error(`Unknown view: ${value}`);
		_activeView = value;
	},

	// ------------------------------------------------------------------
	// Off-canvas drawers (< 1024px): the nav menu and the filter rail.
	//
	// They are mutually exclusive here rather than by convention at the call
	// sites. Both are fixed panels at calc(--z-overlay + 1) with their own
	// scrim, so opening one over the other stacked two scrims and left the
	// lower panel visible-but-dimmed underneath. Nothing prevented it before;
	// now opening either closes the other, in one place.
	// ------------------------------------------------------------------
	get mobileMenuOpen() {
		return _mobileMenuOpen;
	},
	set mobileMenuOpen(value: boolean) {
		_mobileMenuOpen = value;
		if (value) _filtersDrawerOpen = false;
	},
	toggleMobileMenu() {
		this.mobileMenuOpen = !_mobileMenuOpen;
	},

	get filtersDrawerOpen() {
		return _filtersDrawerOpen;
	},
	set filtersDrawerOpen(value: boolean) {
		_filtersDrawerOpen = value;
		if (value) _mobileMenuOpen = false;
	},
	toggleFiltersDrawer() {
		this.filtersDrawerOpen = !_filtersDrawerOpen;
	},

	// Loading states
	get isLoadingDataset() {
		return _isLoadingDataset;
	},
	set isLoadingDataset(value: boolean) {
		_isLoadingDataset = value;
	}
};
