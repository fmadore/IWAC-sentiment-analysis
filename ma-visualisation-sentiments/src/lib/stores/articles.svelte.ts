/**
 * Articles State Module
 *
 * Manages article data, loading, and filtering using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { writable, derived, get } from 'svelte/store';
import { SvelteSet } from 'svelte/reactivity';
import type { Article } from '$lib/types/data';
import { base } from '$app/paths';
import { getJournalName } from '$lib/utils';
import { selectedDataset, comparisonMode, availableDatasets } from './datasets.svelte';
import {
	countryFilters,
	journalFilters,
	polarityFilters,
	subjectivityFilters,
	centralityFilters
} from './filters.svelte';
import { isLoadingDataset } from './ui.svelte';

// ============================================
// Svelte 5 Runes State
// ============================================

let _datasetArticles = $state<Record<string, Article[]>>({});
let _currentDatasetArticles = $state<Article[]>([]);
let _selectedArticle = $state<Article | null>(null);

// ============================================
// Legacy Stores (for derived store compatibility)
// ============================================

/**
 * @deprecated Use articleState.datasets instead
 */
export const datasetArticles = writable<Record<string, Article[]>>({});

/**
 * @deprecated Use articleState.current instead
 */
export const currentDatasetArticles = writable<Article[]>([]);

/**
 * @deprecated Use articleState.selected instead
 */
export const selectedArticle = writable<Article | null>(null);

// Sync legacy stores to runes state
datasetArticles.subscribe((value) => {
	_datasetArticles = value;
});
currentDatasetArticles.subscribe((value) => {
	_currentDatasetArticles = value;
});
selectedArticle.subscribe((value) => {
	_selectedArticle = value;
});

// ============================================
// Derived Stores
// ============================================

/** Filtered articles based on all active filters */
export const filteredArticles = derived(
	[
		datasetArticles,
		selectedDataset,
		countryFilters,
		journalFilters,
		polarityFilters,
		subjectivityFilters,
		centralityFilters,
		comparisonMode
	],
	([
		$datasets,
		$currentDataset,
		$countries,
		$journals,
		$polarities,
		$subjectivities,
		$centralities,
		$isComparison
	]) => {
		// In comparison mode, we don't filter by dataset
		if ($isComparison) {
			return [];
		}

		const articles = $datasets[$currentDataset] || [];

		return articles.filter((article) => {
			// Filter by country (priority)
			if ($countries.length > 0 && !$countries.includes(article.Country || '')) {
				return false;
			}

			// Filter by journal (only from selected countries)
			if ($journals.length > 0) {
				const journalName = getJournalName(article);
				if (!$journals.includes(journalName)) {
					return false;
				}
			}

			// Filter by polarity
			if (
				$polarities.length > 0 &&
				!$polarities.includes(article.sentiment_analysis?.polarite || 'Non applicable')
			) {
				return false;
			}

			// Filter by subjectivity
			if ($subjectivities.length > 0) {
				const score = article.sentiment_analysis?.subjectivite_score;
				if (score === null || score === undefined) {
					return false;
				}
				if (!$subjectivities.includes(score.toString())) {
					return false;
				}
			}

			// Filter by centrality
			if (
				$centralities.length > 0 &&
				!$centralities.includes(
					article.sentiment_analysis?.centralite_islam_musulmans || 'Non abordé'
				)
			) {
				return false;
			}

			return true;
		});
	}
);

/** Available journals based on selected countries */
export const availableJournals = derived(
	[datasetArticles, selectedDataset, countryFilters, comparisonMode],
	([$datasets, $currentDataset, $countries, $isComparison]) => {
		const articles: Article[] = $isComparison
			? [...($datasets['chatgpt'] || []), ...($datasets['gemini'] || [])]
			: $datasets[$currentDataset] || [];

		let filteredArticles = articles;

		// If countries are selected, filter by country first
		if ($countries.length > 0) {
			filteredArticles = articles.filter((article) => $countries.includes(article.Country || ''));
		}

		// Extract unique journals
		return [
			...new SvelteSet(
				filteredArticles
					.map((article) => getJournalName(article))
					.filter((name): name is string => !!name)
			)
		].sort((a, b) => a.localeCompare(b));
	}
);

