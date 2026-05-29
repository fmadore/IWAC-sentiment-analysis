/**
 * UI State Module
 *
 * Manages UI-related state using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

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
	},
	toggleSidebar() {
		_sidebarExpanded = !_sidebarExpanded;
	},

	// Active view
	get activeView() {
		return _activeView;
	},
	set activeView(value: string) {
		_activeView = value;
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
