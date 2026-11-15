<!--
  CollapsibleMethodologyCard Component

  Shared collapsible shell for the methodology panels (AnalysisInfo and
  ArbiterMethodology): a card with a header button that toggles the body,
  a chevron that rotates via data-state, and an optional icon + subtitle.

  Variants:
  - "default": plain card (AnalysisInfo)
  - "arbiter": amber-accented card with header padding (ArbiterMethodology)
  - "compact": a surfaceless disclosure line above the rail and the view, with
    the chevron beside the title (AnalysisInfo)

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
		variant?: 'default' | 'arbiter' | 'compact';
		/** Body content rendered when the card is open */
		children: Snippet;
		/**
		 * Open the card when the page's hash names this id: the target of an
		 * in-page link such as the view header's `#methodology` caveat, which
		 * would otherwise land on a collapsed card.
		 */
		openOnHash?: string;
	}

	let {
		title,
		subtitle,
		icon,
		variant = 'default',
		children,
		openOnHash
	}: CollapsibleMethodologyCardProps = $props();

	let open = $state(false);
	const id = $props.id();
	const contentId = `${id}-content`;
	const subtitleId = `${id}-subtitle`;
	const buttonId = `${id}-button`;

	$effect(() => {
		if (!openOnHash) return;
		const target = `#${openOnHash}`;
		const sync = () => {
			if (window.location.hash === target) open = true;
		};
		sync();
		window.addEventListener('hashchange', sync);
		return () => window.removeEventListener('hashchange', sync);
	});
</script>

<!--
  The title is not a heading: the card sits above the view and its <h1> in the
  DOM, so an <h2> here broke the page's heading order. The card is a region
  named by its toggle instead. The subtitle sits outside the button's name but
  is tied to it with aria-describedby. The button's ::after stretches over the
  whole header, so the full bar stays clickable, chevron included.
-->
<section class="info-card" data-variant={variant} aria-labelledby={buttonId}>
	<div class="info-header">
		<div class="header-main">
			{#if icon}{@render icon()}{/if}
			<div class="header-text">
				<p class="info-title">
					<button
						id={buttonId}
						type="button"
						class="info-header-btn"
						onclick={() => (open = !open)}
						aria-expanded={open}
						aria-controls={contentId}
						aria-describedby={subtitle ? subtitleId : undefined}>{title}</button
					>
				</p>
				{#if subtitle}<p id={subtitleId} class="info-subtitle">{subtitle}</p>{/if}
			</div>
		</div>
		<span class="header-icon" data-state={open ? 'open' : 'closed'} aria-hidden="true">
			<ChevronDownIcon size={20} />
		</span>
	</div>

	<div id={contentId} class="info-content" hidden={!open}>
		{#if open}{@render children()}{/if}
	</div>
</section>

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

	/* Compact: a disclosure line, not a card. It sits above the rail and the
	   view, so it carries no surface of its own — only the hairline that
	   separates it from the page. The title keeps the serif title voice at the
	   same tier the default card uses on mobile; a 13px serif read as a
	   shrunken heading, and secondary grey made the one methodology control on
	   the page look like a footnote. The chevron sits beside the title the way
	   a <summary> marker does, instead of at the far edge of a bar the title
	   never fills. */
	.info-card[data-variant='compact'] {
		padding: var(--space-2) 0;
		margin-bottom: var(--space-3);
		background: transparent;
		border: 0;
		border-bottom: 1px solid var(--border-subtle);
	}
	[data-variant='compact'] .info-header {
		display: inline-flex;
		width: auto;
		gap: var(--space-2);
		min-height: var(--size-control-lg);
	}
	[data-variant='compact'] .info-title {
		font-size: var(--font-size-lg);
		transition: color var(--timing-fast) var(--easing-default);
	}
	[data-variant='compact'] .info-header:hover .info-title {
		color: var(--color-primary-300);
	}

	/* ==========================================================================
	   COLLAPSIBLE HEADER BUTTON
	   ========================================================================== */
	.info-header {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	/* The button carries the heading's text and inherits its type; its
	   ::after covers the whole header so the bar is one target. */
	.info-header-btn {
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: inherit;
		letter-spacing: inherit;
	}

	.info-header-btn::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.info-header:hover .header-icon {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	[data-variant='arbiter'] .info-header {
		padding: var(--space-4) var(--space-5);
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	[data-variant='arbiter'] .info-header:hover {
		background: color-mix(in oklab, var(--sentiment-arbiter) 5%, transparent);
	}

	[data-variant='arbiter'] .info-header:hover .header-icon {
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
	/* A paragraph now, so it takes the display face the global h2 rule gave it. */
	.info-title {
		font-family: var(--font-display);
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
		color: var(--text-muted);
		margin: 0.125rem 0 0;
	}

	/* ==========================================================================
	   CONTENT
	   ========================================================================== */
	.info-content {
		margin-top: var(--space-4);
		animation: slideDown var(--timing-normal) var(--easing-default);
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
