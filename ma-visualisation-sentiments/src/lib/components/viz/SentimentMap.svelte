<!--
  SentimentMap Component

  Where the corpus talks about, and how it talks about it. One bubble per
  geocoded place: radius = how many of the currently filtered articles mention
  it, fill = their mean polarity.

  WORLD EXTENT, NOT WEST AFRICA. A quarter of the article-place pairs sit
  outside the region — La Mecque, Djeddah, Médine, Arabie saoudite, plus France
  and the Maghreb. That pilgrimage-and-diaspora axis is arguably the most
  interesting thing here, and a regional viewport would silently drop it.

  NO TILE SERVER. MapLibre is pointed at a bundled Natural Earth GeoJSON rather
  than a hosted basemap: the app is a static PWA with no third-party runtime
  dependency, and country outlines are all 539 points need to be readable.
  `autoloadGlobalCss={false}` matters for the same reason — the wrapper
  otherwise pulls maplibre-gl.css off a CDN.

  COLOURS ARE HEX. MapLibre's colour parser, like ECharts' zrender, does not
  understand `oklch()` or `color-mix()`; both fall back to black. Everything
  chart-facing comes from `chartTheme.ts`, which holds the sRGB translations.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		MapLibre,
		GeoJSONSource,
		CircleLayer,
		FillLayer,
		LineLayer,
		BackgroundLayer,
		NavigationControl,
		Popup
	} from 'svelte-maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { LngLatLike, MapLayerMouseEvent } from 'maplibre-gl';
	import type { FeatureCollection } from 'geojson';
	import { placeState, loadPlaces } from '$lib/stores/places.svelte';
	import type { PlaceAggregate } from '$lib/utils/placeAggregation';
	import {
		circleColorExpression,
		circleRadiusExpression,
		UNSCORED_MEAN
	} from '$lib/utils/mapScales';
	import { t } from '$lib/i18n';
	import LoadingState from '$lib/components/common/LoadingState.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import MapLegend from './MapLegend.svelte';

	const PLACE_SOURCE = 'iwac-places';
	const WORLD_SOURCE = 'iwac-world';

	/** The whole inhabited world, minus the polar caps nothing is tagged in. */
	const WORLD_BOUNDS: [[number, number], [number, number]] = [
		[-130, -35],
		[150, 70]
	];

	let world = $state<FeatureCollection | null>(null);
	let selected = $state<PlaceAggregate | null>(null);

	onMount(() => {
		loadPlaces();
		fetch(`${base}/data/world-110m.geojson`)
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => (world = data))
			.catch(() => (world = null));
	});

	const aggregates = $derived(placeState.aggregates);

	/** Largest bubble in the current selection — the radius ramp is relative. */
	const maxCount = $derived(aggregates.length > 0 ? aggregates[0].count : 1);

	const points = $derived<FeatureCollection>({
		type: 'FeatureCollection',
		features: aggregates.map((place) => ({
			type: 'Feature' as const,
			id: place.id,
			geometry: { type: 'Point' as const, coordinates: [place.lng, place.lat] },
			properties: {
				id: place.id,
				title: place.title,
				count: place.count,
				// MapLibre expressions cannot branch on null, so unscored places get
				// a sentinel `circleColorExpression` tests for explicitly.
				meanPolarity: place.meanPolarity ?? UNSCORED_MEAN
			}
		}))
	});

	// Both scales come from `utils/mapScales.ts`, which also feeds MapLegend —
	// see that module for why they are not written inline here.
	const radiusExpression = $derived(circleRadiusExpression(maxCount));
	const colorExpression = circleColorExpression();

	function onPlaceClick(event: MapLayerMouseEvent) {
		const feature = event.features?.[0];
		if (!feature) return;
		const id = feature.properties?.id as number;
		selected = aggregates.find((place) => place.id === id) ?? null;
	}

	const popupPosition = $derived<LngLatLike | undefined>(
		selected ? [selected.lng, selected.lat] : undefined
	);

	function formatMean(place: PlaceAggregate): string {
		return place.meanPolarity === null ? '—' : place.meanPolarity.toFixed(2);
	}
</script>

{#if placeState.error}
	<EmptyState title={$t.map.loadErrorTitle} lede={placeState.error} />
{:else if !placeState.loaded || !world}
	<LoadingState />
{:else if aggregates.length === 0}
	<EmptyState title={$t.map.noPlacesTitle} lede={$t.map.noPlacesLede} />
{:else}
	<div class="map-shell">
		<MapLibre
			class="map-canvas"
			autoloadGlobalCss={false}
			attributionControl={false}
			bounds={WORLD_BOUNDS}
			maxZoom={9}
			minZoom={0.6}
			dragRotate={false}
			style={{ version: 8, sources: {}, layers: [] }}
		>
			<NavigationControl position="top-right" showCompass={false} />

			<BackgroundLayer paint={{ 'background-color': '#101720' }} />

			<GeoJSONSource id={WORLD_SOURCE} data={world}>
				<FillLayer paint={{ 'fill-color': '#1B2531' }} />
				<LineLayer paint={{ 'line-color': '#2C3644', 'line-width': 0.5 }} />
			</GeoJSONSource>

			<GeoJSONSource id={PLACE_SOURCE} data={points}>
				<CircleLayer
					paint={{
						'circle-radius': radiusExpression,
						'circle-color': colorExpression,
						'circle-opacity': 0.75,
						'circle-stroke-width': 1,
						'circle-stroke-color': '#0A0D12',
						'circle-stroke-opacity': 0.8
					}}
					onclick={onPlaceClick}
					onmouseenter={(e) => (e.target.getCanvas().style.cursor = 'pointer')}
					onmouseleave={(e) => (e.target.getCanvas().style.cursor = '')}
				/>
			</GeoJSONSource>

			{#if selected && popupPosition}
				<Popup lnglat={popupPosition} closeButton onclose={() => (selected = null)}>
					<div class="place-popup">
						<h3 class="popup-title">{selected.title}</h3>
						<p class="popup-count">
							{selected.count.toLocaleString()}
							{$t.map.articlesMentioning}
						</p>
						<dl class="popup-stats">
							<dt>{$t.map.meanPolarity}</dt>
							<dd>{formatMean(selected)}</dd>
							<dt>{$t.map.scoredArticles}</dt>
							<dd>{selected.scored.toLocaleString()}</dd>
						</dl>
					</div>
				</Popup>
			{/if}
		</MapLibre>

		<MapLegend {maxCount} />

		<p class="map-caveat">{$t.map.caveat}</p>
	</div>
{/if}

<style>
	.map-shell {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.map-shell :global(.map-canvas) {
		width: 100%;
		height: clamp(420px, 62vh, 720px);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.map-caveat {
		font-family: var(--font-sans);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
		max-width: var(--prose-width);
	}

	.place-popup {
		font-family: var(--font-sans);
		min-width: 180px;
	}

	.popup-title {
		font-family: var(--font-display);
		font-size: var(--font-size-base);
		font-weight: 600;
		margin-bottom: var(--space-1);
	}

	.popup-count {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		margin-bottom: var(--space-2);
	}

	.popup-stats {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-1) var(--space-3);
		font-size: var(--font-size-xs);
	}

	.popup-stats dt {
		color: var(--text-muted);
	}

	.popup-stats dd {
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
</style>
