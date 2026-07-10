<!--
  ArbiterConfidenceChart Component

  Displays the distribution of arbiter confidence levels (high, medium, low)
  as a donut chart via the shared ArbiterPieChart.
-->
<script lang="ts">
	import { arbiterEvaluations } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { arbiterConfidenceColors } from '$lib/utils/chartTheme';
	import ArbiterPieChart from './ArbiterPieChart.svelte';

	// Compute confidence distribution
	const confidenceData = $derived.by(() => {
		const evaluations = arbiterEvaluations.current?.evaluations || [];

		const counts = {
			high: 0,
			medium: 0,
			low: 0
		};

		for (const evaluation of evaluations) {
			const level = evaluation.arbiter.confidence_level as 'high' | 'medium' | 'low';
			if (level in counts) {
				counts[level]++;
			}
		}

		return [
			{
				name: $t.arbiter.confidenceHigh,
				value: counts.high,
				itemStyle: { color: arbiterConfidenceColors.high }
			},
			{
				name: $t.arbiter.confidenceMedium,
				value: counts.medium,
				itemStyle: { color: arbiterConfidenceColors.medium }
			},
			{
				name: $t.arbiter.confidenceLow,
				value: counts.low,
				itemStyle: { color: arbiterConfidenceColors.low }
			}
		].filter((d) => d.value > 0);
	});
</script>

<ArbiterPieChart
	data={confidenceData}
	countNoun={$t.arbiter.evaluationsNoun}
	ariaLabel={$t.arbiter.confidenceLevel}
/>
