<!--
  ArbiterV2VerdictPanel

  One article's panel verdict, laid out so it can be checked rather than
  merely read: the five ratings the arbiter was given sit beside the rating it
  gave itself, dimension by dimension, and the letters it uses in its prose
  ("C, E et B") are decoded by a legend rather than by a regex over the text.

  A regex is what the v1 section does for "Modèle A/B", and it would be wrong
  here: the panel's labels are bare capitals, and "A en croire ce groupe de
  pèlerins" is French, not a verdict. So the prose stays verbatim and every
  chip carries its letter.

  Two cues on each chip. A tick marks the analysis the arbiter preferred on
  that dimension. An equals sign marks every analysis whose rating is the
  arbiter's own — the comparison the arbiter was asked to make, and the only
  thing that makes "several are equally close" legible at a glance.

  Shared by the arbiter view's modal and by the comparison detail for a
  generation-2 pair, which is why it takes a joined row and a note rather
  than reading the pair from the store.
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import {
		datasetState,
		arbiterV2Evaluations,
		arbiterV2Legend,
		loadJustifications
	} from '$lib/stores';
	import { SentimentBadge } from '$lib/components/common';
	import {
		ARBITER_V2_DIMENSIONS,
		analysisJustification,
		analysisValue,
		matchesArbiterScore,
		resolvePreference,
		type ArbiterV2Dimension,
		type ArbiterV2Row
	} from '$lib/utils/arbiterV2';
	import { getConfidenceBadgeClass, getConfidenceLabel } from '$lib/utils/arbiter';
	import type { ArbiterV2Preference, DatasetId } from '$lib/types/data';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import CheckIcon from '@lucide/svelte/icons/check';
	import EqualIcon from '@lucide/svelte/icons/equal';

	interface ArbiterV2VerdictPanelProps {
		row: ArbiterV2Row;
		/** A sentence placed under the header, for a host that needs to qualify the verdict. */
		note?: string;
	}

	let { row, note }: ArbiterV2VerdictPanelProps = $props();

	const data = $derived(arbiterV2Evaluations.current);
	const legend = $derived(arbiterV2Legend.current);
	const arbiter = $derived(row.evaluation.arbiter);

	/** Every panel dataset has landed, so a missing rating means "not rated". */
	const panelLoaded = $derived(legend.every((entry) => entry.modelId in row.analyses));

	function modelColor(modelId: DatasetId): string {
		return datasetState.getById(modelId)?.color ?? 'var(--sentiment-arbiter)';
	}

	function verdictLabel(preference: ArbiterV2Preference): string {
		if (preference === 'multiple') return $t.arbiterV2.multiple;
		if (preference === 'none') return $t.arbiterV2.none;
		const modelId = resolvePreference(data, preference);
		return legend.find((entry) => entry.modelId === modelId)?.name ?? preference.toUpperCase();
	}

	function verdictColor(preference: ArbiterV2Preference): string {
		const modelId = resolvePreference(data, preference);
		return modelId ? modelColor(modelId) : 'var(--text-muted)';
	}

	function dimensionName(dimension: ArbiterV2Dimension): string {
		return $t.arbiterV2[dimension];
	}

	// The models' own reasoning is prose the app never loads until asked. One
	// toggle covers all three dimensions, and the fetch is one shard per model;
	// the text appears in place because the row holds the store's own objects.
	let showReasoning = $state(false);
	let loadingReasoning = $state(false);

	async function toggleReasoning() {
		showReasoning = !showReasoning;
		if (!showReasoning || loadingReasoning) return;
		loadingReasoning = true;
		try {
			await Promise.all(
				legend.map((entry) =>
					loadJustifications(entry.modelId, fetch, [row.articleId]).catch((error) =>
						console.error(`Failed to load ${entry.modelId} justification:`, error)
					)
				)
			);
		} finally {
			loadingReasoning = false;
		}
	}
</script>

