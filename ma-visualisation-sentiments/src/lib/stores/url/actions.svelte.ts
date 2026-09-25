/** Complete URL snapshots and browser history synchronization. */
import { tick } from 'svelte';
import { chartInteractionsState } from '../chart-interactions.svelte';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { initializeLanguage } from '$lib/i18n';
import {
	CURRENT_GENERATION,
	defaultDatasetOf,
	defaultPairOf,
	generationOf,
	getPairModels,
	TOTAL_DISCREPANCY_MAXIMUM
} from '$lib/domain/sentimentContract';
import { analysisState, ANALYSIS_DIMENSIONS } from '../analysis.svelte';
import { uiState } from '../ui.svelte';
import { filterState } from '../filters.svelte';
import { datasetState } from '../datasets.svelte';
import { articleState } from '../articles.svelte';
import { comparisonState } from '../comparison.svelte';
import {
	arbiterSelectionState,
	viewOptionsState,
	defaultViewOptions
} from '../view-options.svelte';
import type { ValidView } from './constants';
import type { URLState } from './types';
import { parseURLState } from './parser.svelte';
import { buildURLSearchParams } from './builder.svelte';
import {
	pendingArticleState,
	pendingComparisonArticleState,
	getCurrentState
} from './state.svelte';

let restoring = false;
let restoration = 0;
let selectionContext = '';
let resultContext = '';
let detailContext = '';

function currentDetailContext(): string {
	return String(
		articleState.selected?.['o:id'] ??
			pendingArticleState.current?.articleId ??
			comparisonState.selected?.article['o:id'] ??
			pendingComparisonArticleState.current ??
			arbiterSelectionState.articleId ??
			''
	);
}
let scheduled = false;
let replacePending = true;

function currentSelectionContext(): string {
	return [uiState.activeView, datasetState.selected, datasetState.pair].join(':');
}

function currentResultContext(): string {
	return JSON.stringify([
		currentSelectionContext(),
		filterState.countries,
		filterState.journals,
		filterState.polarities,
		filterState.subjectivities,
		filterState.centralities,
		filterState.discrepancy
	]);
}

/** Detail objects belong to one model/view; do not carry stale analyses to another. */
export function reconcileSelectionContext(): void {
	const context = currentSelectionContext();
	if (selectionContext && context !== selectionContext) {
		articleState.selected = null;
		comparisonState.selected = null;
		arbiterSelectionState.articleId = null;
		pendingArticleState.clear();
		pendingComparisonArticleState.clear();
		viewOptionsState.prompt = false;
		viewOptionsState.scanPage = 1;
	}
	selectionContext = context;
	const results = currentResultContext();
	if (resultContext && results !== resultContext) {
		viewOptionsState.tablePage =
			viewOptionsState.comparisonPage =
			viewOptionsState.arbiterPage =
			viewOptionsState.panelPage =
				1;
	}
	resultContext = results;
	const detail = currentDetailContext();
	if (detail !== detailContext) {
		viewOptionsState.scanPage = 1;
		viewOptionsState.reasoning = false;
	}
	detailContext = detail;
}

