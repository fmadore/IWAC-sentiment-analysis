<!--
  SentimentMap Component

  Where the corpus talks about, and how it talks about it. One bubble per
  geocoded place: radius = how many of the currently filtered articles mention
  it, fill = their mean polarity.

  WORLD EXTENT, NOT WEST AFRICA. A quarter of the article-place pairs sit
  outside the region — La Mecque, Djeddah, Médine, Arabie saoudite, plus France
  and the Maghreb. That pilgrimage-and-diaspora axis is arguably the most
  interesting thing here, and a regional viewport would silently drop it.

  THE `svelte-maplibre-gl/vite` IMPORT IS LOAD-BEARING. MapLibre GL JS v6 is
  ESM-only and no longer bundles its own worker: it resolves one from
  `import.meta.url`, which no bundler's module graph can answer, so
  `setWorkerUrl()` must run before any map is constructed. That side-effect
  module is the Vite answer — it hands MapLibre the URL of a worker chunk built
  through Vite's own worker pipeline (`?worker&url`, NOT `?url`: the dist worker
  imports a sibling `maplibre-gl-shared.mjs`, and `?url` would emit it verbatim
  without that sibling, so it dies on its first import in production only).
  Drop the import and the failure is silent in the worst way: the map
  constructs, registers its sources and layers, raises no error — and paints
  nothing, because no GeoJSON source ever finishes parsing.

  It lives HERE, not in the root layout, because this component is itself the
  lazy chunk (see `ViewContent.svelte`) — registering the worker at app entry
  would drag the map's dependency into every other view's critical path.

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
	// Side effect only, and first on purpose: calls `setWorkerUrl()` with a
	// Vite-built worker chunk. See the header comment — without it v6 renders a
	// blank canvas and reports nothing.
	import 'svelte-maplibre-gl/vite';
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
	import { articleState, datasetState } from '$lib/stores';
	import { placeState, loadPlaces } from '$lib/stores/places.svelte';
	import type { MapDimension, PlaceAggregate } from '$lib/utils/placeAggregation';
	import { MAP_DIMENSIONS } from '$lib/utils/placeAggregation';
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

	/** Which dimension the bubble fill encodes. Size always means article count. */
	let dimension = $state<MapDimension>('polarity');

	const dimensionLabels = $derived<Record<MapDimension, string>>({
		polarity: $t.filters.polarity,
		subjectivity: $t.filters.subjectivity,
		centrality: $t.filters.centrality
	});

	onMount(() => {
		loadPlaces();
		fetch(`${base}/data/world-110m.geojson`)
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => (world = data))
			.catch(() => (world = null));
	});

	/**
	 * Switching model loads that model's payload if it isn't cached yet. Until
	 * it lands `articleState.filtered` is empty, which is indistinguishable from
	 * "no place matches your filters" — so gate on the dataset actually being
	 * present and show the spinner instead of flashing a wrong empty state.
	 */
	const modelReady = $derived((articleState.datasets[datasetState.selected]?.length ?? 0) > 0);

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
				// Only the ACTIVE dimension's mean is published, under a fixed
				// property name, so the paint expression never has to branch on
				// which dimension is showing. MapLibre expressions cannot branch on
				// null, so unscored places get the sentinel `circleColorExpression`
				// tests for explicitly.
				mean: place.stats[dimension].mean ?? UNSCORED_MEAN
			}
		}))
	});

	// Both scales come from `utils/mapScales.ts`, which also feeds MapLegend —
	// see that module for why they are not written inline here.
	const radiusExpression = $derived(circleRadiusExpression(maxCount));
	const colorExpression = $derived(circleColorExpression(dimension));

	function onPlaceClick(event: MapLayerMouseEvent) {
		const feature = event.features?.[0];
		if (!feature) return;
		const id = feature.properties?.id as number;
		selected = aggregates.find((place) => place.id === id) ?? null;
	}

	const popupPosition = $derived<LngLatLike | undefined>(
		selected ? [selected.lng, selected.lat] : undefined
	);

	/** Stats for the active dimension of the place in the popup. */
	const selectedStat = $derived(selected ? selected.stats[dimension] : null);

	function formatMean(mean: number | null): string {
		return mean === null ? '—' : mean.toFixed(2);
	}
</script>

<!--
	The dimension picker sits OUTSIDE the state branches on purpose. A filter
	that empties the map on one dimension can have results on another, so the
	control that recovers from an empty map must not be hidden by it.
