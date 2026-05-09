<script lang="ts">
	import { comparisonPair, availableDatasets, activeView } from '$lib/stores';
	import type { ModelPair, DatasetOption } from '$lib/types/data';
	import { getModelsFromPair } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';
	import { updateURL } from '$lib/stores/url';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	// Available comparison pairs
	const pairs: { id: ModelPair; label: string }[] = [
		{ id: 'chatgpt-gemini', label: 'ChatGPT vs Gemini' },
		{ id: 'chatgpt-mistral', label: 'ChatGPT vs Mistral' },
		{ id: 'gemini-mistral', label: 'Gemini vs Mistral' }
	];

	// Get translated label for a pair
	function getPairLabel(pairId: ModelPair): string {
		const comparison = $t.comparison;
		if (!comparison) return pairId;
		switch (pairId) {
			case 'chatgpt-gemini':
				return (
					(comparison as { pairChatGPTGemini?: string }).pairChatGPTGemini || 'ChatGPT vs Gemini'
				);
			case 'chatgpt-mistral':
				return (
					(comparison as { pairChatGPTMistral?: string }).pairChatGPTMistral || 'ChatGPT vs Mistral'
				);
			case 'gemini-mistral':
				return (
					(comparison as { pairGeminiMistral?: string }).pairGeminiMistral || 'Gemini vs Mistral'
				);
			default:
				return pairId;
		}
	}

	let isOpen = $state(false);
	let dropdownRef = $state<HTMLDivElement | null>(null);

	// Get dataset info for a model ID using $derived
	function getDatasetInfo(modelId: string, datasets: DatasetOption[]): DatasetOption | undefined {
		return datasets.find((d) => d.id === modelId);
	}

	// Get logos for a pair - now takes datasets as parameter
	function getLogosForPair(pair: ModelPair, datasets: DatasetOption[]): [string, string] {
		const [modelAId, modelBId] = getModelsFromPair(pair);
		const modelA = getDatasetInfo(modelAId, datasets);
		const modelB = getDatasetInfo(modelBId, datasets);
		return [modelA?.logo || '', modelB?.logo || ''];
	}

	// Derived current logos for the selected pair
	let currentLogos = $derived(getLogosForPair($comparisonPair, $availableDatasets));

	function selectPair(pair: ModelPair) {
		comparisonPair.set(pair);
		isOpen = false;
		// Update URL to reflect the new pair, passing the current view
		updateURL($activeView, true);
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="model-pair-picker" bind:this={dropdownRef}>
	<button
		class="picker-button"
		onclick={() => (isOpen = !isOpen)}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<div class="selected-pair">
			{#each currentLogos as logo, i (i)}
				{#if logo}
					<img src="{base}{logo}" alt="" class="pair-logo" />
				{/if}
				{#if i === 0}
					<span class="vs-label">vs</span>
				{/if}
			{/each}
		</div>
		<ChevronDownIcon size={16} class="chevron {isOpen ? 'open' : ''}" />
	</button>

	{#if isOpen}
		<div class="dropdown-menu" role="listbox">
			{#each pairs as pair (pair.id)}
				{@const [logoA, logoB] = getLogosForPair(pair.id, $availableDatasets)}
				<button
					class="dropdown-item {$comparisonPair === pair.id ? 'selected' : ''}"
					role="option"
					aria-selected={$comparisonPair === pair.id}
					onclick={() => selectPair(pair.id)}
				>
					<div class="pair-logos">
						{#if logoA}
							<img src="{base}{logoA}" alt="" class="pair-logo-sm" />
						{/if}
						<span class="vs-label-sm">vs</span>
						{#if logoB}
							<img src="{base}{logoB}" alt="" class="pair-logo-sm" />
						{/if}
					</div>
					<span class="pair-label">{getPairLabel(pair.id)}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.model-pair-picker {
		position: relative;
		display: inline-block;
	}

	.picker-button {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--surface-muted);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.picker-button:hover {
		background: var(--surface-subtle);
		border-color: var(--border-hover);
	}

	.selected-pair {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
	}

	.pair-logo {
		width: var(--space-5);
		height: var(--space-5);
		object-fit: contain;
	}

	.vs-label {
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		color: var(--sentiment-comparison-light);
		letter-spacing: var(--tracking-wider);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + var(--space-1));
		left: 0;
		min-width: 200px;
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-dropdown);
		overflow: hidden;
		padding: var(--space-1);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2-5) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
		text-align: left;
	}

	.dropdown-item:hover {
		background: var(--surface-subtle);
	}

	.dropdown-item.selected {
		background: var(--surface-hover);
		box-shadow: inset 2px 0 0 var(--color-primary-400);
	}

	.pair-logos {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.pair-logo-sm {
		width: var(--size-icon-sm);
		height: var(--size-icon-sm);
		object-fit: contain;
	}

	.vs-label-sm {
		font-size: 0.5rem; /* below 2xs */
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		color: var(--sentiment-comparison-light);
	}

	.pair-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}
</style>
