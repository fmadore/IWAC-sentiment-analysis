<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import type { ComponentProps } from 'svelte';
	import type { EChartsOption, LegendComponentOption } from 'echarts';
	import { chartInteractionsState } from '$lib/stores/chart-interactions.svelte';
	import { uiState } from '$lib/stores/ui.svelte';
	let { chartId, options, ...props }: ComponentProps<typeof Chart> & { chartId: string } = $props();
	const interaction = $derived(chartInteractionsState[uiState.activeView]?.[chartId]);
	const legends = $derived(
		Array.isArray(options.legend) ? options.legend : options.legend ? [options.legend] : []
	);
	const names = $derived.by(() => {
		const declared = legends.flatMap((legend) =>
			(legend.data ?? []).map((entry) => (typeof entry === 'string' ? entry : (entry.name ?? '')))
		);
		if (declared.length > 0) return declared;
		// ECharts also generates legends implicitly from series and pie-slice names.
		const series = Array.isArray(options.series)
			? options.series
			: options.series
				? [options.series]
				: [];
		return series.flatMap((item) =>
			item.type === 'pie'
				? (item.data ?? []).flatMap((datum) =>
						datum && typeof datum === 'object' && 'name' in datum ? [String(datum.name)] : []
					)
				: item.name
					? [String(item.name)]
					: []
		);
	});
	const restoredOptions = $derived.by((): EChartsOption => {
		const hidden = interaction?.hidden;
		const legend = legends.map((item): LegendComponentOption => ({
			...item,
			...(hidden
				? { selected: Object.fromEntries(names.map((name, i) => [name, !hidden.includes(i)])) }
				: {})
		}));
		const zoom = interaction?.zoom;
		const dataZoom =
			options.dataZoom && (Array.isArray(options.dataZoom) ? options.dataZoom : [options.dataZoom]);
		return {
			...options,
			...(options.legend ? { legend } : {}),
			...(dataZoom && zoom
				? { dataZoom: dataZoom.map((item) => ({ ...item, start: zoom[0], end: zoom[1] })) }
				: {})
		};
	});
	function save(patch: { hidden?: number[]; zoom?: [number, number] }) {
		const view = uiState.activeView;
		chartInteractionsState[view] ??= {};
		chartInteractionsState[view][chartId] = { ...interaction, ...patch };
	}
	function legendChanged(event: unknown) {
		const { selected } = event as { selected?: Record<string, boolean> };
		if (selected)
			save({ hidden: names.flatMap((name, i) => (selected[name] === false ? [i] : [])) });
	}
	function zoomChanged(event: unknown) {
		const data = event as {
			start?: number;
			end?: number;
			batch?: { start: number; end: number }[];
		};
		const { start, end } = data.batch?.[0] ?? data;
		if (typeof start === 'number' && typeof end === 'number') {
			save({ zoom: [Number(start.toFixed(3)), Number(end.toFixed(3))] });
		}
	}
</script>

<Chart
	{...props}
	options={restoredOptions}
	silent={true}
	onlegendselectchanged={legendChanged}
	ondatazoom={zoomChanged}
/>
