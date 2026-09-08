import type { DatasetId, LoadState, Article } from '$lib/types/data';

/** Resolve only the required models; unrelated prefetch must not gate a view. */
export function datasetReadiness(
	ids: readonly DatasetId[],
	states: Partial<Record<DatasetId, LoadState<Article[]>>>
) {
	const failed = ids.filter((id) => states[id]?.status === 'error');
	return { failed, ready: ids.every((id) => states[id]?.status === 'ready') };
}
