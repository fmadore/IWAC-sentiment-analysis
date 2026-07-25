/**
 * Articles State Module
 *
 * Manages article data, loading, and filtering using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { SvelteSet } from 'svelte/reactivity';
import type { Article, SentimentAnalysis } from '$lib/types/data';
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
 *
 * Plain Map, not SvelteMap: this is internal plumbing that is never rendered
 * and is read from inside `$effect`s. Svelte tracks reads transitively through
 * synchronous calls, so a reactive map would make every caller depend on it —
 * each set()/delete() would invalidate the effect that triggered it and the
 * effect would immediately call again. See extreme-analysis.svelte.ts, where
 * that loop was measured at 14 loader entries per page load.
 */
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- reactivity here causes an effect loop
const inFlightLoads = new Map<string, Promise<Article[]>>();

interface PrefetchTask {
	id: string;
	type: 'dataset' | 'extreme' | 'arbiter';
	priority: number;
	loader: () => Promise<void>;
}

// ============================================
// Data Loading Functions
// ============================================

/** Map article properties from different formats (exported for tests) */
export function mapArticleProperties(
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

/**
 * Article base metadata is stored once in iwac_articles_base.json — the
 * per-model files carry only each model's sentiment analyses, keyed by
 * article id (the three old combined files repeated identical metadata).
 * The base file is fetched once and shared across all dataset loads.
 *
 * The per-model data is itself split in two. `iwac_sentiment_<model>.json`
 * holds only the three SCORES every chart, filter and aggregate reads (~59KB
 * gzipped); `iwac_justifications_<model>.json` holds the free-text prose that
 * only the detail views and CSV exports show (~1.4MB gzipped, 86-92% of the
 * old combined payload). Justifications load on demand — see
 * loadJustifications below.
 */
type BaseArticleRecord = Record<string, unknown> & Partial<Article>;

/** The three score fields carried by iwac_sentiment_<model>.json. */
type SentimentScores = Pick<
	SentimentAnalysis,
	'centralite_islam_musulmans' | 'subjectivite_score' | 'polarite'
>;

/** The three prose fields carried by iwac_justifications_<model>.json. */
type SentimentJustifications = Pick<
	SentimentAnalysis,
	'centralite_justification' | 'subjectivite_justification' | 'polarite_justification'
>;

interface SentimentFile {
	model: string;
	sentiments: Record<string, SentimentScores | null>;
}

interface JustificationFile {
	model: string;
	justifications: Record<string, SentimentJustifications | null>;
}

/**
 * Expand a score-only record into a full SentimentAnalysis with the
 * justification keys present but empty.
 *
 * Seeding the keys rather than leaving them absent keeps the shape stable for
 * every consumer (`article.sentiment_analysis.polarite_justification` reads
 * `null`, not `undefined`, before the prose arrives) and gives
 * loadJustifications plain property writes to make afterwards.
 */
function expandScores(scores: SentimentScores | null | undefined): SentimentAnalysis | null {
	if (!scores) return null;
	return {
		centralite_islam_musulmans: scores.centralite_islam_musulmans ?? null,
		centralite_justification: null,
		subjectivite_score: scores.subjectivite_score ?? null,
		subjectivite_justification: null,
		polarite: scores.polarite ?? null,
		polarite_justification: null
	};
}

let baseArticlesPromise: Promise<BaseArticleRecord[]> | null = null;

const fetchJSON = async (filePath: string, fetchFunction: typeof fetch): Promise<unknown> => {
	const resolvedPath = filePath.startsWith('http') ? filePath : `${base}${filePath}`;
	const response = await fetchFunction(resolvedPath);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
	}
	return response.json();
};

const loadArticleBase = (fetchFunction: typeof fetch): Promise<BaseArticleRecord[]> => {
	if (!baseArticlesPromise) {
		baseArticlesPromise = fetchJSON('/data/iwac_articles_base.json', fetchFunction).then((data) => {
			if (!Array.isArray(data)) {
				throw new Error('Unrecognized article base format');
			}
			return data as BaseArticleRecord[];
		});
		// Allow a retry on transient failure instead of caching the rejection
		baseArticlesPromise.catch(() => {
			baseArticlesPromise = null;
		});
	}
	return baseArticlesPromise;
};

