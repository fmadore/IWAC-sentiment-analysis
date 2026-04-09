<!--
  LoadingState Component
  
  A reusable loading skeleton component that displays placeholder content
  while data is being fetched. Helps prevent Cumulative Layout Shift (CLS).
  
  Features:
  - Glass morphism styling consistent with design system
  - Animated shimmer effect on skeletons
  - Configurable filter and content skeletons
  - Reduced motion support
  
  Usage:
  <LoadingState message={$t.messages.loadingData} />
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import LoaderIcon from '@lucide/svelte/icons/loader';

	interface LoadingStateProps {
		/** Custom loading message (defaults to i18n loading message) */
		message?: string;
		/** Number of filter skeleton items to show */
		filterCount?: number;
		/** Whether to show filters skeleton */
		showFilters?: boolean;
		/** Whether to show content skeleton */
		showContent?: boolean;
		/** Whether to show header skeleton */
		showHeader?: boolean;
	}

	let {
		message,
		filterCount = 5,
		showFilters = true,
		showContent = true,
		showHeader = true
	}: LoadingStateProps = $props();

	// Use provided message or default to i18n
	let displayMessage = $derived(message ?? $t.messages.loadingData);
</script>

<div class="loading-container">
	<!-- Header skeleton to prevent CLS -->
	{#if showHeader}
		<div class="skeleton-item header-skeleton mb-4 sm:mb-6">
			<div class="skeleton-shimmer"></div>
		</div>
	{/if}

	<!-- Loading message card -->
	<div class="loading-message-card mb-4 sm:mb-6">
		<div class="loading-icon">
			<LoaderIcon size={20} class="animate-spin" />
		</div>
		<span class="loading-text">{displayMessage}</span>
	</div>

	<!-- Reserve space for filters -->
	{#if showFilters}
		<div class="filters-skeleton mb-4 sm:mb-6">
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
				{#each Array(filterCount) as _, i (i)}
					<div class="skeleton-item filter-skeleton" style="animation-delay: {i * 100}ms">
						<div class="skeleton-shimmer"></div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Reserve space for content -->
	{#if showContent}
		<div class="content-skeleton">
			<div class="skeleton-item content-skeleton-inner">
				<div class="skeleton-shimmer"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.loading-container {
		width: 100%;
		animation: fadeIn var(--timing-normal) var(--easing-default);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Skeleton base styles */
	.skeleton-item {
		position: relative;
		overflow: hidden;
		background: color-mix(in oklab, var(--color-surface-900) 80%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 8%, transparent);
		border-radius: 0.75rem;
	}

	.header-skeleton {
		height: 8rem;
		border-radius: 1rem;
	}

	.filter-skeleton {
		height: 2.75rem;
		animation: skeletonPulse 1.5s ease-in-out infinite;
	}

	.content-skeleton-inner {
		height: 24rem;
		border-radius: 1rem;
	}

	/* Shimmer effect */
	.skeleton-shimmer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			color-mix(in oklab, var(--color-surface-50) 5%, transparent) 50%,
			transparent 100%
		);
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	@keyframes skeletonPulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	/* Loading message card */
	.loading-message-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 20%, transparent);
		border-radius: 0.75rem;
		box-shadow:
			0 4px 16px color-mix(in oklab, black 10%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 5%, transparent);
	}

	.loading-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: color-mix(in oklab, var(--color-primary-500) 15%, transparent);
		color: var(--color-primary-400);
	}

	.loading-text {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-surface-50);
	}

	/* Animate spin for loader icon */
	.loading-container :global(.animate-spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 640px) {
		.header-skeleton {
			height: 6rem;
		}

		.content-skeleton-inner {
			height: 18rem;
		}

		.loading-message-card {
			padding: 0.875rem 1rem;
		}

		.loading-text {
			font-size: 0.875rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-container {
			animation: none;
		}

		.skeleton-shimmer {
			animation: none;
			background: color-mix(in oklab, var(--color-surface-50) 3%, transparent);
		}

		.filter-skeleton {
			animation: none;
		}

		.loading-container :global(.animate-spin) {
			animation: none;
		}
	}
</style>
