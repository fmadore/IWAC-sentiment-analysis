<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import InfoIcon from '@lucide/svelte/icons/info';
	let {
		ariaLabel,
		children,
		class: className = ''
	}: { ariaLabel: string; children: Snippet; class?: string } = $props();
	const uid = $props.id();
	let trigger: HTMLButtonElement;
	let panel: HTMLDivElement;
	let open = $state(false);
	let left = $state(0);
	let top = $state(0);
	async function place(event: ToggleEvent) {
		open = event.newState === 'open';
		if (!open) return;
		await tick();
		const anchor = trigger.getBoundingClientRect();
		const box = panel.getBoundingClientRect();
		left = Math.max(16, Math.min(anchor.left, window.innerWidth - box.width - 16));
		top = Math.max(16, Math.min(anchor.bottom + 8, window.innerHeight - box.height - 16));
	}
	function close() {
		if (open) panel.hidePopover();
	}
</script>

<svelte:window onresize={close} onscroll={close} />
<span class="info-tooltip {className}">
	<button
		bind:this={trigger}
		type="button"
		class="info-icon"
		popovertarget={uid}
		aria-label={ariaLabel}
		aria-expanded={open}
		aria-controls={uid}><InfoIcon size={16} /></button
	>
	<div
		bind:this={panel}
		id={uid}
		popover="auto"
		ontoggle={place}
		class="tooltip-content"
		style:left={`${left}px`}
		style:top={`${top}px`}
	>
		{@render children()}
	</div>
</span>

<style>
	.info-tooltip {
		display: inline-flex;
		vertical-align: middle;
	}
	.info-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: var(--space-2);
		border: 0;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
	}
	.info-icon:hover {
		background: var(--surface-active);
		color: var(--text-primary);
	}
	.info-icon:focus-visible {
		outline: 2px solid var(--text-primary);
		outline-offset: 2px;
	}
	.tooltip-content {
		position: fixed;
		inset: auto;
		margin: 0;
		width: min(24rem, calc(100vw - 2rem));
		max-height: calc(100dvh - 2rem);
		overflow: auto;
		padding: var(--space-4);
		background: var(--surface-card-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-panel);
		box-shadow: var(--shadow-xl);
	}
</style>
