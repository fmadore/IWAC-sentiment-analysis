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
		background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		border-radius: 1rem;
		box-shadow:
			0 4px 24px color-mix(in oklab, black 10%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
		transition: all var(--timing-normal) var(--easing-default);
	}

	/* Padding variants */
	.glass-card[data-padding='none'] {
		padding: 0;
	}
	.glass-card[data-padding='sm'] {
		padding: 0.75rem;
	}
	.glass-card[data-padding='md'] {
		padding: 1rem;
	}
	.glass-card[data-padding='lg'] {
		padding: 1.5rem;
	}

	/* Hover effects */
	.glass-card[data-hover='true']:hover {
		border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
		transform: translateY(-2px);
		box-shadow:
			0 8px 32px color-mix(in oklab, black 15%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
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
			var(--color-surface-50) 50%,
			transparent 90%
		);
		opacity: 0.15;
		border-radius: 1rem 1rem 0 0;
	}

	.glass-card[data-gradient-border='true']:hover::before {
		opacity: 0.25;
	}

	/* Large variant - more prominent */
	.glass-card[data-variant='large'] {
		background: color-mix(in oklab, var(--color-surface-900) 90%, transparent);
		backdrop-filter: blur(var(--glass-blur-lg));
		border-radius: 1.25rem;
	}

	.glass-card[data-variant='large'][data-padding='md'] {
		padding: 1.5rem;
	}
	.glass-card[data-variant='large'][data-padding='lg'] {
		padding: 2rem;
	}

	/* Extreme variant - for extreme analysis view */
	.glass-card[data-variant='extreme'] {
		background: color-mix(in oklab, var(--color-surface-900) 92%, transparent);
		backdrop-filter: blur(var(--glass-blur-xl));
		border-color: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
	}

	/* Subtle variant - less prominent */
	.glass-card[data-variant='subtle'] {
		background: color-mix(in oklab, var(--color-surface-900) 70%, transparent);
		backdrop-filter: blur(var(--glass-blur-sm));
		box-shadow: 0 2px 12px color-mix(in oklab, black 5%, transparent);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.glass-card[data-padding='md'] {
			padding: 0.875rem;
		}
		.glass-card[data-padding='lg'] {
			padding: 1.25rem;
		}
		.glass-card[data-variant='large'][data-padding='md'] {
			padding: 1.25rem;
		}
		.glass-card[data-variant='large'][data-padding='lg'] {
			padding: 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.glass-card[data-padding='md'] {
			padding: 0.75rem;
		}
		.glass-card[data-padding='lg'] {
			padding: 1rem;
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
