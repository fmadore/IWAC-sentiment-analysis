<!--
  ArbiterV2CSVExportButton

  Exports the panel arbiter's verdicts joined to the articles: metadata, every
  panel model's three ratings, the spread that selected the article, the
  arbiter's own ratings and reasoning per dimension, and the overall verdict.
  Verdicts are written as model names, resolved through the run's blind
  permutation, so a spreadsheet never has to know what "Analyse C" meant.

  Like the v1 export, model ratings only: the models' justification prose is
  loaded on demand, one shard per article, and pulling every shard for five
  models is 160 requests a CSV button should not start.
-->
<script lang="ts">
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { escapeCSVField, formatDateForCSV } from '$lib/utils/csv';
	import {
		ARBITER_V2_DIMENSIONS,
		analysisValue,
		type ArbiterV2LegendEntry,
		type ArbiterV2Row
	} from '$lib/utils/arbiterV2';
	import { SUBJECTIVITY_LABELS_V2, type SubjectivityScore } from '$lib/domain/sentimentContract';
	import type { ArbiterV2Preference } from '$lib/types/data';
	import CsvDownloadButton from './CsvDownloadButton.svelte';

	interface ArbiterV2CSVExportButtonProps {
		rows: ArbiterV2Row[];
		legend: ArbiterV2LegendEntry[];
	}

	let { rows, legend }: ArbiterV2CSVExportButtonProps = $props();

	function preferenceName(preference: ArbiterV2Preference): string {
		if (preference === 'multiple') return $t.arbiterV2.multiple;
		if (preference === 'none') return $t.arbiterV2.none;
		return legend.find((entry) => entry.label === preference)?.name ?? preference;
	}

	function confidenceName(level: 'high' | 'medium' | 'low'): string {
		switch (level) {
			case 'high':
				return $t.arbiter.confidenceHigh;
			case 'medium':
				return $t.arbiter.confidenceMedium;
			default:
				return $t.arbiter.confidenceLow;
		}
	}

	/** The arbiter answered subjectivity in the v2 wording; export that, not the rank. */
	function arbiterScore(dimension: (typeof ARBITER_V2_DIMENSIONS)[number], score: string): string {
		if (dimension !== 'subjectivity') return score;
		return SUBJECTIVITY_LABELS_V2[Number(score) as SubjectivityScore] ?? score;
	}

	function dimensionName(dimension: (typeof ARBITER_V2_DIMENSIONS)[number]): string {
		return $t.arbiterV2[dimension];
	}

	function convertToCSV(): string {
		if (rows.length === 0) return '';

		const headers = [
			$t.table.articleTitle,
			$t.filters.country,
			$t.filters.journal,
			$t.table.date,
			...legend.flatMap((entry) => [
				`${entry.name} - ${$t.table.polarity}`,
				`${entry.name} - ${$t.table.subjectivity}`,
				`${entry.name} - ${$t.table.centrality}`
			]),
			...ARBITER_V2_DIMENSIONS.map(
				(dimension) => `${dimensionName(dimension)} - ${$t.arbiterV2.spread}`
			),
			`${$t.arbiterV2.spread} - ${$t.common.total}`,
			$t.arbiter.overallVerdict,
			$t.arbiterV2.confidence,
			...ARBITER_V2_DIMENSIONS.flatMap((dimension) => [
				`${dimensionName(dimension)} - ${$t.arbiterV2.arbiterScore}`,
				`${dimensionName(dimension)} - ${$t.arbiter.arbiterJustification}`,
				`${dimensionName(dimension)} - ${$t.arbiterV2.verdict}`,
				`${dimensionName(dimension)} - ${$t.arbiter.verdictExplanation}`
			]),
			$t.arbiter.arbiterJustification,
			$t.export.articleId
		];

		const lines = rows.map((row) => {
			const { spread, arbiter } = row.evaluation;
			return [
				row.title,
				row.country,
				row.journal,
				formatDateForCSV(row.date),
				...legend.flatMap((entry) => {
					const analysis = row.analyses[entry.modelId];
					return [
						translateSentimentValue(
							analysisValue(analysis, 'polarity') as string | null,
							$currentLanguage
						),
						translateSubjectivityScore(
							analysisValue(analysis, 'subjectivity') as number | null,
							$currentLanguage
						),
						translateSentimentValue(
							analysisValue(analysis, 'centrality') as string | null,
							$currentLanguage
						)
					];
				}),
				String(spread.polarity_spread),
				String(spread.subjectivity_spread),
				String(spread.centrality_spread),
				String(spread.total_spread),
				preferenceName(arbiter.overall_winner),
				confidenceName(arbiter.confidence_level),
				...ARBITER_V2_DIMENSIONS.flatMap((dimension) => [
					arbiterScore(dimension, arbiter[dimension].score),
					arbiter[dimension].justification,
					preferenceName(arbiter[dimension].preferred),
					arbiter[dimension].verdict_explanation
				]),
				arbiter.overall_explanation,
				row.articleId
			]
				.map((field) => escapeCSVField(field))
				.join(',');
		});

		return [headers.map((header) => escapeCSVField(header)).join(','), ...lines].join('\n');
	}
</script>

<CsvDownloadButton
	count={rows.length}
	filenamePrefix="iwac-panel-arbiter"
	variant="arbiter"
	buildCsv={convertToCSV}
/>
