<!--
  SentimentTrendsChart Component

  Thin wrapper configuring TrendsChart for yearly polarity trends.
-->
<script lang="ts">
	import TrendsChart from './TrendsChart.svelte';
	import { t } from '#lib/i18n/index.js';
	import { scaleLabels } from '#lib/i18n/utils.js';
	import { polarityColors } from '#lib/utils/chartTheme.js';

	// French labels for data lookup (data is stored in French).
	// 'Non applicable' is excluded from the trend lines.
	const frenchPolarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif'];

	// Get polarity labels in current language
	let polarityLabels = $derived($scaleLabels('polarity'));
</script>

<TrendsChart
	stateKey="polarityTrend"
	frenchLabels={frenchPolarityLabels}
	seriesLabels={polarityLabels}
	getKey={(article) => article.sentiment_analysis?.polarite ?? null}
	getColor={(frenchLabel) => polarityColors[frenchLabel as keyof typeof polarityColors]}
	title={$t.charts.sentimentTrends}
	ariaLabel={$t.charts.sentimentTrends}
/>
