<!--
  ErrorNotice

  The one recipe for a failed or missing thing with a remedy: a `role="alert"`
  panel in the shared `.alert-error` dress with a leading icon, the message,
  optional detail, and a single action button. ViewLoadError,
  ResourceLoadError, DatasetLoadError and DetailLinkNotice used to style four
  different retry buttons; they are thin wrappers over this now.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';

	interface Props {
		message: string;
		actionLabel: string;
		onAction: () => unknown;
		/** Disables the action and marks the panel busy while it runs. */
		busy?: boolean;
		/** Extra lines under the message (names, a technical detail). */
		children?: Snippet;
	}

	let { message, actionLabel, onAction, busy = false, children }: Props = $props();
</script>

<div class="alert alert-error error-notice" role="alert" aria-busy={busy}>
	<span class="error-icon" aria-hidden="true"><CircleAlert size={18} /></span>
	<div class="error-body">
		<p class="error-message">{message}</p>
		{@render children?.()}
		<button type="button" class="error-action" onclick={onAction} disabled={busy}>
			{actionLabel}
		</button>
	</div>
</div>

<style>
	.error-notice {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--gap-stack);
	}

	.error-icon {
		display: inline-flex;
		flex-shrink: 0;
		margin-top: var(--space-0-5);
		color: var(--status-error);
	}

	.error-body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
		min-width: 0;
	}

	.error-message {
		margin: 0;
		color: var(--text-primary);
	}

	.error-action {
		display: inline-flex;
		align-items: center;
		min-height: var(--size-control-lg);
		margin-top: var(--space-1);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-panel);
		background: var(--surface-card);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.error-action:hover:not(:disabled) {
		background: var(--surface-card-hover);
	}

	.error-action:disabled {
		cursor: progress;
		opacity: 0.7;
	}

	@media (prefers-reduced-motion: reduce) {
		.error-action {
			transition: none;
		}
	}
</style>
