<!--
  ArbiterCoverage Component

  The arbiter's sampling frame, stated before its percentages.

  The arbiter evaluated 61-176 articles depending on the pair, against a
  12,287-article corpus — 0.5% to 1.4%, and not a random 0.5%: those articles
  were selected precisely because the two models disagreed most sharply about
  them. Every verdict percentage on this page is therefore conditional on
  "given that the models already disagreed", and reading "Gemini preferred
  60%" as "Gemini is better on this corpus" is a category error the numbers
  themselves cannot warn you about.

  So the denominator goes above the percentages, not in a tooltip beneath
  them (.impeccable.md, principle 3: methodology must be visible).
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import InfoIcon from '@lucide/svelte/icons/info';

	interface ArbiterCoverageProps {
		/** Articles the arbiter actually evaluated. */
		evaluated: number;
		/** Articles in the corpus both models analysed. */
		corpusTotal: number;
	}

	let { evaluated, corpusTotal }: ArbiterCoverageProps = $props();

	const percentage = $derived(corpusTotal > 0 ? (evaluated / corpusTotal) * 100 : 0);

	/** Below 0.05% the bar would be invisible; floor it so the sliver still reads. */
	const barWidth = $derived(Math.max(percentage, 0.35));
</script>

<div class="coverage">
	<div class="coverage-head">
		<InfoIcon size={14} aria-hidden="true" />
		<span class="coverage-title">{$t.arbiter.samplingFrame}</span>
	</div>

	<div class="coverage-figures">
		<span class="coverage-figure">
			<strong>{evaluated.toLocaleString()}</strong>
			<span class="coverage-key">{$t.arbiter.coverageEvaluated}</span>
		</span>
		<span class="coverage-of">/</span>
		<span class="coverage-figure">
			<strong>{corpusTotal.toLocaleString()}</strong>
			<span class="coverage-key">{$t.arbiter.coverageCorpus}</span>
		</span>
		<span class="coverage-percent">{percentage.toFixed(1)}%</span>
	</div>

	<div
		class="coverage-bar"
		role="img"
		aria-label="{percentage.toFixed(1)}% {$t.arbiter.samplingFrame}"
	>
		<div class="coverage-fill" style="width: {barWidth}%"></div>
	</div>

	<p class="coverage-note">{$t.arbiter.samplingFrameNote}</p>
</div>

<style>
	.coverage {
		background: var(--surface-subtle);
		border: 1px solid var(--border-subtle);
		border-left: 2px solid var(--sentiment-arbiter);
		padding: var(--space-4);
	}

	.coverage-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--sentiment-arbiter-light);
		margin-bottom: var(--space-3);
	}

	.coverage-title {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
	}

	.coverage-figures {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.coverage-figure {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.coverage-figure strong {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
	}

	.coverage-key {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xs);
		letter-spacing: var(--tracking-wide);
		color: var(--text-muted);
	}

	.coverage-of {
		font-family: var(--font-mono);
		color: var(--text-muted);
	}

	.coverage-percent {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		font-variant-numeric: tabular-nums;
		color: var(--sentiment-arbiter-light);
	}

	.coverage-bar {
		position: relative;
		height: 4px;
		background: var(--surface-nested);
		margin-bottom: var(--space-3);
		overflow: hidden;
	}

	.coverage-fill {
		height: 100%;
		background: var(--sentiment-arbiter);
	}

	.coverage-note {
		font-family: var(--font-sans);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: 0;
	}

	@media (max-width: 640px) {
		.coverage-percent {
			margin-left: 0;
			width: 100%;
		}
	}
</style>
