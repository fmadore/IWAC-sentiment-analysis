<!--
  SentimentChart Component

  Thin wrapper configuring DimensionDistributionChart for the polarity
  dimension (stacked bars by newspaper / global pie).
-->
<script lang="ts">
	import DimensionDistributionChart from './DimensionDistributionChart.svelte';
	import { t } from '#lib/i18n/index.js';
	import { scaleLabels } from '#lib/i18n/utils.js';
	import { polarityColors } from '#lib/utils/chartTheme.js';

	// French labels for data lookup (data is stored in French)
	const frenchPolarityLabels = [
		'Très positif',
		'Positif',
		'Neutre',
		'Négatif',
		'Très négatif',
		'Non applicable'
	];

	// Get polarity labels in current language
	let polarityLabels = $derived($scaleLabels('polarity'));
</script>

<DimensionDistributionChart
	dimension="polarity"
	frenchLabels={frenchPolarityLabels}
	translatedLabels={polarityLabels}
	getKey={(article) =>
		article.sentiment_analysis?.polarite ? (article.sentiment_analysis.polarite as string) : null}
	getColor={(frenchLabel) => polarityColors[frenchLabel as keyof typeof polarityColors]}
	title={$t.charts.polarityDistribution}
	seriesName={$t.filters.polarity}
	seriesIdPrefix="sentiment"
	ariaLabel={$t.charts.polarityDistribution}
/>
