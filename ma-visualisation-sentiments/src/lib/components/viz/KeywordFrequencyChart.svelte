<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { innerWidth } from 'svelte/reactivity/window';
	import { uiState, extremeState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';
	import { getExtremeCategoryConfig, getTopKeywords } from '$lib/utils/extremeAnalysis';
	import {
		getTitleStyle,
		getTooltipConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		chartColors
	} from '$lib/utils/chartTheme';

	// ECharts imports
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { createSimpleTooltipFormatter } from '$lib/utils/chartFormatters';

	// Component props
	interface Props {
		selectedCategory: ExtremeCategory;
		selectedKeywordType: KeywordType;
		showTopN: number;
	}

	let { selectedCategory, selectedKeywordType, showTopN }: Props = $props();

	// Reactive window width for responsive behavior
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Loading state - use specific loading state for better UX
	let isLoading = $derived(uiState.isLoadingExtremeAnalysis || !extremeState.filtered);

	// Derived data
	let categoryData = $derived.by(() => {
		if (!extremeState.filtered) return null;
		return extremeState.filtered.analysis[selectedCategory];
	});

	// Chart options
	let options = $derived.by(() => {
		const data = categoryData;
		if (!data) return null;

		const keywords = selectedKeywordType === 'subject' ? data.subject : data.spatial;

		const topKeywords = getTopKeywords(keywords, showTopN);
		const categoryConfig = getExtremeCategoryConfig(selectedCategory);

		// Reverse for horizontal display (highest at top)
		const reversedData = [...topKeywords].reverse();

		// --- Dynamic left spacing & label width ---
		// We previously used a percentage (25-30%) which created large unused blank space.
		// Compute an approximate width needed for the longest label and size the grid and label width accordingly.
		const longestLabelLength = reversedData.reduce((max, k) => Math.max(max, k.keyword.length), 0);
		// Average character width heuristic (px). Monitors mobile vs desktop.
		const avgCharWidth = isMobile ? 6 : 7; // conservative so we don't truncate early
		const computedLabelWidth = longestLabelLength * avgCharWidth;
		// Clamp to sensible bounds so extremely long labels don't consume the whole chart.
		const labelWidth = Math.min(
			Math.max(computedLabelWidth, isMobile ? 90 : 140),
			isMobile ? 180 : 260 // slightly reduced max to avoid excessive whitespace
		);
		// IMPORTANT: With containLabel=true ECharts already expands the grid area to fit labels.
		// Previously we added labelWidth to grid.left, effectively doubling the needed space.
		// Keep a small constant padding only.
		const baseLeftPadding = isMobile ? 8 : 12; // px

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: $t.extremeAnalysis.topKeywords,
				textStyle: getTitleStyle(isMobile),
				left: 'center',
				top: 15
			},
			tooltip: {
				...tooltipConfig,
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
					shadowStyle: {
						color: chartColors.axis.pointerShadowNeutral
					}
				},
				formatter: createSimpleTooltipFormatter({
					getLabel: () => $t.extremeAnalysis.articleCount
				})
			},
			grid: {
				// Use pixel value derived above instead of large percentage to reclaim space.
				left: baseLeftPadding,
				right: isMobile ? '8%' : '10%',
				top: 60,
				bottom: 40,
				containLabel: true
			},
			xAxis: {
				type: 'value',
				axisLabel: getAxisLabelStyle(isMobile),
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle()
			},
			yAxis: {
				type: 'category',
				data: reversedData.map((item) => item.keyword),
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					color: chartColors.text.secondary,
					interval: 0,
					// Allow larger labels; only ellipsize if still too long for computed width.
					formatter: (value: string) => {
						const maxChars = Math.floor(labelWidth / avgCharWidth);
						if (value.length > maxChars) {
							return value.slice(0, Math.max(0, maxChars - 2)) + '…';
						}
						return value;
					},
					margin: 12,
					overflow: 'truncate',
					width: labelWidth
				},
				axisLine: getAxisLineStyle(),
				axisTick: {
					show: false
				},
				splitLine: {
					show: false
				}
			},
			series: [
				{
					type: 'bar',
					barWidth: isMobile ? '50%' : '60%',
					data: reversedData.map((item) => ({
						value: item.count,
						itemStyle: {
							color: categoryConfig?.color || chartColors.chrome.accent,
							borderRadius: 0
						}
					})),
					emphasis: {
						focus: 'series' as const,
						itemStyle: {
							borderColor: chartColors.text.primary,
							borderWidth: 1
						}
					},
					animationDuration: 1000,
					animationEasing: 'cubicOut',
					animationDelay: (idx: number) => idx * 30
				}
			]
		} as EChartsOption;
	});
