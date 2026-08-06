<!--
  InfoTooltip Component

  An info "?" trigger with a rich tooltip panel. The trigger is a focusable
  button (aria-label + aria-describedby) and the tooltip is shown on both
  hover and keyboard focus.

  Usage:
  <InfoTooltip ariaLabel="More information">
    <p>Tooltip content...</p>
  </InfoTooltip>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface InfoTooltipProps {
		/** Accessible label for the trigger button */
		ariaLabel: string;
		/** Tooltip content */
		children: Snippet;
		/** Additional CSS class */
		class?: string;
	}

	let { ariaLabel, children, class: className = '' }: InfoTooltipProps = $props();

	const uid = $props.id();
	const tooltipId = `${uid}-tooltip`;
</script>

<div class="info-tooltip {className}">
	<button type="button" class="info-icon" aria-label={ariaLabel} aria-describedby={tooltipId}>
		ⓘ
	</button>
	<div class="tooltip-content" id={tooltipId} role="tooltip">
		{@render children()}
	</div>
</div>

<style>
	.info-tooltip {
		/* Component API — override on any ancestor to retint the bubble. */
		--tooltip-bg: var(--surface-card-elevated);

		position: relative;
		display: inline-block;
	}

	.info-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--size-icon-sm);
		height: var(--size-icon-sm);
		padding: 0;
		background: var(--surface-active);
		color: var(--text-secondary);
		border: none;
		border-radius: var(--radius-circle);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-bold);
		cursor: help;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.info-icon:hover {
		background: var(--border-strong);
		color: var(--text-primary);
	}

	.info-icon:focus-visible {
		outline: none;
		box-shadow: var(--ring-focus);
	}

	.tooltip-content {
		position: absolute;
		top: calc(var(--space-2-5) * -1);
		left: 0;
		transform: translateY(-100%);
		background: var(--tooltip-bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-hairline);
		padding: var(--space-3);
		min-width: 320px;
		max-width: 400px;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity var(--timing-normal) var(--easing-default),
			visibility var(--timing-normal) var(--easing-default),
			transform var(--timing-normal) var(--easing-default);
		z-index: var(--z-modal);
		box-shadow: var(--shadow-xl);
	}

	.info-tooltip:hover .tooltip-content,
	.info-icon:focus-visible + .tooltip-content {
		opacity: 1;
		visibility: visible;
		transform: translateY(-100%) translateY(-8px);
	}

	.tooltip-content::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 24px;
		transform: none;
		border: 6px solid transparent;
		border-top-color: var(--tooltip-bg);
	}

	/* Responsive tooltip */
	@media (min-width: 640px) {
		.tooltip-content {
			left: 50%;
			transform: translateX(-50%) translateY(-100%);
		}

		.info-tooltip:hover .tooltip-content,
		.info-icon:focus-visible + .tooltip-content {
			transform: translateX(-50%) translateY(-100%) translateY(-8px);
		}

		.tooltip-content::after {
			left: 50%;
			transform: translateX(-50%);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.info-icon,
		.tooltip-content {
			transition: none;
		}
	}
</style>
