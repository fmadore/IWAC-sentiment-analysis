/**
 * Dispatch `dataRequirements` to the loaders that satisfy them.
 *
 * Every loader here is idempotent and deduplicated in flight, so this is safe
 * to call on every change of what is on screen. Failures are already recorded
 * in each loader's own state — the dataset load states, or the resource states
 * behind extremes and the arbiters — which is what the views render; here they
 * are only logged.
 *
 * Call inside `untrack`: the loaders read reactive state synchronously, and the
 * caller's effect must depend on the requirements, not on the loaders' state.
 */

import { datasetIdsOf } from '$lib/domain/sentimentContract';
// Individual store files, never './index' — the barrel re-exports this module.
import { loadCurrentDataset, loadSpecificDataset } from './articles.svelte';
import { loadComparisonDatasets } from './comparison.svelte';
import { loadExtremeAnalysis } from './extreme-analysis.svelte';
import { loadArbiterEvaluations } from './arbiter.svelte';
import { loadArbiterV2Evaluations } from './arbiterV2.svelte';
import type { DataRequirement } from './dataRequirements';

function satisfy(requirement: DataRequirement, fetchFunction: typeof fetch): Promise<unknown> {
	switch (requirement.kind) {
		case 'dataset':
			return loadCurrentDataset(fetchFunction);
		case 'pair':
			return loadComparisonDatasets(fetchFunction);
		case 'panel':
			return Promise.all(
				datasetIdsOf(requirement.generation).map((id) =>
					loadSpecificDataset(id, fetchFunction, { showLoading: false })
				)
			);
		case 'extremes':
			return loadExtremeAnalysis(requirement.id, fetchFunction);
		case 'arbiter':
			return loadArbiterEvaluations(fetchFunction, requirement.pair);
		case 'arbiterPanel':
			return loadArbiterV2Evaluations(fetchFunction);
	}
}

export function ensureDataRequirements(
	requirements: readonly DataRequirement[],
	fetchFunction: typeof fetch
): void {
	for (const requirement of requirements) {
		satisfy(requirement, fetchFunction).catch((error) =>
			console.error(`Failed to load ${requirement.kind} data:`, error)
		);
	}
}
