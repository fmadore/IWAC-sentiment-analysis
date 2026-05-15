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
	import { getJournalName } from '$lib/utils';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { getModelsFromPair, type ArbiterEvaluationData } from '$lib/types/data';
	import { escapeCSVField, formatDateForCSV } from '$lib/utils/csv';
	import CsvDownloadButton from './CsvDownloadButton.svelte';

	// Get model names from current pair
	const modelNames = $derived.by(() => {
		const [modelAId, modelBId] = getModelsFromPair(datasetState.pair);
		const datasets = datasetState.available;
		const modelAName = datasets.find((d) => d.id === modelAId)?.name || modelAId;
		const modelBName = datasets.find((d) => d.id === modelBId)?.name || modelBId;
		return { modelAName, modelBName };
	});

	// Uses getActualModelName to correctly map arbiter's blind model_a/model_b
	// to actual model names (arbiter_model_a/arbiter_model_b from metadata).
	function translateVerdict(verdict: 'model_a' | 'model_b' | 'both' | 'neither'): string {
		switch (verdict) {
			case 'model_a':
			case 'model_b':
				return getActualModelName(verdict);
			case 'both':
				return $t.arbiter?.bothEqual || 'Both equal';
			case 'neither':
				return $t.arbiter?.neitherAccurate || 'Neither accurate';
			default:
				return verdict;
		}
	}

	function translateConfidence(level: 'high' | 'medium' | 'low'): string {
		switch (level) {
			case 'high':
				return $t.arbiter?.confidenceHigh || 'High';
			case 'medium':
				return $t.arbiter?.confidenceMedium || 'Medium';
			case 'low':
				return $t.arbiter?.confidenceLow || 'Low';
			default:
				return level;
		}
	}

	type ArbiterEvaluationItem = ArbiterEvaluationData['evaluations'][number];

	function convertToCSV(evaluations: ArbiterEvaluationItem[]): string {
		if (evaluations.length === 0) return '';

		const comparisons = comparisonState.data;

		const headers = [
			$t.table?.articleTitle || 'Title',
			$t.filters?.country || 'Country',
			$t.filters?.journal || 'Newspaper',
			$t.table?.date || 'Date',
			modelNames.modelAName + ' - ' + ($t.table?.polarity || 'Polarity'),
			modelNames.modelAName + ' - ' + ($t.table?.subjectivity || 'Subjectivity'),
			modelNames.modelAName + ' - ' + ($t.table?.centrality || 'Centrality'),
			modelNames.modelBName + ' - ' + ($t.table?.polarity || 'Polarity'),
			modelNames.modelBName + ' - ' + ($t.table?.subjectivity || 'Subjectivity'),
			modelNames.modelBName + ' - ' + ($t.table?.centrality || 'Centrality'),
			$t.arbiter?.overallVerdict || 'Overall Verdict',
			$t.arbiter?.confidenceLevel || 'Confidence Level',
			($t.arbiter?.polarity || 'Polarity') + ' - ' + ($t.arbiter?.arbiterScore || 'Arbiter Score'),
			($t.arbiter?.polarity || 'Polarity') +
				' - ' +
				($t.arbiter?.arbiterJustification || 'Arbiter Justification'),
			($t.arbiter?.polarity || 'Polarity') + ' - ' + ($t.arbiter?.verdict || 'Verdict'),
			($t.arbiter?.polarity || 'Polarity') +
				' - ' +
				($t.arbiter?.verdictExplanation || 'Verdict Explanation'),
			($t.arbiter?.subjectivity || 'Subjectivity') +
				' - ' +
				($t.arbiter?.arbiterScore || 'Arbiter Score'),
			($t.arbiter?.subjectivity || 'Subjectivity') +
				' - ' +
				($t.arbiter?.arbiterJustification || 'Arbiter Justification'),
			($t.arbiter?.subjectivity || 'Subjectivity') + ' - ' + ($t.arbiter?.verdict || 'Verdict'),
			($t.arbiter?.subjectivity || 'Subjectivity') +
				' - ' +
				($t.arbiter?.verdictExplanation || 'Verdict Explanation'),
			($t.arbiter?.centrality || 'Centrality') +
				' - ' +
				($t.arbiter?.arbiterScore || 'Arbiter Score'),
			($t.arbiter?.centrality || 'Centrality') +
				' - ' +
				($t.arbiter?.arbiterJustification || 'Arbiter Justification'),
			($t.arbiter?.centrality || 'Centrality') + ' - ' + ($t.arbiter?.verdict || 'Verdict'),
			($t.arbiter?.centrality || 'Centrality') +
				' - ' +
				($t.arbiter?.verdictExplanation || 'Verdict Explanation'),
			$t.arbiter?.arbiterJustification || 'Overall Justification',
			$t.export?.articleId || 'Article ID'
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
