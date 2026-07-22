<!--
  SubjectivityTrendsChart Component

  Thin wrapper configuring TrendsChart for yearly subjectivity trends
  (scores 1-5; N/A is excluded from the trend lines).
-->
<script lang="ts">
	import TrendsChart from './TrendsChart.svelte';
	import { t, currentLanguage } from '$lib/i18n';
	import { getSentimentLabels } from '$lib/i18n/utils';
	import { getSubjectivityLabel } from '$lib/utils/chartAggregators';
	import { subjectivityColors } from '$lib/utils/chartTheme';

	// French labels for data lookup, in score order (1-5, no N/A)
	const frenchSubjectivityLabels = [
		'Factuel',
		'Plutôt factuel',
		'Mixte',
		'Plutôt subjectif',
		'Subjectif'
	];

	// Get subjectivity labels in current language
	let subjectivityLabels = $derived(getSentimentLabels('subjectivity', $currentLanguage));
</script>

<TrendsChart
	frenchLabels={frenchSubjectivityLabels}
	seriesLabels={subjectivityLabels}
	legendData={subjectivityLabels.slice(0, 5)}
	getKey={(article) => {
		const score = article.sentiment_analysis?.subjectivite_score;
		return score ? getSubjectivityLabel(score) : null;
	}}
	getColor={(_frenchLabel, index) =>
		subjectivityColors[(index + 1) as keyof typeof subjectivityColors]}
	title={$t.charts.subjectivityTrends}
	ariaLabel={$t.charts.subjectivityTrends}
/>
