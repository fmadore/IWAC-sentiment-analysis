<!--
  ResourceLoadError

  The failed-load state for an optional payload (extreme analysis, the map,
  either arbiter). Distinct from an empty state on purpose: "this was never
  published" and "this failed to load" read the same on screen otherwise, and
  only the second has a remedy. `onRetry` is the resource's explicit retry.
-->
<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import ErrorNotice from './ErrorNotice.svelte';

	interface Props {
		/** The error the load ended in, shown on demand for a bug report. */
		error: Error;
		/** Re-run the load; the button is disabled while it runs. */
		onRetry: () => Promise<unknown>;
	}

	let { error, onRetry }: Props = $props();
	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			await onRetry();
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
	<details class="error-details">
		<summary>{$t.messages.error}</summary>
		<code>{error.message}</code>
	</details>
</ErrorNotice>

<style>
	.error-details {
		color: var(--text-secondary);
	}
	code {
		overflow-wrap: anywhere;
	}
</style>