// ============================================
// Prefetch Tracking
// ============================================

const prefetchingInProgress = new SvelteSet<string>();
const prefetchCompleted = new SvelteSet<string>();

interface PrefetchTask {
	id: string;
	type: 'dataset' | 'extreme' | 'arbiter';
	priority: number;
	loader: () => Promise<void>;
}

// ============================================
// Data Loading Functions
// ============================================

/** Map article properties from different formats */
function mapArticleProperties(
	item: Record<string, unknown> & Partial<Article>,
	datasetId: string
): Article {
	return {
		'o:id': item['o:id'] as string | number,
		'o:title': item['o:title'] as string,
		journal_source:
			(item.journal_source as string) ||
			(item.Newspaper as string) ||
			((item as { display_title?: string }).display_title as string) ||
			'N/A',
		Newspaper: item.Newspaper as string,
		Country: item.Country as string,
		publication_date:
			(item.publication_date as string) ||
			((item as { 'dcterms:date'?: string })['dcterms:date'] as string) ||
			'N/A',
		sentiment_analysis: item.sentiment_analysis ?? null,
		dataset_id: datasetId,
		...item
	};
}

/** Load articles from a dataset file */
export const loadDatasetArticles = async (
	filePath: string,
	datasetId: string,
	fetchFunction: typeof fetch
): Promise<Article[]> => {
	try {
		const resolvedPath = filePath.startsWith('http') ? filePath : `${base}${filePath}`;
		const response = await fetchFunction(resolvedPath);

		if (!response.ok) {
			throw new Error(`Failed to fetch dataset: ${response.statusText}`);
		}

		const data = await response.json();

		if (Array.isArray(data)) {
			return data.map((item: Record<string, unknown>) => mapArticleProperties(item, datasetId));
		} else if (data.articles && Array.isArray(data.articles)) {
			return data.articles.map((item: Record<string, unknown>) =>
				mapArticleProperties(item, datasetId)
			);
		} else {
			console.error('Unrecognized data format:', data);
			return [];
		}
	} catch (error) {
		console.error(`Error fetching dataset ${datasetId}:`, error);
		return [];
	}
};

/** Load a specific dataset into the store */
export const loadSpecificDataset = async (
	datasetId: string,
	fetchFunction: typeof fetch,
	options: { showLoading?: boolean } = {}
): Promise<void> => {
	const { showLoading = true } = options;

	// Only show loading indicator for foreground loads, not background prefetch
	if (showLoading) {
		isLoadingDataset.set(true);
	}

	try {
		const datasets = get(availableDatasets);
		const dataset = datasets.find((d) => d.id === datasetId);

		if (!dataset) {
			throw new Error(`Dataset ${datasetId} not found`);
		}

		const articles = await loadDatasetArticles(dataset.file, datasetId, fetchFunction);

		datasetArticles.update((current) => ({
			...current,
			[datasetId]: articles
		}));

		// Update currentDatasetArticles if this is the selected dataset
		if (get(selectedDataset) === datasetId) {
			currentDatasetArticles.set(articles);
		}
	} finally {
		if (showLoading) {
			isLoadingDataset.set(false);
		}
	}
};

/** Load all available datasets */
export const loadAllDatasets = async (fetchFunction: typeof fetch): Promise<void> => {
	const datasets = get(availableDatasets);
	await Promise.all(datasets.map((dataset) => loadSpecificDataset(dataset.id, fetchFunction)));
};

/** Load only the currently selected dataset (lazy loading) */
export const loadCurrentDataset = async (fetchFunction: typeof fetch): Promise<void> => {
	const currentDatasetId = get(selectedDataset);
	const currentDatasets = get(datasetArticles);

	if (currentDatasets[currentDatasetId] && currentDatasets[currentDatasetId].length > 0) {
		currentDatasetArticles.set(currentDatasets[currentDatasetId]);
		prefetchOtherDatasets(currentDatasetId, fetchFunction);
		return;
	}

	await loadSpecificDataset(currentDatasetId, fetchFunction);

	const updatedDatasets = get(datasetArticles);
	currentDatasetArticles.set(updatedDatasets[currentDatasetId] || []);

	prefetchOtherDatasets(currentDatasetId, fetchFunction);
};

