<!--
  ComparisonPanel Component

  A side-by-side comparison panel showing two model analyses for a sentiment dimension.
  Used in ComparisonDetail to display centrality, polarity, and subjectivity comparisons.
-->
<script lang="ts">
	import { SentimentBadge } from '$lib/components/common';
	import { t } from '$lib/i18n';

	interface ComparisonPanelProps {
		dimension: 'polarity' | 'subjectivity' | 'centrality';
		modelAName?: string;
		modelAValue: string | number | null | undefined;
		modelAJustification?: string | null;
		modelBName?: string;
		modelBValue: string | number | null | undefined;
		modelBJustification?: string | null;
	}

	let {
		dimension,
		modelAName = 'Model A',
		modelAValue,
		modelAJustification,
		modelBName = 'Model B',
		modelBValue,
		modelBJustification
	}: ComparisonPanelProps = $props();
</script>

<div class="comparison-panel-grid">
	<div class="comparison-panel">
		<div class="comparison-panel-head">
			<span class="model-label">{modelAName}</span>
			<SentimentBadge type={dimension} value={modelAValue} size="sm" />
		</div>
		{#if modelAJustification}
			<blockquote class="justification">{modelAJustification}</blockquote>
		{:else}
			<p class="justification-empty">{$t.article.noAnalysisData}</p>
		{/if}
	</div>

	<div class="comparison-panel">
		<div class="comparison-panel-head">
			<span class="model-label">{modelBName}</span>
			<SentimentBadge type={dimension} value={modelBValue} size="sm" />
		</div>
		{#if modelBJustification}
			<blockquote class="justification">{modelBJustification}</blockquote>
		{:else}
			<p class="justification-empty">{$t.article.noAnalysisData}</p>
		{/if}
	</div>
</div>

<style>
	.comparison-panel-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-5);
	}

	@media (min-width: 1024px) {
		.comparison-panel-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.comparison-panel {
		background: var(--surface-subtle);
		border: 1px solid var(--border-subtle);
		padding: var(--space-5);
	}

	.comparison-panel-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.model-label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.justification {
		position: relative;
		font-family: var(--font-display);
		font-size: 0.9375rem;
		font-style: italic;
		line-height: 1.65;
		color: var(--text-secondary);
		padding-left: var(--space-6);
		margin: 0;
	}

	.justification::before {
		content: '\201C';
		position: absolute;
		top: -0.5rem;
		left: 0;
		font-family: var(--font-display);
		font-size: 2.25rem;
		font-style: normal;
		line-height: 1;
		color: var(--sentiment-comparison-light);
	}

	.justification-empty {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		font-style: italic;
		color: var(--text-faint);
		margin: 0;
	}

	@media (max-width: 640px) {
		.comparison-panel {
			padding: var(--space-4);
		}

		.justification {
			font-size: var(--font-size-base);
		}
	}
</style>
