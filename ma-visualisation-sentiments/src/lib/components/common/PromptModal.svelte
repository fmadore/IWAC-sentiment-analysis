<!-- Shared prompt modal shell used by AnalysisInfo and ArbiterMethodology -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n';

	interface PromptModalProps {
		open: boolean;
		onClose: () => void;
		title: Snippet;
		children: Snippet;
	}

	let { open, onClose, title, children }: PromptModalProps = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="prompt-modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-labelledby="prompt-modal-title"
		onclick={onClose}
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="prompt-modal"
			role="document"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="prompt-modal-header">
				<h3 id="prompt-modal-title" class="prompt-modal-title">
					{@render title()}
				</h3>
				<button
					class="modal-close-btn"
					onclick={onClose}
					aria-label={$t.common.close}
					type="button"
				>
					✕
				</button>
			</div>

			<div class="prompt-modal-body">
				{@render children()}
			</div>

			<div class="prompt-modal-footer">
				<button class="close-btn" onclick={onClose} type="button">
					{$t.common.close}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.prompt-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		background: color-mix(in oklab, black 70%, transparent);
		animation: fadeIn var(--timing-fast) var(--easing-default);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.prompt-modal {
		width: 100%;
		max-width: 850px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-xl);
		animation: scaleIn var(--timing-normal) var(--easing-default);
		overflow: hidden;
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.prompt-modal::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--chrome-accent);
	}

	.prompt-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
		background: var(--surface-subtle);
	}

	.prompt-modal-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.modal-close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-sm);
		height: var(--size-control-sm);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		cursor: pointer;
		transition:
			background var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default),
			transform var(--timing-fast) var(--easing-default);
	}

	.modal-close-btn:hover {
		background: var(--surface-active);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.prompt-modal-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-6);
	}

	.prompt-modal-footer {
		display: flex;
		justify-content: flex-end;
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--border-subtle);
		background: var(--surface-subtle);
	}

	.close-btn {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: var(--chrome-accent);
		border: 1px solid var(--chrome-accent);
		color: var(--app-bg);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.close-btn:hover {
		background: var(--text-primary);
		border-color: var(--text-primary);
	}

	@media (max-width: 640px) {
		.prompt-modal {
			max-height: 95vh;
			border-radius: var(--radius-xl);
		}

		.prompt-modal-header {
			padding: var(--space-4);
		}

		.prompt-modal-body {
			padding: var(--space-4);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.prompt-modal-backdrop,
		.prompt-modal {
			animation: none;
		}

		.modal-close-btn,
		.close-btn {
			transition: none;
		}
	}
</style>
