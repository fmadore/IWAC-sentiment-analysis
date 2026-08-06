<!--
  Drawer

  The one off-canvas panel primitive. SidebarNav and FiltersPanel each used to
  hand-roll a fixed panel, a scrim, a `calc(var(--z-overlay) + 1)` and a
  transform, and they had drifted apart on all of it: different widths (16rem vs
  min(88vw, 22rem)), different shadows (one of which resolved to nothing at all,
  because it referenced a token that was never defined), and different keyboard
  behaviour — only the filters drawer closed on Escape. They could also both be
  open at once, stacked on the same z-index, each with its own scrim.

  What this primitive guarantees that neither hand-rolled version did:

  • The scrim is a plain element, not a <button>. Both previous versions used a
    full-viewport <button>, which a screen reader announces as a giant unlabelled
    control covering the page and which keyboard users tab into. Click-to-close
    still works; it is simply not a focusable control. The labelled close button
    inside the panel is the accessible affordance, and Escape is the keyboard one.

  • Focus is trapped while open, and restored to whatever opened the drawer when
    it closes. Previously, tabbing out of an open drawer walked straight into the
    charts behind it.

  • The rest of the page is marked `inert` while open, so it is unreachable by
    keyboard, pointer and assistive tech in one declaration rather than three.

  • Escape closes, on both drawers, always.

  • Body scroll is locked, so the page behind cannot be scrolled away under the
    panel.

  Rendering: the panel is always in the DOM (it slides via transform, so it can
  animate, and so its content keeps its state between openings). Only the scrim
  is conditional.

  Usage:
    <Drawer open={uiState.mobileMenuOpen} onClose={() => (uiState.mobileMenuOpen = false)}
            label="Main navigation" width="var(--sidebar-width-mobile-drawer)">
      …panel content…
    </Drawer>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';

	interface DrawerProps {
		/** Whether the drawer is open. */
		open: boolean;
		/** Called when the drawer asks to close (scrim click, Escape, close button). */
		onClose: () => void;
		/** Accessible name for the panel. */
		label: string;
		/**
		 * The panel's tag. Defaults to `aside` (a complementary landmark), but
		 * the nav drawer must stay a `nav` — the landmark is what a screen
		 * reader user navigates by, and turning the app's main navigation into a
		 * generic complementary region would be a real regression.
		 */
		element?: 'aside' | 'nav' | 'div';
		/**
		 * Which edge the panel slides in from. Defaults to `left`.
		 *
		 * This is not decoration: a drawer should arrive from the side its
		 * trigger is on, so the panel appears to come out of the button that was
		 * just pressed. The nav trigger sits at the far left of the header and
		 * the filters trigger at the far right, so they take opposite edges.
		 */
		side?: 'left' | 'right';
		/** Panel width. Any CSS length. */
		width?: string;
		/**
		 * When false the component renders its children with no drawer chrome at
		 * all — no fixed positioning, no scrim, no focus trap. This is how the
		 * same markup serves as a static rail at desktop widths.
		 */
		enabled?: boolean;
		/** Extra class on the panel, for the caller's own layout. */
		class?: string;
		children: Snippet;
		/**
		 * Any further attributes are spread onto the panel — in practice the
		 * caller's own `data-*` state hooks, which is how this codebase expresses
		 * state rather than by concatenating conditional class names.
		 */
		[key: string]: unknown;
	}

	let {
		open,
		onClose,
		label,
		width = 'min(88vw, 22rem)',
		enabled = true,
		element = 'aside',
		side = 'left',
		class: className = '',
		children,
		...rest
	}: DrawerProps = $props();

	let panel = $state<HTMLElement | null>(null);
	/** What had focus before we took it, so it can be handed back on close. */
	let previouslyFocused: HTMLElement | null = null;

	const FOCUSABLE =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	function focusableInPanel(): HTMLElement[] {
		if (!panel) return [];
		return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
			(el) => el.offsetParent !== null || el === document.activeElement
		);
	}

	function onKeydown(event: KeyboardEvent) {
		if (!open || !enabled) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
			return;
		}

		if (event.key !== 'Tab') return;

		// Cycle focus inside the panel rather than letting it escape into the
		// inert page behind. `inert` already blocks the background, so without
		// this the tab order would simply dead-end.
		const items = focusableInPanel();
		if (items.length === 0) {
			event.preventDefault();
			panel?.focus();
			return;
		}

		const first = items[0];
		const last = items[items.length - 1];
		const active = document.activeElement;

		if (event.shiftKey && (active === first || active === panel)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	}

	/**
	 * Everything outside the drawer, as a flat list to mark `inert`.
	 *
	 * Walks from the panel up to <body>, collecting each ancestor's *other*
	 * children. Marking `document.body.children` directly would be wrong here:
	 * SvelteKit renders the whole app inside a single wrapper div, so the
	 * drawer's own container is that one child — and inerting it would
	 * neutralise the drawer along with the page, which is exactly the bug this
	 * shape avoids.
	 */
	function backgroundOf(node: HTMLElement): HTMLElement[] {
		const out: HTMLElement[] = [];
		let current: HTMLElement | null = node;

		while (current && current !== document.body) {
			const parent: HTMLElement | null = current.parentElement;
			if (!parent) break;
			for (const sibling of Array.from(parent.children) as HTMLElement[]) {
				if (sibling !== current && !sibling.hasAttribute('data-drawer-scrim')) {
					out.push(sibling);
				}
			}
			current = parent;
		}

		return out;
	}

	/**
	 * A drawer that is no longer a drawer cannot be left open.
	 *
	 * Both callers disable the chrome at >= 1024px, where the same markup
	 * becomes a permanent rail. Crossing that threshold with the panel open used
	 * to leave the flag set: the rail looked right, so nothing seemed wrong, but
	 * dragging the window back down re-opened a drawer the user never asked for
	 * — and the trigger that would have closed it is hidden on desktop.
	 */
	$effect(() => {
		if (!enabled && open) onClose();
	});

	/** Take focus on open, hand it back on close, and lock the page behind. */
	$effect(() => {
		if (!browser || !enabled || !open || !panel) return;

		previouslyFocused = document.activeElement as HTMLElement | null;

		const background = backgroundOf(panel);
		const wasInert = background.map((el) => el.inert);
		background.forEach((el) => (el.inert = true));

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		// Move focus into the panel. The panel itself is the target rather than
		// its first control: a screen reader then announces the drawer's name
		// before its contents.
		panel.focus();

		return () => {
			background.forEach((el, i) => (el.inert = wasInert[i]));
			document.body.style.overflow = previousOverflow;
			previouslyFocused?.focus?.();
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#if enabled && open}
	<!-- A plain element, not a button. Clicking it closes the drawer, but it is
	     not a control: it has no accessible name to announce and nothing to
	     focus. Escape and the panel's own close button are the real affordances.
	     svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="drawer-scrim"
		data-drawer-scrim
		onclick={onClose}
		aria-hidden="true"
		role="presentation"
	></div>
{/if}

<svelte:element
	this={element}
	bind:this={panel}
	class="drawer-panel {className}"
	data-enabled={enabled}
	data-open={open}
	data-side={side}
	style:--drawer-width={width}
	aria-label={label}
	aria-hidden={enabled && !open ? 'true' : undefined}
	tabindex="-1"
	{...rest}
>
	{@render children()}
</svelte:element>

<style>
	.drawer-scrim {
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: color-mix(in oklab, black 65%, transparent);
		cursor: pointer;
	}

	/* These are :global on purpose, and it is not laziness.
	   The panel is rendered by <svelte:element> so its tag can be `nav` for the
	   navigation drawer and `aside` for the filter rail — the landmark matters
	   to a screen-reader user. Svelte cannot statically prove which element a
	   dynamic tag produces, so it prunes scoped selectors that target it as
	   unused, and the drawer silently renders with no chrome at all: fully
	   translated off-screen, permanently. (Found exactly that way.)
	   `.drawer-panel` is this component's own class name, so scoping it by hand
	   is safe. */
	:global(.drawer-panel[data-enabled='true']) {
		/* Where the panel parks when shut. Declared on the root selector rather
		   than reached for with an inline fallback, which this project bans: a
		   fallback turns a missing token into silence. `side` overrides it
		   below, and the open state is then the same `translateX(0)` for both
		   edges — one rule, not two that could drift. */
		--drawer-offscreen: -100%;

		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		/* Must sit ABOVE its own scrim, or the scrim dims the panel and swallows
		   its clicks. One place decides this now, rather than two components
		   each remembering to. */
		z-index: calc(var(--z-overlay) + 1);
		width: var(--drawer-width);
		height: 100dvh;
		background: var(--app-bg-elevated);
		border-right: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-drawer);
		transform: translateX(var(--drawer-offscreen));
		transition: transform var(--timing-normal) var(--easing-default);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	/* The right-hand variant. The border moves with the panel: an edge drawn on
	   the side facing the viewport edge is invisible and the one facing the page
	   is the one doing the work. */
	:global(.drawer-panel[data-enabled='true'][data-side='right']) {
		--drawer-offscreen: 100%;

		left: auto;
		right: 0;
		border-right: none;
		border-left: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-drawer-mirrored);
	}

	/* One open state for both edges — the side rule only moved where "shut" is. */
	:global(.drawer-panel[data-enabled='true'][data-open='true']) {
		transform: translateX(0);
	}

	:global(.drawer-panel:focus) {
		outline: none;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.drawer-panel) {
			transition: none;
		}
	}
</style>
