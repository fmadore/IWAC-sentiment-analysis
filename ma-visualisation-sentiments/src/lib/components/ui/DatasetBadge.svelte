<script lang="ts">
	import { datasetState } from '#lib/stores/index.js';
	import { modelBrandColor } from '#lib/stores/datasets.svelte.js';
	import { t } from '#lib/i18n/index.js';
	import { asset } from '$app/paths';
	import GitCompareIcon from '@lucide/svelte/icons/git-compare';

	let currentDataset = $derived(datasetState.available.find((d) => d.id === datasetState.selected));

	interface Props {
		size?: 'sm' | 'md' | 'lg';
		showIcon?: boolean;
		showLabel?: boolean;
	}

	let { size = 'md', showIcon = true, showLabel = true }: Props = $props();

	const iconSizes = {
		sm: 14,
		md: 16,
		lg: 18
	};

	const logoSizes = {
		sm: 14,
		md: 16,
		lg: 20
	};
</script>

{#if datasetState.isComparisonMode}
	<div class="dataset-badge comparison-mode" data-size={size}>
		{#if showIcon}
			<GitCompareIcon size={iconSizes[size]} />
		{/if}
		{#if showLabel}
			<span class="badge-label">{$t.datasets.comparisonMode}</span>
		{/if}
	</div>
{:else if currentDataset}
	<!-- The badge is the logo's surround, so it carries the model's brand
	     colour; the series colour belongs to charts that plot several models. -->
	<div
		class="dataset-badge"
		data-size={size}
		style="--dataset-color: {modelBrandColor(currentDataset.id)}"
	>
		{#if showIcon}
			{#if currentDataset.logo}
				<img
					src={asset(currentDataset.logo)}
					alt="{currentDataset.name} logo"
					class="dataset-logo"
					style="width: {logoSizes[size]}px; height: {logoSizes[size]}px;"
				/>
			{:else if currentDataset.icon}
				<span class="dataset-icon" style="font-size: {iconSizes[size]}px">
					{currentDataset.icon}
				</span>
			{/if}
		{/if}
		{#if showLabel}
			<span class="badge-label">{currentDataset.name}</span>
		{/if}
	</div>
{/if}

<style>
	.dataset-badge {
		/* Default accent for a dataset whose registry entry carries no colour.
		   The inline style overrides it when one is present — previously the
		   fallback was a raw blue hex interpolated in the markup, which put a
		   colour decision outside the token layer and outside this file. */
		--dataset-color: var(--status-info);
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		border-radius: var(--radius-hairline);
		font-weight: var(--font-weight-medium);
		background: var(--surface-subtle);
		border: 1px solid var(--border-hover);
		color: var(--text-primary);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			transform var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
		position: relative;
		overflow: hidden;
	}

	.dataset-badge[data-size='sm'] {
		font-size: var(--font-size-xs);
		padding: var(--space-1) var(--space-2);
	}

	.dataset-badge[data-size='md'] {
		font-size: var(--font-size-sm);
		padding: var(--space-1-5) var(--space-3);
	}

	.dataset-badge[data-size='lg'] {
		font-size: var(--font-size-base);
		padding: var(--space-2) var(--space-4);
	}

	/* The brand colour as a hairline beside the logo, never on the text. */
	.dataset-badge:not(.comparison-mode) {
		border-left: 2px solid var(--dataset-color);
	}

	.dataset-badge:hover {
		border-color: var(--border-active);
	}

	.comparison-mode {
		--dataset-color: var(--color-secondary-500);
		background: color-mix(in oklab, var(--color-secondary-500) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-secondary-500) 30%, transparent);
	}

	.comparison-mode:hover {
		background: color-mix(in oklab, var(--color-secondary-500) 20%, transparent);
		border-color: color-mix(in oklab, var(--color-secondary-500) 40%, transparent);
	}

	.dataset-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 1;
	}

	.dataset-logo {
		object-fit: contain;
		flex-shrink: 0;
		position: relative;
		z-index: 1;
	}

	/* Icon-plus-value until there is room for the label. */
	.badge-label {
		position: relative;
		z-index: 1;
		white-space: nowrap;
		display: none;
	}

	@media (min-width: 640px) {
		.badge-label {
			display: inline;
		}
	}
</style>
