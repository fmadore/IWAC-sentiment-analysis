<!--
  DropdownMenu

  A single-choice picker: a button that opens a listbox (the WAI-ARIA
  "select-only combobox" interaction, built on a button). Both call sites —
  the model picker and the language switcher — pick exactly one value, but
  need a logo or icon beside each option, which a native <select> cannot
  draw.

  Keyboard: Enter, Space or ArrowDown/ArrowUp on the trigger open the list
  with the current value active; ArrowUp/ArrowDown move, Home/End jump,
  typing a letter jumps to the next matching option, Enter or Space selects,
  Escape closes and returns focus to the trigger, Tab closes. Focus moves
  into the list on open; the active option is tracked with
  aria-activedescendant so the list keeps a single tab stop.

  The trigger's accessible name is the caller's label followed by the current
  value (aria-labelledby over both), so a screen reader hears "Change
  language, English" rather than a label that hides what is selected.

  Selection happens on click only — never on touchend, which fired at the end
  of a scroll gesture that happened to start on an option.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { t } from '#lib/i18n/index.js';

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
		/** What the control chooses ("Change language"); read before the value */
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
		ariaLabel,
		class: className = ''
	}: Props = $props();

	const id = $props.id();
	const labelId = `${id}-label`;
	const valueId = `${id}-value`;
	const listId = `${id}-list`;
	const optionId = (index: number) => `${id}-option-${index}`;

	let isOpen = $state(false);
	let activeIndex = $state(-1);
	let dropdownElement: HTMLDivElement;
	let triggerElement = $state<HTMLButtonElement>();
	let listElement = $state<HTMLUListElement>();

	let selectedItem = $derived(items.find((item) => item.id === selectedId));
	let enabledIndexes = $derived(items.flatMap((item, index) => (item.disabled ? [] : [index])));

	async function open(focusIndex?: number) {
		const selectedIndex = items.findIndex((item) => item.id === selectedId);
		activeIndex =
			focusIndex ??
			(selectedIndex >= 0 && !items[selectedIndex].disabled
				? selectedIndex
				: (enabledIndexes[0] ?? -1));
		isOpen = true;
		await tick();
		listElement?.focus();
		scrollActiveIntoView();
	}

	function close(returnFocus = true) {
		isOpen = false;
		if (returnFocus) triggerElement?.focus();
	}

	function choose(index: number) {
		const item = items[index];
		if (!item || item.disabled) return;
		onSelect(item.id);
		close();
	}

	function scrollActiveIntoView() {
		if (activeIndex < 0) return;
		document.getElementById(optionId(activeIndex))?.scrollIntoView?.({ block: 'nearest' });
	}

	function moveActive(step: number) {
		if (enabledIndexes.length === 0) return;
		const position = enabledIndexes.indexOf(activeIndex);
		const next =
			position === -1
				? step > 0
					? 0
					: enabledIndexes.length - 1
				: Math.min(Math.max(position + step, 0), enabledIndexes.length - 1);
		activeIndex = enabledIndexes[next];
		scrollActiveIntoView();
	}

	// Typeahead: letters typed within half a second build one search string.
	let typed = '';
	let typedTimer: ReturnType<typeof setTimeout> | undefined;
	function typeahead(character: string) {
		clearTimeout(typedTimer);
		typed += character.toLocaleLowerCase();
		typedTimer = setTimeout(() => (typed = ''), 500);
		const start = Math.max(activeIndex, 0);
		const order = [
			...enabledIndexes.filter((i) => i > start),
			...enabledIndexes.filter((i) => i <= start)
		];
		// A repeated single letter cycles through the matches.
		const query = typed.length > 1 && new Set(typed).size === 1 ? typed[0] : typed;
		const match =
			query.length > 1
				? [start, ...order].find((i) => items[i]?.label.toLocaleLowerCase().startsWith(query))
				: order.find((i) => items[i].label.toLocaleLowerCase().startsWith(query));
		if (match !== undefined && enabledIndexes.includes(match)) {
			activeIndex = match;
			scrollActiveIntoView();
		}
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			void open(event.key === 'ArrowUp' ? enabledIndexes.at(-1) : undefined);
		}
	}

	function onListKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				moveActive(1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				moveActive(-1);
				break;
			case 'Home':
				event.preventDefault();
				activeIndex = enabledIndexes[0] ?? -1;
				scrollActiveIntoView();
				break;
			case 'End':
				event.preventDefault();
				activeIndex = enabledIndexes.at(-1) ?? -1;
				scrollActiveIntoView();
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				choose(activeIndex);
				break;
			case 'Escape':
				event.preventDefault();
				event.stopPropagation();
				close();
				break;
			case 'Tab':
				close(false);
				break;
			default:
				if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
					typeahead(event.key);
				}
		}
	}

	function handleClickOutside(event: MouseEvent | TouchEvent) {
		const target = event.target as Element;
		if (dropdownElement && !dropdownElement.contains(target)) {
			close(false);
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

	$effect(() => () => clearTimeout(typedTimer));
</script>

<div
	class="dropdown-container {className}"
	bind:this={dropdownElement}
	style="--z-index: {zIndex}; --menu-min-width: {menuMinWidth}; --button-min-width: {buttonMinWidth};"
>
	<span id={labelId} class="sr-only">{ariaLabel ?? $t.audit.openMenu}</span>
	<button
		bind:this={triggerElement}
		class="dropdown-trigger"
		onclick={() => (isOpen ? close() : open())}
		onkeydown={onTriggerKeydown}
		aria-labelledby="{labelId} {valueId}"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		aria-controls={isOpen ? listId : undefined}
		type="button"
	>
		<span class="trigger-content" id={valueId}>
			{#if trigger}
				{@render trigger()}
			{:else}
				<span class="trigger-label">
					{selectedItem?.label ?? $t.audit.selectPlaceholder}
				</span>
			{/if}
		</span>
		<span class="chevron" data-state={isOpen ? 'open' : 'closed'} aria-hidden="true">
			<ChevronDownIcon size={16} />
		</span>
	</button>

	{#if isOpen}
		<div class="dropdown-menu">
			{#if sectionLabel}
				<div class="menu-section" aria-hidden="true">
					<span class="section-label">{sectionLabel}</span>
				</div>
			{/if}
			<ul
				bind:this={listElement}
				id={listId}
				class="menu-items"
				role="listbox"
				tabindex="-1"
				aria-label={sectionLabel ?? ariaLabel ?? $t.audit.openMenu}
				aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
				onkeydown={onListKeydown}
			>
				{#each items as item, index (item.id)}
					<!-- Options are not focusable themselves (aria-activedescendant
					     carries focus); the list handles the keyboard, so the
					     click handler here is pointer-only by design. -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id={optionId(index)}
						class="menu-item"
						role="option"
						data-state={selectedId === item.id ? 'active' : 'inactive'}
						data-highlighted={index === activeIndex}
						aria-selected={selectedId === item.id}
						aria-disabled={item.disabled || undefined}
						onclick={() => choose(index)}
						onpointermove={() => {
							if (!item.disabled) activeIndex = index;
						}}
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
								<span class="check-mark" aria-hidden="true">✓</span>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
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
		gap: var(--space-2);
		min-width: var(--button-min-width);
		height: var(--size-control-lg);
		padding: 0 var(--space-3);
		border-radius: var(--radius-panel);
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

	.chevron {
		display: inline-flex;
		transition: transform var(--timing-fast) var(--easing-default);
		flex-shrink: 0;
		color: var(--text-muted);
	}

	.chevron[data-state='open'] {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + var(--space-2));
		left: 0;
		min-width: var(--menu-min-width);
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-panel);
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
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
	}

	.menu-items {
		list-style: none;
		margin: 0;
		padding: var(--space-1) var(--space-2) var(--space-2);
		max-height: min(60vh, 24rem);
		overflow-y: auto;
	}

	/* The list holds DOM focus; the active option carries the visible
	   indicator (aria-activedescendant), so the ring goes on the option. */
	.menu-items:focus-visible {
		outline: none;
	}

	.menu-items:focus-visible .menu-item[data-highlighted='true'] {
		outline: var(--focus-outline);
		outline-offset: calc(var(--focus-outline-offset) * -1);
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
		border-radius: var(--radius-panel);
		position: relative;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
		min-height: var(--size-control-xl);
	}

	.menu-item[data-highlighted='true']:not([aria-disabled='true']) {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	.menu-item[aria-disabled='true'] {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.menu-item[data-state='active'] {
		background: color-mix(in oklab, var(--color-primary-500) 16%, transparent);
		color: var(--color-primary-300);
	}

	.menu-item[data-state='active']:hover {
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

	/* ---- Small screens -------------------------------------------------------
	   The trigger keeps its 40px height at every size. Two viewport queries used
	   to shrink it — to 36px below 640 and to 32px below 480 — which made the
	   touch target smallest exactly where fingers are least precise and where
	   this control is hardest to hit. Only the width and the menu's own
	   positioning relax; the height does not.

	   The menu itself right-aligns and caps its width against the viewport so it
	   cannot overflow a narrow screen. */
	.dropdown-trigger {
		min-width: var(--size-control-lg);
	}

	.dropdown-menu {
		right: 0;
		left: auto;
		max-width: calc(100vw - var(--space-8));
	}

	@media (min-width: 640px) {
		.dropdown-trigger {
			min-width: var(--button-min-width);
		}

		.dropdown-menu {
			right: auto;
			left: 0;
			max-width: none;
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

		.menu-item[data-state='active'] {
			background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.dropdown-trigger,
		.menu-item {
			transition: none;
		}

		.chevron {
			transition: none;
		}
	}
</style>