<section class="panel-verdict" aria-label={$t.arbiter.title}>
	<header class="panel-header">
		<div class="panel-heading">
			<span class="panel-icon"><GavelIcon size={22} /></span>
			<div>
				<h4 class="panel-title">
					{$t.arbiter.title}
					<span class="badge badge-model">{$t.arbiterV2.modelName}</span>
				</h4>
				{#if note}
					<p class="panel-note">{note}</p>
				{/if}
			</div>
		</div>
		<span class="badge {getConfidenceBadgeClass(arbiter.confidence_level)}">
			{$t.arbiterV2.confidence}: {getConfidenceLabel(arbiter.confidence_level, $t)}
		</span>
	</header>

	<!-- The legend the prose needs. -->
	<div class="legend">
		<span class="field-label">{$t.arbiterV2.panelLegend}</span>
		<ul class="legend-list">
			{#each legend as entry (entry.label)}
				<li class="legend-item" style="--model-color: {modelColor(entry.modelId)}">
					<span class="chip-letter">{entry.label.toUpperCase()}</span>
					<span class="legend-name">{entry.name}</span>
				</li>
			{/each}
		</ul>
		<p class="legend-note">{$t.arbiterV2.panelLegendNote}</p>
	</div>

	<!-- Overall verdict -->
	<div class="overall-panel">
		<span class="verdict-icon"><SparklesIcon size={20} /></span>
		<div>
			<h5 class="verdict-heading">{$t.arbiter.overallVerdict}</h5>
			<p class="verdict-preferred">
				<span class="verdict-swatch" style="background: {verdictColor(arbiter.overall_winner)}"
				></span>
				<strong>{verdictLabel(arbiter.overall_winner)}</strong>
			</p>
			<p class="verdict-body">{arbiter.overall_explanation}</p>
		</div>
	</div>

	<div class="chip-key">
		<span class="chip-key-item">
			<span class="chip-mark chip-mark-preferred"><CheckIcon size={12} /></span>
			{$t.arbiterV2.preferredAnalysis}
		</span>
		<span class="chip-key-item">
			<span class="chip-mark chip-mark-match"><EqualIcon size={12} /></span>
			{$t.arbiterV2.matchesArbiter}
		</span>
		<button type="button" class="reasoning-toggle" onclick={toggleReasoning}>
			{showReasoning ? $t.arbiterV2.hideModelsReasoning : $t.arbiterV2.showModelsReasoning}
		</button>
	</div>

	<!-- Dimension by dimension -->
	<div class="dimension-list">
		{#each ARBITER_V2_DIMENSIONS as dimension (dimension)}
			{@const verdict = arbiter[dimension]}
			<div class="dimension-panel">
				<div class="dimension-head">
					<h5 class="verdict-heading">{dimensionName(dimension)}</h5>
					<div class="arbiter-rating">
						<span class="field-label">{$t.arbiterV2.arbiterScore}</span>
						<SentimentBadge
							type={dimension}
							value={dimension === 'subjectivity' ? Number(verdict.score) : verdict.score}
							size="sm"
						/>
					</div>
					<span class="badge badge-preferred">
						<span class="verdict-swatch" style="background: {verdictColor(verdict.preferred)}"
						></span>
						{verdictLabel(verdict.preferred)}
					</span>
				</div>

				<ul class="panel-chips">
					{#each legend as entry (entry.label)}
						{@const loaded = entry.modelId in row.analyses}
						{@const analysis = row.analyses[entry.modelId]}
						{@const value = analysisValue(analysis, dimension)}
						{@const preferred = verdict.preferred === entry.label}
						{@const match = matchesArbiterScore(value, verdict.score, dimension)}
						<li
							class="panel-chip"
							data-preferred={preferred}
							data-match={match}
							style="--model-color: {modelColor(entry.modelId)}"
						>
							<span class="chip-letter">{entry.label.toUpperCase()}</span>
							<span class="chip-model">{entry.name}</span>
							{#if !loaded}
								<span class="chip-pending">{$t.arbiterV2.panelLoading}</span>
							{:else if value === null}
								<span class="chip-unrated">{$t.arbiterV2.notRated}</span>
							{:else}
								<SentimentBadge type={dimension} {value} size="sm" />
							{/if}
							{#if match}
								<span class="chip-mark chip-mark-match" title={$t.arbiterV2.matchesArbiter}>
									<EqualIcon size={12} />
								</span>
							{/if}
							{#if preferred}
								<span class="chip-mark chip-mark-preferred" title={$t.arbiterV2.preferredAnalysis}>
									<CheckIcon size={12} />
								</span>
							{/if}
						</li>
					{/each}
				</ul>

				<div class="field">
					<span class="field-label">{$t.arbiter.arbiterJustification}</span>
					<p class="field-text">{verdict.justification}</p>
				</div>
				<div class="field">
					<span class="field-label">{$t.arbiter.verdictExplanation}</span>
					<p class="field-text">{verdict.verdict_explanation}</p>
				</div>

				{#if showReasoning}
					<ul class="model-reasons">
						{#each legend as entry (entry.label)}
							{@const prose = analysisJustification(row.analyses[entry.modelId], dimension)}
							<li class="model-reason" style="--model-color: {modelColor(entry.modelId)}">
								<span class="model-reason-head">
									<span class="chip-letter">{entry.label.toUpperCase()}</span>
									<span class="chip-model">{entry.name}</span>
								</span>
								{#if prose}
									<blockquote class="justification">{prose}</blockquote>
								{:else if loadingReasoning || !panelLoaded}
									<p class="justification-empty">{$t.arbiterV2.modelsReasoningLoading}</p>
								{:else}
									<p class="justification-empty">{$t.article.noAnalysisData}</p>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}
	</div>
</section>

<style>
	.panel-verdict {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-arbiter);
		padding: var(--space-5);
	}

	.panel-header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.panel-heading {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		min-width: 0;
	}

	.panel-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--size-control-md);
		height: var(--size-control-md);
		border: 1px solid var(--sentiment-arbiter-border);
		background: var(--sentiment-arbiter-bg);
		color: var(--sentiment-arbiter);
	}

	.panel-title {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0;
	}

	.panel-note {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: var(--line-height-relaxed);
		max-width: var(--prose-width);
		margin: var(--space-1) 0 0;
	}

	/* The global `.badge` supplies the box; these set the colours. */
	.badge {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		border-radius: 0;
		border: 1px solid var(--border-default);
		white-space: nowrap;
	}

	.badge-model {
		background: var(--sentiment-arbiter-bg);
		border-color: var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter-light);
		text-transform: uppercase;
	}

	.badge-preferred {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		background: var(--surface-nested);
		border-color: var(--border-subtle);
		color: var(--text-primary);
	}

	/* The model's colour goes on a swatch, never on the text: brand colours
	   are not contrast-checked as type. */
	.verdict-swatch {
		width: 10px;
		height: 10px;
		flex-shrink: 0;
	}

	/* ---- Legend ---- */
	.legend {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
	}

	.legend-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-4);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.legend-note {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: var(--line-height-relaxed);
		max-width: var(--prose-width);
		margin: 0;
	}

	/* The letter the arbiter used, underlined in the model's brand colour. The
	   colour comes in as an inline custom property from the dataset registry:
	   plain DOM, so no chart-side hex is needed. */
	.chip-letter {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--size-icon-lg);
		height: var(--size-icon-lg);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--text-primary);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-bottom: 2px solid var(--model-color);
	}

	/* ---- Overall verdict ---- */
	.overall-panel {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		background: var(--surface-subtle);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-arbiter);
		padding: var(--space-4);
	}

	.verdict-icon {
		display: inline-flex;
		flex-shrink: 0;
		margin-top: var(--space-1);
		color: var(--sentiment-arbiter);
	}

	.verdict-heading {
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0 0 var(--space-2);
	}

	.verdict-preferred {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-base);
		color: var(--text-primary);
		margin: 0 0 var(--space-2);
	}

	.verdict-body {
		color: var(--text-primary);
		line-height: var(--line-height-relaxed);
		margin: 0;
	}

	/* ---- Chip key and the reasoning toggle ---- */
	.chip-key {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-5);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.chip-key-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.chip-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--size-icon-sm);
		height: var(--size-icon-sm);
		border-radius: var(--radius-circle);
	}

	.chip-mark-preferred {
		background: var(--sentiment-arbiter);
		color: var(--text-on-light);
	}

	.chip-mark-match {
		background: var(--surface-active);
		border: 1px solid var(--border-strong);
		color: var(--text-secondary);
	}

	.reasoning-toggle {
		margin-left: auto;
		padding: var(--space-1-5) var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--sentiment-arbiter-light);
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.reasoning-toggle:hover {
		background: color-mix(in oklab, var(--sentiment-arbiter) 22%, transparent);
		border-color: var(--sentiment-arbiter);
	}

	/* ---- Dimensions ---- */
	.dimension-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.dimension-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--surface-subtle);
		border: 1px solid var(--border-subtle);
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.dimension-panel:hover {
		border-color: var(--sentiment-arbiter-border);
	}

	.dimension-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}

	.dimension-head .verdict-heading {
		margin: 0;
	}

	.arbiter-rating {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.dimension-head .badge-preferred {
		margin-left: auto;
	}

	.panel-chips {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-2);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.panel-chip {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		padding: var(--space-2) var(--space-3);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.panel-chip[data-match='true'] {
		border-color: var(--border-hover);
	}

	.panel-chip[data-preferred='true'] {
		background: var(--sentiment-arbiter-bg);
		border-color: var(--sentiment-arbiter-border);
	}

	.chip-model {
		flex: 1;
		min-width: 0;
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip-pending,
	.chip-unrated {
		font-size: var(--font-size-eyebrow);
		font-style: italic;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	/* Uppercase mono eyebrow over each field. --text-muted, not --text-subtle:
	   this is a label, not a rule. */
	.field-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
	}

	.field-text {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		margin: 0;
	}

	/* ---- The models' own reasoning ---- */
	.model-reasons {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-3);
		list-style: none;
		margin: 0;
		padding: var(--space-3) 0 0;
		border-top: 1px dashed var(--border-subtle);
	}

	.model-reason {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.model-reason-head {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.justification {
		position: relative;
		font-family: var(--font-display);
		font-size: var(--font-size-sm);
		font-style: italic;
		line-height: 1.65;
		color: var(--text-secondary);
		padding-left: var(--space-5);
		margin: 0;
	}

	.justification::before {
		content: '\201C';
		position: absolute;
		top: -0.35rem;
		left: 0;
		font-family: var(--font-display);
		font-size: var(--size-quote-glyph);
		font-style: normal;
		line-height: 1;
		color: var(--text-faint);
	}

	.justification-empty {
		font-size: var(--font-size-xs);
		font-style: italic;
		color: var(--text-muted);
		margin: 0;
	}

	@media (min-width: 640px) {
		.panel-chips {
			grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		}

		.model-reasons {
			grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dimension-panel,
		.reasoning-toggle {
			transition: none;
		}
	}
</style>
