<script lang="ts">
	import { comparisonState, datasetState } from '$lib/stores';
	import { getJournalName } from '$lib/utils/format';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import type { ComparisonData } from '$lib/types/data';
	import { escapeCSVField, formatDateForCSV } from '$lib/utils/csv';
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

		const csvRows = [
			headers.map((header) => escapeCSVField(header)).join(','),
			...comparisons.map((comparison) => {
				const row = [
					escapeCSVField(comparison.article['o:title']),
					escapeCSVField(comparison.article.Country),
					escapeCSVField(getJournalName(comparison.article)),
					escapeCSVField(formatDateForCSV(comparison.article.publication_date)),

					escapeCSVField(translateSentimentValue(comparison.modelA?.polarite, $currentLanguage)),
					escapeCSVField(
						translateSubjectivityScore(comparison.modelA?.subjectivite_score, $currentLanguage)
					),
					escapeCSVField(
						translateSentimentValue(comparison.modelA?.centralite_islam_musulmans, $currentLanguage)
					),
					escapeCSVField(comparison.modelA?.polarite_justification),
					escapeCSVField(comparison.modelA?.subjectivite_justification),
					escapeCSVField(comparison.modelA?.centralite_justification),

					escapeCSVField(translateSentimentValue(comparison.modelB?.polarite, $currentLanguage)),
					escapeCSVField(
						translateSubjectivityScore(comparison.modelB?.subjectivite_score, $currentLanguage)
					),
					escapeCSVField(
						translateSentimentValue(comparison.modelB?.centralite_islam_musulmans, $currentLanguage)
					),
					escapeCSVField(comparison.modelB?.polarite_justification),
					escapeCSVField(comparison.modelB?.subjectivite_justification),
					escapeCSVField(comparison.modelB?.centralite_justification),

					escapeCSVField(comparison.discrepancies.polarityDiff.toString()),
					escapeCSVField(comparison.discrepancies.subjectivityDiff.toString()),
					escapeCSVField(comparison.discrepancies.centralityDiff.toString()),
					escapeCSVField(comparison.discrepancies.totalDiff.toString()),
					escapeCSVField(comparison.article['o:id']?.toString())
				];
				return row.join(',');
			})
		];

		return csvRows.join('\n');
	}

	const comparisonCount = $derived(comparisonState.filtered.length);
</script>

<CsvDownloadButton
	count={comparisonCount}
	filenamePrefix="iwac-comparison"
	variant="comparison"
	buildCsv={() => convertToCSV(comparisonState.filtered)}
/>
