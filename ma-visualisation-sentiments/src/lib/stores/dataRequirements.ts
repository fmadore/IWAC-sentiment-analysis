/**
 * What data the screen needs, as a pure function of what is on it.
 *
 * Loading used to be orchestrated by seven `$effect`s in `+page.svelte` plus
 * mount-time calls and pair-watching effect roots in three views, and their
 * comments recorded what that shape produced: doubled requests, load cascades,
 * and effects re-triggered by the very maps that deduplicated them. Now one
 * derived list of requirements feeds one effect, which hands it to
 * `ensureDataRequirements` — every loader behind it is idempotent and
 * deduplicated in flight, so re-running is cheap and never double-fetches.
 *
 * Two loads stay where they are on purpose: the map fetches its own payload so
 * the places store stays in the map's lazy chunk, and the comparison detail
 * asks for the rest of the panel only when an article with a panel verdict is
 * opened.
 */

import type { DatasetId, GenerationId, ModelPair, ViewId } from '$lib/types/data';

export type DataRequirement =
	/** The selected model's scores, in the foreground, then background prefetch. */
	| { kind: 'dataset'; id: DatasetId }
	/** Both members of a comparison pair. */
	| { kind: 'pair'; pair: ModelPair }
	/** Every model of a generation (agreement; the panel arbiter). */
	| { kind: 'panel'; generation: GenerationId }
	/** One model's extreme-keyword analysis. */
	| { kind: 'extremes'; id: DatasetId }
	/** A generation-1 pair's arbiter file. */
	| { kind: 'arbiter'; pair: ModelPair }
	/** The generation-2 panel arbiter file. */
	| { kind: 'arbiterPanel' };

export interface DataContext {
	view: ViewId;
	dataset: DatasetId;
	pair: ModelPair;
	comparisonMode: boolean;
	generation: GenerationId;
}

export function dataRequirements(context: DataContext): DataRequirement[] {
	const needs: DataRequirement[] = [{ kind: 'dataset', id: context.dataset }];

	if (context.comparisonMode) {
		needs.push({ kind: 'pair', pair: context.pair });
		// The comparison detail shows the arbiter's verdict: pairwise in the
		// archive, the panel's for generation 2.
		needs.push(
			context.generation === 'v1'
				? { kind: 'arbiter', pair: context.pair }
				: { kind: 'arbiterPanel' }
		);
	}

	if (context.view === 'agreement') {
		needs.push({ kind: 'panel', generation: context.generation });
	}
	if (context.view === 'extremes') {
		needs.push({ kind: 'extremes', id: context.dataset });
	}
	// The v1 arbiter view runs in comparison mode and is covered above; the
	// panel arbiter judges all five analyses, so it needs the whole panel.
	if (context.view === 'arbiter' && context.generation === 'v2') {
		needs.push({ kind: 'arbiterPanel' }, { kind: 'panel', generation: 'v2' });
	}

	return needs;
}
