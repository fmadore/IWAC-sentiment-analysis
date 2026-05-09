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
	/* GlassCard — name kept for API stability, but the visual is now a flat
	   editorial panel: opaque surface, hairline border, no backdrop-filter,
	   no hover lift. The component-level 'gradient border' decoration was
	   removed (decorative gradients are an AI design tell). */
	.glass-card {
		position: relative;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--elevation-card);
		transition: border-color var(--timing-fast) var(--easing-default);
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

	/* Hover — colour shift only, no transform */
	.glass-card[data-hover='true']:hover {
		border-color: var(--border-hover);
	}

	/* Variants — they only change padding/elevation now. Surface stays flat. */
	.glass-card[data-variant='large'] {
		background: var(--surface-card-elevated);
		border-radius: var(--radius-2xl);
	}

	.glass-card[data-variant='large'][data-padding='md'] {
		padding: var(--space-6);
	}
	.glass-card[data-variant='large'][data-padding='lg'] {
		padding: var(--space-8);
	}

	.glass-card[data-variant='extreme'] {
		background: var(--surface-card-elevated);
		border-color: var(--border-default);
	}

	.glass-card[data-variant='subtle'] {
		background: var(--surface-nested);
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
