<!--
  CentralityChart Component

  Thin wrapper configuring DimensionDistributionChart for the centrality
  dimension (global bar or pie, or per-newspaper 100% profiles).
-->
<script lang="ts">
	import DimensionDistributionChart from './DimensionDistributionChart.svelte';
	import { t, currentLanguage } from '#lib/i18n/index.js';
	import { getSentimentLabels } from '#lib/i18n/utils.js';
	import { centralityColors, polarityColors } from '#lib/utils/chartTheme.js';

	// French labels for data lookup (data is stored in French)
	const frenchCentralityLabels = [
		'Très central',
		'Central',
		'Secondaire',
		'Marginal',
		'Non abordé',
		'Non applicable'
	];

	let centralityLabels = $derived([
		...getSentimentLabels('centrality', $currentLanguage),
		$t.sentiment.notApplicable
	]);

	// `Non applicable` has no step on the amber ramp; it shares the neutral grey
	// the polarity ramp gives the same verdict.
	function colorOf(frenchLabel: string): string {
		return frenchLabel in centralityColors
			? centralityColors[frenchLabel as keyof typeof centralityColors]
			: polarityColors['Non applicable'];
	}
</script>

<DimensionDistributionChart
	dimension="centrality"
	frenchLabels={frenchCentralityLabels}
	translatedLabels={centralityLabels}
	getKey={(article) => article.sentiment_analysis?.centralite_islam_musulmans ?? null}
	getColor={colorOf}
	title={$t.charts.centralityDistribution}
	seriesName={$t.filters.centrality}
	seriesIdPrefix="centrality"
	ariaLabel={$t.charts.centralityDistribution}
/>
