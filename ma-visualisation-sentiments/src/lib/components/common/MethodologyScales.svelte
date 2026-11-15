<!--
  MethodologyScales

  The "evaluation scales" accordion body both arbiter cards show: polarity,
  subjectivity and centrality, each as a chip list. The polarity and
  centrality rows come from `utils/scaleItems.ts`; subjectivity's badge wording
  is the caller's (ranks 1–5 in the archive, the v2 labels the panel arbiter
  answered in), so the caller passes those items.
-->
<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import SentimentScaleList, { type ScaleItem } from './SentimentScaleList.svelte';
	import { centralityScaleItems, polarityScaleItems } from '#lib/utils/scaleItems.js';
	import MethodologySection from './MethodologySection.svelte';

	interface MethodologyScalesProps {
		subjectivityItems: ScaleItem[];
		/** Chip shape for subjectivity: a circle for a rank, a pill for a label. */
		subjectivityChip?: 'subjectivity' | 'sentiment';
	}

	let { subjectivityItems, subjectivityChip = 'subjectivity' }: MethodologyScalesProps = $props();

	const polarityItems = $derived(polarityScaleItems($t.arbiter));
	const centralityItems = $derived(centralityScaleItems($t.arbiter));
</script>

<div class="scales-content">
	<MethodologySection title={$t.filters.polarity}>
		<SentimentScaleList variant="chip" chipKind="sentiment" items={polarityItems} />
	</MethodologySection>
	<MethodologySection title={$t.filters.subjectivity}>
		<SentimentScaleList variant="chip" chipKind={subjectivityChip} items={subjectivityItems} />
	</MethodologySection>
	<MethodologySection title={$t.filters.centrality}>
		<SentimentScaleList variant="chip" chipKind="centrality" items={centralityItems} />
	</MethodologySection>
</div>

<style>
	.scales-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}
</style>
