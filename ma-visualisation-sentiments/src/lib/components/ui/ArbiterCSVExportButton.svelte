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
	import {
		getPairModelNames,
		type ArbiterEvaluationData,
		type ComparisonData
	} from '$lib/types/data';
	import { toCSV } from '$lib/utils/csv';
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

		const comparisonsById = new Map(
			(comparisons ?? []).map((comparison) => [String(comparison.article['o:id']), comparison])
		);
		const modelColumns = (analysis: ComparisonData['modelA'] | undefined) => [
			translateSentimentValue(analysis?.polarite, $currentLanguage),
			translateSubjectivityScore(analysis?.subjectivite_score, $currentLanguage),
			translateSentimentValue(analysis?.centralite_islam_musulmans, $currentLanguage)
		];
		const dimensionColumns = (verdict: ArbiterEvaluationItem['arbiter']['polarity']) => [
			verdict.score,
			verdict.justification,
			translateVerdict(verdict.preferred_model),
			verdict.verdict_explanation
		];

		const rows = evaluations.map((evaluation) => {
			const comparison = comparisonsById.get(String(evaluation.article_id));
			return [
				comparison?.article['o:title'] || `Article ${evaluation.article_id}`,
				comparison?.article.Country,
				comparison ? getJournalName(comparison.article) : '',
				// Exactly as stored: month-only and ranged dates are real in the corpus.
				comparison?.article.publication_date,
				...modelColumns(comparison?.modelA),
				...modelColumns(comparison?.modelB),
				translateVerdict(evaluation.arbiter.overall_winner),
				translateConfidence(evaluation.arbiter.confidence_level),
				...dimensionColumns(evaluation.arbiter.polarity),
				...dimensionColumns(evaluation.arbiter.subjectivity),
				...dimensionColumns(evaluation.arbiter.centrality),
				evaluation.arbiter.overall_explanation,
				evaluation.article_id
			];
		});

		return toCSV(headers, rows);
	}

	const evaluationCount = $derived(arbiterEvaluations.current?.evaluations?.length ?? 0);
</script>

<CsvDownloadButton
	count={evaluationCount}
	filenamePrefix="iwac-arbiter-evaluations"
	variant="arbiter"
	buildCsv={() => convertToCSV(arbiterEvaluations.current?.evaluations ?? [])}
/>
