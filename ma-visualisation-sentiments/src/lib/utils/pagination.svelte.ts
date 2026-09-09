/**
 * Shared pagination composable using Svelte 5 runes.
 * Used by: ArticleTable, ComparisonTable
 */

interface PaginationOptions {
	state?: { currentPage: number; itemsPerPage: number };
	totalItems: () => number;
	initialItemsPerPage?: number;
	itemsPerPageOptions?: number[];
	maxVisiblePages?: number | (() => number);
	onPageChange?: () => void;
}

export interface PaginationState {
	currentPage: number;
	itemsPerPage: number;
	readonly itemsPerPageOptions: number[];
	readonly totalPages: number;
	readonly startIndex: number;
	readonly endIndex: number;
	readonly visiblePages: number[];
	goToPage: (page: number) => void;
	previousPage: () => void;
	nextPage: () => void;
	changeItemsPerPage: (newItemsPerPage: number) => void;
}

export function createPagination(options: PaginationOptions): PaginationState {
	const {
		totalItems,
		initialItemsPerPage = 50,
		itemsPerPageOptions = [25, 50, 100, 200],
		maxVisiblePages = 7,
		onPageChange
	} = options;

	const localState = $state({ currentPage: 1, itemsPerPage: initialItemsPerPage });
	const state = options.state ?? localState;

	const totalPages = $derived(Math.ceil(totalItems() / state.itemsPerPage));
	const startIndex = $derived((state.currentPage - 1) * state.itemsPerPage);
	const endIndex = $derived(Math.min(startIndex + state.itemsPerPage, totalItems()));

	// Reset to page 1 when total items changes (e.g. filter change)
	let previousTotal = $state<number | null>(null);
	$effect(() => {
		const current = totalItems();
		if (!options.state && previousTotal !== null && previousTotal !== current) {
			state.currentPage = 1;
		}
		if (current > 0 && state.currentPage > totalPages) state.currentPage = Math.max(1, totalPages);
		previousTotal = current;
	});

	const getMaxVisible =
		typeof maxVisiblePages === 'function' ? maxVisiblePages : () => maxVisiblePages;

	const visiblePages = $derived.by(() => {
		const pages: number[] = [];
		const max = getMaxVisible();
		if (totalPages <= max) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			const half = Math.floor(max / 2);
			let start = Math.max(1, state.currentPage - half);
			const end = Math.min(totalPages, start + max - 1);
			if (end - start + 1 < max) {
				start = Math.max(1, end - max + 1);
			}
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
		}
		return pages;
	});

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			state.currentPage = page;
			onPageChange?.();
		}
	}

	function previousPage() {
		if (state.currentPage > 1) {
			state.currentPage--;
			onPageChange?.();
		}
	}

	function nextPage() {
		if (state.currentPage < totalPages) {
			state.currentPage++;
			onPageChange?.();
		}
	}

	function changeItemsPerPage(newItemsPerPage: number) {
		state.itemsPerPage = newItemsPerPage;
		state.currentPage = 1;
		onPageChange?.();
	}

	return {
		get currentPage() {
			return state.currentPage;
		},
		set currentPage(v: number) {
			state.currentPage = v;
		},
		get itemsPerPage() {
			return state.itemsPerPage;
		},
		set itemsPerPage(v: number) {
			state.itemsPerPage = v;
		},
		itemsPerPageOptions,
		get totalPages() {
			return totalPages;
		},
		get startIndex() {
			return startIndex;
		},
		get endIndex() {
			return endIndex;
		},
		get visiblePages() {
			return visiblePages;
		},
		goToPage,
		previousPage,
		nextPage,
		changeItemsPerPage
	};
}
