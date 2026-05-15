<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib';
	import type { Article } from '$lib';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import { createStackedBarTooltipFormatter } from '$lib/utils/chartFormatters';

	// Import centralized chart theme
	import {
		subjectivityColors,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		getGridConfig,
		getEmphasisConfig,
		getStaggeredAnimationDelay,
		chartColors
	} from '$lib/utils/chartTheme';

	// Ordre des polarités pour l'affichage (French values for data operations)
	const polarityOrder = [
		'Très négatif',
		'Négatif',
		'Neutre',
		'Positif',
		'Très positif',
		'Non applicable'
	];

	// Reactive translated polarity labels for display
	let translatedPolarityLabels = $derived(
		polarityOrder.map((polarity) => translateSentimentValue(polarity, $currentLanguage))
	);

	// Ordre des scores de subjectivité
	const subjectivityOrder = [1, 2, 3, 4, 5];

	// Reactive subjectivity labels that update with language changes
	let subjectivityLabels = $derived({
		1: $t.filters.veryObjectiveScore,
		2: $t.filters.ratherObjectiveScore,
		3: $t.filters.mixedScore,
		4: $t.filters.ratherSubjectiveScore,
		5: $t.filters.verySubjectiveScore
	});

	// Reactive window width for responsive behavior
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);
	let chartContainer = $state<HTMLDivElement>();

	let options = $derived.by(() => {
		const articles = articleState.filtered;

		// Structure: polarité -> subjectivité -> count
		const data: Record<string, Record<number, number>> = {};
		let articlesAnalyzed = 0;

		// Initialiser la structure de données
		polarityOrder.forEach((polarity) => {
			data[polarity] = {};
			subjectivityOrder.forEach((subj) => {
				data[polarity][subj] = 0;
			});
		});

		// Compter les articles
		articles.forEach((article: Article) => {
			if (
				article.sentiment_analysis?.polarite &&
				article.sentiment_analysis?.subjectivite_score !== undefined
			) {
				const polarity = article.sentiment_analysis.polarite;
				const subjectivity = article.sentiment_analysis.subjectivite_score;

				if (data[polarity] && subjectivity !== null && subjectivity >= 1 && subjectivity <= 5) {
					data[polarity][subjectivity]++;
					articlesAnalyzed++;
				}
			}
		});

		// Créer les séries pour chaque score de subjectivité
		const series = subjectivityOrder.map((subjScore) => ({
			name: subjectivityLabels[subjScore as keyof typeof subjectivityLabels],
			type: 'bar' as const,
			data: polarityOrder.map((polarity) => data[polarity][subjScore]),
			itemStyle: {
				color: subjectivityColors[subjScore as keyof typeof subjectivityColors],
				borderRadius: 0
			},
			emphasis: getEmphasisConfig(),
			...getStaggeredAnimationDelay()
		}));

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: `${$t.charts.polaritySubjectivityDistribution} (${articlesAnalyzed} ${$t.common.articles})`,
				left: 'center',
				top: '2%',
				textStyle: getTitleStyle(isMobile)
			},
			tooltip: {
				...tooltipConfig,
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
					shadowStyle: {
						color: chartColors.axis.pointerShadow
					}
				},
				formatter: createStackedBarTooltipFormatter({
					getTotalLabel: () => 'Total',
					headerKey: 'name',
					sort: false,
					totalSuffix: () => $t.common.articles
				})
			},
			legend: {
				...getLegendConfig(isMobile),
				data: subjectivityOrder.map(
					(s) => subjectivityLabels[s as keyof typeof subjectivityLabels]
				),
				top: isMobile ? '12%' : '8%'
			},
			grid: getGridConfig(isMobile, { hasLegendTop: true }),
			xAxis: {
				type: 'category',
				data: translatedPolarityLabels,
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					interval: 0,
					rotate: isMobile ? 45 : 0
				},
				axisLine: getAxisLineStyle(),
				axisTick: {
					alignWithLabel: true,
					lineStyle: { color: chartColors.axis.tickLine }
				}
			},
			yAxis: {
				type: 'value',
				name: $t.filters.numberOfArticles,
				nameLocation: 'middle',
				nameGap: 50,
				axisLabel: getAxisLabelStyle(isMobile),
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle(),
				nameTextStyle: {
					color: 'rgba(255, 255, 255, 0.85)',
					fontSize: isMobile ? 10 : 12,
					fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
				}
			},
			series: series
		} as EChartsOption;
	});
</script>

{#if articleState.filtered.length > 0}
	<div class="mb-4">
		<DatasetBadge size="sm" />
	</div>

	<div
		bind:this={chartContainer}
		style="height: {isMobile ? '450px' : '500px'}; position: relative;"
		class="chart-container p-2 sm:p-4"
	>
		<Chart {init} {options} />
	</div>
{:else}
	<p class="text-center py-8 text-white/80 text-sm sm:text-base">{$t.table.noFilteredArticles}</p>
{/if}
