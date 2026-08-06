<script lang="ts">
	import FilterXIcon from '@lucide/svelte/icons/filter-x';
	import { clearAllFilters } from '$lib/stores/url';
	import { filterState } from '$lib/stores';
	import { t } from '$lib/i18n';

	// Track if we have any active filters
	let hasActiveFilters = $derived(
		filterState.countries.length > 0 ||
			filterState.journals.length > 0 ||
			filterState.polarities.length > 0 ||
			filterState.subjectivities.length > 0 ||
			filterState.centralities.length > 0
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
		background: color-mix(in oklab, var(--color-error-500) 10%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-error-500) 30%, transparent);
		color: var(--color-error-400);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		padding: var(--space-2-5) var(--space-4);
		border-radius: 0;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		white-space: nowrap;
	}

	.clear-filters-btn:hover {
		background: color-mix(in oklab, var(--color-error-500) 18%, transparent);
		border-color: color-mix(in oklab, var(--color-error-500) 45%, transparent);
		color: var(--color-error-300);
	}

	.clear-filters-btn :global(svg) {
		flex-shrink: 0;
	}

	/* Collapses to an icon-only square when the rail itself is narrow, not when
	   the window is. Previously a 480px viewport query, which meant the button
	   kept its label in a 320px desktop rail but lost it in a 330px drawer. */
	@container filter-rail (max-width: 300px) {
		.button-text {
			display: none;
		}

		.clear-filters-btn {
			padding: var(--space-2-5);
			width: var(--size-control-lg);
			height: var(--size-control-lg);
			justify-content: center;
		}
	}
</style>
