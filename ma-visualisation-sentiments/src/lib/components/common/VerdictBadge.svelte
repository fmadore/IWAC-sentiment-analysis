<!--
  VerdictBadge — the archived pairwise arbiter's verdict

  Model A / model B / both / neither, with a glyph so the verdict is never
  carried by colour alone. Generation 1 only: the panel arbiter names one of
  several analyses and has its own rendering. The caller resolves the label
  (a model name, through the run's blind assignment), so this leaf never
  touches `model_a_is_first`.
-->
<script lang="ts">
	import { getVerdictBadgeClass } from '#lib/utils/arbiter.js';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import MinusCircleIcon from '@lucide/svelte/icons/minus-circle';

	interface VerdictBadgeProps {
		verdict: 'model_a' | 'model_b' | 'both' | 'neither';
		label: string;
		size?: 'sm' | 'md';
	}

	let { verdict, label, size = 'sm' }: VerdictBadgeProps = $props();
</script>

<span class="verdict-badge {getVerdictBadgeClass(verdict)}" data-size={size}>
	<span class="verdict-glyph" aria-hidden="true">
		{#if verdict === 'model_a' || verdict === 'model_b'}
			<CheckCircleIcon size={12} />
		{:else if verdict === 'both'}
			<MinusCircleIcon size={12} />
		{:else}
			<XCircleIcon size={12} />
		{/if}
	</span>
	{label}
</span>

<style>
	/* Colour, fill and border come from the shared `.badge-verdict-*` classes
	   in components.css; only the box lives here. */
	.verdict-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		border-radius: var(--radius-hairline);
	}

	.verdict-badge[data-size='sm'] {
		padding: var(--space-0-5) var(--space-2);
	}

	.verdict-badge[data-size='md'] {
		padding: var(--space-1) var(--space-2-5);
	}

	.verdict-glyph {
		display: inline-flex;
		flex-shrink: 0;
	}
</style>