</script>

{#if isLoading}
	<!-- Loading State -->
	<div class="loading-container">
		<div class="chart-container extreme-chart-container p-4" style="min-height: 500px;">
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<Spinner
						size="2xl"
						--spinner-track="var(--border-default)"
						--spinner-accent="var(--sentiment-extreme)"
					/>
					<p class="loading-note">{$t.messages.loading}</p>
				</div>
			</div>
		</div>
	</div>
{:else if extremeState.filtered && options}
	<!-- Category Description -->
	{#if selectedCategory}
		{@const descriptionKey = selectedCategory
			.replace('_extreme', '')
			.replace('polarity_very_', 'polarity')
			.replace('centrality_', 'centrality') as keyof typeof $t.extremeAnalysis.descriptions}
		{@const description = $t.extremeAnalysis.descriptions[descriptionKey]}
		{#if description && description.trim()}
			<div class="extreme-description-card">
				<p class="description-text leading-relaxed">
					{description}
				</p>
			</div>
		{/if}
	{/if}

	<!-- Chart Container -->
	<div
		style="height: {isMobile ? '400px' : '500px'}; position: relative;"
		class="chart-container extreme-chart-container p-2 sm:p-4"
		role="img"
		aria-label={$t.extremeAnalysis.topKeywords}
	>
		<Chart {init} {options} />
	</div>

	<!-- Statistics Card -->
	{#if categoryData}
		{@const data = categoryData}
		<div class="extreme-stats-card">
			<div class="statistics-row">
				<div class="stat-item">
					<span class="stat-label">{$t.common.total} {$t.common.articles}:</span>
					<span class="stat-value extreme-stat-value">{data?.articles.length || 0}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">{$t.extremeAnalysis.topKeywords}:</span>
					<span class="stat-value extreme-stat-value">{showTopN}</span>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<p class="chart-empty">{$t.messages.noData}</p>
{/if}

<style>
	.loading-container {
		animation: fadeIn var(--timing-normal) ease-in-out;
	}

	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Chart Container */
	.chart-container {
		background: var(--surface-muted);
		border: 1px solid var(--border-subtle);
	}

	.extreme-chart-container {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-extreme);
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.extreme-chart-container:hover {
		border-color: var(--border-hover);
		border-top-color: var(--sentiment-extreme);
	}

	/* Description Card */
	.extreme-description-card {
		background: color-mix(in oklab, var(--sentiment-extreme) 6%, transparent);
		border: 1px solid color-mix(in oklab, var(--sentiment-extreme) 18%, transparent);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	/* Statistics Card */
	.extreme-stats-card {
		background: var(--surface-subtle);
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
		margin-top: var(--space-4);
	}

	/* Statistics Row */
	.statistics-row {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
		justify-content: center;
	}

	.stat-item {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		text-align: center;
	}

	.stat-label {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}

	.stat-value {
		color: var(--text-primary);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-base);
	}

	.extreme-stat-value {
		color: var(--sentiment-extreme-accent);
	}

	/* Mobile Responsiveness */
	@media (min-width: 640px) {
		.statistics-row {
			flex-direction: row;
			gap: var(--space-6);
		}

		.stat-item {
			text-align: left;
		}
	}

	@media (min-width: 1024px) {
		.statistics-row {
			gap: var(--space-8);
		}

		.stat-label {
			font-size: var(--font-size-base);
		}

		.stat-value {
			font-size: var(--font-size-lg);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.extreme-chart-container,
		.extreme-description-card,
		.extreme-stats-card {
			animation: none;
			transition: none;
		}
	}

	.loading-note {
		color: var(--text-secondary);
	}

	.description-text {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}
</style>
