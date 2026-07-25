<!--
  SentimentBadge Component

  A reusable badge for displaying sentiment values (polarity, subjectivity, centrality).
  Colours come from the shared palette resolver in app.css, keyed on the
  data attribute this component emits — see utils/sentimentTokens.ts.

  Usage:
  <SentimentBadge type="polarity" value="Très positif" />
  <SentimentBadge type="subjectivity" value={3} />
  <SentimentBadge type="centrality" value="Central" />
-->
<script lang="ts">
	import { currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { sentimentAttributes, type SentimentFamily } from '$lib/utils/sentimentTokens';

	type BadgeSize = 'sm' | 'md' | 'lg';

	interface SentimentBadgeProps {
		/** Type of sentiment value */
		type: SentimentFamily;
		/** The sentiment value (French for polarity/centrality, number for subjectivity) */
		value: string | number | null | undefined;
		/** Size variant */
		size?: BadgeSize;
		/** Whether to translate the display text */
		translate?: boolean;
		/** Additional CSS class */
		class?: string;
	}

	let {
		type,
		value,
		size = 'md',
		translate = true,
		class: className = ''
	}: SentimentBadgeProps = $props();

	// Get the display text
	function getDisplayText(): string {
		if (value === null || value === undefined) {
			return type === 'subjectivity' ? '-' : 'N/A';
		}

		if (!translate) {
			return String(value);
		}

		if (type === 'subjectivity') {
			const score = typeof value === 'string' ? parseInt(value, 10) : value;
			return translateSubjectivityScore(score as number, $currentLanguage);
		}

		return translateSentimentValue(String(value), $currentLanguage);
	}

	let paletteAttributes = $derived(sentimentAttributes(type, value));
	let displayText = $derived.by(getDisplayText);
</script>

<span class="sentiment-badge {className}" data-size={size} {...paletteAttributes}>
	{displayText}
</span>

<style>
	.sentiment-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-snug);
		border-radius: var(--radius-sm);
		white-space: nowrap;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);

		/* The whole colour system, in one rule: app.css resolves these three
		   from the data-polarity / data-subjectivity / data-centrality
		   attribute above. A badge is always filled. */
		background: var(--sentiment-bg);
		border: 1px solid var(--sentiment-border);
		color: var(--sentiment-fg);
	}

	/* Size variants */
	.sentiment-badge[data-size='sm'] {
		padding: var(--space-0-5) var(--space-2);
		font-size: var(--font-size-2xs);
	}

	.sentiment-badge[data-size='md'] {
		padding: var(--space-1) var(--space-2-5);
		font-size: var(--font-size-xs);
	}

	.sentiment-badge[data-size='lg'] {
		padding: var(--space-1-5) var(--space-3-5);
		font-size: var(--font-size-sm);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.sentiment-badge {
			transition: none;
		}
	}
</style>
