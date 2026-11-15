<!--
  ShareBar

  One horizontal bar split into proportional segments, plus the words and
  numbers that say what each segment is. The arbiter views had three hand-rolled
  copies whose segments carried colour and a `title` attribute only, so a value
  was reachable by mouse hover and nothing else: no keyboard, no touch, no
  screen reader, and two hues that differ only in hue were indistinguishable.

  What this guarantees instead:

  - Every segment is named in a legend with its count and share, as text. The
    legend is the accessible representation; the bar itself is `aria-hidden`.
    With `legend="hidden"` the same list is still rendered, visually hidden, so
    assistive technology never loses it.
  - Segments wide enough to hold one carry a direct label (the count) on an
    opaque chip, legible whatever the segment's colour.
  - Colour is never the only cue: a segment can be `pattern: 'hatch'` (ties,
    "none"), and the legend repeats the label beside every swatch.

  Colours arrive from the caller — model colours from the dataset registry,
  sentiment colours from their tokens — as an inline custom property, never as
  a literal here.
-->
<script lang="ts" module>
	export interface ShareSegment {
		/** Stable key for the keyed each block. */
		key: string;
		/** What the segment is, in words. */
		label: string;
		count: number;
		/** Any CSS colour value; omitted for a neutral (patterned) segment. */
		color?: string;
		/** A hatch marks a segment that is not one of the named alternatives. */
		pattern?: 'solid' | 'hatch';
	}
</script>

<script lang="ts">
	import { num, pct } from '#lib/i18n/utils.js';

	interface ShareBarProps {
		segments: ShareSegment[];
		/** Denominator; defaults to the sum of the segments. */
		total?: number;
		/** Accessible name of the list, e.g. the dimension or the question. */
		label: string;
		/** `hidden` keeps the legend for assistive technology only. */
		legend?: 'visible' | 'hidden';
		/** Minimum share for a segment to carry its count inline. */
		directLabelMin?: number;
	}

	let {
		segments,
		total,
		label,
		legend = 'visible',
		directLabelMin = 0.1
	}: ShareBarProps = $props();

	const denominator = $derived(total ?? segments.reduce((sum, segment) => sum + segment.count, 0));
	const shown = $derived(segments.filter((segment) => segment.count > 0));

	function share(count: number): number {
		return denominator > 0 ? count / denominator : 0;
	}
</script>

<div class="share-bar">
	<div class="bar" aria-hidden="true">
		{#each shown as segment (segment.key)}
			<div
				class="segment"
				data-pattern={segment.pattern ?? 'solid'}
				style:--segment-color={segment.color}
				style:width="{share(segment.count) * 100}%"
			>
				{#if share(segment.count) >= directLabelMin}
					<span class="direct-label">{$num(segment.count)}</span>
				{/if}
			</div>
		{/each}
	</div>

	<ul class="legend" data-visibility={legend} aria-label={label}>
		{#each segments as segment (segment.key)}
			<li class="legend-item">
				<span
					class="swatch"
					data-pattern={segment.pattern ?? 'solid'}
					style:--segment-color={segment.color}
					aria-hidden="true"
				></span>
				<span class="legend-name">{segment.label}</span>
				<strong class="legend-value">{$num(segment.count)}</strong>
				<span class="legend-share">({$pct(share(segment.count), 1)})</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.share-bar {
		--segment-color: var(--surface-muted);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
	}

	.bar {
		display: flex;
		height: var(--size-icon-lg);
		background: var(--surface-muted);
		overflow: hidden;
	}

	.segment {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		height: 100%;
		background: var(--segment-color);
	}

	/* A hairline between neighbours, so two close hues still read as two. */
	.segment + .segment {
		border-left: 1px solid var(--surface-card);
	}

	.segment[data-pattern='hatch'],
	.swatch[data-pattern='hatch'] {
		background: repeating-linear-gradient(
			135deg,
			var(--surface-muted) 0 3px,
			var(--border-strong) 3px 5px
		);
	}

	.direct-label {
		padding: 0 var(--space-1);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-variant-numeric: tabular-nums;
		line-height: 1.4;
		color: var(--text-primary);
		background: var(--surface-card);
		white-space: nowrap;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* Visually hidden, still read: the bar is aria-hidden, so this list is the
	   only representation assistive technology gets. */
	.legend[data-visibility='hidden'] {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.swatch {
		width: var(--space-3);
		height: var(--space-3);
		flex-shrink: 0;
		background: var(--segment-color);
		border: 1px solid var(--border-default);
	}

	.legend-value {
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
	}

	.legend-share {
		font-variant-numeric: tabular-nums;
	}
</style>
