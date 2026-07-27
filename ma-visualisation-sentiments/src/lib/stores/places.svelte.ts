/**
 * Places State Module
 *
 * Backs the map view: loads the geocoded place registry + the article→place
 * edge list, then aggregates sentiment per place over whatever the shared
 * filter rail currently selects.
 *
 * WHY THE AGGREGATION LIVES HERE AND NOT IN THE PAYLOAD: `iwac_places.json`
 * ships edges, not averages, so the map re-derives its numbers for the active
 * country / newspaper / date filters like every other view. Recomputing 40k
 * edges is trivial next to the fetch.
 *
 * WHAT A POINT MEANS: `dcterms:spatial` is item-level tagging — a place the
 * article *mentions*, not the place it is *about*. Articles average ~3.8
 * places each, so `count` sums well past the corpus size and the UI must say
 * "articles mentioning X". Anything stronger is unsupported by the data.
 */

import { base } from '$app/paths';
import type { Place, PlacesPayload } from '$lib/types/data';
import { aggregatePlaces, type PlaceAggregate } from '$lib/utils/placeAggregation';
// Leaf/data stores imported directly — importing from './index' would create a
// cycle (the barrel re-exports this module). Same convention as agreement.svelte.
import { articleState } from './articles.svelte';

export type { PlaceAggregate };

let _payload = $state<PlacesPayload | null>(null);
let _loading = $state(false);
let _error = $state<string | null>(null);

let payloadPromise: Promise<PlacesPayload> | null = null;

/**
 * Fetch the map payload once. Idempotent with in-flight dedup, and a rejection
 * is not cached so a transient failure can be retried — same contract as
 * `loadJustifications`.
 */
export async function loadPlaces(fetchFunction: typeof fetch = fetch): Promise<void> {
	if (_payload) return;

	if (!payloadPromise) {
		_loading = true;
		_error = null;
		payloadPromise = fetchFunction(`${base}/data/iwac_places.json`)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to fetch place data: ${response.statusText}`);
				}
				return response.json();
			})
			.then((data: unknown) => {
				const payload = data as PlacesPayload;
				if (!payload || !Array.isArray(payload.places) || !payload.articles) {
					throw new Error('Unrecognized place data format');
				}
				return payload;
			});
		payloadPromise.catch(() => {
			payloadPromise = null;
		});
	}

	try {
		_payload = await payloadPromise;
	} catch (error) {
		_error = error instanceof Error ? error.message : String(error);
	} finally {
		_loading = false;
	}
}

/**
 * Per-place aggregates over `articleState.filtered`.
 *
 * Empty until `loadPlaces` resolves; places with no article in the current
 * selection are dropped rather than drawn as zero-radius points.
 */
const _aggregates = $derived.by((): PlaceAggregate[] =>
	_payload ? aggregatePlaces(articleState.filtered, _payload) : []
);

export const placeState = {
	get loading() {
		return _loading;
	},
	get error() {
		return _error;
	},
	get loaded() {
		return _payload !== null;
	},
	/** Every geocoded place in the registry, regardless of the active filters. */
	get places(): Place[] {
		return _payload?.places ?? [];
	},
	/** Places with at least one article in the current filter selection. */
	get aggregates(): PlaceAggregate[] {
		return _aggregates;
	},
	/** Article-place pairs currently drawn — the sum of every bubble. */
	get totalMentions(): number {
		return _aggregates.reduce((sum, place) => sum + place.count, 0);
	}
};
