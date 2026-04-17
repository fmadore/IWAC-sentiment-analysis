<!--
  GlassCard Component
  
  A reusable glass morphism card container with multiple variants.
  Provides consistent styling across the application.
  
  Usage:
  <GlassCard>
    Content here
  </GlassCard>
  
  <GlassCard variant="large" hover>
    Chart content
  </GlassCard>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardVariant = 'default' | 'large' | 'extreme' | 'subtle';

	interface GlassCardProps {
		/** Visual variant */
		variant?: CardVariant;
		/** Enable hover lift effect */
		hover?: boolean;
		/** Enable gradient border on hover */
		gradientBorder?: boolean;
		/** Padding size */
		padding?: 'none' | 'sm' | 'md' | 'lg';
		/** Card content */
		children: Snippet;
		/** Additional CSS class */
		class?: string;
	}

	let {
		variant = 'default',
		hover = false,
		gradientBorder = false,
		padding = 'md',
		children,
		class: className = ''
	}: GlassCardProps = $props();
</script>

<div
	class="glass-card {className}"
	data-variant={variant}
	data-hover={hover}
	data-gradient-border={gradientBorder}
	data-padding={padding}
>
	{@render children()}
</div>

<style>
	.glass-card {
		position: relative;
		background: var(--surface-card);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-2xl);
		box-shadow: var(--elevation-card);
		transition:
			border-color var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-normal) var(--easing-default),
			transform var(--timing-normal) var(--easing-default);
	}

	/* Padding variants */
	.glass-card[data-padding='none'] {
		padding: 0;
	}
	.glass-card[data-padding='sm'] {
		padding: var(--space-3);
	}
	.glass-card[data-padding='md'] {
		padding: var(--space-4);
	}
	.glass-card[data-padding='lg'] {
		padding: var(--space-6);
	}

	/* Hover effects */
	.glass-card[data-hover='true']:hover {
		border-color: var(--border-hover);
		transform: translateY(-2px);
		box-shadow: var(--elevation-card-hover);
	}

	/* Gradient border effect */
	.glass-card[data-gradient-border='true']::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 10%,
			var(--border-active) 50%,
			transparent 90%
		);
		opacity: 0.5;
		border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
	}

	.glass-card[data-gradient-border='true']:hover::before {
		opacity: 0.8;
	}

	/* Large variant - more prominent */
	.glass-card[data-variant='large'] {
		background: var(--surface-card-elevated);
		backdrop-filter: blur(var(--glass-blur-lg));
		border-radius: var(--radius-3xl);
	}

	.glass-card[data-variant='large'][data-padding='md'] {
		padding: var(--space-6);
	}
	.glass-card[data-variant='large'][data-padding='lg'] {
		padding: var(--space-8);
	}

	/* Extreme variant - for extreme analysis view */
	.glass-card[data-variant='extreme'] {
		background: var(--surface-card-elevated);
		backdrop-filter: blur(var(--glass-blur-xl));
		border-color: var(--border-default);
	}

	/* Subtle variant - less prominent */
	.glass-card[data-variant='subtle'] {
		background: color-mix(in oklab, var(--color-surface-900) 55%, transparent);
		backdrop-filter: blur(var(--glass-blur-sm));
		box-shadow: var(--shadow-sm);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.glass-card[data-padding='md'] {
			padding: var(--space-3-5);
		}
		.glass-card[data-padding='lg'] {
			padding: var(--space-5);
		}
		.glass-card[data-variant='large'][data-padding='md'] {
			padding: var(--space-5);
		}
		.glass-card[data-variant='large'][data-padding='lg'] {
			padding: var(--space-6);
		}
	}

	@media (max-width: 480px) {
		.glass-card[data-padding='md'] {
			padding: var(--space-3);
		}
		.glass-card[data-padding='lg'] {
			padding: var(--space-4);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.glass-card {
			transition: none;
			transform: none !important;
		}
	}
</style>
