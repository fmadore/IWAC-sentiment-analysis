<!--
  LabelFlowChart Component

  The three-way generalisation of AgreementMatrix: every article tracked from
  one model's label to the next, as a Sankey.

  Two things a pairwise matrix cannot show. A systematic offset appears as a
  mass of ribbons all sliding down by one band, which is a shape rather than a
  number. And the minority routes become visible — the articles where the first
  and last model agree *through* a disagreeing middle one are a ribbon that
  leaves a band and comes back, which no cross-tabulation of two models contains.

  Nodes take the dimension's own sentiment ramp, because the bands ARE sentiment
  values; ribbons inherit a translucent blend of their endpoints.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { num } from '$lib/i18n/utils';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import { getModelDisplayNames } from '$lib/utils/format';
	import { tooltipPanel } from '$lib/utils/chartFormatters';
	import { datasetState } from '$lib/stores';
	import { buildLabelFlow, type AgreementDimension, type ConsensusRow } from '$lib/utils/consensus';
	import {
		polarityColors,
		subjectivityColors,
		centralityColors,
		chartColors,
		getTitleStyle,
		getTooltipConfig
	} from '$lib/utils/chartTheme';

	interface LabelFlowChartProps {
		rows: ConsensusRow[];
		models: readonly string[];
		dimension: AgreementDimension;
		includeDeclined: boolean;
	}

	let { rows, models, dimension, includeDeclined }: LabelFlowChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let flow = $derived(buildLabelFlow(rows, dimension, models.length, includeDeclined));

	let modelNames = $derived(getModelDisplayNames(models, datasetState.availableInGeneration));

	/** The ramp colour for a band, or a neutral grey for a rung the ramp omits. */
	function bandColor(category: string): string {
		if (dimension === 'polarity') {
			return polarityColors[category as keyof typeof polarityColors] ?? chartColors.text.faint;
		}
		if (dimension === 'subjectivity') {
			return (
				subjectivityColors[Number(category) as keyof typeof subjectivityColors] ??
				chartColors.text.faint
			);
		}
		return centralityColors[category as keyof typeof centralityColors] ?? chartColors.text.faint;
	}

	let subjectivityLabels = $derived<Record<string, string>>({
		'1': $t.filters.veryObjectiveScore,
		'2': $t.filters.ratherObjectiveScore,
		'3': $t.filters.mixedScore,
		'4': $t.filters.ratherSubjectiveScore,
		'5': $t.filters.verySubjectiveScore
	});

	function displayCategory(category: string): string {
		return dimension === 'subjectivity'
			? (subjectivityLabels[category] ?? category)
			: translateSentimentValue(category, $currentLanguage);
	}

	let options = $derived.by(() => {
		const currentT = $t;
		const total = flow.links
			.filter((link) => link.source.startsWith('0 '))
			.reduce((sum, link) => sum + link.value, 0);

		return {
			backgroundColor: 'transparent',
			title: {
				text: currentT.agreement.flowTitle,
				subtext: `${modelNames.join('  →  ')} · ${$num(total)} ${currentT.common.articles}`,
				left: 'center',
				top: '1%',
				textStyle: getTitleStyle(isMobile),
				subtextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 10 : 12,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				}
			},
			tooltip: {
				...getTooltipConfig(isMobile),
				trigger: 'item',
				formatter: (params: unknown) => {
					const item = params as {
						dataType?: string;
						name?: string;
						value?: number;
						data?: { sourceLabel?: string; targetLabel?: string; bandLabel?: string };
					};

					const title =
						item.dataType === 'edge'
							? `${item.data?.sourceLabel} → ${item.data?.targetLabel}`
							: (item.data?.bandLabel ?? item.name ?? '');

					return tooltipPanel(
						item.dataType === 'edge' ? 220 : 200,
						`<div style="font-weight:600;margin-bottom:4px;">${title}</div>`,
						`<div>${$num(item.value ?? 0)} ${currentT.agreement.flowArticles}</div>`
					);
				}
			},
			series: [
				{
					type: 'sankey',
					top: isMobile ? 90 : 84,
					bottom: isMobile ? 34 : 40,
					left: isMobile ? '4%' : '3%',
					right: isMobile ? '18%' : '13%',
					nodeWidth: isMobile ? 10 : 14,
					nodeGap: isMobile ? 6 : 10,
					// Fixed layout: `justify` would let ECharts reorder the columns, and
					// the columns are the models, in a stated order.
					nodeAlign: 'justify',
					layoutIterations: 0,
					draggable: false,
					emphasis: { focus: 'adjacency' },
					data: flow.nodes.map((node) => ({
						name: node.name,
						bandLabel: `${modelNames[node.depth]} · ${displayCategory(node.category)}`,
						depth: node.depth,
						itemStyle: { color: bandColor(node.category), borderWidth: 0 },
						label: {
							show: !isMobile || node.depth === models.length - 1,
							formatter: () => displayCategory(node.category),
							color: chartColors.text.muted,
							fontSize: isMobile ? 9 : 11,
							fontFamily: '"Public Sans", sans-serif'
						}
					})),
					links: flow.links.map((link) => {
						const source = flow.nodes.find((node) => node.name === link.source);
						const target = flow.nodes.find((node) => node.name === link.target);
						return {
							source: link.source,
							target: link.target,
							value: link.value,
							sourceLabel: source
								? `${modelNames[source.depth]} · ${displayCategory(source.category)}`
								: link.source,
							targetLabel: target
								? `${modelNames[target.depth]} · ${displayCategory(target.category)}`
								: link.target,
							lineStyle: { color: 'gradient', opacity: 0.28, curveness: 0.5 }
						};
					})
				}
			]
		} as EChartsOption;
	});
</script>

{#if flow.nodes.length > 0}
	<div class="flow-columns">
		{#each modelNames as name, index (models[index])}
			<span class="flow-column">{name}</span>
		{/each}
	</div>

	<div
		style="height: {isMobile ? '480px' : '600px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.agreement.flowTitle}
	>
		<Chart {init} {options} />
	</div>

	<p class="chart-note">{$t.agreement.flowNote}</p>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	/*
		The column headings live in the DOM rather than in the chart: a Sankey has
		no category axis, and zrender text would not be selectable or translated
		by anything a screen reader reaches.
	*/
	.flow-columns {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
		padding: 0 var(--space-2);
	}

	.flow-column {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.flow-column:first-child {
		text-align: left;
	}

	.flow-column:last-child {
		text-align: right;
	}
</style>
