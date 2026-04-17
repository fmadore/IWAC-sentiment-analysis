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
	/* =============================================================================
	   Variant color channels — each variant sets --accent and --accent-gradient
	   so the single rule block below can reuse them.
	   ============================================================================= */
	.chart-card[data-variant='default'] {
		--accent: transparent;
		--accent-soft: transparent;
		--accent-gradient: none;
		--accent-border: var(--border-subtle);
	}
	.chart-card[data-variant='large'] {
		--accent: transparent;
		--accent-soft: transparent;
		--accent-gradient: none;
		--accent-border: var(--border-subtle);
	}
	.chart-card[data-variant='extreme'] {
		--accent: var(--sentiment-extreme);
		--accent-soft: var(--sentiment-extreme-bg);
		--accent-gradient: var(--gradient-extreme);
		--accent-border: var(--sentiment-extreme-border);
	}
	.chart-card[data-variant='arbiter'] {
		--accent: var(--sentiment-arbiter);
		--accent-soft: var(--sentiment-arbiter-bg);
		--accent-gradient: linear-gradient(
			90deg,
			var(--sentiment-arbiter),
			var(--sentiment-arbiter-light),
			var(--sentiment-arbiter)
		);
		--accent-border: var(--sentiment-arbiter-border);
	}
	.chart-card[data-variant='comparison'] {
		--accent: var(--sentiment-comparison);
		--accent-soft: var(--sentiment-comparison-bg);
		--accent-gradient: var(--gradient-comparison);
		--accent-border: var(--sentiment-comparison-border);
	}
	.chart-card[data-variant='charts'] {
		--accent: var(--sentiment-charts);
		--accent-soft: var(--sentiment-charts-bg);
		--accent-gradient: var(--gradient-charts);
		--accent-border: var(--sentiment-charts-border);
	}
	.chart-card[data-variant='trends'] {
		--accent: var(--sentiment-trends);
		--accent-soft: var(--sentiment-trends-bg);
		--accent-gradient: var(--gradient-trends);
		--accent-border: var(--sentiment-trends-border);
	}
	.chart-card[data-variant='volume'] {
		--accent: var(--sentiment-volume);
		--accent-soft: var(--sentiment-volume-bg);
		--accent-gradient: var(--gradient-volume);
		--accent-border: var(--sentiment-volume-border);
	}
	.chart-card[data-variant='heatmap'] {
		--accent: var(--sentiment-heatmap);
		--accent-soft: var(--sentiment-heatmap-bg);
		--accent-gradient: var(--gradient-heatmap);
		--accent-border: var(--sentiment-heatmap-border);
	}
	.chart-card[data-variant='table'] {
		--accent: var(--sentiment-table);
		--accent-soft: var(--sentiment-table-bg);
		--accent-gradient: var(--gradient-table);
		--accent-border: var(--sentiment-table-border);
	}
	.chart-card[data-variant='correlation'] {
		--accent: var(--sentiment-correlation);
		--accent-soft: var(--sentiment-correlation-bg);
		--accent-gradient: var(--gradient-correlation);
		--accent-border: var(--sentiment-correlation-border);
	}

	/* =============================================================================
	   Base card surface
	   ============================================================================= */
	.chart-card {
		position: relative;
		background: var(--surface-card);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid var(--accent-border, var(--border-subtle));
		border-radius: var(--radius-2xl);
		box-shadow: var(--elevation-card);
		overflow: hidden;
		transition:
			border-color var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-normal) var(--easing-default),
			transform var(--timing-normal) var(--easing-default);
	}

	/* Accent top bar — only rendered for variants that have an accent gradient.
	   Kept slim (2px) and subtle for a calmer, more editorial feel. */
	.chart-card[data-variant]:not([data-variant='default']):not([data-variant='large'])::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--accent-gradient);
		opacity: 0.75;
	}

	.chart-card:hover {
		border-color: color-mix(
			in oklab,
			var(--accent, var(--color-surface-50)) 40%,
			var(--border-hover)
		);
		transform: translateY(-2px);
		box-shadow: var(--elevation-card-hover);
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

	.chart-card[data-variant]:not([data-variant='default']):not([data-variant='large'])
		.chart-card-header {
		border-bottom-color: color-mix(in oklab, var(--accent) 18%, var(--border-subtle));
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}

	.chart-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		line-height: var(--line-height-tight);
		letter-spacing: var(--tracking-snug);
		margin: 0;
	}

	.chart-subtitle {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		line-height: var(--line-height-snug);
		margin: 0;
	}

	.chart-card-body {
		padding: var(--space-5);
	}

	/* Large variant — more breathing room, no accent */
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

	/* Extreme variant — heroic size */
	.chart-card[data-variant='extreme'] {
		min-height: var(--height-chart-lg);
	}
	.chart-card[data-variant='extreme'] .chart-card-header,
	.chart-card[data-variant='extreme'] .chart-card-body {
		padding: var(--space-5) var(--space-6);
	}
	.chart-card[data-variant='extreme'] .chart-card-body {
		padding: var(--space-6);
	}
	.chart-card[data-variant='extreme'] .chart-title {
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
	}
	.chart-card[data-variant='extreme'] .chart-subtitle {
		font-size: var(--font-size-base);
		max-width: 56ch;
		line-height: var(--line-height-normal);
	}

	/* Accent-colored variants: keep title calm (solid color), only the top bar hints the hue */
	.chart-card[data-variant='arbiter'] .chart-title {
		color: var(--sentiment-arbiter-light);
	}
	.chart-card[data-variant='comparison'] .chart-card-header,
	.chart-card[data-variant='arbiter'] .chart-card-header {
		padding: var(--space-5) var(--space-6);
	}
	.chart-card[data-variant='comparison'] .chart-card-body,
	.chart-card[data-variant='arbiter'] .chart-card-body {
		padding: var(--space-6);
	}
	.chart-card[data-variant='comparison'] .chart-title {
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-semibold);
	}
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

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.chart-card {
			transition: none;
		}
		.chart-card:hover {
			transform: none;
		}
	}
</style>
