<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { datasetState } from '#lib/stores/datasets.svelte.js';
	import { loadSpecificDataset } from '#lib/stores/articles.svelte.js';
	import type { DatasetId } from '#lib/types/data.js';
	import ErrorNotice from './ErrorNotice.svelte';
	let { ids }: { ids: readonly DatasetId[] } = $props();
	let retrying = $state(false);
	async function retry() {
		retrying = true;
		try {
			await Promise.allSettled(
				ids.map((id) => loadSpecificDataset(id, fetch, { showLoading: false, force: true }))
			);
		} finally {
			retrying = false;
		}
	}
</script>

<ErrorNotice
	message={$t.messages.dataLoadError}
	actionLabel={$t.messages.retry}
	onAction={retry}
	busy={retrying}
>
	<p class="failed-names">{ids.map((id) => datasetState.getById(id)?.name ?? id).join(', ')}</p>
</ErrorNotice>

<style>
	.failed-names {
		margin: 0;
		color: var(--text-secondary);
	}
</style>
