<!--
  ModelPairPicker

  Two native selects — first model, second model — rather than one menu of
  every pair. With fifteen pairs in the current panel the old trigger showed two
  logos and "vs" with no names, its aria-label replaced that content so the
  current pair was never announced, and the menu was a listbox without the
  keyboard model a listbox promises. A native select brings its own keyboard,
  touch and screen-reader behaviour, and the names are always visible.

  The pair is resolved through the contract's pairs, never by splitting an id
  on "-" (a v2 model id contains a hyphen). Only pairs of the generation on
  screen are offered: a pair across the prompt rewrite is not a comparison
  between models.
-->
<script lang="ts">
	import { datasetState, uiState } from '#lib/stores/index.js';
	import { getModelsFromPair, type DatasetId, type ModelPair } from '#lib/types/data.js';
	import { t } from '#lib/i18n/index.js';
	import { asset } from '$app/paths';
	import { updateURL } from '#lib/stores/url/index.js';

	let pairs = $derived(datasetState.pairsInGeneration);
	let models = $derived(datasetState.availableInGeneration);

	const uid = $props.id();

	/** The contract pair joining two models, in either order. */
	function pairOf(a: DatasetId, b: DatasetId): ModelPair | undefined {
		return pairs.find((pair) => {
			const [x, y] = getModelsFromPair(pair);
			return (x === a && y === b) || (x === b && y === a);
		});
	}

	/**
	 * Which member the reader put first. The contract fixes each pair's own
	 * order, so without this a choice could swap the two selects under the
	 * reader's hand when the contract lists that pair the other way round.
	 */
	let anchor = $state<DatasetId | null>(null);

	let members = $derived(getModelsFromPair(datasetState.pair));
	let first = $derived<DatasetId>(anchor && members.includes(anchor) ? anchor : members[0]);
	let second = $derived<DatasetId>(members[0] === first ? members[1] : members[0]);

	/** Models that form a published pair with the first model. */
	let partners = $derived(models.filter((model) => model.id !== first && pairOf(first, model.id)));

	function apply(a: DatasetId, b: DatasetId) {
		const pair = pairOf(a, b);
		if (!pair) return;
		anchor = a;
		if (pair !== datasetState.pair) {
			datasetState.pair = pair;
			updateURL(uiState.activeView);
		}
	}

	function changeFirst(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value as DatasetId;
		const keep = value !== second && pairOf(value, second);
		const partner = keep
			? second
			: models.find((model) => model.id !== value && pairOf(value, model.id))?.id;
		if (partner) apply(value, partner);
	}

	function changeSecond(event: Event) {
		apply(first, (event.currentTarget as HTMLSelectElement).value as DatasetId);
	}

	function logoOf(id: DatasetId) {
		return datasetState.getById(id)?.logo;
	}
</script>

<div class="model-pair-picker" role="group" aria-label={$t.comparison.selectModelPair}>
	<div class="pair-field">
		<label class="pair-label" for="{uid}-first">{$t.pairPicker.first}</label>
		<span class="pair-control">
			{#if logoOf(first)}
				<img src={asset(logoOf(first)!)} alt="" class="pair-logo" />
			{/if}
			<select
				id="{uid}-first"
				class="select select-sm pair-select"
				value={first}
				onchange={changeFirst}
			>
				{#each models as model (model.id)}
					<option value={model.id}>{model.name}</option>
				{/each}
			</select>
		</span>
	</div>

	<span class="vs-label" aria-hidden="true">{$t.comparison.versus}</span>

	<div class="pair-field">
		<label class="pair-label" for="{uid}-second">{$t.pairPicker.second}</label>
		<span class="pair-control">
			{#if logoOf(second)}
				<img src={asset(logoOf(second)!)} alt="" class="pair-logo" />
			{/if}
			<select
				id="{uid}-second"
				class="select select-sm pair-select"
				value={second}
				onchange={changeSecond}
			>
				{#each partners as model (model.id)}
					<option value={model.id}>{model.name}</option>
				{/each}
			</select>
		</span>
	</div>
</div>

<style>
	.model-pair-picker {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-2) var(--space-3);
		max-width: 100%;
		min-width: 0;
	}

	.pair-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		max-width: 100%;
	}

	.pair-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
	}

	.pair-control {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.pair-select {
		min-height: var(--size-control-lg);
		min-width: 0;
		max-width: 100%;
	}

	.pair-logo {
		width: var(--space-5);
		height: var(--space-5);
		object-fit: contain;
		flex-shrink: 0;
	}

	.vs-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--sentiment-comparison-light);
		padding-bottom: var(--space-3);
	}
</style>
