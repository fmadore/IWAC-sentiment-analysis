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
		height: 2.5rem;
		padding: 0 0.75rem;
		border-radius: 0.75rem;
		background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 15%, transparent);
		color: var(--color-surface-50);
		cursor: pointer;
		transition: all var(--timing-normal) var(--easing-default);
		position: relative;
		overflow: hidden;
		/* Mobile touch optimizations */
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
		user-select: none;
		-webkit-user-select: none;
	}

	.dropdown-trigger::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in oklab, var(--color-surface-50) 15%, transparent),
			transparent
		);
		transition: left var(--timing-slow) var(--easing-default);
	}

	.dropdown-trigger:hover::before {
		left: 100%;
	}

	.dropdown-trigger:hover {
		background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
		border-color: color-mix(in oklab, var(--color-surface-50) 25%, transparent);
		transform: translateY(-1px);
		box-shadow:
			0 8px 25px color-mix(in oklab, black 15%, transparent),
			0 0 20px color-mix(in oklab, var(--color-primary-500) 10%, transparent);
	}

	.dropdown-trigger:active {
		transform: translateY(0);
		box-shadow: 0 2px 6px color-mix(in oklab, black 10%, transparent);
	}

	.trigger-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		position: relative;
		z-index: 1;
	}

	.trigger-label {
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.trigger-content :global(.chevron) {
		transition: transform var(--timing-fast) var(--easing-default);
		flex-shrink: 0;
	}

	.trigger-content :global(.rotate-180) {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		min-width: var(--menu-min-width);
		background: color-mix(in oklab, var(--color-surface-900) 95%, transparent);
		backdrop-filter: blur(var(--glass-blur-lg));
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 15%, transparent);
		border-radius: 0.75rem;
		box-shadow:
			0 20px 40px color-mix(in oklab, black 30%, transparent),
			0 8px 16px color-mix(in oklab, black 20%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		overflow: hidden;
		animation: dropdownFadeIn var(--timing-fast) ease-out;
		z-index: calc(var(--z-index) + 1);
	}

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.menu-section {
		padding: 0.5rem 0.75rem 0.25rem;
	}

	.section-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.menu-items {
		padding: 0.25rem 0.5rem 0.5rem;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: transparent;
		border: none;
		color: var(--color-surface-50);
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		position: relative;
		/* Mobile touch optimizations */
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
		min-height: 44px;
	}

	.menu-item:hover:not(:disabled) {
		background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	.menu-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.menu-item.active {
		background: color-mix(in oklab, var(--color-primary-500) 20%, transparent);
		color: var(--color-primary-400);
	}

	.menu-item.active:hover {
		background: color-mix(in oklab, var(--color-primary-500) 30%, transparent);
	}

	.item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		flex-shrink: 0;
	}

	.item-label {
		flex: 1;
		text-align: left;
	}

	.check-mark {
		color: var(--color-success-500);
		font-weight: bold;
		font-size: 1rem;
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.dropdown-trigger {
			min-width: 100px;
			height: 2.25rem;
			padding: 0 0.625rem;
		}

		.trigger-label {
			font-size: 0.8125rem;
		}

		.trigger-content :global(svg) {
			width: 16px;
			height: 16px;
		}

		.dropdown-menu {
			min-width: 160px;
			max-width: calc(100vw - 2rem);
		}

		.menu-item {
			padding: 0.75rem 0.5rem;
			font-size: 0.8125rem;
			min-height: 48px;
		}
	}

	@media (max-width: 480px) {
		.dropdown-trigger {
			min-width: 2.5rem;
			width: auto;
			height: 2rem;
			padding: 0 0.5rem;
		}

		.trigger-label {
			display: none;
		}

		.trigger-content {
			gap: 0.25rem;
		}

		.dropdown-menu {
			right: 0;
			left: auto;
			min-width: 140px;
			max-width: calc(100vw - 1rem);
		}

		.menu-item {
			padding: 0.75rem 0.5rem;
			font-size: 0.875rem;
			min-height: 44px;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.dropdown-trigger {
			border-width: 2px;
			border-color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
		}

		.dropdown-menu {
			border-width: 2px;
			border-color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
		}

		.menu-item.active {
			background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.dropdown-trigger,
		.menu-item,
		.dropdown-trigger::before {
			transition: none;
		}

		.trigger-content :global(.chevron) {
			transition: none;
		}
	}
</style>
