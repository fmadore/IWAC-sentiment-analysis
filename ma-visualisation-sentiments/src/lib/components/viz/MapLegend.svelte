<!--
  MapLegend Component

  The map encodes two variables at once — bubble area for article count,
  bubble fill for mean polarity — so it needs both scales spelled out.

  Everything here is generated from `utils/mapScales.ts`, the same module that
  builds the MapLibre paint expressions. A legend that quietly disagrees with
  the map is worse than none, so the two cannot be edited apart.

  Unlike the map canvas, this is ordinary SVG in the DOM, so it can use the
  app.css custom properties directly; only the ramp swatches take the hex
  values, because those must match what WebGL actually painted.
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import type { MapDimension } from '$lib/utils/placeAggregation';
	import {
		DIMENSION_RAMPS,
		LABEL_GROUP,
		UNSCORED_COLOR,
		circleRadius,
		legendCountStops,
		MAX_RADIUS
	} from '$lib/utils/mapScales';

	interface MapLegendProps {
		/** Article count of the busiest place in the current selection. */
		maxCount: number;
		/** Which dimension the bubble fill encodes. */
		dimension: MapDimension;
		/** Translated name of that dimension, used as the colour block's title. */
		label: string;
	}

	let { maxCount, dimension, label }: MapLegendProps = $props();

	const ramp = $derived(DIMENSION_RAMPS[dimension]);

	/**
	 * Swatch labels live in whichever i18n group owns the dimension's scale
	 * (`sentiment` / `subjectivity` / `centrality`), so the legend reuses the
	 * same wording as the filter rail instead of inventing its own.
	 */
	const rampLabels = $derived(
		$t[LABEL_GROUP[dimension]] as unknown as Record<string, string | undefined>
	);

	const sizeStops = $derived(
		legendCountStops(maxCount).map((count) => ({ count, radius: circleRadius(count, maxCount) }))
	);

	const numberFormat = new Intl.NumberFormat();
</script>

<!-- The reserved height comes from the same constant the map sizes bubbles with. -->
<div class="map-legend" style:--map-legend-max-radius="{MAX_RADIUS}px">
	<div class="legend-block">
		<span class="legend-title">{$t.map.legendSizeTitle}</span>
		<ul class="size-scale">
			{#each sizeStops as stop (stop.count)}
				<li class="size-item">
					<svg
						class="size-swatch"
						width={stop.radius * 2}
						height={stop.radius * 2}
						viewBox="0 0 {stop.radius * 2} {stop.radius * 2}"
						aria-hidden="true"
					>
						<circle cx={stop.radius} cy={stop.radius} r={Math.max(stop.radius - 0.5, 0.5)} />
					</svg>
					<span class="size-label">{numberFormat.format(stop.count)}</span>
				</li>
			{/each}
		</ul>
	</div>

	<div class="legend-block">
		<span class="legend-title">{$t.map.legendColorTitle.replace('{dimension}', label)}</span>
		<ul class="ramp">
			{#each ramp as stop (stop.labelKey)}
				<li class="ramp-item">
					<span class="ramp-swatch" style:background-color={stop.color}></span>
					<span class="ramp-label">{rampLabels[stop.labelKey] ?? stop.labelKey}</span>
				</li>
			{/each}
			<li class="ramp-item ramp-item-unscored">
				<span class="ramp-swatch" style:background-color={UNSCORED_COLOR}></span>
				<span class="ramp-label">{$t.map.legendUnscored}</span>
			</li>
		</ul>
	</div>
</div>

<style>
	.map-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.legend-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
	}

	.legend-title {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* --- Size: circles share a baseline, so area comparison is direct -------- */
	.size-scale {
		display: flex;
		align-items: flex-end;
		gap: var(--space-4);
		/* Reserve the tallest circle's height so the row doesn't jump as filters
		   change the maximum. */
		min-height: calc(var(--map-legend-max-radius) * 2);
	}

	.size-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	.size-swatch {
		display: block;
		overflow: visible;
	}

	.size-swatch circle {
		fill: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		stroke: var(--border-strong);
		stroke-width: 1;
	}

	.size-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
	}

	/* --- Colour: discrete swatches, because the map steps the mean ---------- */
	.ramp {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
	}

	.ramp-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	/* The unscored grey is not part of the diverging ramp — separate it. */
	.ramp-item-unscored {
		margin-left: 0;
		padding-left: 0;
		border-left: none;
	}

	.ramp-swatch {
		width: var(--space-4);
		height: var(--space-4);
		flex-shrink: 0;
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 20%, transparent);
	}

	.ramp-label {
		font-family: var(--font-sans);
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		white-space: nowrap;
	}

	@media (min-width: 640px) {
		.map-legend {
			gap: var(--space-5) var(--space-8);
		}

		.ramp-item-unscored {
			margin-left: var(--space-2);
			padding-left: var(--space-4);
			border-left: 1px solid var(--border-subtle);
		}
	}
</style>
