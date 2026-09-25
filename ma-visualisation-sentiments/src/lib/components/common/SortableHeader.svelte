<!--
  SortableHeader

  One sortable column header for every table: a native `<th scope="col">`
  carrying `aria-sort`, with a real button inside and a visible direction
  glyph. Each table used to spell this out per column, and the two arbiter
  tables had drifted: no `aria-sort`, no `scope`, and a bidirectional icon that
  marked the sorted column without saying which way.

  `accent` picks the hover tint of the table's family. `align="center"` centres
  the label for numeric columns.
-->
<script lang="ts">
	import { ariaSort, type SortOrder } from '$lib/utils/sorting';

	interface Props {
		label: string;
		/** Whether this column is the sorted one. */
		active: boolean;
		order: SortOrder;
		onsort: () => void;
		accent?: 'primary' | 'neutral' | 'arbiter';
		align?: 'start' | 'center';
		/** Extra classes for the cell, such as a column-width hook. */
		class?: string;
	}

	let {
		label,
		active,
		order,
		onsort,
		accent = 'primary',
		align = 'start',
		class: className = ''
	}: Props = $props();
</script>

<th
	class="sortable-header {className}"
	scope="col"
	data-accent={accent}
	data-align={align}
	aria-sort={ariaSort(active, order)}
>
	<button class="sort-button" type="button" onclick={onsort}>
		{label}
		<span class="sort-indicator" aria-hidden="true">
			{#if active}{order === 'asc' ? '↑' : '↓'}{/if}
		</span>
	</button>
</th>

<style>
	.sortable-header {
		cursor: pointer;
		user-select: none;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	/* Mixed into the opaque header colour: the header is sticky, so any
	   translucent fill lets the scrolling rows read through it. */
	.sortable-header[data-accent='primary']:hover {
		background-color: color-mix(
			in oklab,
			var(--color-primary-500) 15%,
			var(--surface-card-elevated)
		);
	}

	.sortable-header[data-accent='neutral']:hover {
		background-color: color-mix(
			in oklab,
			var(--color-surface-50) 10%,
			var(--surface-card-elevated)
		);
	}

	.sortable-header[data-accent='arbiter']:hover {
		background-color: color-mix(
			in oklab,
			var(--sentiment-arbiter) 15%,
			var(--surface-card-elevated)
		);
	}

	.sort-button {
		align-items: center;
		appearance: none;
		background: none;
		border: 0;
		color: inherit;
		cursor: pointer;
		display: flex;
		font: inherit;
		font-weight: inherit;
		gap: var(--space-1);
		padding: 0;
		text-align: inherit;
		width: 100%;
	}

	.sortable-header[data-align='center'] .sort-button {
		justify-content: center;
	}

	.sort-button:focus-visible {
		outline: 2px solid var(--color-primary-400);
		outline-offset: 3px;
	}

	.sort-indicator {
		display: inline-block;
		min-width: 1ch;
	}

	@media (prefers-reduced-motion: reduce) {
		.sortable-header {
			transition: none;
		}
	}
</style>
