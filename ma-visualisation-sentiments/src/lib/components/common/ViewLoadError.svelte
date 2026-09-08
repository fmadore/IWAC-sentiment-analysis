<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<div role="alert" class="view-load-error">
	<p>{$t.audit.viewLoadError}</p>
	<button type="button" onclick={() => window.location.reload()}>{$t.audit.reload}</button>
</div>

<style>
	.view-load-error {
		padding: var(--space-4);
		color: var(--text-primary);
	}
	button {
		margin-top: var(--space-3);
		background: var(--surface-card);
		color: inherit;
		border: 1px solid var(--border-strong);
		padding: var(--space-2) var(--space-4);
		cursor: pointer;
	}
	button:hover {
		background: var(--surface-card-hover);
	}
	button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
</style>
