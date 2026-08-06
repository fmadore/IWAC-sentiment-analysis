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
		left: var(--space-3);
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-subtle);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3);
		font-size: var(--font-size-sm);
		border-radius: var(--radius-panel);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-primary);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
	}

	.search-input.has-icon {
		padding-left: var(--space-8);
	}

	.search-input.has-clear {
		padding-right: var(--space-8);
	}

	.search-input::placeholder {
		color: var(--text-subtle);
	}

	.search-input:hover {
		border-color: var(--border-hover);
		background: var(--surface-hover);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		background: var(--surface-hover);
		box-shadow: var(--ring-focus);
	}

	.search-clear {
		position: absolute;
		right: var(--space-2);
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		background: none;
		border: none;
		color: var(--text-subtle);
		cursor: pointer;
		border-radius: var(--radius-none);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.search-clear:hover {
		color: var(--text-primary);
		background: var(--surface-hover);
	}

	/* Size variants */
	.size-sm .search-input {
		padding: var(--space-1-5) var(--space-7) var(--space-1-5) var(--space-2-5);
		font-size: var(--font-size-xs);
		border-radius: var(--radius-hairline);
	}

	.size-sm .search-input.has-icon {
		padding-left: var(--space-7);
	}

	.size-sm :global(.search-icon) {
		left: var(--space-2-5);
	}

	.size-sm .search-clear {
		right: var(--space-1-5);
		padding: var(--space-0-5);
	}

	/* Responsive */
	/* This input only renders inside JournalFilter, which lives in the filter
	   rail — so it asks the rail how much room it has, not the window. The
	   values match the `size-sm` variant above by design. */
	@container filter-rail (max-width: 300px) {
		.search-input {
			padding: var(--space-1-5) var(--space-7) var(--space-1-5) var(--space-2-5);
			font-size: var(--font-size-xs);
		}

		.search-input.has-icon {
			padding-left: var(--space-8);
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
