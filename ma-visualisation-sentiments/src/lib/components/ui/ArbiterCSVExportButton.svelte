<!--
  ArbiterCSVExportButton

  Exports arbiter evaluation data (article metadata, both model analyses,
  and arbiter verdicts) to CSV. The button chrome/flow is shared via
  CsvDownloadButton; this wrapper only builds the arbiter-specific rows.
-->
<script lang="ts">
	import {
		arbiterEvaluations,
		comparisonState,
		datasetState,
		getActualModelName
	} from '$lib/stores';
	import { getJournalName } from '$lib/utils/format';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { getPairModelNames, type ArbiterEvaluationData } from '$lib/types/data';
	import { escapeCSVField, formatDateForCSV } from '$lib/utils/csv';
	import CsvDownloadButton from './CsvDownloadButton.svelte';

	// Get model names from current pair
	const modelNames = $derived(getPairModelNames(datasetState.pair, datasetState.available));

	// Uses getActualModelName to correctly map arbiter's blind model_a/model_b
	// to actual model names (arbiter_model_a/arbiter_model_b from metadata).
	function translateVerdict(verdict: 'model_a' | 'model_b' | 'both' | 'neither'): string {
		switch (verdict) {
			case 'model_a':
			case 'model_b':
				return getActualModelName(verdict);
			case 'both':
				return $t.arbiter.bothEqual;
			case 'neither':
				return $t.arbiter.neitherAccurate;
			default:
				return verdict;
		}
	}

	function translateConfidence(level: 'high' | 'medium' | 'low'): string {
		switch (level) {
			case 'high':
				return $t.arbiter.confidenceHigh;
			case 'medium':
				return $t.arbiter.confidenceMedium;
			case 'low':
				return $t.arbiter.confidenceLow;
			default:
				return level;
		}
	}

	type ArbiterEvaluationItem = ArbiterEvaluationData['evaluations'][number];

	function convertToCSV(evaluations: ArbiterEvaluationItem[]): string {
		if (evaluations.length === 0) return '';

		const comparisons = comparisonState.data;

		const headers = [
			$t.table.articleTitle,
			$t.filters.country,
			$t.filters.journal,
			$t.table.date,
			modelNames.modelAName + ' - ' + $t.table.polarity,
			modelNames.modelAName + ' - ' + $t.table.subjectivity,
			modelNames.modelAName + ' - ' + $t.table.centrality,
			modelNames.modelBName + ' - ' + $t.table.polarity,
			modelNames.modelBName + ' - ' + $t.table.subjectivity,
			modelNames.modelBName + ' - ' + $t.table.centrality,
			$t.arbiter.overallVerdict,
			$t.arbiter.confidenceLevel,
			$t.arbiter.polarity + ' - ' + $t.arbiter.arbiterScore,
			$t.arbiter.polarity + ' - ' + $t.arbiter.arbiterJustification,
			$t.arbiter.polarity + ' - ' + $t.arbiter.verdict,
			$t.arbiter.polarity + ' - ' + $t.arbiter.verdictExplanation,
			$t.arbiter.subjectivity + ' - ' + $t.arbiter.arbiterScore,
			$t.arbiter.subjectivity + ' - ' + $t.arbiter.arbiterJustification,
			$t.arbiter.subjectivity + ' - ' + $t.arbiter.verdict,
			$t.arbiter.subjectivity + ' - ' + $t.arbiter.verdictExplanation,
			$t.arbiter.centrality + ' - ' + $t.arbiter.arbiterScore,
			$t.arbiter.centrality + ' - ' + $t.arbiter.arbiterJustification,
			$t.arbiter.centrality + ' - ' + $t.arbiter.verdict,
			$t.arbiter.centrality + ' - ' + $t.arbiter.verdictExplanation,
			$t.arbiter.arbiterJustification,
			$t.export.articleId
		];

		const csvRows = [
			headers.map((header) => escapeCSVField(header)).join(','),
			...evaluations.map((evaluation) => {
				const comparison = comparisons?.find(
					(c) => String(c.article['o:id']) === String(evaluation.article_id)
				);

				const row = [
					escapeCSVField(comparison?.article['o:title'] || `Article ${evaluation.article_id}`),
					escapeCSVField(comparison?.article.Country || ''),
					escapeCSVField(comparison ? getJournalName(comparison.article) : ''),
					escapeCSVField(formatDateForCSV(comparison?.article.publication_date)),

					escapeCSVField(translateSentimentValue(comparison?.modelA?.polarite, $currentLanguage)),
					escapeCSVField(
						translateSubjectivityScore(comparison?.modelA?.subjectivite_score, $currentLanguage)
					),
					escapeCSVField(
						translateSentimentValue(
							comparison?.modelA?.centralite_islam_musulmans,
							$currentLanguage
						)
					),

					escapeCSVField(translateSentimentValue(comparison?.modelB?.polarite, $currentLanguage)),
					escapeCSVField(
						translateSubjectivityScore(comparison?.modelB?.subjectivite_score, $currentLanguage)
					),
					escapeCSVField(
						translateSentimentValue(
							comparison?.modelB?.centralite_islam_musulmans,
							$currentLanguage
						)
					),

					escapeCSVField(translateVerdict(evaluation.arbiter.overall_winner)),
					escapeCSVField(translateConfidence(evaluation.arbiter.confidence_level)),
					escapeCSVField(evaluation.arbiter.polarity.score),
					escapeCSVField(evaluation.arbiter.polarity.justification),
					escapeCSVField(translateVerdict(evaluation.arbiter.polarity.preferred_model)),
					escapeCSVField(evaluation.arbiter.polarity.verdict_explanation),
					escapeCSVField(evaluation.arbiter.subjectivity.score),
					escapeCSVField(evaluation.arbiter.subjectivity.justification),
					escapeCSVField(translateVerdict(evaluation.arbiter.subjectivity.preferred_model)),
					escapeCSVField(evaluation.arbiter.subjectivity.verdict_explanation),
					escapeCSVField(evaluation.arbiter.centrality.score),
					escapeCSVField(evaluation.arbiter.centrality.justification),
					escapeCSVField(translateVerdict(evaluation.arbiter.centrality.preferred_model)),
					escapeCSVField(evaluation.arbiter.centrality.verdict_explanation),
					escapeCSVField(evaluation.arbiter.overall_explanation),
					escapeCSVField(evaluation.article_id)
				];
				return row.join(',');
			})
		];

		return csvRows.join('\n');
	}

	const evaluationCount = $derived(arbiterEvaluations.current?.evaluations?.length ?? 0);
</script>

<CsvDownloadButton
	count={evaluationCount}
	filenamePrefix="iwac-arbiter-evaluations"
	variant="arbiter"
	buildCsv={() => convertToCSV(arbiterEvaluations.current?.evaluations ?? [])}
/>