/** Join base metadata with a model's score map (exported for tests) */
export function joinArticles(
	baseRecords: BaseArticleRecord[],
	sentiments: SentimentFile['sentiments'],
	datasetId: string
): Article[] {
	return baseRecords.map((record) =>
		mapArticleProperties(
			{ ...record, sentiment_analysis: expandScores(sentiments[String(record['o:id'])]) },
			datasetId
		)
	);
}

/**
 * Merge a model's justification prose into articles already in the store
 * (exported for tests).
 *
 * Writes the three prose fields onto the EXISTING `sentiment_analysis` objects
 * rather than rebuilding the array. Two reasons: Svelte 5's deep `$state`
 * proxies make these property writes wake exactly the components reading a
 * justification and nothing else — no re-filter, no chart redraw — and any
 * reference already captured elsewhere (the open detail modal, a selected
 * comparison row) sees the prose appear rather than pointing at a stale copy.
 */
export function applyJustifications(
	articles: Article[],
	justifications: JustificationFile['justifications']
): void {
	for (const article of articles) {
		const analysis = article.sentiment_analysis;
		if (!analysis) continue;

		const prose = justifications[String(article['o:id'])];
		if (!prose) continue;

		analysis.centralite_justification = prose.centralite_justification ?? null;
		analysis.subjectivite_justification = prose.subjectivite_justification ?? null;
		analysis.polarite_justification = prose.polarite_justification ?? null;
	}
}

/** Load articles for a dataset: shared base metadata + per-model sentiments */
export const loadDatasetArticles = async (
	filePath: string,
	datasetId: string,
	fetchFunction: typeof fetch
): Promise<Article[]> => {
	try {
		const [baseRecords, sentimentData] = await Promise.all([
			loadArticleBase(fetchFunction),
			fetchJSON(filePath, fetchFunction) as Promise<SentimentFile>
		]);

		if (!sentimentData || typeof sentimentData.sentiments !== 'object') {
			console.error('Unrecognized sentiment data format:', sentimentData);
			return [];
		}

		return joinArticles(baseRecords, sentimentData.sentiments, datasetId);
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

// ============================================
// Justifications (lazy)
// ============================================

/** Datasets whose prose has already been merged in. */
const justificationsLoaded = new SvelteSet<string>();
/** One promise per justification file currently being fetched. */
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- internal plumbing read inside effects
const justificationLoads = new Map<string, Promise<void>>();

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
	datasetId: string,
	fetchFunction: typeof fetch = fetch
): Promise<void> => {
	if (justificationsLoaded.has(datasetId)) return;

	const existing = justificationLoads.get(datasetId);
	if (existing) return existing;

	const load = (async () => {
		await loadSpecificDataset(datasetId, fetchFunction, { showLoading: false });

		const data = (await fetchJSON(
			`/data/iwac_justifications_${datasetId}.json`,
			fetchFunction
		)) as JustificationFile;

		if (!data || typeof data.justifications !== 'object') {
			throw new Error(`Unrecognized justification data format for ${datasetId}`);
		}

		applyJustifications(_datasetArticles[datasetId] ?? [], data.justifications);
		justificationsLoaded.add(datasetId);
	})()
		.catch((error) => {
			console.error(`Error fetching justifications for ${datasetId}:`, error);
		})
		.finally(() => {
			justificationLoads.delete(datasetId);
		});

	justificationLoads.set(datasetId, load);
	return load;
};

/** True once a dataset's justification prose has been merged in. */
export const hasJustifications = (datasetId: string): boolean =>
	justificationsLoaded.has(datasetId);

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
				// Respect the user's data-saver / slow-connection signal.
				if (queue.length > 0) {
					scheduleSmartPrefetch(queue);
				}
				return;
			}
		}

		try {
			await task.loader();
		} catch (error) {
			console.warn(`[Prefetch] Failed: ${task.id}`, error);
		}

		if (queue.length > 0) {
			setTimeout(() => scheduleSmartPrefetch(queue), 150);
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
