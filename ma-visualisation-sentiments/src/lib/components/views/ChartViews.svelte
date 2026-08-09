<script lang="ts">
	import SentimentChart from '$lib/components/viz/SentimentChart.svelte';
	import SentimentTrendsChart from '$lib/components/viz/SentimentTrendsChart.svelte';
	import SubjectivityChart from '$lib/components/viz/SubjectivityChart.svelte';
	import SubjectivityTrendsChart from '$lib/components/viz/SubjectivityTrendsChart.svelte';
	import CorrelationChart from '$lib/components/viz/CorrelationChart.svelte';
	import VolumeChart from '$lib/components/viz/VolumeChart.svelte';
	import CentralityHeatmap from '$lib/components/viz/CentralityHeatmap.svelte';
	import HijriSeasonalityChart from '$lib/components/viz/HijriSeasonalityChart.svelte';
	import NewspaperRankingChart from '$lib/components/viz/NewspaperRankingChart.svelte';
	import { ChartCard } from '$lib/components/ui';

	type ChartView =
		'charts' | 'trends' | 'correlation' | 'volume' | 'seasonality' | 'heatmap' | 'ranking';
	let { view }: { view: ChartView } = $props();
</script>

{#if view === 'charts'}
	<div class="space-y-4 sm:space-y-6">
		<ChartCard variant="charts"><SentimentChart /></ChartCard>
		<ChartCard variant="charts"><SubjectivityChart /></ChartCard>
	</div>
{:else if view === 'trends'}
	<ChartCard variant="trends" class="mb-6"><SentimentTrendsChart /></ChartCard>
	<ChartCard variant="trends"><SubjectivityTrendsChart /></ChartCard>
{:else if view === 'correlation'}
	<ChartCard variant="correlation"><CorrelationChart /></ChartCard>
{:else if view === 'volume'}
	<ChartCard variant="volume"><VolumeChart /></ChartCard>
{:else if view === 'seasonality'}
	<ChartCard variant="volume"><HijriSeasonalityChart /></ChartCard>
{:else if view === 'heatmap'}
	<ChartCard variant="heatmap"><CentralityHeatmap /></ChartCard>
{:else if view === 'ranking'}
	<ChartCard variant="charts"><NewspaperRankingChart /></ChartCard>
{/if}