export function applyURLState(state: URLState): ValidView | undefined {
	// Absent fields mean defaults, never the state left over from another history entry.
	filterState.countries = state.countries ?? [];
	filterState.journals = state.journals ?? [];
	filterState.polarities = state.polarities ?? [];
	filterState.subjectivities = state.subjectivities ?? [];
	filterState.centralities = state.centralities ?? [];
	datasetState.isComparisonMode = false;
	const pairView = state.view === 'comparison' || state.view === 'arbiter';
	// The explicit pair is authoritative on pair views, including conflicting legacy links.
	const dataset =
		pairView && state.pair
			? getPairModels(state.pair)[0]
			: (state.dataset ??
				(state.pair ? getPairModels(state.pair)[0] : defaultDatasetOf(CURRENT_GENERATION)));
	datasetState.selected = dataset;
	datasetState.pair =
		state.pair && generationOf(state.pair) === generationOf(dataset)
			? state.pair
			: defaultPairOf(generationOf(dataset));
	datasetState.isComparisonMode =
		state.view === 'comparison' || (state.view === 'arbiter' && generationOf(dataset) === 'v1');
	filterState.discrepancy = {
		minDifference: state.diffMin ?? 0,
		maxDifference: state.diffMax ?? TOTAL_DISCREPANCY_MAXIMUM,
		dimensions: state.dimensions ?? [...ANALYSIS_DIMENSIONS],
		excludeNonApplicable: state.excludeNA ?? true
	};
	analysisState.scope = state.scope ?? 'pair';
	analysisState.dimension = state.dimension ?? 'polarity';
	analysisState.includeDeclined = state.declined ?? false;
	articleState.selected = null;
	comparisonState.selected = null;
	pendingArticleState.clear();
	pendingComparisonArticleState.clear();
	uiState.activeView = state.view ?? 'charts';
	initializeLanguage(state.lang);
	Object.assign(viewOptionsState, defaultViewOptions(), state.options);
	chartInteractionsState[uiState.activeView] = state.chartState ?? {};
	arbiterSelectionState.articleId =
		state.view === 'arbiter' ? (state.arbiterArticleId ?? null) : null;
	if (state.articleId !== undefined && !pairView) {
		pendingArticleState.current = { articleId: state.articleId, dataset: datasetState.selected };
	}
	if (state.comparisonArticleId !== undefined && state.view === 'comparison') {
		pendingComparisonArticleState.current = state.comparisonArticleId;
	}
	selectionContext = currentSelectionContext();
	resultContext = currentResultContext();
	handlePendingArticleSelection();
	handlePendingComparisonArticleSelection();
	detailContext = currentDetailContext();
	return state.view;
}

/** Suppress feedback writes until the complete snapshot has propagated through effects. */
export async function restoreURLState(params: URLSearchParams): Promise<void> {
	const revision = ++restoration;
	restoring = true;
	try {
		applyURLState(parseURLState(params));
		await tick();
	} finally {
		if (revision === restoration) restoring = false;
	}
}

export function updateURL(currentView?: ValidView, replaceState = false): void {
	if (!browser) return;
	// Always read dependencies, including during restoration, to keep effects subscribed.
	const state = getCurrentState();
	if (currentView) state.view = currentView;
	void buildURLSearchParams(state);
	if (restoring) return;
	replacePending = replacePending && replaceState;
	if (scheduled) return;
	scheduled = true;
	queueMicrotask(() => {
		scheduled = false;
		const replace = replacePending;
		replacePending = true;
		if (restoring) return;
		const query = buildURLSearchParams(getCurrentState()).toString();
		if (window.location.search.slice(1) === query) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(resolve('/') + '?' + query + window.location.hash, {
			replaceState: replace,
			keepFocus: true,
			noScroll: true
		});
	});
}

export function initializeURLState(): ValidView | undefined {
	if (!browser) return;
	return applyURLState(parseURLState(page.url.searchParams));
}

export function clearAllFilters(): void {
	filterState.countries = [];
	filterState.journals = [];
	filterState.polarities = [];
	filterState.subjectivities = [];
	filterState.centralities = [];
	updateURL();
}

export function clearSelectedArticle(): void {
	articleState.selected = null;
	pendingArticleState.clear();
	updateURL();
}

export function clearSelectedArticleOnly(): void {
	articleState.selected = null;
}

/** Retain IDs through slow/failed loads. Missing IDs are disclosed by the view. */
export function handlePendingArticleSelection(): void {
	const pending = pendingArticleState.current;
	if (!pending || pending.dataset !== datasetState.selected) return;
	const article = articleState.datasets[datasetState.selected]?.find(
		(article) => String(article['o:id']) === String(pending.articleId)
	);
	if (article) {
		articleState.selected = article;
		pendingArticleState.clear();
	}
}

export function handlePendingComparisonArticleSelection(): void {
	const pending = pendingComparisonArticleState.current;
	if (pending === null || uiState.activeView !== 'comparison') return;
	const comparison = comparisonState.data.find(
		(item) => String(item.article['o:id']) === String(pending)
	);
	if (comparison) {
		comparisonState.selected = comparison;
		pendingComparisonArticleState.clear();
	}
}

export function clearSelectedComparison(): void {
	comparisonState.selected = null;
	pendingComparisonArticleState.clear();
	updateURL();
}
