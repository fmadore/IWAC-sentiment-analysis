<!--
  Spinner Component

  Shared ring spinner replacing the per-component `.loading-spinner`
  re-implementations. Colors are themeable via CSS custom properties:
  - `--spinner-track`  ring color (default: var(--surface-active))
  - `--spinner-accent` spinning arc color (default: var(--color-primary-500))

  Usage:
  <Spinner size="md" />
  <Spinner size="lg" --spinner-accent="var(--sentiment-arbiter)" />
-->
<script lang="ts">
	interface SpinnerProps {
		/** Diameter on the icon size scale: sm=16px, md=20px, lg=24px, xl=32px */
		size?: 'sm' | 'md' | 'lg' | 'xl';
	}

	let { size = 'md' }: SpinnerProps = $props();
</script>

<div class="spinner" data-size={size} aria-hidden="true"></div>

<style>
	.spinner {
		border-radius: var(--radius-full);
		border: 2px solid var(--spinner-track, var(--surface-active));
		border-top-color: var(--spinner-accent, var(--color-primary-500));
		/* ~0.9s rotation expressed on the motion scale (3 × --timing-slow = 960ms) */
		animation: spin calc(var(--timing-slow) * 3) linear infinite;
	}

	.spinner[data-size='sm'] {
		width: var(--size-icon-sm);
		height: var(--size-icon-sm);
	}

	.spinner[data-size='md'] {
		width: var(--size-icon-md);
		height: var(--size-icon-md);
	}

	.spinner[data-size='lg'] {
		width: var(--size-icon-lg);
		height: var(--size-icon-lg);
	}

	.spinner[data-size='xl'] {
		width: var(--size-icon-xl);
		height: var(--size-icon-xl);
	}

	/* Component-scoped keyframes are intentional — Svelte CSS scoping hashes
	   animation names, so they must live beside the scoped selector. */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
