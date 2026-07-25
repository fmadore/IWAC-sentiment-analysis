<script lang="ts">
	import { datasetState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';
	import GitCompareIcon from '@lucide/svelte/icons/git-compare';

	let currentDataset = $derived(datasetState.available.find((d) => d.id === datasetState.selected));

	interface Props {
		size?: 'sm' | 'md' | 'lg';
		showIcon?: boolean;
		showLabel?: boolean;
	}

	let { size = 'md', showIcon = true, showLabel = true }: Props = $props();

	// Size configurations
	const sizeClasses = {
		sm: 'text-xs px-2 py-1',
		md: 'text-sm px-3 py-1.5',
		lg: 'text-base px-4 py-2'
	};

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
	<div class="dataset-badge comparison-mode {sizeClasses[size]}">
		{#if showIcon}
			<GitCompareIcon size={iconSizes[size]} />
		{/if}
		{#if showLabel}
			<span class="badge-label">{$t.datasets?.comparisonMode || 'Comparison Mode'}</span>
		{/if}
	</div>
{:else if currentDataset}
	<div
		class="dataset-badge {sizeClasses[size]}"
		style="--dataset-color: {currentDataset.color || '#3B82F6'}"
	>
		{#if showIcon}
			{#if currentDataset.logo}
				<img
					src="{base}{currentDataset.logo}"
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
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		border-radius: var(--radius-sm);
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

	.badge-label {
		position: relative;
		z-index: 1;
		white-space: nowrap;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.dataset-badge {
			font-size: var(--font-size-xs);
		}

		.badge-label {
			display: none;
		}

		.dataset-badge.show-label-mobile .badge-label {
			display: inline;
		}
	}
</style>
