<!--
  DissentProfileChart Component

  The chart the pairwise architecture structurally cannot produce: every article
  decomposed into five mutually exclusive outcomes — unanimous, one of the three
  models standing alone, or no two agreeing at all.

  Two forms of the same finding. The stacked bars are exact and readable per
  title; the triangle puts the whole press landscape's model-sensitivity on one
  panel, a title sitting at a corner when one model does all the dissenting there
  and at the centre when the three share it evenly.

  ECharts has no ternary series, so the triangle is barycentric coordinates
  projected into pixel space by two `custom` series — one silent backdrop, one
  for the points. Pixel space rather than a cartesian grid on purpose: a grid
  whose aspect ratio follows the container would render the triangle as a
  different, non-equilateral triangle at every viewport width, and the distance
  from a corner is the entire reading.

  The mode switch changes what a series means, so the whole chart is keyed on it
  — `setOption` merges by default and would otherwise leave the old series behind.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { num, pct } from '$lib/i18n/utils';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { t } from '$lib/i18n';
	import { getModelDisplayNames } from '$lib/utils/format';
	import {
		tooltipFooterRow,
		tooltipHeader,
		tooltipPanel,
		tooltipSeriesRow
	} from '$lib/utils/chartFormatters';
	import { datasetState } from '$lib/stores';
	import {
		barycentric,
		rankNewspaperDisagreement,
		TRIANGLE_CORNERS,
		type AgreementDimension,
		type ConsensusRow,
		type NewspaperDisagreement
	} from '$lib/utils/consensus';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import {
		seriesColorPalette,
		chartColors,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		getEmphasisConfig
	} from '$lib/utils/chartTheme';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import TriangleIcon from '@lucide/svelte/icons/triangle';

	interface DissentProfileChartProps {
		rows: ConsensusRow[];
		models: readonly string[];
		dimension: AgreementDimension;
		includeDeclined: boolean;
		minArticles?: number;
	}

	let {
		rows,
		models,
		dimension,
		includeDeclined,
		minArticles = 30
	}: DissentProfileChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let mode = $state<'stacked' | 'ternary'>('stacked');

	let modeOptions = $derived([
		{ value: 'stacked', label: $t.agreement.dissentStacked, icon: BarChart3Icon },
		{ value: 'ternary', label: $t.agreement.dissentTernary, icon: TriangleIcon }
	]);

	let modelNames = $derived(getModelDisplayNames(models, datasetState.availableInGeneration));

	/**
	 * Model series take the categorical palette rather than the brand colours,
	 * matching ModelCalibrationChart directly above. The brand greens and reds
	 * are the polarity ramp's hues, and a model series wearing them next to a
	 * sentiment chart reads as a claim about sentiment.
	 */
	let modelColors = $derived(
		models.map((_, index) => seriesColorPalette[index % seriesColorPalette.length])
	);

	let ranked = $derived(
		rankNewspaperDisagreement(rows, dimension, models.length, { includeDeclined, minArticles })
	);

	/** Ranked by how often anyone breaks ranks, so the contested titles lead. */
	let byDissent = $derived([...ranked].sort((a, b) => a.unanimity - b.unanimity));

	const percent = (value: number) => $pct(value, 1);

	// --- Stacked form ---------------------------------------------------------

	let stackedOptions = $derived.by(() => {
		const currentT = $t;
		const names = byDissent.map((entry) => entry.newspaper);

		const seriesNames = [
			currentT.agreement.unanimous,
			...modelNames.map((name) => `${name} ${currentT.agreement.dissentsAlone}`),
			currentT.agreement.allDiffer
		];

		const bands: { name: string; color: string; values: number[] }[] = [
			{
				name: seriesNames[0],
				color: chartColors.text.faint,
				values: byDissent.map((entry) => entry.unanimity * 100)
			},
			...models.map((_, index) => ({
				name: seriesNames[index + 1],
				color: modelColors[index],
				values: byDissent.map((entry) => (entry.dissentShare[index] ?? 0) * 100)
			})),
			{
				name: seriesNames[seriesNames.length - 1],
				color: chartColors.chrome.accent,
				values: byDissent.map((entry) => entry.splitShare * 100)
			}
		];

		return {
			backgroundColor: 'transparent',
			title: {
				text: currentT.agreement.dissentTitle,
				subtext: currentT.agreement.dissentSubtitle,
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
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
					shadowStyle: { color: chartColors.axis.pointerShadowNeutral }
				},
				formatter: (params: unknown) => {
					const list = (Array.isArray(params) ? params : [params]) as {
						seriesName?: string;
						color?: string;
						value?: number;
						dataIndex?: number;
					}[];
					const entry = byDissent[list[0]?.dataIndex ?? 0];
					if (!entry) return '';

					return tooltipPanel(
						260,
						tooltipHeader(`${entry.newspaper} · ${$num(entry.n)} ${currentT.common.articles}`),
						list
							.map((item) =>
								tooltipSeriesRow(item.color, item.seriesName, $pct((item.value ?? 0) / 100, 1))
							)
							.join('')
					);
				}
			},
			legend: {
				...getLegendConfig(isMobile),
				data: seriesNames,
				top: isMobile ? '12%' : '9%'
			},
			grid: {
				top: isMobile ? 150 : 130,
				bottom: 40,
				left: '2%',
				right: isMobile ? '6%' : '4%',
				containLabel: true
			},
			xAxis: {
				type: 'value',
				min: 0,
				max: 100,
				axisLabel: { ...getAxisLabelStyle(isMobile), formatter: (value: number) => `${value}%` },
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle()
			},
			yAxis: {
				type: 'category',
				data: names,
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					interval: 0,
					fontSize: isMobile ? 8 : 10
				},
				axisLine: getAxisLineStyle(),
				axisTick: { show: false }
			},
			series: bands.map((band) => ({
				name: band.name,
				type: 'bar',
				stack: 'outcome',
				data: band.values,
				itemStyle: { color: band.color, borderRadius: 0 },
				emphasis: getEmphasisConfig()
			}))
		} as EChartsOption;
	});

	// --- Ternary form ---------------------------------------------------------

	interface TernaryPoint {
		entry: NewspaperDisagreement;
		unit: [number, number];
	}

	let ternaryPoints = $derived.by<TernaryPoint[]>(() => {
		const points: TernaryPoint[] = [];
		for (const entry of ranked) {
			const unit = barycentric(entry.dissentShare);
			if (unit) points.push({ entry, unit });
		}
		return points;
	});

	let maxArticles = $derived(Math.max(1, ...ternaryPoints.map((point) => point.entry.n)));

	/**
	 * The triangle's pixel geometry for a given canvas, with equal margins and a
	 * height locked to the equilateral ratio. Both custom series call this, so
	 * the backdrop and the points can never disagree about where a corner is.
	 */
	function geometry(width: number, height: number) {
		const margin = isMobile ? 48 : 64;
		const top = isMobile ? 110 : 96;
		const usableWidth = Math.max(1, width - margin * 2);
		const usableHeight = Math.max(1, height - top - margin);
		const side = Math.min(usableWidth, usableHeight / (Math.sqrt(3) / 2));

		const originX = (width - side) / 2;
		const originY = top + (usableHeight + (side * Math.sqrt(3)) / 2) / 2;

		// Unit space has y growing upward; canvas y grows downward.
		const project = ([ux, uy]: [number, number]): [number, number] => [
			originX + ux * side,
			originY - uy * side
		];

		return { side, project };
	}

	let ternaryOptions = $derived.by(() => {
		const currentT = $t;
		const labels = modelNames;
		const colors = modelColors;
		const points = ternaryPoints;
		const largest = maxArticles;

		return {
			backgroundColor: 'transparent',
			title: {
				text: currentT.agreement.dissentTitle,
				subtext: currentT.agreement.dissentSubtitle,
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
					const point = points[(params as { dataIndex?: number }).dataIndex ?? 0];
					if (!point) return '';

					return tooltipPanel(
						250,
						tooltipHeader(
							`${point.entry.newspaper} · ${$num(point.entry.n)} ${currentT.common.articles}`
						),
						point.entry.dissentShare
							.map((share, index) => tooltipSeriesRow(colors[index], labels[index], percent(share)))
							.join(''),
						tooltipFooterRow(currentT.agreement.unanimityRate, percent(point.entry.unanimity))
					);
				}
			},
			// A single full-bleed cartesian grid the custom series ignore: they draw
			// in pixel space, but ECharts still requires a coordinate system to exist.
			grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
			xAxis: { type: 'value', min: 0, max: 1, show: false },
			yAxis: { type: 'value', min: 0, max: 1, show: false },
			series: [
				{
					type: 'custom',
					silent: true,
					z: 1,
					data: [0],
					renderItem: (
						_params: unknown,
						api: { getWidth: () => number; getHeight: () => number }
					) => {
						const { project } = geometry(api.getWidth(), api.getHeight());
						const corners = TRIANGLE_CORNERS.map((corner) => project(corner as [number, number]));

						const edge = {
							stroke: chartColors.border.medium,
							lineWidth: 1,
							fill: 'transparent'
						};

						const children: unknown[] = [
							{
								type: 'polygon',
								shape: { points: corners },
								style: edge
							}
						];

						// Three gridlines per third, so "a quarter of the way from that
						// corner" is readable rather than estimated.
						for (const fraction of [0.25, 0.5, 0.75]) {
							for (let corner = 0; corner < 3; corner++) {
								const a = TRIANGLE_CORNERS[corner] as [number, number];
								const b = TRIANGLE_CORNERS[(corner + 1) % 3] as [number, number];
								const c = TRIANGLE_CORNERS[(corner + 2) % 3] as [number, number];

								const start = project([
									a[0] + (b[0] - a[0]) * fraction,
									a[1] + (b[1] - a[1]) * fraction
								]);
								const end = project([
									a[0] + (c[0] - a[0]) * fraction,
									a[1] + (c[1] - a[1]) * fraction
								]);

								children.push({
									type: 'line',
									shape: { x1: start[0], y1: start[1], x2: end[0], y2: end[1] },
									style: { stroke: chartColors.border.subtle, lineWidth: 1 }
								});
							}
						}

						const labelOffsets: [number, number][] = [
							[-6, 18],
							[6, 18],
							[0, -14]
						];
						const alignments = ['right', 'left', 'center'];

						corners.forEach((corner, index) => {
							children.push({
								type: 'text',
								style: {
									text: labels[index],
									x: corner[0] + labelOffsets[index][0],
									y: corner[1] + labelOffsets[index][1],
									fill: colors[index],
									font: `600 ${isMobile ? 10 : 12}px "Public Sans", sans-serif`,
									align: alignments[index],
									verticalAlign: 'middle'
								}
							});
						});

						return { type: 'group', children };
					}
				},
				{
					type: 'custom',
					z: 2,
					data: points.map((point) => [point.unit[0], point.unit[1]]),
					renderItem: (
						params: { dataIndex: number },
						api: { getWidth: () => number; getHeight: () => number }
					) => {
						const point = points[params.dataIndex];
						if (!point) return { type: 'group', children: [] };

						const { project } = geometry(api.getWidth(), api.getHeight());
						const [x, y] = project(point.unit);

						// Area-proportional: radius on sqrt so a title with ten times the
						// articles does not read as a hundred times the weight.
						const radius =
							(isMobile ? 4 : 5) + Math.sqrt(point.entry.n / largest) * (isMobile ? 10 : 16);

						// Tinted toward whichever model dissents most there, so the colour
						// says the same thing as the position.
						const dominant = point.entry.dissentShare.indexOf(
							Math.max(...point.entry.dissentShare)
						);

						return {
							type: 'circle',
							shape: { cx: x, cy: y, r: radius },
							style: {
								fill: colors[dominant] ?? colors[0],
								opacity: 0.55,
								stroke: chartColors.border.strong,
								lineWidth: 1
							}
						};
					}
				}
			]
		} as EChartsOption;
	});

	let chartHeight = $derived(
		mode === 'stacked'
			? Math.max(360, byDissent.length * (isMobile ? 20 : 24) + 170)
			: isMobile
				? 420
				: 560
	);
</script>

{#if ranked.length > 0}
	<div class="chart-toolbar">
		<span class="toolbar-label">{$t.agreement.dissentTitle}</span>
		<ChartTypeToggle
			options={modeOptions}
			value={mode}
			onChange={(value) => (mode = value as 'stacked' | 'ternary')}
			ariaLabel={$t.agreement.dissentTitle}
		/>
	</div>

	<!--
		Keyed: the two modes are different series shapes on different coordinate
		conventions, and setOption merges.
	-->
	{#key mode}
		<div
			style="height: {chartHeight}px; position: relative;"
			class="chart-container"
			role="img"
			aria-label={$t.agreement.dissentTitle}
		>
			<Chart {init} options={mode === 'stacked' ? stackedOptions : ternaryOptions} />
		</div>
	{/key}

	{#if mode === 'ternary'}
		<p class="chart-note">{$t.agreement.dissentTernaryNote}</p>
	{/if}
{:else}
	<p class="chart-empty">
		{$t.agreement.disagreementEmpty.replace('{min}', String(minArticles))}
	</p>
{/if}
