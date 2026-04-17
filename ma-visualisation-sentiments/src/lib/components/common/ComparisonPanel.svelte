<!--
  ComparisonPanel Component
  
  A side-by-side comparison panel showing two model analyses for a sentiment dimension.
  Used in ComparisonDetail to display centrality, polarity, and subjectivity comparisons.
  
  Features:
  - Two-column layout (responsive to single column on mobile)
  - Model label with sentiment badge
  - Blockquote for justification text
  - Customizable border accent color
  
  Usage:
  <ComparisonPanel 
    dimension="polarity"
    modelAName="ChatGPT"
    modelAValue={comparison.modelA?.polarite}
    modelAJustification={comparison.modelA?.polarite_justification}
    modelBName="Gemini"
    modelBValue={comparison.modelB?.polarite}
    modelBJustification={comparison.modelB?.polarite_justification}
    borderColorA="border-l-blue-400/50"
    borderColorB="border-l-green-400/50"
  />
-->
<script lang="ts">
	import { SentimentBadge } from '$lib/components/common';
	import { t } from '$lib/i18n';

	interface ComparisonPanelProps {
		/** The sentiment dimension type for SentimentBadge */
		dimension: 'polarity' | 'subjectivity' | 'centrality';
		/** Name of Model A (e.g., "ChatGPT", "Gemini", "Mistral") */
		modelAName?: string;
		/** Model A's sentiment value */
		modelAValue: string | number | null | undefined;
		/** Model A's justification text */
		modelAJustification?: string | null;
		/** Name of Model B (e.g., "ChatGPT", "Gemini", "Mistral") */
		modelBName?: string;
		/** Model B's sentiment value */
		modelBValue: string | number | null | undefined;
		/** Model B's justification text */
		modelBJustification?: string | null;
		/** Border color class for Model A blockquote */
		borderColorA?: string;
		/** Border color class for Model B blockquote */
		borderColorB?: string;
	}

	let {
		dimension,
		modelAName = 'Model A',
		modelAValue,
		modelAJustification,
		modelBName = 'Model B',
		modelBValue,
		modelBJustification,
		borderColorA = 'border-l-blue-400/50',
		borderColorB = 'border-l-green-400/50'
	}: ComparisonPanelProps = $props();
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- Model A Analysis -->
	<div class="comparison-panel">
		<div class="flex items-center gap-2 mb-3">
			<span class="text-sm font-bold text-white/80">{modelAName}</span>
			<SentimentBadge type={dimension} value={modelAValue} size="sm" />
		</div>
		{#if modelAJustification}
			<blockquote
				class="card variant-glass glass-dark p-4 border-l-4 {borderColorA} italic text-white/90 leading-relaxed"
			>
				{modelAJustification}
			</blockquote>
		{:else}
			<p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
		{/if}
	</div>

	<!-- Model B Analysis -->
	<div class="comparison-panel">
		<div class="flex items-center gap-2 mb-3">
			<span class="text-sm font-bold text-white/80">{modelBName}</span>
			<SentimentBadge type={dimension} value={modelBValue} size="sm" />
		</div>
		{#if modelBJustification}
			<blockquote
				class="card variant-glass glass-dark p-4 border-l-4 {borderColorB} italic text-white/90 leading-relaxed"
			>
				{modelBJustification}
			</blockquote>
		{:else}
			<p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
		{/if}
	</div>
</div>

<style>
	.comparison-panel {
		border: 1px solid color-mix(in oklab, var(--sentiment-comparison) 15%, transparent);
		border-radius: var(--radius-xl);
		padding: var(--space-5);
		background: color-mix(in oklab, var(--sentiment-comparison) 5%, transparent);
		backdrop-filter: blur(var(--glass-blur-sm));
		transition:
			background var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.comparison-panel:hover {
		background: color-mix(in oklab, var(--sentiment-comparison) 8%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-comparison) 25%, transparent);
	}

	/* Glass variants */
	:global(.glass-dark) {
		background: var(--surface-card) !important;
		backdrop-filter: blur(var(--glass-blur-md));
	}

	/* Enhanced blockquote styling */
	blockquote {
		position: relative;
		font-style: italic;
		line-height: var(--line-height-relaxed);
		padding-left: var(--space-6);
		background: color-mix(in oklab, var(--sentiment-comparison) 3%, transparent);
		border-color: var(--sentiment-comparison-light) !important;
	}

	blockquote::before {
		content: '"';
		position: absolute;
		top: -0.25rem;
		left: 0;
		font-size: var(--font-size-3xl);
		color: var(--sentiment-comparison-light);
		font-family: serif;
		opacity: 0.5;
	}

	/* Mobile responsive adjustments */
	@media (max-width: 640px) {
		.comparison-panel {
			padding: var(--space-3);
		}

		blockquote {
			font-size: var(--font-size-base);
			padding: var(--space-3);
		}
	}
</style>
