<!--
  ConfidenceBadge

  The arbiter's confidence level as a badge. The three-level scale (high /
  medium / low) is common to both arbiter generations, so this leaf is shared by
  the archived pairwise views and the panel views alike; nothing about either
  generation's verdict shape reaches it.

  The label and colour come from `utils/arbiter.ts`. An unrecognised level is
  shown as it was stored, on the neutral badge, never folded into "low".
-->
<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { getConfidenceBadgeClass, getConfidenceLabel } from '#lib/utils/arbiter.js';

	interface ConfidenceBadgeProps {
		level: string;
		/** Optional words before the level, e.g. "Confidence:". */
		prefix?: string;
		size?: 'sm' | 'md';
	}

	let { level, prefix, size = 'sm' }: ConfidenceBadgeProps = $props();
</script>

<span class="confidence-badge {getConfidenceBadgeClass(level)}" data-size={size}>
	{prefix ? `${prefix} ` : ''}{getConfidenceLabel(level, $t)}
</span>

<style>
	/* Colour, fill and border come from the shared `.badge-confidence-*`
	   classes in components.css; only the box lives here. */
	.confidence-badge {
		display: inline-flex;
		align-items: center;
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		white-space: nowrap;
		border-radius: var(--radius-hairline);
	}

	.confidence-badge[data-size='sm'] {
		padding: var(--space-0-5) var(--space-2);
	}

	.confidence-badge[data-size='md'] {
		padding: var(--space-1) var(--space-2-5);
	}
</style>
