<!--
  ArbiterVerdictChart Component

  Displays the distribution of arbiter verdicts (which model is preferred)
  as a donut chart via the shared ArbiterPieChart. Supports filtering by dimension.
-->
<script lang="ts">
	import { arbiterEvaluations, arbiterModelAIsFirst } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { arbiterVerdictColors } from '$lib/utils/chartTheme';
	import ArbiterPieChart from './ArbiterPieChart.svelte';

	interface ArbiterVerdictChartProps {
		dimension: 'polarity' | 'subjectivity' | 'centrality' | null;
		modelAName: string;
		modelBName: string;
	}

	let { dimension, modelAName, modelBName }: ArbiterVerdictChartProps = $props();

	// Compute verdict counts based on dimension filter
	const verdictData = $derived.by(() => {
		const evaluations = arbiterEvaluations.current?.evaluations || [];
		const modelAIsFirst = arbiterModelAIsFirst.current;

		const counts = {
			model_a: 0,
			model_b: 0,
			both: 0,
			neither: 0
		};

		for (const evaluation of evaluations) {
			const arbiter = evaluation.arbiter;
			const dimensions = dimension
				? [dimension]
				: (['polarity', 'subjectivity', 'centrality'] as const);

			for (const dim of dimensions) {
				const preferred = arbiter[dim]?.preferred_model as
					'model_a' | 'model_b' | 'both' | 'neither';
				if (preferred in counts) {
					counts[preferred]++;
				}
			}
		}

		// CRITICAL: Map arbiter verdicts to pair order (first/second model in pair name)
		// - arbiter_model_a = what arbiter saw as "Model A" (could be ChatGPT or Gemini)
		// - arbiterModelAIsFirst = true when arbiter_model_a matches pair_first_model
		// - This swapping ensures UI always shows first model in pair as "modelA" for consistency
		const firstModelPreferred = modelAIsFirst ? counts.model_a : counts.model_b;
		const secondModelPreferred = modelAIsFirst ? counts.model_b : counts.model_a;

		return [
			{
				name: modelAName,
				value: firstModelPreferred,
				itemStyle: { color: arbiterVerdictColors.model_a }
			},
			{
				name: modelBName,
				value: secondModelPreferred,
				itemStyle: { color: arbiterVerdictColors.model_b }
			},
			{
				name: $t.arbiter.bothEqual,
				value: counts.both,
				itemStyle: { color: arbiterVerdictColors.both }
			},
			{
				name: $t.arbiter.neitherAccurate,
				value: counts.neither,
				itemStyle: { color: arbiterVerdictColors.neither }
			}
		].filter((d) => d.value > 0);
	});
</script>

<ArbiterPieChart
	data={verdictData}
	countNoun={$t.arbiter.verdictsNoun}
	ariaLabel={$t.arbiter.overallVerdict}
/>
