<!--
  ChartHeading — the DOM title a chart renders for itself when no ChartCard
  header claimed it (a second chart in one card, or a chart outside any card).
  Same voice as ChartCard's header title, one step smaller.
-->
<script lang="ts">
	let {
		title,
		subtitle,
		level = 3
	}: { title: string; subtitle?: string; level?: 2 | 3 } = $props();
</script>

<div class="chart-heading-block">
	{#if level === 2}
		<h2 class="chart-heading">{title}</h2>
	{:else}
		<h3 class="chart-heading">{title}</h3>
	{/if}
	{#if subtitle}
		<p class="chart-heading-subtitle">{subtitle}</p>
	{/if}
</div>

<style>
	.chart-heading-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin: 0 0 var(--space-3);
	}

	.chart-heading {
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		font-weight: 600;
		line-height: var(--line-height-tight);
		letter-spacing: var(--tracking-snug);
		color: var(--text-primary);
		margin: 0;
	}

	.chart-heading-subtitle {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-snug);
		color: var(--text-muted);
		margin: 0;
	}
</style>
