<script lang="ts">
	import FilterXIcon from '@lucide/svelte/icons/filter-x';
	import { clearAllFilters } from '$lib/urlState';
	import {
		countryFilters,
		journalFilters,
		polarityFilters,
		subjectivityFilters,
		centralityFilters
	} from '$lib/stores';
	import { t } from '$lib/i18n';

	// Track if we have any active filters
	let hasActiveFilters = $derived(
		$countryFilters.length > 0 ||
			$journalFilters.length > 0 ||
			$polarityFilters.length > 0 ||
			$subjectivityFilters.length > 0 ||
			$centralityFilters.length > 0
	);

	function handleClearFilters() {
		clearAllFilters();
	}
</script>

{#if hasActiveFilters}
	<div class="clear-filters-container">
		<button
			class="clear-filters-btn"
			onclick={handleClearFilters}
			title={$t.filters.clearAllFilters}
		>
			<FilterXIcon size={16} />
			<span class="button-text">{$t.filters.clearAllFilters}</span>
		</button>
	</div>
{/if}

<style>
	.clear-filters-container {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-4);
	}

	@media (min-width: 640px) {
		.clear-filters-container {
			margin-bottom: var(--space-6);
		}
	}

	.clear-filters-btn {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-error-500) 15%, transparent),
			color-mix(in oklab, var(--color-error-600) 10%, transparent)
		);
		border: 1px solid color-mix(in oklab, var(--color-error-500) 30%, transparent);
		color: var(--color-error-500);
		font-weight: var(--font-weight-semibold);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur-md));
		box-shadow:
			0 4px 12px color-mix(in oklab, var(--color-error-500) 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		transition:
			background-color var(--timing-normal) var(--easing-default),
			border-color var(--timing-normal) var(--easing-default),
			color var(--timing-normal) var(--easing-default),
			transform var(--timing-normal) var(--easing-default),
			box-shadow var(--timing-normal) var(--easing-default);
		position: relative;
		overflow: hidden;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-base);
		white-space: nowrap;
	}

	.clear-filters-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in oklab, var(--color-surface-50) 10%, transparent),
			transparent
		);
		transition: left var(--timing-slow) ease;
	}

	.clear-filters-btn:hover {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-error-500) 25%, transparent),
			color-mix(in oklab, var(--color-error-600) 15%, transparent)
		);
		border-color: color-mix(in oklab, var(--color-error-500) 50%, transparent);
		color: var(--color-error-600);
		transform: translateY(-2px);
		box-shadow:
			0 8px 25px color-mix(in oklab, var(--color-error-500) 25%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
	}

	.clear-filters-btn:hover::before {
		left: 100%;
	}

	.clear-filters-btn:active {
		transform: translateY(0);
		box-shadow:
			0 2px 8px color-mix(in oklab, var(--color-error-500) 20%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	.clear-filters-btn :global(svg) {
		transition: transform var(--timing-normal) var(--easing-default);
		flex-shrink: 0;
	}

	.clear-filters-btn:hover :global(svg) {
		transform: scale(1.1) rotate(5deg);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.clear-filters-btn {
			padding: var(--space-2-5) var(--space-5);
			font-size: var(--font-size-base);
		}
	}

	@media (max-width: 480px) {
		.button-text {
			display: none;
		}

		.clear-filters-btn {
			padding: var(--space-2-5);
			border-radius: var(--radius-full);
			width: var(--size-control-lg);
			height: var(--size-control-lg);
			justify-content: center;
		}
	}
</style>
