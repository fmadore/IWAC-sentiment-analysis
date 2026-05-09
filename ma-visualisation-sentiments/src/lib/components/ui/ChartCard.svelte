<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ChartCardProps {
		/** Optional title for the card header */
		title?: string;
		/** Optional subtitle for the card header */
		subtitle?: string;
		/** Visual variant - drives the accent color tokens */
		variant?:
			| 'default'
			| 'large'
			| 'extreme'
			| 'arbiter'
			| 'comparison'
			| 'charts'
			| 'trends'
			| 'volume'
			| 'heatmap'
			| 'table'
			| 'correlation';
		/** Card content */
		children: Snippet;
		/** Custom header snippet (overrides title/subtitle) */
		header?: Snippet;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		title,
		subtitle,
		variant = 'default',
		children,
		header,
		class: className = ''
	}: ChartCardProps = $props();
</script>

<div class="chart-card {className}" data-variant={variant}>
	{#if title || header}
		<div class="chart-card-header">
			{#if header}
				{@render header()}
			{:else if title}
				<div class="header-content">
					<h2 class="chart-title">{title}</h2>
					{#if subtitle}
						<p class="chart-subtitle">{subtitle}</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	<div class="chart-card-body">
		{@render children()}
	</div>
</div>

<style>
	/* ChartCard — editorial dataviz container.
	   The chart inside IS the colour signal. The card is just a frame: opaque
	   surface, hairline border, hairline rule under the header. No accent
	   stripe, no per-variant gradient, no hover lift. The data-variant
	   attribute is preserved as a hook for chart components that want to read
	   it (e.g. for chart-internal accent colours), but it doesn't drive
	   visual chrome here. */

	.chart-card {
		position: relative;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--elevation-card);
		overflow: hidden;
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.chart-card:hover {
		border-color: var(--border-hover);
	}

	/* Header */
	.chart-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--border-subtle);
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}

	.chart-title {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--text-primary);
		line-height: var(--line-height-tight);
		letter-spacing: var(--tracking-snug);
		margin: 0;
	}

	.chart-subtitle {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		line-height: var(--line-height-snug);
		margin: 0;
	}

	.chart-card-body {
		padding: var(--space-5);
	}

	/* Size variants — only kept where they meaningfully change layout */
	.chart-card[data-variant='large'] {
		min-height: var(--height-chart-md);
	}
	.chart-card[data-variant='large'] .chart-card-header {
		padding: var(--space-5) var(--space-6);
	}
	.chart-card[data-variant='large'] .chart-title {
		font-size: var(--font-size-2xl);
	}
	.chart-card[data-variant='large'] .chart-card-body {
		padding: var(--space-6);
	}

	.chart-card[data-variant='extreme'] {
		min-height: var(--height-chart-lg);
	}
	.chart-card[data-variant='extreme'] .chart-card-header {
		padding: var(--space-5) var(--space-6);
	}
	.chart-card[data-variant='extreme'] .chart-card-body {
		padding: var(--space-6);
	}
	.chart-card[data-variant='extreme'] .chart-title {
		font-size: var(--font-size-2xl);
		font-weight: 700;
	}
	.chart-card[data-variant='extreme'] .chart-subtitle {
		font-size: var(--font-size-base);
		max-width: var(--prose-width);
		line-height: var(--line-height-normal);
	}

	.chart-card[data-variant='comparison'] .chart-card-header,
	.chart-card[data-variant='arbiter'] .chart-card-header {
		padding: var(--space-5) var(--space-6);
	}
	.chart-card[data-variant='comparison'] .chart-card-body,
	.chart-card[data-variant='arbiter'] .chart-card-body {
		padding: var(--space-6);
	}
	.chart-card[data-variant='comparison'] .chart-title,
	.chart-card[data-variant='arbiter'] .chart-title {
		font-size: var(--font-size-2xl);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.chart-card-header {
			padding: var(--space-3) var(--space-4);
		}
		.chart-title {
			font-size: var(--font-size-lg);
		}
		.chart-card-body {
			padding: var(--space-3);
		}
		.chart-card[data-variant='extreme'] {
			min-height: var(--height-chart-sm);
		}
		.chart-card[data-variant='extreme'] .chart-card-header {
			padding: var(--space-4) var(--space-5);
		}
		.chart-card[data-variant='extreme'] .chart-title {
			font-size: var(--font-size-xl);
		}
		.chart-card[data-variant='extreme'] .chart-card-body {
			padding: var(--space-4);
		}
	}

	@media (min-width: 1024px) {
		.chart-card[data-variant='extreme'] {
			min-height: var(--height-chart-xl);
		}
		.chart-card[data-variant='extreme'] .chart-title {
			font-size: var(--font-size-3xl);
		}
		.chart-card[data-variant='extreme'] .chart-card-body {
			padding: var(--space-8);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chart-card {
			transition: none;
		}
	}
</style>
