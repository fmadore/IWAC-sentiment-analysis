<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import type { Article } from '$lib/types/data';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import { createStackedBarTooltipFormatter } from '$lib/utils/chartFormatters';
	import { spearman, interpretRho } from '$lib/utils/correlation';

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

	/**
	 * Spearman's rho between polarity and subjectivity.
	 *
	 * This view has always shown the cross-tabulation and left "do these move
	 * together?" to the eye. Both scales are ordinal, so rank correlation is the
	 * right coefficient — Pearson's r would assume the gap from Négatif to
	 * Neutre is the same size as the gap from Positif to Très positif.
	 *
	 * 'Non applicable' is excluded: it is a refusal to rate, not a rating, and
	 * placing it anywhere on the polarity scale would manufacture a correlation.
	 */
	const POLARITY_RANK: Record<string, number> = {
		'Très négatif': 1,
		Négatif: 2,
		Neutre: 3,
		Positif: 4,
		'Très positif': 5
	};

	let correlation = $derived.by(() => {
		const polarities: number[] = [];
		const subjectivities: number[] = [];

		for (const article of articleState.filtered) {
			const analysis = article.sentiment_analysis;
			const polarity = analysis?.polarite ? POLARITY_RANK[analysis.polarite] : undefined;
			const subjectivity = analysis?.subjectivite_score;

			if (polarity === undefined || typeof subjectivity !== 'number') continue;

			polarities.push(polarity);
			subjectivities.push(subjectivity);
		}

		return spearman(polarities, subjectivities);
	});

	let rhoStrength = $derived(interpretRho(correlation.rho));

	/** p-values below the float noise floor read better as an inequality. */
	function formatP(p: number): string {
		if (Number.isNaN(p)) return '—';
		return p < 0.0001 ? '< 0.0001' : p.toFixed(4);
	}

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
					color: chartColors.text.secondary,
					fontSize: isMobile ? 10 : 12,
					fontFamily:
						'"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
		style="height: {isMobile ? '450px' : '500px'}; position: relative;"
		class="chart-container p-2 sm:p-4"
		role="img"
		aria-label={$t.charts.polaritySubjectivityDistribution}
	>
		<Chart {init} {options} />
	</div>

	{#if !Number.isNaN(correlation.rho)}
		<!-- The coefficient the chart implies but never stated. Sits below the
		     chart as a statistics line rather than inside a tooltip. -->
		<p class="correlation-readout">
			<span class="stat">
				<span class="stat-key">{$t.correlation.spearman}</span>
				<span class="stat-value">{correlation.rho.toFixed(3)}</span>
			</span>
			{#if rhoStrength}
				<span class="stat">
					<span class="stat-key">{$t.correlation.strengthLabel}</span>
					<span class="stat-value">{$t.correlation.strength[rhoStrength]}</span>
				</span>
			{/if}
			<span class="stat">
				<span class="stat-key">p</span>
				<span class="stat-value">{formatP(correlation.pValue)}</span>
			</span>
			<span class="stat">
				<span class="stat-key">n</span>
				<span class="stat-value">{correlation.n.toLocaleString()}</span>
			</span>
		</p>
		<p class="correlation-note">{$t.correlation.rhoNote}</p>
	{/if}
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	/* Wire-service statistics line: monospace, tabular, sits under the chart. */
	.correlation-readout {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		justify-content: center;
		margin: var(--space-4) 0 0;
		padding-top: var(--space-3);
		border-top: 1px solid var(--border-subtle);
	}

	.stat {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.stat-key {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		/* Deliberately NOT uppercased. Uppercase turns ρ into Ρ, which is
		   indistinguishable from a Latin P, and n/p are lowercase italics by
		   statistical convention — capitalising them is wrong notation. */
		color: var(--text-muted);
	}

	.stat-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
	}

	.correlation-note {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xs);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
		max-width: var(--prose-width);
		margin: var(--space-3) auto 0;
		text-align: center;
	}
</style>
