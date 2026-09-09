<script lang="ts">
	let {
		options,
		onlegendselectchanged,
		ondatazoom
	}: {
		options: unknown;
		onlegendselectchanged: (event: unknown) => void;
		ondatazoom: (event: unknown) => void;
	} = $props();
</script>

<div data-testid="chart-options" data-options={JSON.stringify(options)}></div>
<button onclick={() => onlegendselectchanged({ selected: { First: false, Second: true } })}
	>Hide first series</button
>
<button onclick={() => ondatazoom({ batch: [{ start: 12.34567, end: 89.76543 }] })}>Zoom</button>
