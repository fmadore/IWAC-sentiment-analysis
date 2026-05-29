<!--
  FullScreenModal Component
  
  A full-screen modal component with glass morphism styling for detailed views.
  Provides a rich, immersive experience for article and comparison details.
  
  Features:
  - Full viewport coverage with glass morphism backdrop
  - Responsive header with title, subtitle, and close button
  - Scrollable content area with custom scrollbar
  - Keyboard navigation (Escape to close)
  - Reduced motion support
  
  Usage:
  <FullScreenModal 
    open={showModal} 
    onClose={() => showModal = false}
    title="Article Details"
    subtitle="Optional subtitle"
  >
    <YourContentComponent />
  </FullScreenModal>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	interface FullScreenModalProps {
		/** Whether the modal is open */
		open: boolean;
		/** Callback when the modal should close */
		onClose: () => void;
		/** Title displayed in the header */
		title: string;
		/** Optional subtitle/description */
		subtitle?: string;
		/** Optional header icon snippet */
		headerIcon?: Snippet;
		/** Optional header actions snippet (buttons, badges, etc.) */
		headerActions?: Snippet;
		/** The main content of the modal */
		children: Snippet;
		/** Accent color variant for the header line */
		accentVariant?: 'primary' | 'comparison' | 'extreme' | 'arbiter';
	}

	let {
		open,
		onClose,
		title,
		subtitle,
		headerIcon,
		headerActions,
		children,
		accentVariant = 'primary'
	}: FullScreenModalProps = $props();

	// Handle keyboard events
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		}
	}

	// Prevent scroll on body when modal is open
	$effect(() => {
		if (open && typeof document !== 'undefined') {
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = '';
			};
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fullscreen-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<!-- Glass backdrop -->
		<div class="fs-modal-backdrop" aria-hidden="true"></div>

		<!-- Modal container -->
		<div class="fs-modal-container">
			<!-- Header with accent line -->
			<header class="fs-modal-header" data-accent={accentVariant}>
				<div class="header-content">
					<!-- Back button and title -->
					<div class="header-left">
						<button class="back-button" onclick={onClose} title="Close" aria-label="Close modal">
							<ArrowLeftIcon size={20} />
							<span class="back-text">Back</span>
						</button>

						<div class="header-title-group">
							{#if headerIcon}
								<div class="header-icon">
									{@render headerIcon()}
								</div>
							{/if}
							<div class="header-text">
								<h1 id="modal-title" class="fs-modal-title">{title}</h1>
								{#if subtitle}
									<p class="fs-modal-subtitle">{subtitle}</p>
								{/if}
							</div>
						</div>
					</div>

					<!-- Header actions -->
					<div class="header-right">
						{#if headerActions}
							<div class="header-actions">
								{@render headerActions()}
							</div>
						{/if}
						<button class="close-button" onclick={onClose} title="Close" aria-label="Close modal">
							<XIcon size={24} />
						</button>
					</div>
				</div>
			</header>

			<!-- Scrollable content area -->
			<main class="fs-modal-content custom-scrollbar">
				<div class="content-wrapper">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
{/if}

<style>
	.fullscreen-modal {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		display: flex;
		flex-direction: column;
	}

	.fs-modal-backdrop {
		position: absolute;
		inset: 0;
		z-index: 0;
		background: var(--app-bg);
		animation: fadeIn var(--timing-normal) var(--easing-default);
	}

	.fs-modal-container {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		animation: slideUp var(--timing-normal) var(--easing-default);
	}

	/* Header styles */
	.fs-modal-header {
		position: relative;
		flex-shrink: 0;
		background: var(--surface-card-elevated);
		border-bottom: 1px solid var(--border-subtle);
	}

	/* Accent line variants */
	.fs-modal-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		opacity: 0.8;
	}

	.fs-modal-header[data-accent='primary']::before {
		background: var(--accent);
	}

	.fs-modal-header[data-accent='comparison']::before {
		background: var(--sentiment-comparison-light);
	}

	.fs-modal-header[data-accent='extreme']::before {
		background: var(--sentiment-extreme);
	}

	.fs-modal-header[data-accent='arbiter']::before {
		background: var(--sentiment-arbiter);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-6);
		max-width: 900px;
		margin: 0 auto;
		width: 100%;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		min-width: 0;
		flex: 1;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default),
			transform var(--timing-fast) var(--easing-default);
		flex-shrink: 0;
	}

	.back-button:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
		transform: translateX(-2px);
	}

	.back-text {
		display: none;
	}

	.header-title-group {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
	}

	.header-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-lg);
		background: color-mix(in oklab, var(--color-primary-500) 14%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 22%, transparent);
	}

	.header-text {
		min-width: 0;
	}

	.fs-modal-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		line-height: var(--line-height-snug);
		letter-spacing: var(--tracking-snug);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.fs-modal-subtitle {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		margin: var(--space-1) 0 0 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-shrink: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-md);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.close-button:hover {
		background: color-mix(in oklab, var(--color-error-500) 16%, transparent);
		border-color: color-mix(in oklab, var(--color-error-500) 36%, transparent);
		color: var(--color-error-300);
	}

	/* Content area */
	.fs-modal-content {
		flex: 1;
		overflow-y: auto;
		background: color-mix(in oklab, var(--color-surface-950) 60%, transparent);
	}

	.content-wrapper {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	/* Responsive adjustments */
	@media (min-width: 640px) {
		.back-text {
			display: inline;
		}

		.header-content {
			padding: var(--space-5) var(--space-8);
		}

		.fs-modal-title {
			font-size: var(--font-size-2xl);
		}

		.content-wrapper {
			padding: var(--space-8) var(--space-10);
		}
	}

	@media (min-width: 1024px) {
		.header-content {
			padding: var(--space-6) var(--space-12);
		}

		.content-wrapper {
			padding: var(--space-10) var(--space-12);
			max-width: 900px;
		}
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.header-content {
			padding: var(--space-3) var(--space-4);
			gap: var(--space-2);
		}

		.header-left {
			gap: var(--space-3);
		}

		.back-button {
			padding: var(--space-2);
		}

		.header-icon {
			width: var(--size-control-sm);
			height: var(--size-control-sm);
			border-radius: var(--radius-md);
		}

		.fs-modal-title {
			font-size: var(--font-size-base);
		}

		.fs-modal-subtitle {
			font-size: var(--font-size-xs);
		}

		.close-button {
			width: var(--size-control-md);
			height: var(--size-control-md);
		}

		.content-wrapper {
			padding: var(--space-4);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.fs-modal-backdrop,
		.fs-modal-container,
		.back-button,
		.close-button {
			animation: none;
			transition: none;
		}
	}

	/* Animations (defined in app.postcss but included here for completeness) */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
