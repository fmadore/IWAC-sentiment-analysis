<script lang="ts">
	import { t } from '$lib/i18n';
	import { datasetState } from '$lib/stores/datasets.svelte';
	import { loadSpecificDataset } from '$lib/stores/articles.svelte';
	import type { DatasetId } from '$lib/types/data';
	let { ids }: { ids: readonly DatasetId[] } = $props();
	let retrying = $state(false);
	async function retry() {
		retrying = true;
		try {
			await Promise.allSettled(
				ids.map((id) => loadSpecificDataset(id, fetch, { showLoading: false }))
			);
		} finally {
			retrying = false;
		}
	}
</script>

<div role="alert" class="load-error">
	<p>{$t.messages.dataLoadError}</p>
	<p>{ids.map((id) => datasetState.getById(id)?.name ?? id).join(', ')}</p>
	<button type="button" onclick={retry} disabled={retrying}>{$t.messages.retry}</button>
</div>

<style>
	.load-error {
		padding: var(--space-4);
		border: 1px solid var(--status-error);
	}
	button {
		margin-top: var(--space-3);
		padding: var(--space-2) var(--space-4);
		background: var(--surface-card);
		color: var(--text-primary);
		border: 1px solid var(--border-strong);
		cursor: pointer;
	}
	button:hover {
		background: var(--surface-card-hover);
	}
	button:focus-visible {
		outline: 2px solid var(--text-primary);
		outline-offset: 2px;
	}
</style>
