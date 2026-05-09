<script lang="ts">
	import { Chart } from 'svelte-echarts';

	// ECharts core and modules for tree-shaking
	import { init, use } from 'echarts/core';
	import { BarChart, PieChart } from 'echarts/charts';
	import {
		TitleComponent,
		TooltipComponent,
		GridComponent,
		LegendComponent
	} from 'echarts/components';
	import { LabelLayout, UniversalTransition } from 'echarts/features';
	import { CanvasRenderer } from 'echarts/renderers';
	import type { EChartsOption, SeriesOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';
	import { SvelteSet } from 'svelte/reactivity';

	// Register the required components
	use([
		TitleComponent,
		TooltipComponent,
		GridComponent,
		LegendComponent,
		BarChart,
		PieChart,
		LabelLayout,
		UniversalTransition,
		CanvasRenderer
	]);

	import { filteredArticles } from '$lib';
	import type { Article } from '$lib';
	import { getJournalName } from '$lib/utils';
	import { t, currentLanguage } from '$lib/i18n';
	import { getSentimentLabels, formatNumber } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import PieChartIcon from '@lucide/svelte/icons/pie-chart';
	import {
		createPieTooltipFormatter,
		createStackedBarTooltipFormatter
	} from '$lib/utils/chartFormatters';

	// Import centralized chart theme
	import {
		subjectivityColorsByLabel,
		seriesColorPalette,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		getGridConfig,
		getPieSeriesStyle,
		getEmphasisConfig,
		getUniversalTransitionConfig,
		getStaggeredAnimationDelay
	} from '$lib/utils/chartTheme';

	// Get subjectivity labels in current language
	let subjectivityLabels = $derived(getSentimentLabels('subjectivity', $currentLanguage));

	// French labels for data lookup (data is stored in French)
	const frenchSubjectivityLabels = [
		'Factuel',
		'Plutôt factuel',
		'Mixte',
		'Plutôt subjectif',
		'Subjectif',
		'Non applicable'
	];

	// Function that converts numeric score to French label (for data operations)
	function getSubjectivityLabel(score: number | null): string {
		if (score === null || score === undefined) return 'Non applicable';

		switch (score) {
			case 1:
				return 'Factuel';
			case 2:
				return 'Plutôt factuel';
			case 3:
				return 'Mixte';
			case 4:
				return 'Plutôt subjectif';
			case 5:
				return 'Subjectif';
			default:
				return 'Non applicable';
		}
	}

	// Reactive window width for responsive behavior
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);
	let chartContainer = $state<HTMLDivElement>();
	let chartType = $state<'bar' | 'pie'>('bar');

	// Use $derived for proper reactivity in Svelte 5
	let options = $derived.by(() => {
		const articles = $filteredArticles; // Direct reactive dependency
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates
		let articlesAnalyzed = 0;
		const newspaperSubjectivityCounts: Record<string, Record<string, number>> = {};
		const uniqueNewspapers = new SvelteSet<string>();

		articles.forEach((article: Article) => {
			if (article.sentiment_analysis?.subjectivite_score !== undefined) {
				const subjectivityScore = article.sentiment_analysis.subjectivite_score;
				const subjectivityKey = getSubjectivityLabel(subjectivityScore);
				const journal = getJournalName(article); // Use the utility function
				uniqueNewspapers.add(journal);

				if (!newspaperSubjectivityCounts[journal]) {
					newspaperSubjectivityCounts[journal] = Object.fromEntries(
						frenchSubjectivityLabels.map((l) => [l, 0])
					);
				}
				if (
					Object.prototype.hasOwnProperty.call(
						newspaperSubjectivityCounts[journal],
						subjectivityKey
					)
				) {
					newspaperSubjectivityCounts[journal][subjectivityKey]++;
				}
				articlesAnalyzed++;
			}
		});

		const newspaperList = Array.from(uniqueNewspapers).sort();

		if (chartType === 'pie') {
			// Pie chart: global aggregation by subjectivity
			const totalBySubjectivity: Record<string, number> = {};
			frenchSubjectivityLabels.forEach((frenchLabel, index) => {
				const translatedLabel = subjectivityLabels[index];
				totalBySubjectivity[translatedLabel] = 0;
				newspaperList.forEach((journal) => {
					totalBySubjectivity[translatedLabel] +=
						newspaperSubjectivityCounts[journal]?.[frenchLabel] || 0;
				});
			});

			const pieData = subjectivityLabels
				.filter((label) => totalBySubjectivity[label] > 0)
				.map((label, index) => ({
					name: label,
					value: totalBySubjectivity[label],
					itemStyle: {
						color:
							subjectivityColorsByLabel[
								frenchSubjectivityLabels[index] as keyof typeof subjectivityColorsByLabel
							]
					}
				}));

			const pieStyle = getPieSeriesStyle(isMobile);
			const tooltipConfig = getTooltipConfig(isMobile);

			return {
				backgroundColor: 'transparent',
				title: {
					text: `${currentT.charts.globalDistribution} ${currentT.charts.subjectivityDistribution.toLowerCase()} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.common.articles})`,
					left: 'center',
					top: '2%',
					textStyle: getTitleStyle(isMobile)
				},
				tooltip: {
					...tooltipConfig,
					trigger: 'item',
					formatter: createPieTooltipFormatter({
						formatValue: (n) => formatNumber(n, currentLang)
					})
				},
				legend: {
					show: false
				},
				series: [
					{
						name: currentT.filters.subjectivity,
						type: 'pie',
						...pieStyle,
						...getUniversalTransitionConfig(),
						id: 'subjectivity',
						data: pieData
					}
				]
			} as EChartsOption;
		} else {
			// Bar chart (original)
			const seriesData: SeriesOption[] = newspaperList.map((journal, index) => {
				return {
					name: journal,
					type: 'bar',
					stack: 'total',
					emphasis: getEmphasisConfig(),
					...getUniversalTransitionConfig(),
					...getStaggeredAnimationDelay(),
					id: `subjectivity-${index}`,
					data: frenchSubjectivityLabels.map(
						(frenchLabel) => newspaperSubjectivityCounts[journal]?.[frenchLabel] || 0
					),
					itemStyle: {
						color: seriesColorPalette[index % seriesColorPalette.length],
						borderRadius: 0
					}
				};
			});

			const tooltipConfig = getTooltipConfig(isMobile);

			return {
				backgroundColor: 'transparent',
				title: {
					text: isMobile
						? `${currentT.charts.subjectivityDistribution} ${currentT.charts.byJournal}\n(${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`
						: `${currentT.charts.subjectivityDistribution} ${currentT.charts.byJournal} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
					left: 'center',
					top: '1%',
					textStyle: {
						...getTitleStyle(isMobile),
						lineHeight: isMobile ? 16 : 20
					}
				},
				tooltip: {
					...tooltipConfig,
					trigger: 'axis',
					triggerOn: 'mousemove',
					enterable: true,
					axisPointer: {
						type: 'shadow',
						shadowStyle: {
							color: 'rgba(59, 130, 246, 0.08)'
						}
					},
					confine: true,
					formatter: createStackedBarTooltipFormatter({
						getTotalLabel: () => currentT.common.total,
						getIsMobile: () => isMobile,
						scrollableList: true
					})
				},
				legend: {
					...getLegendConfig(isMobile),
					data: newspaperList,
					bottom: isMobile ? '8%' : undefined,
					top: isMobile ? undefined : '8%'
				},
				grid: getGridConfig(isMobile, {
					hasLegendTop: !isMobile,
					legendPosition: isMobile ? 'bottom' : 'top'
				}),
				xAxis: {
					type: 'category',
					data: subjectivityLabels,
					axisTick: {
						alignWithLabel: true,
						lineStyle: { color: 'rgba(255, 255, 255, 0.2)' }
					},
					axisLine: getAxisLineStyle(),
					axisLabel: {
						...getAxisLabelStyle(isMobile),
						rotate: isMobile ? 45 : 30,
						interval: 0
					}
				},
				yAxis: {
					type: 'value',
					minInterval: 1,
					axisLine: getAxisLineStyle(),
					splitLine: getSplitLineStyle(),
					axisLabel: {
						...getAxisLabelStyle(isMobile),
						formatter: (value: number) => Math.floor(value).toString()
					}
				},
				series: seriesData
			} as EChartsOption;
		}
	});
</script>

{#if $filteredArticles.length > 0}
	<div class="chart-toolbar">
		<DatasetBadge size="sm" />

		<div class="chart-type-toggle" role="group" aria-label={$t.charts.bars}>
			<button
				class="chart-type-btn"
				data-active={chartType === 'bar'}
				onclick={() => (chartType = 'bar')}
				aria-pressed={chartType === 'bar'}
			>
				<BarChart3Icon size={14} />
				<span>{$t.charts.bars}</span>
			</button>
			<button
				class="chart-type-btn"
				data-active={chartType === 'pie'}
				onclick={() => (chartType = 'pie')}
				aria-pressed={chartType === 'pie'}
			>
				<PieChartIcon size={14} />
				<span>{$t.charts.pie}</span>
			</button>
		</div>
	</div>

	<div
		bind:this={chartContainer}
		style="height: {isMobile ? '350px' : '450px'}; position: relative;"
		class="chart-container"
	>
		<Chart {init} {options} />
	</div>
{:else}
	<p class="empty-state">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	.chart-toolbar {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	@media (min-width: 640px) {
		.chart-toolbar {
			flex-direction: row;
		}
	}

	.chart-type-toggle {
		display: inline-flex;
		gap: 1px;
		padding: 2px;
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
	}

	.chart-type-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-1-5) var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-muted);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.chart-type-btn:hover:not([data-active='true']) {
		color: var(--text-primary);
		background: var(--surface-hover);
	}

	.chart-type-btn[data-active='true'] {
		color: var(--accent);
		background: var(--accent-soft);
	}

	.chart-container {
		background: transparent;
		padding: var(--space-2);
	}

	@media (min-width: 640px) {
		.chart-container {
			padding: var(--space-4);
		}
	}

	.empty-state {
		text-align: center;
		padding: var(--space-8) 0;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}
</style>
