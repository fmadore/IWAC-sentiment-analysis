/**
 * Extreme Analysis State Module
 *
 * One keyword-analysis payload per model, loaded when the Extremes view needs
 * it. Loading, dedup and failure are the shared resource's (see
 * `$lib/data/resource.svelte.ts`): a failed load is an `error` the view shows
 * with a Retry action, never a `null` that reads as "still loading" forever.
 */

import type { ExtremeAnalysisData } from '$lib/types/extremeAnalysis';
import type { DatasetId } from '$lib/types/data';
import { loadExtremeAnalysisData, filterExtremeAnalysisData } from '$lib/utils/extremeAnalysis';
import { createResource, type ResourceState } from '$lib/data/resource.svelte';
import { datasetState } from './datasets.svelte';
import { filterState } from './filters.svelte';

/** Every model's payload is published, so a 404 is a failure here, not an absence. */
const extremeResource = createResource<DatasetId, ExtremeAnalysisData>((datasetId, fetchFunction) =>
	loadExtremeAnalysisData(datasetId, fetchFunction)
);

/** Current extreme analysis for the selected dataset */
const _currentExtremeAnalysisRune = $derived(extremeResource.data(datasetState.selected));

/** Filtered extreme analysis (respects country filters only) */
const _filteredExtremeAnalysisRune = $derived.by(() =>
	filterExtremeAnalysisData(_currentExtremeAnalysisRune, filterState.countries, [])
);

/** Load one model's payload. Idempotent; never retries a failure unasked. */
export const loadExtremeAnalysis = (
	datasetId: DatasetId,
	fetchFunction: typeof fetch = fetch
): Promise<void> => extremeResource.ensure(datasetId, fetchFunction);

/** Load the selected model's payload. */
export const loadCurrentExtremeAnalysis = (fetchFunction: typeof fetch = fetch): Promise<void> =>
	loadExtremeAnalysis(datasetState.selected, fetchFunction);

/** Load the selected model's payload again after a failure. */
export const retryCurrentExtremeAnalysis = (fetchFunction: typeof fetch = fetch): Promise<void> =>
	extremeResource.retry(datasetState.selected, fetchFunction);

export const extremeState = {
	/** Load state of the selected model's payload. */
	get loadState(): ResourceState<ExtremeAnalysisData> {
		return extremeResource.state(datasetState.selected);
	},

	/** The selected model's payload, or null until it is ready. */
	get current() {
		return _currentExtremeAnalysisRune;
	},

	/** The payload narrowed to the selected countries. */
	get filtered() {
		return _filteredExtremeAnalysisRune;
	}
};
