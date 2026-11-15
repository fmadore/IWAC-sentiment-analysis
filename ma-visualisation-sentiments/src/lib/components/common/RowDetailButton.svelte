<!--
  RowDetailButton

  The one way a table row or card opens its detail: a real `<button>` around
  the title. Putting `role="button"` on the `<tr>` (or a `<div>` with a
  hand-written keydown) replaced the row and cell semantics a screen reader
  navigates by with a single opaque button, so the table stopped being a
  table. The row may still be clickable for a mouse, without a role: the
  keyboard and assistive-technology path is this button.

  `clamp` limits the visible title to two lines; the accessible name is always
  the full `label`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface RowDetailButtonProps {
		/** Accessible name, e.g. "View article details for {title}". */
		label: string;
		onclick: (event: MouseEvent) => void;
		/** Visible content — usually the title. */
		children: Snippet;
		clamp?: boolean;
	}

	let { label, onclick, children, clamp = false }: RowDetailButtonProps = $props();

	/** A click on the button must not also reach a clickable row behind it. */
	function handleClick(event: MouseEvent) {
		event.stopPropagation();
		onclick(event);
	}
</script>

<button
	type="button"
	class="row-detail-button"
	data-clamp={clamp}
	aria-label={label}
	onclick={handleClick}>{@render children()}</button
>

<style>
	.row-detail-button {
		display: inline;
		padding: 0;
		background: transparent;
		border: 0;
		color: var(--text-primary);
		font: inherit;
		font-weight: var(--font-weight-medium);
		text-align: start;
		text-decoration: underline;
		text-decoration-color: var(--border-strong);
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.row-detail-button[data-clamp='true'] {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.row-detail-button:hover {
		text-decoration-color: currentColor;
	}
</style>
