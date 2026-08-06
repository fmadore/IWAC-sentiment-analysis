<!--
  ChartTypeToggle Component

  Segmented control for switching a chart between rendering types
  (bar/pie, stacked-area/line). Owns the shared toggle markup and styling
  that was previously copy-pasted into each chart component.
-->
<script lang="ts">
	import type { Component } from 'svelte';

	interface ChartTypeOption {
		value: string;
		/** Translated button label */
		label: string;
		/** Lucide icon component rendered before the label */
		icon: Component<{ size?: number | string }>;
	}

	interface ChartTypeToggleProps {
		options: ChartTypeOption[];
		/** Currently active option value */
		value: string;
		onChange: (value: string) => void;
		/** Accessible name for the toggle group (usually the chart title) */
		ariaLabel: string;
	}

	let { options, value, onChange, ariaLabel }: ChartTypeToggleProps = $props();
</script>

<div class="chart-type-toggle" role="group" aria-label={ariaLabel}>
	{#each options as option (option.value)}
		<button
			class="chart-type-btn"
			data-active={value === option.value}
			onclick={() => onChange(option.value)}
			aria-pressed={value === option.value}
		>
			<option.icon size={14} />
			<span>{option.label}</span>
		</button>
	{/each}
</div>

<style>
	.chart-type-toggle {
		display: inline-flex;
		gap: 1px;
		padding: 2px;
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	.chart-type-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-1-5) var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-muted);
		background: transparent;
		border: none;
		border-radius: var(--radius-hairline);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.chart-type-btn:hover:not([data-active='true']) {
		color: var(--text-primary);
		background: var(--surface-hover);
	}

	.chart-type-btn[data-active='true'] {
		color: var(--accent);
		background: var(--accent-soft);
	}
</style>
