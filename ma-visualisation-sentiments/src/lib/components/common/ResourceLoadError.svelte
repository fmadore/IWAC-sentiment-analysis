<!--
  ResourceLoadError

  The failed-load state for an optional payload (extreme analysis, the map,
  either arbiter). Distinct from an empty state on purpose: "this was never
  published" and "this failed to load" read the same on screen otherwise, and
  only the second has a remedy. `onRetry` is the resource's explicit retry.
-->
<script lang="ts">
	import { t } from '$lib/i18n';

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

<div role="alert" class="load-error">
	<p>{$t.messages.dataLoadError}</p>
	<details>
		<summary>{$t.messages.error}</summary>
		<code>{error.message}</code>
	</details>
	<button type="button" onclick={retry} disabled={retrying}>{$t.messages.retry}</button>
</div>

<style>
	.load-error {
		padding: var(--space-4);
		border: 1px solid var(--status-error);
		color: var(--text-primary);
	}
	details {
		margin-top: var(--space-2);
		color: var(--text-secondary);
	}
	code {
		overflow-wrap: anywhere;
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
	button:disabled {
		cursor: progress;
	}
	button:focus-visible {
		outline: 2px solid var(--text-primary);
		outline-offset: 2px;
	}
</style>
