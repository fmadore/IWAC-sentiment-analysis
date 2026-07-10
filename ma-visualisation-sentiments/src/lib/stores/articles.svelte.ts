/**
 * Articles State Module
 *
 * Manages article data, loading, and filtering using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { SvelteMap } from 'svelte/reactivity';
import type { Article } from '$lib/types/data';
import { base } from '$app/paths';
import { datasetState } from './datasets.svelte';
import { filterState } from './filters.svelte';
import { uiState } from './ui.svelte';
import { filterArticles, computeAvailableJournals } from './derivations';

// ============================================
// Svelte 5 Runes State
// ============================================

let _datasetArticles = $state<Record<string, Article[]>>({});
let _currentDatasetArticles = $state<Article[]>([]);
let _selectedArticle = $state<Article | null>(null);

// ============================================
// Derived State (reactive runes)
// ============================================

/** Filtered articles based on all active filters */
const _filteredArticlesRune = $derived.by(() => {
	if (datasetState.isComparisonMode) {
		return [];
	}
	return filterArticles(_datasetArticles[datasetState.selected] || [], {
		countries: filterState.countries,
		journals: filterState.journals,
		polarities: filterState.polarities,
		subjectivities: filterState.subjectivities,
		centralities: filterState.centralities
	});
});

/** Available journals based on selected countries */
const _availableJournalsRune = $derived.by(() => {
	const articles = datasetState.isComparisonMode
		? [...(_datasetArticles['chatgpt'] || []), ...(_datasetArticles['gemini'] || [])]
		: _datasetArticles[datasetState.selected] || [];
	return computeAvailableJournals(articles, filterState.countries);
});

// ============================================
// In-flight Load Tracking
// ============================================

/**
 * One promise per dataset currently being fetched. Foreground loads,
 * comparison loads and background prefetch all go through this map, so a
 * dataset is never fetched twice concurrently (the old length-based checks
 * were check-then-act races between the effects in +page.svelte and the
 * prefetch queue). No AbortController: every dataset ends up cached for
 * comparison/prefetch anyway, so a load started for a dataset the user
 * switched away from is still useful — completion only touches
 * `articleState.current` when that dataset is still the selected one.
 */
const inFlightLoads = new SvelteMap<string, Promise<Article[]>>();

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
	// Spread first so the computed fallbacks below win over null/empty raw values
	return {
		...item,
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
		dataset_id: datasetId
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

/** True once a dataset's articles are in the store */
const isDatasetLoaded = (datasetId: string): boolean =>
	(_datasetArticles[datasetId]?.length ?? 0) > 0;

/**
 * Load a specific dataset into the store. Idempotent and race-free: an
 * already-loaded dataset resolves immediately, and concurrent callers of a
 * loading dataset await the same underlying fetch.
 */
export const loadSpecificDataset = async (
	datasetId: string,
	fetchFunction: typeof fetch,
	options: { showLoading?: boolean } = {}
): Promise<void> => {
	const { showLoading = true } = options;

	if (isDatasetLoaded(datasetId)) {
		if (datasetState.selected === datasetId) {
			articleState.current = _datasetArticles[datasetId];
		}
		return;
	}

	let load = inFlightLoads.get(datasetId);
	if (!load) {
		const dataset = datasetState.available.find((d) => d.id === datasetId);
		if (!dataset) {
			throw new Error(`Dataset ${datasetId} not found`);
		}
		load = loadDatasetArticles(dataset.file, datasetId, fetchFunction)
			.then((articles) => {
				articleState.updateDatasets(datasetId, articles);
				return articles;
			})
			.finally(() => {
				inFlightLoads.delete(datasetId);
			});
		inFlightLoads.set(datasetId, load);
	}

	// Only show loading indicator for foreground loads, not background prefetch
	if (showLoading) {
		uiState.isLoadingDataset = true;
	}

	try {
		const articles = await load;
		// Re-check the selection at completion time: if the user switched away
		// while this was in flight, don't clobber the visible dataset.
		if (datasetState.selected === datasetId) {
			articleState.current = articles;
		}
	} finally {
		if (showLoading) {
			uiState.isLoadingDataset = false;
		}
	}
};

/** Load all available datasets */
export const loadAllDatasets = async (fetchFunction: typeof fetch): Promise<void> => {
	await Promise.all(
		datasetState.available.map((dataset) => loadSpecificDataset(dataset.id, fetchFunction))
	);
};

/** Load only the currently selected dataset (lazy loading) */
export const loadCurrentDataset = async (fetchFunction: typeof fetch): Promise<void> => {
	const currentDatasetId = datasetState.selected;

	await loadSpecificDataset(currentDatasetId, fetchFunction);

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
	const datasets = datasetState.available;
	const prefetchQueue: PrefetchTask[] = [];

	// Priority 2: Other main datasets (for comparison mode). Dedup against
	// loaded data and in-flight loads happens inside loadSpecificDataset, so
	// the queue only needs a cheap pre-filter to avoid useless queue entries.
	datasets
		.filter((dataset) => dataset.id !== currentDatasetId)
		.filter((dataset) => !isDatasetLoaded(dataset.id) && !inFlightLoads.has(dataset.id))
		.forEach((dataset) => {
			prefetchQueue.push({
				id: dataset.id,
				type: 'dataset',
				priority: 2,
				loader: () =>
					// showLoading: false prevents UI flashing during background prefetch
					loadSpecificDataset(dataset.id, fetchFunction, { showLoading: false })
			});
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
	},

	// Selected article
	get selected() {
		return _selectedArticle;
	},
	set selected(value: Article | null) {
		_selectedArticle = value;
	},

	// Filtered articles (reactive runes-based derivation)
	get filtered() {
		return _filteredArticlesRune;
	},

	// Available journals (reactive runes-based derivation)
	get journals() {
		return _availableJournalsRune;
	},

	// Update datasets
	updateDatasets(datasetId: string, articles: Article[]) {
		_datasetArticles = { ..._datasetArticles, [datasetId]: articles };
	}
};
