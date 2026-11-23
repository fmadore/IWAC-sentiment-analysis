<!-- Shared prompt modal shell used by AnalysisInfo and ArbiterMethodology -->
<script lang="ts">
	import CopyLinkButton from '#lib/components/ui/CopyLinkButton.svelte';
	import type { Snippet } from 'svelte';
	import { t } from '#lib/i18n/index.js';

	interface PromptModalProps {
		open: boolean;
		onClose: () => void;
		title: Snippet;
		children: Snippet;
	}

	let { open, onClose, title, children }: PromptModalProps = $props();

	let dialog = $state<HTMLDialogElement>();
	const titleId = $props.id();

	// Keep Tab inside the panel rather than letting it leave for the browser
	// chrome (same contract as FullScreenModal).
	function containFocus(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !dialog) return;
		const controls = Array.from(
			dialog.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => el.getClientRects().length > 0);
		const first = controls[0],
			last = controls.at(-1);
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
	}

	// The dialog element itself is the full-viewport scrim and the panel sits
	// inside it, so a click whose target is the dialog landed on the scrim.
	function closeOnScrim(event: MouseEvent) {
		if (event.target === event.currentTarget) onClose();
	}

	// Native modality moves focus in, traps it and makes the page behind inert.
	// Focus is returned explicitly because `{#if open}` removes the dialog on
	// close, and the body's own overflow is restored rather than blanked.
	$effect(() => {
		if (open && dialog) {
			const opener = document.activeElement;
			const activeDialog = dialog;
			const previousOverflow = document.body.style.overflow;
			activeDialog.showModal();
			document.body.style.overflow = 'hidden';
			return () => {
				activeDialog.close();
				document.body.style.overflow = previousOverflow;
				if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
			};
		}
	});
</script>

{#if open}
	<!-- The scrim click is a pointer convenience; Escape (oncancel) and the two
	     close buttons are the keyboard paths. -->
	<dialog
		bind:this={dialog}
		class="prompt-modal-backdrop"
		aria-labelledby={titleId}
		onclick={closeOnScrim}
		onkeydown={containFocus}
		oncancel={(event) => {
			event.preventDefault();
			onClose();
		}}
	>
		<div class="prompt-modal">
			<div class="prompt-modal-header">
				<h3 id={titleId} class="prompt-modal-title">
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
				<CopyLinkButton />
				<button class="close-btn" onclick={onClose} type="button">
					{$t.common.close}
				</button>
			</div>
		</div>
	</dialog>
{/if}

<style>
	/* The dialog is the scrim: it fills the viewport and centres the panel. The
	   native ::backdrop is cleared so the scrim is not painted twice. */
	.prompt-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		color: var(--text-primary);
		background: var(--scrim-strong);
		animation: fadeIn var(--timing-fast) var(--easing-default);
	}

	/* Only when open: a class would otherwise beat the UA's
	   `dialog:not([open]) { display: none }`. */
	.prompt-modal-backdrop[open] {
		display: flex;
	}

	.prompt-modal-backdrop::backdrop {
		background: transparent;
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
		position: relative;
		width: 100%;
		max-width: 850px;
		max-height: 95vh;
		display: flex;
		flex-direction: column;
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-panel);
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
		background: var(--accent);
	}

	.prompt-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
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
		flex-shrink: 0;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-panel);
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
		padding: var(--space-4);
	}

	.prompt-modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--border-subtle);
		background: var(--surface-subtle);
	}

	.close-btn {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		background: var(--accent);
		border: 1px solid var(--accent);
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

	@media (min-width: 640px) {
		.prompt-modal {
			max-height: 90vh;
			border-radius: var(--radius-panel);
		}

		.prompt-modal-header {
			padding: var(--space-5) var(--space-6);
		}

		.prompt-modal-body {
			padding: var(--space-6);
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
