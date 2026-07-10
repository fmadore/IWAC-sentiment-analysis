<!--
  SentimentChart Component

  Thin wrapper configuring DimensionDistributionChart for the polarity
  dimension (stacked bars by newspaper / global pie).
-->
<script lang="ts">
	import DimensionDistributionChart from './DimensionDistributionChart.svelte';
	import { t, currentLanguage } from '$lib/i18n';
	import { getSentimentLabels } from '$lib/i18n/utils';
	import { polarityColors } from '$lib/utils/chartTheme';

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
	let polarityLabels = $derived(getSentimentLabels('polarity', $currentLanguage));
</script>

<DimensionDistributionChart
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
