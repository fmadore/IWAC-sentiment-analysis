<!--
  RangeSlider Component

  A dual-thumb min/max range slider with a highlighted track and tick labels.
  Accent colors are themable via CSS custom properties on the host:
  --range-accent (thumb border) and --range-accent-light (highlight),
  defaulting to the comparison palette.

  Usage:
  <RangeSlider
    min={0}
    max={5}
    lowValue={minDiff}
    highValue={maxDiff}
    onInput={(low, high) => { ... live preview ... }}
    onChange={(low, high) => { ... commit ... }}
  />
-->
<script lang="ts">
	import { t } from '#lib/i18n/index.js';

	interface RangeSliderProps {
		/** Minimum selectable value */
		min: number;
		/** Maximum selectable value */
		max: number;
		/** Step between values */
		step?: number;
		/** Current low (min) thumb value */
		lowValue: number;
		/** Current high (max) thumb value */
		highValue: number;
		/** Called when a thumb is released (commit) */
		onChange: (low: number, high: number) => void;
		/** Called while a thumb is dragged (live preview) */
		onInput?: (low: number, high: number) => void;
		/** Accessible label for the low thumb — must differ from the high one */
		lowAriaLabel?: string;
		/** Accessible label for the high thumb */
		highAriaLabel?: string;
		/** Whether to render tick labels under the track */
		showTickLabels?: boolean;
	}

	let {
		min,
		max,
		step = 1,
		lowValue,
		highValue,
		onChange,
		onInput,
		lowAriaLabel,
		highAriaLabel,
		showTickLabels = true
	}: RangeSliderProps = $props();

	// Writable deriveds: track prop changes (quick filters, reset, ...) but
	// can be overridden locally while a thumb is dragged.
	let low = $derived(lowValue);
	let high = $derived(highValue);

	let tickValues = $derived(
		Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)
	);

	function toPercent(value: number): number {
		return ((value - min) / (max - min)) * 100;
	}

	// The thumbs may meet but never cross: a low thumb dragged past the high
	// one used to report low > high, an empty range the filter then applied.
	// The input's own value is written back because `low`/`high` may not
	// change (already at the limit), in which case nothing re-renders it.
	function handleLowInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		low = Math.min(Number(input.value), high);
		input.value = String(low);
		onInput?.(low, high);
	}

	function handleHighInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		high = Math.max(Number(input.value), low);
		input.value = String(high);
		onInput?.(low, high);
	}
</script>

<div class="range-container">
	<div class="range-track"></div>
	<div
		class="range-highlight"
		style="left: {toPercent(low)}%; width: {toPercent(high) - toPercent(low)}%"
	></div>

	<input
		type="range"
		{min}
		{max}
		{step}
		value={low}
		oninput={handleLowInput}
		onchange={() => onChange(low, high)}
		class="range-slider range-min"
		aria-label={lowAriaLabel ?? $t.audit.rangeMinimum}
	/>
	<input
		type="range"
		{min}
		{max}
		{step}
		value={high}
		oninput={handleHighInput}
		onchange={() => onChange(low, high)}
		class="range-slider range-max"
		aria-label={highAriaLabel ?? $t.audit.rangeMaximum}
	/>

	{#if showTickLabels}
		<div class="range-labels">
			{#each tickValues as value (value)}
				<span class="range-label" style="left: {toPercent(value)}%">{value}</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.range-container {
		/* Component API — override on any ancestor to retint the track and
		   handles. Declared once here; it was previously repeated as the same
		   var() fallback at five separate use sites, so changing the default
		   meant finding all five. */
		--range-accent: var(--sentiment-comparison);
		--range-accent-light: var(--sentiment-comparison-light);

		position: relative;
		height: 60px;
		margin: 0 5px;
	}

	.range-track {
		position: absolute;
		top: 20px;
		left: 0;
		right: 0;
		height: 4px;
		background: var(--surface-subtle);
		border-radius: var(--space-0-5);
	}

	.range-highlight {
		position: absolute;
		top: 20px;
		height: 4px;
		background: var(--range-accent-light);
		border-radius: var(--space-0-5);
		transition:
			left var(--timing-fast) var(--easing-default),
			width var(--timing-fast) var(--easing-default);
	}

	.range-slider {
		position: absolute;
		top: 10px;
		width: 100%;
		height: 24px;
		background: transparent;
		pointer-events: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.range-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		border-radius: var(--radius-circle);
		background: var(--text-primary);
		border: 2px solid var(--range-accent);
		cursor: pointer;
		pointer-events: auto;
		box-shadow: var(--shadow-control-thumb);
		transition:
			transform var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
	}

	.range-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px color-mix(in oklab, var(--range-accent) 40%, transparent);
	}

	.range-slider::-moz-range-thumb {
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		border-radius: var(--radius-circle);
		background: var(--text-primary);
		border: 2px solid var(--range-accent);
		cursor: pointer;
		pointer-events: auto;
		box-shadow: var(--shadow-control-thumb);
		transition:
			transform var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
	}

	.range-slider::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px color-mix(in oklab, var(--range-accent) 40%, transparent);
	}

	/* Both inputs span the whole track, so an outline on the input could not
	   say which thumb has focus. The indicator goes on the thumb instead: a
	   solid amber ring (8.8:1 on the card) separated by a backdrop-coloured
	   gap. Forced-colors mode drops box-shadows, so there the input itself
	   takes the system outline. */
	.range-slider:focus-visible {
		outline: none;
	}

	.range-slider:focus-visible::-webkit-slider-thumb {
		box-shadow:
			0 0 0 2px var(--surface-card),
			0 0 0 4px var(--focus-outline-color);
	}

	.range-slider:focus-visible::-moz-range-thumb {
		box-shadow:
			0 0 0 2px var(--surface-card),
			0 0 0 4px var(--focus-outline-color);
	}

	@media (forced-colors: active) {
		.range-slider:focus-visible {
			outline: 2px solid Highlight;
			outline-offset: 2px;
		}
	}

	.range-min {
		z-index: 2;
	}

	.range-max {
		z-index: 1;
	}

	.range-labels {
		position: absolute;
		top: 40px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
	}

	.range-label {
		position: absolute;
		transform: translateX(-50%);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* Responsive */
	@media (min-width: 640px) {
		.range-container {
			margin: 0 var(--space-2-5);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.range-highlight,
		.range-slider::-webkit-slider-thumb,
		.range-slider::-moz-range-thumb {
			transition: none;
		}
	}
</style>
