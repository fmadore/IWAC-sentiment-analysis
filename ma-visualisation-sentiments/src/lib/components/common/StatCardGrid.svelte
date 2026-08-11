<!--
  StatCardGrid Component

  The auto-fitting row of StatCards. Pairs with StatCard the way ChartCard pairs
  with a chart: the card owns one statistic, this owns how a set of them lays
  out, so a view never re-derives the track sizing.

  `minmax(230px, 1fr)` is the shared figure — narrow enough that four cards stay
  on one row on a laptop, wide enough that a kappa and its Landis & Koch band
  never wrap mid-word.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface StatCardGridProps {
		children: Snippet;
		/** Extra classes, typically a margin utility from the calling view. */
		class?: string;
	}

	let { children, class: className = '' }: StatCardGridProps = $props();
</script>

<div class="stat-card-grid {className}">
	{@render children()}
</div>

<style>
	.stat-card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-5);
	}
</style>
