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
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
	}

	.header-skeleton {
		height: 8rem;
		border-radius: var(--radius-2xl);
	}

	.filter-skeleton {
		height: var(--size-control-xl);
		animation: skeletonPulse 1.6s ease-in-out infinite;
	}

	.content-skeleton-inner {
		height: 24rem;
		border-radius: var(--radius-2xl);
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
			var(--surface-hover) 50%,
			transparent 100%
		);
		animation: shimmer 1.6s infinite;
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
		gap: var(--space-3);
		padding: var(--space-4) var(--space-5);
		background: var(--surface-card);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 22%, transparent);
		border-radius: var(--radius-xl);
		box-shadow: var(--elevation-card);
	}

	.loading-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-icon-xl);
		height: var(--size-icon-xl);
		border-radius: var(--radius-md);
		background: color-mix(in oklab, var(--color-primary-500) 14%, transparent);
		color: var(--color-primary-300);
	}

	.loading-text {
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-medium);
		color: var(--text-primary);
	}

	/* Animate spin for loader icon */
	.loading-container :global(.animate-spin) {
		animation: spin 0.9s linear infinite;
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
			padding: var(--space-3-5) var(--space-4);
		}

		.loading-text {
			font-size: var(--font-size-base);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-container {
			animation: none;
		}

		.skeleton-shimmer {
			animation: none;
			background: var(--surface-subtle);
		}

		.filter-skeleton {
			animation: none;
		}

		.loading-container :global(.animate-spin) {
			animation: none;
		}
	}
</style>
