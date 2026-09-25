import { dataUrl } from '$lib/data/release';
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

import type { Place, PlacesPayload } from '$lib/types/data';
import type { FeatureCollection } from 'geojson';
import { aggregatePlaces, type PlaceAggregate } from '$lib/utils/placeAggregation';
import { parsePlacesPayload } from '$lib/data/validation';
import { createResource, type ResourceState } from '$lib/data/resource.svelte';
// Leaf/data stores imported directly — importing from './index' would create a
// cycle (the barrel re-exports this module). Same convention as agreement.svelte.
import { articleState } from './articles.svelte';

export type { PlaceAggregate };

async function fetchMapJSON(path: string, fetchFunction: typeof fetch): Promise<unknown> {
	const response = await fetchFunction(dataUrl(path));
	if (!response.ok) {
		throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

// Both files are always published, so a 404 is a failure here, not an absence.
const placesResource = createResource<'places', PlacesPayload>(async (_key, fetchFunction) =>
	parsePlacesPayload(await fetchMapJSON('/data/iwac_places.json', fetchFunction))
);
const basemapResource = createResource<'basemap', FeatureCollection>(
	async (_key, fetchFunction) =>
		(await fetchMapJSON('/data/world-110m.geojson', fetchFunction)) as FeatureCollection
);

/**
 * Fetch the map payload and the basemap. Idempotent with in-flight dedup; a
 * failure is reported through `placeState.loadState` and retried only on
 * request (`retryPlaces`). The basemap used to be fetched by the component with
 * its failure swallowed, which left the map on its loading state for good.
 */
export async function loadPlaces(fetchFunction: typeof fetch = fetch): Promise<void> {
	await Promise.all([
		placesResource.ensure('places', fetchFunction),
		basemapResource.ensure('basemap', fetchFunction)
	]);
}

/** Retry whichever of the two map files failed. */
export async function retryPlaces(fetchFunction: typeof fetch = fetch): Promise<void> {
	await Promise.all([
		placesResource.retry('places', fetchFunction),
		basemapResource.retry('basemap', fetchFunction)
	]);
}

/** The map's combined state: an error in either file wins, then loading. */
function combinedState(): ResourceState<true> {
	const states = [placesResource.state('places'), basemapResource.state('basemap')];
	const failed = states.find((state) => state.status === 'error');
	if (failed) return failed;
	if (states.every((state) => state.status === 'ready')) return { status: 'ready', data: true };
	return states.some((state) => state.status === 'loading')
		? { status: 'loading' }
		: { status: 'idle' };
}

const _payload = $derived(placesResource.data('places'));

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
	/** Both map files together: ready only when the payload and the basemap are. */
	get loadState(): ResourceState<true> {
		return combinedState();
	},
	get loaded() {
		return _payload !== null;
	},
	/** The Natural Earth basemap, or null until it is ready. */
	get world(): FeatureCollection | null {
		return basemapResource.data('basemap');
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
