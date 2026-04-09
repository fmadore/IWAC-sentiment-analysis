<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ChartCardProps {
		/** Optional title for the card header */
		title?: string;
		/** Optional subtitle for the card header */
		subtitle?: string;
		/** Visual variant: default, large, extreme, arbiter, comparison, charts, trends, volume, heatmap, table, correlation */
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
	.chart-card {
		background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		border-radius: 1rem;
		box-shadow:
			0 4px 24px color-mix(in oklab, black 10%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
		overflow: hidden;
		transition: all var(--timing-normal) var(--easing-default);
	}

	.chart-card:hover {
		border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
		transform: translateY(-2px);
		box-shadow:
			0 8px 32px color-mix(in oklab, black 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	.chart-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.chart-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-surface-50);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.chart-subtitle {
		font-size: 0.8125rem;
		color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
		margin: 0;
	}

	.chart-card-body {
		padding: 1.25rem;
	}

	/* Large variant */
	.chart-card[data-variant='large'] {
		min-height: 500px;
	}

	.chart-card[data-variant='large'] .chart-card-header {
		padding: 1.25rem 1.5rem;
	}

	.chart-card[data-variant='large'] .chart-title {
		font-size: 1.25rem;
	}

	.chart-card[data-variant='large'] .chart-card-body {
		padding: 1.5rem;
	}

	/* Extreme variant - for the extreme analysis view */
	.chart-card[data-variant='extreme'] {
		position: relative;
		overflow: hidden;
		min-height: 600px;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-extreme) 4%, var(--color-surface-900))
		);
		border-color: var(--sentiment-extreme-border);
	}

	.chart-card[data-variant='extreme']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-extreme),
			var(--sentiment-extreme-light),
			var(--sentiment-extreme-accent)
		);
		opacity: 0.8;
	}

	.chart-card[data-variant='extreme'] .chart-card-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--sentiment-extreme) 15%, transparent);
	}

	.chart-card[data-variant='extreme'] .chart-title {
		font-size: 1.25rem;
		font-weight: 700;
		background: var(--gradient-extreme);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.chart-card[data-variant='extreme'] .chart-subtitle {
		font-size: 0.9375rem;
		max-width: 800px;
		line-height: 1.5;
	}

	.chart-card[data-variant='extreme'] .chart-card-body {
		padding: 1.5rem;
	}

	/* Arbiter variant - for the arbiter analysis view */
	.chart-card[data-variant='arbiter'] {
		position: relative;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-arbiter) 4%, var(--color-surface-900))
		);
		border-color: var(--sentiment-arbiter-border);
	}

	.chart-card[data-variant='arbiter']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-arbiter),
			var(--sentiment-arbiter-light),
			var(--sentiment-arbiter)
		);
		opacity: 0.8;
	}

	.chart-card[data-variant='arbiter'] .chart-card-header {
		padding: 1.25rem 1.5rem;
	}

	.chart-card[data-variant='arbiter'] .chart-title {
		font-size: 1.25rem;
		color: var(--sentiment-arbiter-light);
	}

	.chart-card[data-variant='arbiter'] .chart-card-body {
		padding: 1.5rem;
	}

	/* Comparison variant - for the comparison view */
	.chart-card[data-variant='comparison'] {
		position: relative;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-comparison) 4%, var(--color-surface-900))
		);
		border-color: var(--sentiment-comparison-border);
	}

	.chart-card[data-variant='comparison']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-comparison);
		opacity: 0.8;
	}

	.chart-card[data-variant='comparison'] .chart-card-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--sentiment-comparison) 15%, transparent);
	}

	.chart-card[data-variant='comparison'] .chart-title {
		font-size: 1.25rem;
		font-weight: 700;
		background: var(--gradient-comparison);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.chart-card[data-variant='comparison'] .chart-card-body {
		padding: 1.5rem;
	}

	/* Charts variant - for the distribution/charts view */
	.chart-card[data-variant='charts'] {
		position: relative;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-charts) 4%, var(--color-surface-900))
		);
		border-color: var(--sentiment-charts-border);
	}

	.chart-card[data-variant='charts']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-charts);
		opacity: 0.8;
	}

	.chart-card[data-variant='charts'] .chart-card-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--sentiment-charts) 15%, transparent);
	}

	.chart-card[data-variant='charts'] .chart-title {
		font-size: 1.25rem;
		font-weight: 600;
		background: var(--gradient-charts);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.chart-card[data-variant='charts'] .chart-card-body {
		padding: 1.5rem;
	}

	.chart-card[data-variant='charts']:hover {
		border-color: var(--sentiment-charts);
		box-shadow:
			0 8px 32px color-mix(in oklab, var(--sentiment-charts) 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	/* Trends variant - for the trends view */
	.chart-card[data-variant='trends'] {
		position: relative;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-trends) 4%, var(--color-surface-900))
		);
		border-color: var(--sentiment-trends-border);
	}

	.chart-card[data-variant='trends']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-trends);
		opacity: 0.8;
	}

	.chart-card[data-variant='trends'] .chart-card-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--sentiment-trends) 15%, transparent);
	}

	.chart-card[data-variant='trends'] .chart-title {
		font-size: 1.25rem;
		font-weight: 600;
		background: var(--gradient-trends);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.chart-card[data-variant='trends'] .chart-card-body {
		padding: 1.5rem;
	}

	.chart-card[data-variant='trends']:hover {
		border-color: var(--sentiment-trends);
		box-shadow:
			0 8px 32px color-mix(in oklab, var(--sentiment-trends) 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	/* Volume variant - for the volume view */
	.chart-card[data-variant='volume'] {
		position: relative;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-volume) 4%, var(--color-surface-900))
		);
		border-color: var(--sentiment-volume-border);
	}

	.chart-card[data-variant='volume']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-volume);
		opacity: 0.8;
	}

	.chart-card[data-variant='volume'] .chart-card-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--sentiment-volume) 15%, transparent);
	}

	.chart-card[data-variant='volume'] .chart-title {
		font-size: 1.25rem;
		font-weight: 600;
		background: var(--gradient-volume);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.chart-card[data-variant='volume'] .chart-card-body {
		padding: 1.5rem;
	}

	.chart-card[data-variant='volume']:hover {
		border-color: var(--sentiment-volume);
		box-shadow:
			0 8px 32px color-mix(in oklab, var(--sentiment-volume) 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	/* Heatmap variant - for the heatmap view */
	.chart-card[data-variant='heatmap'] {
		position: relative;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-heatmap) 4%, var(--color-surface-900))
		);
		border-color: var(--sentiment-heatmap-border);
	}

	.chart-card[data-variant='heatmap']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-heatmap);
		opacity: 0.8;
	}

	.chart-card[data-variant='heatmap'] .chart-card-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--sentiment-heatmap) 15%, transparent);
	}

	.chart-card[data-variant='heatmap'] .chart-title {
		font-size: 1.25rem;
		font-weight: 600;
		background: var(--gradient-heatmap);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.chart-card[data-variant='heatmap'] .chart-card-body {
		padding: 1.5rem;
	}

	.chart-card[data-variant='heatmap']:hover {
		border-color: var(--sentiment-heatmap);
		box-shadow:
			0 8px 32px color-mix(in oklab, var(--sentiment-heatmap) 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	/* Table variant - for the table view */
	.chart-card[data-variant='table'] {
		position: relative;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-table) 3%, var(--color-surface-900))
		);
		border-color: var(--sentiment-table-border);
	}

	.chart-card[data-variant='table']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-table);
		opacity: 0.6;
	}

	.chart-card[data-variant='table'] .chart-card-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--sentiment-table) 15%, transparent);
	}

	.chart-card[data-variant='table'] .chart-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-surface-50);
	}

	.chart-card[data-variant='table'] .chart-card-body {
		padding: 1.5rem;
	}

	.chart-card[data-variant='table']:hover {
		border-color: var(--sentiment-table);
		box-shadow:
			0 8px 32px color-mix(in oklab, var(--sentiment-table) 10%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	/* Correlation variant - for the distribution/correlation view */
	.chart-card[data-variant='correlation'] {
		position: relative;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-correlation) 4%, var(--color-surface-900))
		);
		border-color: var(--sentiment-correlation-border);
	}

	.chart-card[data-variant='correlation']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-correlation);
		opacity: 0.8;
	}

	.chart-card[data-variant='correlation'] .chart-card-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--sentiment-correlation) 15%, transparent);
	}

	.chart-card[data-variant='correlation'] .chart-title {
		font-size: 1.25rem;
		font-weight: 600;
		background: var(--gradient-correlation);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.chart-card[data-variant='correlation'] .chart-card-body {
		padding: 1.5rem;
	}

	.chart-card[data-variant='correlation']:hover {
		border-color: var(--sentiment-correlation);
		box-shadow:
			0 8px 32px color-mix(in oklab, var(--sentiment-correlation) 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.chart-card-header {
			padding: 0.75rem 1rem;
		}

		.chart-title {
			font-size: 1rem;
		}

		.chart-card-body {
			padding: 0.75rem;
		}

		.chart-card[data-variant='extreme'] .chart-card-header {
			padding: 1rem 1.25rem;
		}

		.chart-card[data-variant='extreme'] .chart-title {
			font-size: 1.125rem;
		}

		.chart-card[data-variant='extreme'] .chart-card-body {
			padding: 1rem;
		}

		.chart-card[data-variant='extreme'] {
			min-height: 450px;
		}
	}

	@media (min-width: 1024px) {
		.chart-card[data-variant='extreme'] {
			min-height: 700px;
		}

		.chart-card[data-variant='extreme'] .chart-title {
			font-size: 1.5rem;
		}

		.chart-card[data-variant='extreme'] .chart-card-body {
			padding: 2rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.chart-card {
			transition: none;
		}
	}
</style>
