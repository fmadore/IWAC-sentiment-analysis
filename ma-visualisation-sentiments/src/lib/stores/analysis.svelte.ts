/** Analytical choices shared by links and agreement views. No store dependencies. */
export type AnalysisDimension = 'polarity' | 'subjectivity' | 'centrality';
export const ANALYSIS_DIMENSIONS: AnalysisDimension[] = ['polarity', 'subjectivity', 'centrality'];
export const analysisState = $state({
	scope: 'pair' as 'pair' | 'panel',
	dimension: 'polarity' as AnalysisDimension,
	includeDeclined: false
});
