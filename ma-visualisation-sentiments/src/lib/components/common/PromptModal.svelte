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
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: color-mix(in oklab, var(--color-surface-950) 85%, transparent);
		backdrop-filter: blur(var(--glass-blur-sm));
		animation: fadeIn 0.2s var(--easing-default);
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
		background: color-mix(in oklab, var(--color-surface-900) 95%, transparent);
		backdrop-filter: blur(var(--glass-blur-lg));
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
		border-radius: 1rem;
		box-shadow:
			0 16px 64px color-mix(in oklab, black 30%, transparent),
			0 0 40px color-mix(in oklab, var(--color-primary-500) 10%, transparent);
		animation: scaleIn 0.25s var(--easing-default);
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
		background: linear-gradient(
			90deg,
			transparent,
			var(--color-primary-500),
			var(--color-secondary-500),
			transparent
		);
		opacity: 0.6;
	}

	.prompt-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		background: color-mix(in oklab, var(--color-surface-50) 3%, transparent);
	}

	.prompt-modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-surface-50);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.modal-close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
		border-radius: 0.5rem;
		color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
		font-size: 1rem;
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.modal-close-btn:hover {
		background: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
		color: var(--color-surface-50);
		transform: translateY(-1px);
	}

	.prompt-modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.prompt-modal-footer {
		display: flex;
		justify-content: flex-end;
		padding: 1rem 1.5rem;
		border-top: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		background: color-mix(in oklab, var(--color-surface-50) 2%, transparent);
	}

	.close-btn {
		padding: 0.5rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		background: linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500));
		border: none;
		border-radius: 0.5rem;
		color: white;
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.close-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary-500) 30%, transparent);
	}

	@media (max-width: 640px) {
		.prompt-modal {
			max-height: 95vh;
			border-radius: 0.875rem;
		}

		.prompt-modal-header {
			padding: 1rem;
		}

		.prompt-modal-body {
			padding: 1rem;
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
