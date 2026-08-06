<!--
  CollapsibleMethodologyCard Component

  Shared collapsible shell for the methodology panels (AnalysisInfo and
  ArbiterMethodology): a card with a header button that toggles the body,
  a chevron that rotates via data-state, and an optional icon + subtitle.

  Variants:
  - "default": plain card (AnalysisInfo)
  - "arbiter": amber-accented card with header padding (ArbiterMethodology)

  Usage:
  <CollapsibleMethodologyCard title="Methodology">
    <p>Body content…</p>
  </CollapsibleMethodologyCard>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	interface CollapsibleMethodologyCardProps {
		/** Title shown in the header button */
		title: string;
		/** Optional subtitle rendered under the title */
		subtitle?: string;
		/** Optional icon rendered before the title (styled by the parent) */
		icon?: Snippet;
		/** Visual variant of the card */
		variant?: 'default' | 'arbiter';
		/** Body content rendered when the card is open */
		children: Snippet;
	}

	let {
		title,
		subtitle,
		icon,
		variant = 'default',
		children
	}: CollapsibleMethodologyCardProps = $props();

	let open = $state(false);
</script>

<div class="info-card" data-variant={variant}>
	<!-- Collapsible Header -->
	<button class="info-header-btn" onclick={() => (open = !open)} aria-expanded={open}>
		{#if icon || subtitle}
			<div class="header-main">
				{#if icon}{@render icon()}{/if}
				<div class="header-text">
					<h2 class="info-title">{title}</h2>
					{#if subtitle}<p class="info-subtitle">{subtitle}</p>{/if}
				</div>
			</div>
		{:else}
			<h2 class="info-title">{title}</h2>
		{/if}
		<span class="header-icon" data-state={open ? 'open' : 'closed'}>
			<ChevronDownIcon size={20} />
		</span>
	</button>

	{#if open}
		<div class="info-content" data-state="open">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	/* ==========================================================================
	   INFO CARD - Main Container
	   ========================================================================== */
	.info-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
		margin-bottom: var(--space-6);
	}

	@media (min-width: 640px) {
		.info-card {
			padding: var(--space-5);
		}
	}

	.info-card[data-variant='arbiter'] {
		padding: 0;
		border-top: 2px solid var(--sentiment-arbiter);
		overflow: hidden;
	}

	/* ==========================================================================
	   COLLAPSIBLE HEADER BUTTON
	   ========================================================================== */
	.info-header-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: color var(--timing-fast) var(--easing-default);
	}

	.info-header-btn:hover .header-icon {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	[data-variant='arbiter'] .info-header-btn {
		padding: var(--space-4) var(--space-5);
		transition: all var(--timing-fast) var(--easing-default);
	}

	[data-variant='arbiter'] .info-header-btn:hover {
		background: color-mix(in oklab, var(--sentiment-arbiter) 5%, transparent);
	}

	[data-variant='arbiter'] .info-header-btn:hover .header-icon {
		background: none;
		color: var(--color-surface-50);
	}

	.header-main {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.header-text {
		text-align: left;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-sm);
		height: var(--size-control-sm);
		border-radius: var(--radius-panel);
		background: var(--surface-subtle);
		color: var(--text-muted);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default),
			transform var(--timing-normal) var(--easing-default);
		flex-shrink: 0;
	}

	.header-icon[data-state='open'] {
		transform: rotate(180deg);
		color: var(--color-primary-300);
	}

	[data-variant='arbiter'] .header-icon {
		width: auto;
		height: auto;
		border-radius: 0;
		background: none;
		color: var(--color-surface-50);
		opacity: 0.6;
		transition: transform var(--timing-fast) var(--easing-default);
	}

	[data-variant='arbiter'] .header-icon[data-state='open'] {
		transform: rotate(180deg);
		color: var(--color-surface-50);
	}

	/* ==========================================================================
	   TITLE + SUBTITLE
	   ========================================================================== */
	.info-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		letter-spacing: var(--tracking-snug);
		line-height: var(--line-height-tight);
		margin: 0;
	}

	[data-variant='arbiter'] .info-title {
		font-size: var(--font-size-lg);
		color: var(--color-surface-50);
		letter-spacing: normal;
		line-height: var(--line-height-normal);
	}

	.info-subtitle {
		font-size: var(--font-size-xs);
		line-height: calc(1 / 0.75);
		color: color-mix(in oklab, white 60%, transparent);
		margin: 0.125rem 0 0;
	}

	/* ==========================================================================
	   CONTENT
	   ========================================================================== */
	.info-content {
		margin-top: var(--space-4);
		animation: slideDown var(--timing-normal) var(--easing-default);
	}

	.info-content[data-state='open'] {
		display: block;
	}

	[data-variant='arbiter'] .info-content {
		margin-top: 0;
		padding: 0 var(--space-5) var(--space-5);
		animation: none;
	}

	/* ==========================================================================
	   RESPONSIVE
	   ========================================================================== */
	/* The default variant starts compact and grows; the base .info-card padding
	   above already carries the small step, so only the type and icon need a
	   larger tier here. */
	[data-variant='default'] .info-title {
		font-size: var(--font-size-lg);
	}

	[data-variant='default'] .header-icon {
		width: 1.75rem;
		height: 1.75rem;
	}

	@media (min-width: 640px) {
		.info-card[data-variant='default'] {
			border-radius: var(--radius-panel);
		}

		[data-variant='default'] .info-title {
			font-size: var(--font-size-xl);
		}

		[data-variant='default'] .header-icon {
			width: var(--size-control-sm);
			height: var(--size-control-sm);
		}
	}

	/* ==========================================================================
	   REDUCED MOTION
	   ========================================================================== */
	@media (prefers-reduced-motion: reduce) {
		.info-content,
		.header-icon,
		.info-header-btn {
			transition: none;
			animation: none;
		}
	}
</style>
