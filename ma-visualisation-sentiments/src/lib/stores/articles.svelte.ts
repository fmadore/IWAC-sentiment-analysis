import { scheduleSmartPrefetch, type PrefetchTask } from '$lib/data/prefetch';
/**
 * Articles State Module
 *
 * Manages article data, loading, and filtering using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { Article, DatasetId, LoadState } from '$lib/types/data';
import { datasetState } from './datasets.svelte';
import { filterState } from './filters.svelte';
import { uiState } from './ui.svelte';
import { filterArticles, computeAvailableJournals } from './derivations';
import { parseJustificationFile } from '$lib/data/validation';
import { fetchJSON, loadDatasetArticles, applyJustifications } from '$lib/data/articleRepository';
export {
	mapArticleProperties,
	joinArticles,
	applyJustifications,
	loadDatasetArticles
} from '$lib/data/articleRepository';
import {
	JUSTIFICATION_SHARD_COUNT,
	getPairModels,
	isDatasetId,
	justificationShard
} from '$lib/domain/sentimentContract';

// ============================================
// Svelte 5 Runes State
// ============================================

let _datasetArticles = $state<Record<string, Article[]>>({});
let _currentDatasetArticles = $state<Article[]>([]);
let _selectedArticle = $state<Article | null>(null);
const _loadStates = $state<Partial<Record<DatasetId, LoadState<Article[]>>>>({});
const _justificationErrors = $state<Partial<Record<DatasetId, Error>>>({});

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
	// In comparison mode the journals must come from the pair actually being
	// compared, not from a fixed pair of models.
	const articles = datasetState.isComparisonMode
		? getPairModels(datasetState.pair).flatMap((id: DatasetId) => _datasetArticles[id] || [])
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
 *
 * Plain Map, not SvelteMap: this is internal plumbing that is never rendered
 * and is read from inside `$effect`s. Svelte tracks reads transitively through
 * synchronous calls, so a reactive map would make every caller depend on it —
 * each set()/delete() would invalidate the effect that triggered it and the
 * effect would immediately call again. See extreme-analysis.svelte.ts, where
 * that loop was measured at 14 loader entries per page load.
 */
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- reactivity here causes an effect loop
const inFlightLoads = new Map<DatasetId, Promise<Article[]>>();
let foregroundLoadCount = 0;

// ============================================
// Data Loading Functions
// ============================================

/** True once a dataset's articles are in the store */
const isDatasetLoaded = (datasetId: DatasetId): boolean =>
	_loadStates[datasetId]?.status === 'ready';

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
	if (!isDatasetId(datasetId)) throw new Error(`Dataset ${datasetId} not found`);

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
		_loadStates[datasetId] = { status: 'loading' };
		load = loadDatasetArticles(dataset.file, datasetId, fetchFunction)
			.then((articles) => {
				articleState.updateDatasets(datasetId, articles);
				_loadStates[datasetId] = { status: 'ready', data: articles };
				return articles;
			})
			.catch((error: unknown) => {
				const normalizedError = error instanceof Error ? error : new Error(String(error));
				_loadStates[datasetId] = { status: 'error', error: normalizedError };
				throw normalizedError;
			})
			.finally(() => {
				inFlightLoads.delete(datasetId);
			});
		inFlightLoads.set(datasetId, load);
	}

	// Only show loading indicator for foreground loads, not background prefetch
	if (showLoading) {
		foregroundLoadCount++;
		uiState.isLoadingDataset = foregroundLoadCount > 0;
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
			foregroundLoadCount = Math.max(0, foregroundLoadCount - 1);
			uiState.isLoadingDataset = foregroundLoadCount > 0;
		}
	}
};

// ============================================
// Justifications (lazy)
// ============================================

/** Datasets whose prose has already been merged in. */
const justificationsLoaded = new SvelteSet<DatasetId>();
/** Shards already merged and one promise per shard currently being fetched. */
const loadedJustificationShards = new SvelteMap<DatasetId, SvelteSet<number>>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- internal plumbing read inside effects
const justificationLoads = new Map<string, Promise<void>>();

