<!--
  Spinner Component

  Shared ring spinner replacing the per-component `.loading-spinner`
  re-implementations. Colors are themeable via CSS custom properties:
  - `--spinner-track`  ring color (default: var(--surface-active))
  - `--spinner-accent` spinning arc color (default: var(--color-primary-500))

  Self-announcing: the ring is wrapped in a `role="status"` region with a
  visually hidden label (default: the catalogue's "Loading…"), so every
  call site tells a screen reader that something is loading without wiring
  it up itself. Pass `label` to say what; pass `decorative` when the
  surrounding component already owns the announcement (LoadingState, a busy
  button whose own name changes).

  Usage:
  <Spinner size="md" />
  <Spinner size="md" label={$t.arbiterV2.loading} />
  <Spinner size="lg" --spinner-accent="var(--sentiment-arbiter)" />
-->
<script lang="ts">
	import { t } from '#lib/i18n/index.js';

	interface SpinnerProps {
		/**
		 * Diameter: sm=16px, md=20px, lg=24px, xl=32px on the icon scale, plus
		 * 2xl=44px for the full-panel loading states (a view waiting on its
		 * dataset), which also thickens the ring so it reads at that size.
		 */
		size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		/** What is loading, announced politely. Defaults to "Loading…". */
		label?: string;
		/** Render the ring only; the caller announces the state itself. */
		decorative?: boolean;
	}

	let { size = 'md', label, decorative = false }: SpinnerProps = $props();
</script>

{#if decorative}
	<span class="spinner" data-size={size} aria-hidden="true"></span>
{:else}
	<span class="spinner-status" role="status">
		<span class="spinner" data-size={size} aria-hidden="true"></span>
		<span class="sr-only">{label ?? $t.messages.loading}</span>
	</span>
{/if}

<style>
	.spinner-status {
		display: inline-flex;
	}

	.spinner {
		display: block;
		/* Component API — a parent may override either on any ancestor.
		   Declared here with its default rather than repeated as a var()
		   fallback at each use: a fallback is also how a genuinely missing
		   token stays silent, so this codebase does not use them. */
		--spinner-track: var(--surface-active);
		--spinner-accent: var(--color-primary-500);

		--spinner-ring-width: 2px;

		border-radius: var(--radius-circle);
		border: var(--spinner-ring-width) solid var(--spinner-track);
		border-top-color: var(--spinner-accent);
		animation: spin var(--timing-spin) linear infinite;
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

	.spinner[data-size='2xl'] {
		--spinner-ring-width: 3px;

		width: var(--size-control-xl);
		height: var(--size-control-xl);
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
