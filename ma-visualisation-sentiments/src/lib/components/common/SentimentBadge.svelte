<!--
  SentimentBadge Component
  
  A reusable badge for displaying sentiment values (polarity, subjectivity, centrality).
  Uses semantic colors from the design system.
  
  Usage:
  <SentimentBadge type="polarity" value="Très positif" />
  <SentimentBadge type="subjectivity" value={3} />
  <SentimentBadge type="centrality" value="Central" />
-->
<script lang="ts">
  import { currentLanguage } from '$lib/i18n';
  import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';

  type BadgeType = 'polarity' | 'subjectivity' | 'centrality';
  type BadgeSize = 'sm' | 'md' | 'lg';

  interface SentimentBadgeProps {
    /** Type of sentiment value */
    type: BadgeType;
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

  // CSS class mappings for each type
  const polarityClasses: Record<string, string> = {
    'Très positif': 'polarity-very-positive',
    'Positif': 'polarity-positive',
    'Neutre': 'polarity-neutral',
    'Négatif': 'polarity-negative',
    'Très négatif': 'polarity-very-negative',
    'Non applicable': 'polarity-na'
  };

  const centralityClasses: Record<string, string> = {
    'Très central': 'centrality-very-central',
    'Central': 'centrality-central',
    'Secondaire': 'centrality-secondary',
    'Marginal': 'centrality-marginal',
    'Non abordé': 'centrality-not-addressed'
  };

  const subjectivityClasses: Record<number, string> = {
    1: 'subjectivity-1',
    2: 'subjectivity-2',
    3: 'subjectivity-3',
    4: 'subjectivity-4',
    5: 'subjectivity-5'
  };

  // Get the appropriate CSS class based on type and value
  function getVariantClass(): string {
    if (value === null || value === undefined) {
      return type === 'polarity' ? 'polarity-na' : 'centrality-not-addressed';
    }

    switch (type) {
      case 'polarity':
        return polarityClasses[value as string] || 'polarity-na';
      case 'centrality':
        return centralityClasses[value as string] || 'centrality-not-addressed';
      case 'subjectivity':
        const score = typeof value === 'string' ? parseInt(value, 10) : value;
        return subjectivityClasses[score as number] || 'subjectivity-3';
      default:
        return '';
    }
  }

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

  let variantClass = $derived.by(getVariantClass);
  let displayText = $derived.by(getDisplayText);
</script>

<span class="sentiment-badge {variantClass} size-{size} {className}">
  {displayText}
</span>

<style>
  .sentiment-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    border-radius: 9999px;
    white-space: nowrap;
    transition: all var(--timing-fast) var(--easing-default);
  }

  /* Size variants */
  .sentiment-badge.size-sm {
    padding: 0.1875rem 0.5rem;
    font-size: 0.6875rem;
  }

  .sentiment-badge.size-md {
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
  }

  .sentiment-badge.size-lg {
    padding: 0.375rem 0.875rem;
    font-size: 0.8125rem;
  }

  /* ============================================
     POLARITY VARIANTS
     ============================================ */
  
  .sentiment-badge.polarity-very-positive {
    background: var(--sentiment-polarity-very-positive-bg);
    border: 1px solid var(--sentiment-polarity-very-positive-border);
    color: var(--sentiment-polarity-very-positive);
  }

  .sentiment-badge.polarity-positive {
    background: var(--sentiment-polarity-positive-bg);
    border: 1px solid var(--sentiment-polarity-positive-border);
    color: var(--sentiment-polarity-positive);
  }

  .sentiment-badge.polarity-neutral {
    background: var(--sentiment-polarity-neutral-bg);
    border: 1px solid var(--sentiment-polarity-neutral-border);
    color: var(--sentiment-polarity-neutral);
  }

  .sentiment-badge.polarity-negative {
    background: var(--sentiment-polarity-negative-bg);
    border: 1px solid var(--sentiment-polarity-negative-border);
    color: var(--sentiment-polarity-negative);
  }

  .sentiment-badge.polarity-very-negative {
    background: var(--sentiment-polarity-very-negative-bg);
    border: 1px solid var(--sentiment-polarity-very-negative-border);
    color: var(--sentiment-polarity-very-negative);
  }

  .sentiment-badge.polarity-na {
    background: var(--sentiment-polarity-na-bg);
    border: 1px solid var(--sentiment-polarity-na-border);
    color: var(--sentiment-polarity-na);
  }

  /* ============================================
     SUBJECTIVITY VARIANTS
     ============================================ */

  .sentiment-badge.subjectivity-1 {
    background: var(--sentiment-subjectivity-1-bg);
    border: 1px solid var(--sentiment-subjectivity-1-border);
    color: var(--sentiment-subjectivity-1);
  }

  .sentiment-badge.subjectivity-2 {
    background: var(--sentiment-subjectivity-2-bg);
    border: 1px solid var(--sentiment-subjectivity-2-border);
    color: var(--sentiment-subjectivity-2);
  }

  .sentiment-badge.subjectivity-3 {
    background: var(--sentiment-subjectivity-3-bg);
    border: 1px solid var(--sentiment-subjectivity-3-border);
    color: var(--sentiment-subjectivity-3);
  }

  .sentiment-badge.subjectivity-4 {
    background: var(--sentiment-subjectivity-4-bg);
    border: 1px solid var(--sentiment-subjectivity-4-border);
    color: var(--sentiment-subjectivity-4);
  }

  .sentiment-badge.subjectivity-5 {
    background: var(--sentiment-subjectivity-5-bg);
    border: 1px solid var(--sentiment-subjectivity-5-border);
    color: var(--sentiment-subjectivity-5);
  }

  /* ============================================
     CENTRALITY VARIANTS
     ============================================ */

  .sentiment-badge.centrality-very-central {
    background: var(--sentiment-centrality-very-central-bg);
    border: 1px solid var(--sentiment-centrality-very-central-border);
    color: var(--sentiment-centrality-very-central);
  }

  .sentiment-badge.centrality-central {
    background: var(--sentiment-centrality-central-bg);
    border: 1px solid var(--sentiment-centrality-central-border);
    color: var(--sentiment-centrality-central);
  }

  .sentiment-badge.centrality-secondary {
    background: var(--sentiment-centrality-secondary-bg);
    border: 1px solid var(--sentiment-centrality-secondary-border);
    color: var(--sentiment-centrality-secondary);
  }

  .sentiment-badge.centrality-marginal {
    background: var(--sentiment-centrality-marginal-bg);
    border: 1px solid var(--sentiment-centrality-marginal-border);
    color: var(--sentiment-centrality-marginal);
  }

  .sentiment-badge.centrality-not-addressed {
    background: var(--sentiment-centrality-not-addressed-bg);
    border: 1px solid var(--sentiment-centrality-not-addressed-border);
    color: var(--sentiment-centrality-not-addressed);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .sentiment-badge {
      transition: none;
    }
  }
</style>
