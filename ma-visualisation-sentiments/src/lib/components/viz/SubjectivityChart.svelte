<!--
  SubjectivityChart Component

  Thin wrapper configuring DimensionDistributionChart for the subjectivity
  dimension (stacked bars by newspaper / global pie).
-->
<script lang="ts">
	import DimensionDistributionChart from './DimensionDistributionChart.svelte';
	import { t, currentLanguage } from '$lib/i18n';
	import { getSentimentLabels } from '$lib/i18n/utils';
	import { getSubjectivityLabel } from '$lib/utils/chartAggregators';
	import { subjectivityColorsByLabel } from '$lib/utils/chartTheme';

	// French labels for data lookup (data is stored in French)
	const frenchSubjectivityLabels = [
		'Factuel',
		'Plutôt factuel',
		'Mixte',
		'Plutôt subjectif',
		'Subjectif',
		'Non applicable'
	];

	// Get subjectivity labels in current language
	let subjectivityLabels = $derived(getSentimentLabels('subjectivity', $currentLanguage));
</script>

<DimensionDistributionChart
	frenchLabels={frenchSubjectivityLabels}
	translatedLabels={subjectivityLabels}
	getKey={(article) => {
		const score = article.sentiment_analysis?.subjectivite_score;
		return score === undefined ? null : getSubjectivityLabel(score);
	}}
	getColor={(frenchLabel) =>
		subjectivityColorsByLabel[frenchLabel as keyof typeof subjectivityColorsByLabel]}
	title={$t.charts.subjectivityDistribution}
	seriesName={$t.filters.subjectivity}
	seriesIdPrefix="subjectivity"
	ariaLabel={$t.charts.subjectivityDistribution}
/>
