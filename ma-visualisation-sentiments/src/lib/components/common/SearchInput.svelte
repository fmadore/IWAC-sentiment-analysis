<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import SearchIcon from '@lucide/svelte/icons/search';

	interface Props {
		/** Current search value (bindable) */
		value?: string;
		/** Placeholder text */
		placeholder?: string;
		/** Callback when value changes */
		onchange?: (value: string) => void;
		/** Callback when input is cleared */
		onclear?: () => void;
		/** Show search icon on the left */
		showSearchIcon?: boolean;
		/** Additional class for the wrapper */
		class?: string;
		/** Size variant */
		size?: 'sm' | 'md';
	}

	let {
		value = $bindable(''),
		placeholder = 'Search...',
		onchange,
		onclear,
		showSearchIcon = false,
		class: className = '',
		size = 'md'
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		onchange?.(value);
	}

	function handleClear() {
		value = '';
		onchange?.('');
		onclear?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && value) {
			handleClear();
		}
	}
</script>

<div class="search-wrapper {className}" class:size-sm={size === 'sm'}>
	{#if showSearchIcon}
		<SearchIcon size={size === 'sm' ? 14 : 16} class="search-icon" />
	{/if}
	<input
		type="text"
		{placeholder}
		{value}
		oninput={handleInput}
		onkeydown={handleKeydown}
		class="search-input"
		class:has-icon={showSearchIcon}
		class:has-clear={value}
	/>
	{#if value}
		<button onclick={handleClear} class="search-clear" aria-label="Clear search" type="button">
			<XIcon size={size === 'sm' ? 12 : 14} />
		</button>
	{/if}
</div>

<style>
	.search-wrapper {
		position: relative;
		width: 100%;
	}

	/* Applied to Lucide icon component */
	.search-wrapper :global(.search-icon) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 2rem 0.5rem 0.75rem;
		font-size: 0.8125rem;
		border-radius: 0.5rem;
		background: color-mix(in oklab, var(--color-surface-50) 6%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		color: var(--color-surface-50);
		transition: all var(--timing-fast) var(--easing-default);
	}

	.search-input.has-icon {
		padding-left: 2.25rem;
	}

	.search-input.has-clear {
		padding-right: 2rem;
	}

	.search-input::placeholder {
		color: color-mix(in oklab, var(--color-surface-50) 40%, transparent);
	}

	.search-input:hover {
		border-color: color-mix(in oklab, var(--color-surface-50) 18%, transparent);
		background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
	}

	.search-clear {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		background: none;
		border: none;
		color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.search-clear:hover {
		color: var(--color-surface-50);
		background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	.search-clear:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 1px;
	}

	/* Size variants */
	.size-sm .search-input {
		padding: 0.375rem 1.75rem 0.375rem 0.625rem;
		font-size: 0.75rem;
		border-radius: 0.375rem;
	}

	.size-sm .search-input.has-icon {
		padding-left: 1.875rem;
	}

	.size-sm :global(.search-icon) {
		left: 0.625rem;
	}

	.size-sm .search-clear {
		right: 0.375rem;
		padding: 0.125rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.search-input {
			padding: 0.4375rem 1.75rem 0.4375rem 0.625rem;
			font-size: 0.75rem;
		}

		.search-input.has-icon {
			padding-left: 2rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.search-input,
		.search-clear {
			transition: none;
		}
	}
</style>