-->
<div class="map-shell">
	<div class="dimension-tabs" role="tablist" aria-label={$t.agreement.dimensionSelector}>
		{#each MAP_DIMENSIONS as option (option)}
			<button
				role="tab"
				class="dimension-tab"
				data-active={dimension === option}
				aria-selected={dimension === option}
				onclick={() => (dimension = option)}
			>
				{dimensionLabels[option]}
			</button>
		{/each}
	</div>

	{#if placeState.error}
		<EmptyState title={$t.map.loadErrorTitle} lede={placeState.error} />
	{:else if !placeState.loaded || !world || !modelReady}
		<LoadingState />
	{:else if aggregates.length === 0}
		<EmptyState title={$t.map.noPlacesTitle} lede={$t.map.noPlacesLede} />
	{:else}
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
							<dt>{$t.map.meanOf.replace('{dimension}', dimensionLabels[dimension])}</dt>
							<dd>{formatMean(selectedStat?.mean ?? null)}</dd>
							<dt>{$t.map.scoredArticles}</dt>
							<dd>{(selectedStat?.scored ?? 0).toLocaleString()}</dd>
						</dl>
					</div>
				</Popup>
			{/if}
		</MapLibre>

		<MapLegend {maxCount} {dimension} label={dimensionLabels[dimension]} />

		<p class="map-caveat">{$t.map.caveat}</p>
	{/if}
</div>

<style>
	.map-shell {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* Same idiom as the agreement view's dimension tabs — same control, same look. */
	.dimension-tabs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.dimension-tab {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		padding: var(--space-2) var(--space-4);
		color: var(--text-muted);
		background: transparent;
		border: 1px solid var(--border-subtle);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.dimension-tab:hover:not([data-active='true']) {
		color: var(--text-primary);
		background: var(--surface-hover);
	}

	.dimension-tab[data-active='true'] {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: color-mix(in oklab, var(--accent) 40%, transparent);
	}

	.dimension-tab:focus-visible {
		outline: none;
		box-shadow: var(--ring-focus);
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

	/* --------------------------------------------------------------------------
	   MAPLIBRE CHROME. maplibre-gl.css ships a light-theme popup — `#fff`
	   content and a `#fff` tip — and the app's text tokens are near-white, so
	   the default popup renders pale text on white and is effectively
	   unreadable. The same goes for the zoom control: white group, `#333`
	   icons. Both live in MapLibre's own DOM, outside Svelte's scoping, so the
	   overrides go through `:global()` anchored on `.map-shell` (MapLibre
	   appends popups and controls inside the map container, which is a
	   descendant). Tokens match InfoTooltip so a map popup reads like every
	   other floating panel in the app.
	   -------------------------------------------------------------------------- */
	.map-shell {
		/* Aliased because the tip repeats it across six anchor rules. */
		--map-popup-bg: var(--surface-card-elevated);
	}

	.map-shell :global(.maplibregl-popup) {
		/* Overrides the 12px/20px Helvetica stack .maplibregl-map cascades in. */
		font-family: var(--font-sans);
		line-height: var(--line-height-normal);
	}

	.map-shell :global(.maplibregl-popup-content) {
		padding: var(--space-3) var(--space-4);
		color: var(--text-primary);
		background: var(--map-popup-bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-xl);
	}

	/* The tip is a CSS border triangle, so each anchor colours a different edge.
	   Repaint all six or the popup keeps a white spike on some placements. */
	.map-shell :global(.maplibregl-popup-anchor-top .maplibregl-popup-tip),
	.map-shell :global(.maplibregl-popup-anchor-top-left .maplibregl-popup-tip),
	.map-shell :global(.maplibregl-popup-anchor-top-right .maplibregl-popup-tip) {
		border-bottom-color: var(--map-popup-bg);
	}

	.map-shell :global(.maplibregl-popup-anchor-bottom .maplibregl-popup-tip),
	.map-shell :global(.maplibregl-popup-anchor-bottom-left .maplibregl-popup-tip),
	.map-shell :global(.maplibregl-popup-anchor-bottom-right .maplibregl-popup-tip) {
		border-top-color: var(--map-popup-bg);
	}

	.map-shell :global(.maplibregl-popup-anchor-left .maplibregl-popup-tip) {
		border-right-color: var(--map-popup-bg);
	}

	.map-shell :global(.maplibregl-popup-anchor-right .maplibregl-popup-tip) {
		border-left-color: var(--map-popup-bg);
	}

	.map-shell :global(.maplibregl-popup-close-button) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-icon-lg);
		height: var(--size-icon-lg);
		font-size: var(--font-size-base);
		line-height: 1;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.map-shell :global(.maplibregl-popup-close-button:hover) {
		color: var(--text-primary);
		background-color: var(--surface-hover);
	}

	.map-shell :global(.maplibregl-ctrl-group) {
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md);
	}

	.map-shell :global(.maplibregl-ctrl-group button) {
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.map-shell :global(.maplibregl-ctrl-group button + button) {
		border-top-color: var(--border-default);
	}

	.map-shell :global(.maplibregl-ctrl-group button:hover) {
		background-color: var(--surface-hover);
	}

	/* The +/- glyphs are `#333` inside a background-image data URI, so there is
	   no fill to restyle — inverting is the only way to lift them off a dark
	   button. */
	.map-shell :global(.maplibregl-ctrl-group button .maplibregl-ctrl-icon) {
		filter: invert(1);
		opacity: 0.75;
		transition: opacity var(--timing-fast) var(--easing-default);
	}

	.map-shell :global(.maplibregl-ctrl-group button:hover .maplibregl-ctrl-icon) {
		opacity: 1;
	}

	.place-popup {
		font-family: var(--font-sans);
		min-width: 180px;
	}

	.popup-title {
		font-family: var(--font-display);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		line-height: var(--line-height-snug);
		/* Clears the absolutely-positioned close button. */
		padding-right: var(--space-5);
		margin-bottom: var(--space-1);
	}

	.popup-count {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		padding-bottom: var(--space-2);
		margin-bottom: var(--space-2);
		border-bottom: 1px solid var(--border-subtle);
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
		font-weight: var(--font-weight-medium);
		text-align: right;
		color: var(--text-primary);
	}

	@media (prefers-reduced-motion: reduce) {
		.map-shell :global(.maplibregl-popup-close-button),
		.map-shell :global(.maplibregl-ctrl-group button),
		.map-shell :global(.maplibregl-ctrl-group button .maplibregl-ctrl-icon) {
			transition: none;
		}
	}
</style>
