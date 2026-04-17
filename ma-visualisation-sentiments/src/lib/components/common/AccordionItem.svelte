<!--
  AccordionItem Component
  
  A reusable accordion item with glass morphism styling.
  Uses data-state attribute for open/closed styling.
  
  Features:
  - Glass morphism styling
  - Smooth expand/collapse animation
  - Accessible button trigger
  - Supports any content via snippet
  
  Usage:
  <AccordionItem 
    title="Section Title" 
    open={isOpen} 
    onToggle={() => isOpen = !isOpen}
  >
    <p>Your content here</p>
  </AccordionItem>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface AccordionItemProps {
		/** The title/label for the accordion trigger */
		title: string;
		/** Whether the accordion is currently open */
		open?: boolean;
		/** Callback when the accordion is toggled */
		onToggle?: () => void;
		/** The content to display when expanded */
		children: Snippet;
		/** Optional custom class for the container */
		class?: string;
	}

	let {
		title,
		open = false,
		onToggle,
		children,
		class: className = ''
	}: AccordionItemProps = $props();
</script>

<div class="accordion-item {className}">
	<h3>
		<button
			class="accordion-trigger"
			data-state={open ? 'open' : 'closed'}
			onclick={onToggle}
			aria-expanded={open}
		>
			<span class="accordion-trigger-text">{title}</span>
			<span class="accordion-icon" data-state={open ? 'open' : 'closed'}>▼</span>
		</button>
	</h3>
	{#if open}
		<div class="accordion-panel">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.accordion-item {
		border-bottom: 1px solid var(--border-subtle);
	}

	.accordion-item:last-child {
		border-bottom: none;
	}

	.accordion-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3-5) var(--space-4);
		background: var(--surface-muted);
		border: none;
		color: var(--text-primary);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
		text-align: left;
	}

	.accordion-trigger:hover {
		background: var(--surface-hover);
	}

	.accordion-trigger[data-state='open'] {
		background: color-mix(in oklab, var(--color-primary-500) 10%, transparent);
		box-shadow: inset 3px 0 0 var(--color-primary-500);
	}

	.accordion-trigger-text {
		flex: 1;
	}

	.accordion-icon {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		transition:
			transform var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.accordion-icon[data-state='open'] {
		transform: rotate(180deg);
		color: var(--color-primary-300);
	}

	.accordion-panel {
		padding: var(--space-4) var(--space-5);
		background: var(--surface-nested);
		animation: slideDown var(--timing-normal) var(--easing-default);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive */
	@media (max-width: 640px) {
		.accordion-trigger {
			padding: var(--space-3);
			font-size: var(--font-size-base);
		}

		.accordion-panel {
			padding: var(--space-3-5) var(--space-4);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.accordion-trigger,
		.accordion-icon {
			transition: none;
		}

		.accordion-panel {
			animation: none;
		}
	}
</style>