async function loadJustificationShard(
	datasetId: DatasetId,
	shard: number,
	fetchFunction: typeof fetch
): Promise<void> {
	const loaded = loadedJustificationShards.get(datasetId) ?? new SvelteSet<number>();
	loadedJustificationShards.set(datasetId, loaded);
	if (loaded.has(shard)) return;

	const key = `${datasetId}:${shard}`;
	const existing = justificationLoads.get(key);
	if (existing) return existing;

	const load = (async () => {
		const data = parseJustificationFile(
			await fetchJSON(
				`/data/iwac_justifications_${datasetId}_${shard.toString().padStart(2, '0')}.json`,
				fetchFunction
			),
			datasetId,
			shard
		);
		applyJustifications(_datasetArticles[datasetId] ?? [], data.justifications);
		loaded.add(shard);
	})().finally(() => justificationLoads.delete(key));

	justificationLoads.set(key, load);
	return load;
}

/**
 * Fetch and merge a model's justification prose.
 *
 * Idempotent and deduped: the detail modal, the comparison detail and the CSV
 * export can all ask at once and only one request goes out. Ensures the
 * dataset's articles are present first, since there is nothing to merge into
 * otherwise. Failures are logged and not cached, so a later open retries — the
 * app stays usable without prose (scores, charts and filters never need it).
 */
export const loadJustifications = async (
	datasetId: DatasetId,
	fetchFunction: typeof fetch = fetch,
	articleIds?: Array<string | number>
): Promise<void> => {
	if (justificationsLoaded.has(datasetId)) return;
	try {
		await loadSpecificDataset(datasetId, fetchFunction, { showLoading: false });
		const shards = articleIds
			? [...new SvelteSet(articleIds.map(justificationShard))]
			: Array.from({ length: JUSTIFICATION_SHARD_COUNT }, (_, index) => index);

		// A bounded batch avoids opening 32 HTTP connections for a CSV export.
		for (let start = 0; start < shards.length; start += 8) {
			await Promise.all(
				shards
					.slice(start, start + 8)
					.map((shard) => loadJustificationShard(datasetId, shard, fetchFunction))
			);
		}
		if (
			!articleIds &&
			(loadedJustificationShards.get(datasetId)?.size ?? 0) === JUSTIFICATION_SHARD_COUNT
		) {
			justificationsLoaded.add(datasetId);
		}
		delete _justificationErrors[datasetId];
	} catch (error) {
		_justificationErrors[datasetId] = error instanceof Error ? error : new Error(String(error));
		console.error(`Error fetching justifications for ${datasetId}:`, error);
		throw error;
	}
};

/** True once a dataset's justification prose has been merged in. */
export const hasJustifications = (datasetId: DatasetId): boolean =>
	justificationsLoaded.has(datasetId);

/** Load only the currently selected dataset (lazy loading) */
export const loadCurrentDataset = async (fetchFunction: typeof fetch): Promise<void> => {
	const currentDatasetId = datasetState.selected;

	await loadSpecificDataset(currentDatasetId, fetchFunction);

	prefetchOtherDatasets(currentDatasetId, fetchFunction);
};

// ============================================
// Smart Prefetching
// ============================================

const prefetchOtherDatasets = async (
	currentDatasetId: DatasetId,
	fetchFunction: typeof fetch
): Promise<void> => {
	// Only the active generation: the archived models are never compared against
	// the current ones, so prefetching them would be pure waste.
	const datasets = datasetState.availableInGeneration;
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
					_loadStates[dataset.id]?.status === 'error'
						? Promise.resolve()
						: loadSpecificDataset(dataset.id, fetchFunction, { showLoading: false })
			});
		});

	if (prefetchQueue.length === 0) {
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

	get loadStates() {
		return _loadStates;
	},
	get currentLoadState(): LoadState<Article[]> {
		return _loadStates[datasetState.selected] ?? { status: 'idle' };
	},
	get justificationErrors() {
		return _justificationErrors;
	},

	// Update datasets
	updateDatasets(datasetId: DatasetId, articles: Article[]) {
		_datasetArticles = { ..._datasetArticles, [datasetId]: articles };
	}
};
