<script lang="ts">
	import { comparisonState, datasetState, loadJustifications } from '$lib/stores';
	import { getJournalName } from '$lib/utils/format';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { getModelsFromPair, type ComparisonData } from '$lib/types/data';
	import { toCSV } from '$lib/utils/csv';
	import { getModelDisplayName } from '$lib/utils/format';
	import CsvDownloadButton from './CsvDownloadButton.svelte';

	function convertToCSV(comparisons: ComparisonData[]): string {
		if (comparisons.length === 0) return '';

		// Get model names from first comparison (they're all the same pair)
		const firstComp = comparisons[0];
		const modelAName = getModelDisplayName(firstComp.modelAId, datasetState.available);
		const modelBName = getModelDisplayName(firstComp.modelBId, datasetState.available);

		const headers = [
			$t.table.articleTitle,
			$t.filters.country,
			$t.filters.journal,
			$t.table.date,
			modelAName + ' - ' + $t.table.polarity,
			modelAName + ' - ' + $t.table.subjectivity,
			modelAName + ' - ' + $t.table.centrality,
			modelAName + ' - ' + $t.export.polarityJustification,
			modelAName + ' - ' + $t.export.subjectivityJustification,
			modelAName + ' - ' + $t.export.centralityJustification,
			modelBName + ' - ' + $t.table.polarity,
			modelBName + ' - ' + $t.table.subjectivity,
			modelBName + ' - ' + $t.table.centrality,
			modelBName + ' - ' + $t.export.polarityJustification,
			modelBName + ' - ' + $t.export.subjectivityJustification,
			modelBName + ' - ' + $t.export.centralityJustification,
			$t.comparison.polarity + ' ' + $t.comparison.pointsDifference,
			$t.comparison.subjectivity + ' ' + $t.comparison.pointsDifference,
			$t.comparison.centrality + ' ' + $t.comparison.pointsDifference,
			$t.comparison.totalDiscrepancy,
			$t.export.articleId
		];

		const modelColumns = (analysis: ComparisonData['modelA']) => [
			translateSentimentValue(analysis?.polarite, $currentLanguage),
			translateSubjectivityScore(analysis?.subjectivite_score, $currentLanguage),
			translateSentimentValue(analysis?.centralite_islam_musulmans, $currentLanguage),
			analysis?.polarite_justification,
			analysis?.subjectivite_justification,
			analysis?.centralite_justification
		];

		const rows = comparisons.map((comparison) => [
			comparison.article['o:title'],
			comparison.article.Country,
			getJournalName(comparison.article),
			// Exactly as stored: month-only and ranged dates are real in the corpus.
			comparison.article.publication_date,
			...modelColumns(comparison.modelA),
			...modelColumns(comparison.modelB),
			comparison.discrepancies.polarityDiff,
			comparison.discrepancies.subjectivityDiff,
			comparison.discrepancies.centralityDiff,
			comparison.discrepancies.totalDiff,
			comparison.article['o:id']
		]);

		return toCSV(headers, rows);
	}

	const comparisonCount = $derived(comparisonState.filtered.length);

	/** Both sides' justification prose, fetched on demand for the export. */
	async function loadPairJustifications(): Promise<void> {
		const [modelAId, modelBId] = getModelsFromPair(datasetState.pair);
		await Promise.all([loadJustifications(modelAId), loadJustifications(modelBId)]);
	}
</script>

<CsvDownloadButton
	count={comparisonCount}
	filenamePrefix="iwac-comparison"
	variant="comparison"
	prepare={loadPairJustifications}
	buildCsv={() => convertToCSV(comparisonState.filtered)}
/>
