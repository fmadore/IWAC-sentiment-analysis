import { getContext, onDestroy, setContext } from 'svelte';

/**
 * Chart titles belong in the DOM, not in the canvas: an ECharts `title` is
 * invisible to screen readers and cannot be selected. A chart registers its
 * title with the enclosing `ChartCard`, which renders it as the card's `<h2>`
 * (plus subtitle), so call sites need not compute the title themselves.
 *
 * Only the first chart inside a card claims its header. A chart outside any
 * card, or a second chart in the same card, gets `inCard: false` and renders
 * its own heading (`viz/ChartHeading.svelte`).
 */
export interface ChartHeadingContent {
	title: string;
	subtitle?: string;
}

const KEY = Symbol('chart-card-heading');

class ChartCardHeadingSlot {
	source = $state<(() => ChartHeadingContent) | null>(null);

	get content(): ChartHeadingContent | null {
		return this.source ? this.source() : null;
	}
}

/** Called by `ChartCard`: opens a header slot for one chart below it. */
export function provideChartCardHeading(): ChartCardHeadingSlot {
	const slot = new ChartCardHeadingSlot();
	setContext(KEY, slot);
	return slot;
}

/** Called by a chart during initialisation. Read the getter reactively. */
export function useChartCardHeading(source: () => ChartHeadingContent): {
	readonly inCard: boolean;
} {
	const slot = getContext<ChartCardHeadingSlot | undefined>(KEY);
	if (!slot || slot.source) return { inCard: false };
	slot.source = source;
	onDestroy(() => {
		if (slot.source === source) slot.source = null;
	});
	return { inCard: true };
}
