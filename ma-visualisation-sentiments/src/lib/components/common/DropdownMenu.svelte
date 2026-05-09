<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	interface DropdownMenuItem {
		id: string;
		label: string;
		icon?: Snippet;
		disabled?: boolean;
		/** Custom data that can be passed to item renderer */
		data?: Record<string, unknown>;
	}

	interface Props {
		/** Array of menu items */
		items: DropdownMenuItem[];
		/** Currently selected item ID */
		selectedId?: string;
		/** Callback when an item is selected */
		onSelect: (id: string) => void;
		/** Optional trigger button content */
		trigger?: Snippet;
		/** Optional custom item renderer - receives item and isSelected */
		itemRenderer?: Snippet<[{ item: DropdownMenuItem; isSelected: boolean }]>;
		/** Optional section label above items */
		sectionLabel?: string;
		/** Minimum width of the dropdown menu */
		menuMinWidth?: string;
		/** Minimum width of the trigger button */
		buttonMinWidth?: string;
		/** Z-index for the dropdown */
		zIndex?: number;
		/** Aria label for the dropdown button */
		ariaLabel?: string;
		/** Additional class for the trigger button */
		class?: string;
	}

	let {
		items,
		selectedId,
		onSelect,
		trigger,
		itemRenderer,
		sectionLabel,
		menuMinWidth = '180px',
		buttonMinWidth = '120px',
		zIndex = 1000,
		ariaLabel = 'Open menu',
		class: className = ''
	}: Props = $props();

	let isOpen = $state(false);
	let dropdownElement: HTMLDivElement;

	let selectedItem = $derived(items.find((item) => item.id === selectedId));

	function toggleDropdown(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		isOpen = !isOpen;
	}

	function handleSelect(event: Event, itemId: string) {
		event.preventDefault();
		event.stopPropagation();
		onSelect(itemId);
		isOpen = false;
	}

	function handleClickOutside(event: MouseEvent | TouchEvent) {
		const target = event.target as Element;
		if (dropdownElement && !dropdownElement.contains(target)) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('touchstart', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
				document.removeEventListener('touchstart', handleClickOutside);
			};
		}
	});
</script>

<div
	class="dropdown-container {className}"
	bind:this={dropdownElement}
	style="--z-index: {zIndex}; --menu-min-width: {menuMinWidth}; --button-min-width: {buttonMinWidth};"
>
	<button
		class="dropdown-trigger"
		onclick={toggleDropdown}
		ontouchend={toggleDropdown}
		aria-label={ariaLabel}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		type="button"
	>
		<div class="trigger-content">
			{#if trigger}
				{@render trigger()}
			{:else}
				<span class="trigger-label">
					{selectedItem?.label || 'Select...'}
				</span>
			{/if}
			<ChevronDownIcon size={16} class="chevron {isOpen ? 'rotate-180' : ''}" />
		</div>
	</button>

	{#if isOpen}
		<div class="dropdown-menu" role="listbox" aria-label={sectionLabel || ariaLabel}>
			{#if sectionLabel}
				<div class="menu-section">
					<span class="section-label">{sectionLabel}</span>
				</div>
			{/if}
			<div class="menu-items">
				{#each items as item (item.id)}
					<button
						class="menu-item"
						class:active={selectedId === item.id}
						disabled={item.disabled}
						onclick={(e) => handleSelect(e, item.id)}
						ontouchend={(e) => handleSelect(e, item.id)}
						role="option"
						aria-selected={selectedId === item.id}
						tabindex="0"
					>
						{#if itemRenderer}
							{@render itemRenderer({ item, isSelected: selectedId === item.id })}
						{:else}
							{#if item.icon}
								<span class="item-icon">
									{@render item.icon()}
								</span>
							{/if}
							<span class="item-label">{item.label}</span>
							{#if selectedId === item.id}
								<span class="check-mark">✓</span>
							{/if}
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.dropdown-container {
		position: relative;
		z-index: var(--z-index);
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: var(--button-min-width);
		height: var(--size-control-lg);
		padding: 0 var(--space-3);
		border-radius: var(--radius-lg);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-primary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
		position: relative;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
		user-select: none;
		-webkit-user-select: none;
	}

	.dropdown-trigger:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}

	.dropdown-trigger:active {
		background: var(--surface-active);
	}

	.trigger-content {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		position: relative;
		z-index: 1;
	}

	.trigger-label {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
	}

	.trigger-content :global(.chevron) {
		transition: transform var(--timing-fast) var(--easing-default);
		flex-shrink: 0;
		color: var(--text-muted);
	}

	.trigger-content :global(.rotate-180) {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + var(--space-2));
		left: 0;
		min-width: var(--menu-min-width);
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--elevation-modal);
		overflow: hidden;
		animation: dropdownFadeIn var(--timing-fast) var(--easing-default);
		z-index: calc(var(--z-index) + 1);
	}

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-6px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.menu-section {
		padding: var(--space-2) var(--space-3) var(--space-1);
	}

	.section-label {
		display: block;
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-semibold);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
	}

	.menu-items {
		padding: var(--space-1) var(--space-2) var(--space-2);
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2-5) var(--space-3);
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-md);
		position: relative;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
		min-height: var(--size-control-xl);
	}

	.menu-item:hover:not(:disabled) {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	.menu-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.menu-item.active {
		background: color-mix(in oklab, var(--color-primary-500) 16%, transparent);
		color: var(--color-primary-300);
	}

	.menu-item.active:hover {
		background: color-mix(in oklab, var(--color-primary-500) 22%, transparent);
	}

	.item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-icon-lg);
		flex-shrink: 0;
	}

	.item-label {
		flex: 1;
		text-align: left;
	}

	.check-mark {
		color: var(--color-primary-300);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-lg);
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.dropdown-trigger {
			min-width: 100px;
			height: var(--size-control-md);
			padding: 0 var(--space-2-5);
		}

		.trigger-label {
			font-size: var(--font-size-sm);
		}

		.trigger-content :global(svg) {
			width: var(--size-icon-sm);
			height: var(--size-icon-sm);
		}

		.dropdown-menu {
			min-width: 160px;
			max-width: calc(100vw - 2rem);
		}

		.menu-item {
			padding: var(--space-3) var(--space-2);
			font-size: var(--font-size-sm);
		}
	}

	@media (max-width: 480px) {
		.dropdown-trigger {
			min-width: var(--size-control-lg);
			width: auto;
			height: var(--size-control-sm);
			padding: 0 var(--space-2);
		}

		.trigger-label {
			display: none;
		}

		.trigger-content {
			gap: var(--space-1);
		}

		.dropdown-menu {
			right: 0;
			left: auto;
			min-width: 140px;
			max-width: calc(100vw - 1rem);
		}

		.menu-item {
			padding: var(--space-3) var(--space-2);
			font-size: var(--font-size-base);
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.dropdown-trigger {
			border-width: 2px;
			border-color: var(--border-strong);
		}

		.dropdown-menu {
			border-width: 2px;
			border-color: var(--border-strong);
		}

		.menu-item.active {
			background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.dropdown-trigger,
		.menu-item {
			transition: none;
		}

		.trigger-content :global(.chevron) {
			transition: none;
		}
	}
</style>
