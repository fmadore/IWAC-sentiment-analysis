<script lang="ts">
	import FullscreenIcon from '@lucide/svelte/icons/maximize';
	import MinimizeIcon from '@lucide/svelte/icons/minimize';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';
	import { LanguageSwitcher, DatasetPicker } from '$lib/components/ui';
	import { mobileMenuOpen } from '$lib/stores';

	let isFullscreen = $state(false);

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.error(`Error attempting to enable fullscreen: ${err.message}`);
			});
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
	}

	onMount(() => {
		// Set initial fullscreen state
		isFullscreen = !!document.fullscreenElement;

		// Listen for fullscreen change events
		const handleFullscreenChange = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		// Cleanup on unmount
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	});
</script>

<header class="app-header sticky top-0">
	<div class="header-toolbar">
		<!-- Lead: Logo/Brand Section -->
		<div class="header-lead">
			<!-- Mobile Menu Toggle -->
			<button
				class="mobile-menu-btn"
				onclick={() => ($mobileMenuOpen = !$mobileMenuOpen)}
				aria-label={$mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
				aria-expanded={$mobileMenuOpen}
			>
				{#if $mobileMenuOpen}
					<XIcon size={22} />
				{:else}
					<MenuIcon size={22} />
				{/if}
			</button>

			<div class="brand-text">
				<span class="brand-title">{$t.appTitle}</span>
				<span class="brand-subtitle hidden sm:block">{$t.appSubtitle}</span>
			</div>
		</div>

		<!-- Headline: Center Section with Dataset Picker (desktop only) -->
		<div class="header-headline hidden md:flex">
			<DatasetPicker />
		</div>

		<!-- Trail: Actions Section -->
		<div class="header-trail">
			<div class="md:hidden">
				<DatasetPicker />
			</div>
			<LanguageSwitcher />
			{#if browser}
				<button
					class="fullscreen-btn"
					onclick={toggleFullscreen}
					title={isFullscreen ? $t.exitFullscreen : $t.enterFullscreen}
					aria-label={isFullscreen ? $t.exitFullscreen : $t.enterFullscreen}
				>
					<div class="btn-content">
						{#if isFullscreen}
							<MinimizeIcon size={20} />
						{:else}
							<FullscreenIcon size={20} />
						{/if}
					</div>
				</button>
			{/if}
		</div>
	</div>
</header>

<style>
	/* App Header — opaque editorial bar, no backdrop blur. */
	.app-header {
		z-index: var(--z-header);
		background: var(--app-bg-elevated);
		border-bottom: 1px solid var(--border-subtle);
		box-shadow: var(--elevation-sticky);
		position: sticky;
	}

	/* Header Toolbar - Grid Layout */
	.header-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		max-width: 1400px;
		margin: 0 auto;
		position: relative;
	}

	@media (min-width: 768px) {
		.header-toolbar {
			display: grid;
			grid-template-columns: 1fr auto 1fr;
		}
	}

	.header-lead {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	/* Mobile Menu Button — restrained, tonal instead of glowing gradient */
	.mobile-menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-lg);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-primary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
		flex-shrink: 0;
	}

	.mobile-menu-btn:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}

	@media (min-width: 1024px) {
		.mobile-menu-btn {
			display: none;
		}
	}

	/* Headline Section (Center) */
	.header-headline {
		align-items: center;
		justify-content: center;
	}

	/* Trail Section */
	.header-trail {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		justify-content: flex-end;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-0-5);
	}

	/* Brand: Source Serif 4 for the project name (reads as "research artefact"
	   not "product name"); JetBrains Mono for the subtitle (wire-service caption). */
	.brand-title {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
		line-height: var(--line-height-tight);
		letter-spacing: var(--tracking-tight);
	}

	.brand-subtitle {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 400;
		color: var(--text-muted);
		line-height: var(--line-height-snug);
		letter-spacing: var(--tracking-normal);
		max-width: 320px;
	}

	/* Fullscreen Button */
	.fullscreen-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		border-radius: var(--radius-md);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
		flex-shrink: 0;
	}

	.fullscreen-btn:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.btn-content {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.header-toolbar {
			padding: var(--space-2) var(--space-3);
			gap: var(--space-2);
		}

		.header-lead {
			gap: var(--space-2);
		}

		.fullscreen-btn {
			width: var(--size-control-sm);
			height: var(--size-control-sm);
		}

		.brand-title {
			font-size: var(--font-size-base);
		}

		.header-trail {
			gap: var(--space-1-5);
		}
	}

	@media (max-width: 480px) {
		.header-toolbar {
			padding: var(--space-2);
			gap: var(--space-1);
		}

		.header-lead {
			gap: var(--space-1-5);
		}

		.brand-title {
			font-size: var(--font-size-sm);
		}

		.header-trail {
			gap: var(--space-1);
		}
	}

	@media (min-width: 1024px) {
		.header-toolbar {
			padding: var(--space-3-5) var(--space-8);
			gap: var(--space-6);
		}

		.brand-title {
			font-size: var(--font-size-2xl);
		}

		.brand-subtitle {
			font-size: var(--font-size-sm);
			max-width: 320px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.fullscreen-btn,
		.mobile-menu-btn {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.fullscreen-btn {
			border-width: 2px;
		}
	}
</style>