// ============================================
// Smart Prefetching
// ============================================

const scheduleSmartPrefetch = (queue: PrefetchTask[]): void => {
	if (queue.length === 0) return;

	const executeNext = async () => {
		const task = queue.shift();
		if (!task) return;

		const connection = (
			navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }
		).connection;
		if (connection) {
			if (
				connection.effectiveType === 'slow-2g' ||
				connection.effectiveType === '2g' ||
				connection.saveData
			) {
				console.log(`[Prefetch] Skipping ${task.id} - slow network or data saver enabled`);
				if (queue.length > 0) {
					scheduleSmartPrefetch(queue);
				}
				return;
			}
		}

		try {
			console.log(`[Prefetch] Loading: ${task.id}`);
			await task.loader();
			console.log(`[Prefetch] Completed: ${task.id}`);
		} catch (error) {
			console.warn(`[Prefetch] Failed: ${task.id}`, error);
		}

		if (queue.length > 0) {
			setTimeout(() => scheduleSmartPrefetch(queue), 150);
		} else {
			console.log('[Prefetch] All prefetching completed');
		}
	};

	if (typeof requestIdleCallback !== 'undefined') {
		requestIdleCallback(() => executeNext(), { timeout: 2000 });
	} else {
		setTimeout(executeNext, 500);
	}
};

const prefetchOtherDatasets = async (
	currentDatasetId: string,
	fetchFunction: typeof fetch
): Promise<void> => {
	const datasets = get(availableDatasets);
	const currentDatasets = get(datasetArticles);
	const prefetchQueue: PrefetchTask[] = [];

	// Priority 2: Other main datasets (for comparison mode)
	datasets
		.filter((dataset) => dataset.id !== currentDatasetId)
		.filter((dataset) => !currentDatasets[dataset.id] || currentDatasets[dataset.id].length === 0)
		.forEach((dataset) => {
			if (!prefetchingInProgress.has(dataset.id) && !prefetchCompleted.has(dataset.id)) {
				prefetchQueue.push({
					id: dataset.id,
					type: 'dataset',
					priority: 2,
					loader: async () => {
						prefetchingInProgress.add(dataset.id);
						try {
							// Use showLoading: false to prevent UI flashing during background prefetch
							await loadSpecificDataset(dataset.id, fetchFunction, { showLoading: false });
							prefetchCompleted.add(dataset.id);
						} finally {
							prefetchingInProgress.delete(dataset.id);
						}
					}
				});
			}
		});

	if (prefetchQueue.length === 0) {
		console.log('[Prefetch] All data already loaded');
		return;
	}

	prefetchQueue.sort((a, b) => a.priority - b.priority);
	console.log(
		`[Prefetch] Queue: ${prefetchQueue.map((t) => `${t.id}(P${t.priority})`).join(', ')}`
	);
	scheduleSmartPrefetch(prefetchQueue);
};

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * Article state object with reactive getters and setters.
 * Use this API for new code.
 *
 * @example
 * // Read state
 * const articles = articleState.datasets['chatgpt'];
 *
 * // Write state
 * articleState.selected = article;
 *
 * // Get filtered
 * const filtered = articleState.filtered;
 */
export const articleState = {
	// All dataset articles
	get datasets() {
		return _datasetArticles;
	},

	// Current dataset articles
	get current() {
		return _currentDatasetArticles;
	},
	set current(value: Article[]) {
		_currentDatasetArticles = value;
		currentDatasetArticles.set(value);
	},

	// Selected article
	get selected() {
		return _selectedArticle;
	},
	set selected(value: Article | null) {
		_selectedArticle = value;
		selectedArticle.set(value);
	},

	// Filtered articles (reads from derived store)
	get filtered() {
		return get(filteredArticles);
	},

	// Available journals (reads from derived store)
	get journals() {
		return get(availableJournals);
	},

	// Update datasets
	updateDatasets(datasetId: string, articles: Article[]) {
		_datasetArticles = { ..._datasetArticles, [datasetId]: articles };
		datasetArticles.set(_datasetArticles);
	}
};
