<script lang="ts">
	import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';
	import KeywordFrequencyChart from '$lib/components/viz/KeywordFrequencyChart.svelte';
	import { ChartCard } from '$lib/components/ui';

	let {
		selectedCategory,
		selectedKeywordType,
		showTopN
	}: {
		selectedCategory: ExtremeCategory;
		selectedKeywordType: KeywordType;
		showTopN: number;
	} = $props();
</script>

<ChartCard variant="extreme">
	<KeywordFrequencyChart {selectedCategory} {selectedKeywordType} {showTopN} />
</ChartCard>
