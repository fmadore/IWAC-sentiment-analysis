/**
 * Shared pagination composable using Svelte 5 runes.
 * Used by: ArticleTable, ComparisonTable
 */

interface PaginationOptions {
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

	let currentPage = $state(1);
	let itemsPerPage = $state(initialItemsPerPage);

	const totalPages = $derived(Math.ceil(totalItems() / itemsPerPage));
	const startIndex = $derived((currentPage - 1) * itemsPerPage);
	const endIndex = $derived(Math.min(startIndex + itemsPerPage, totalItems()));

	// Reset to page 1 when total items changes (e.g. filter change)
	let previousTotal = $state<number | null>(null);
	$effect(() => {
		const current = totalItems();
		if (previousTotal !== null && previousTotal !== current) {
			currentPage = 1;
		}
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
			let start = Math.max(1, currentPage - half);
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
			currentPage = page;
			onPageChange?.();
		}
	}

	function previousPage() {
		if (currentPage > 1) {
			currentPage--;
			onPageChange?.();
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			onPageChange?.();
		}
	}

	function changeItemsPerPage(newItemsPerPage: number) {
		itemsPerPage = newItemsPerPage;
		currentPage = 1;
		onPageChange?.();
	}

	return {
		get currentPage() {
			return currentPage;
		},
		set currentPage(v: number) {
			currentPage = v;
		},
		get itemsPerPage() {
			return itemsPerPage;
		},
		set itemsPerPage(v: number) {
			itemsPerPage = v;
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
