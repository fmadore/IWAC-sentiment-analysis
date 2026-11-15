<!--
  ViewContent Component
  
  Encapsulates the main content area that switches between different views
  (charts, trends, correlation, volume, heatmap, table, comparison, extremes).
  
  This component receives the active view and renders the appropriate content,
  keeping the main page cleaner and more focused on orchestration.
  
  Usage:
  <ViewContent 
    {activeView} 
    {selectedCategory} 
    {selectedKeywordType}
    {showTopN}
    onShowDetails={handleShowDetails} 
  />
-->
<script lang="ts">
	import ViewLoadError from '../common/ViewLoadError.svelte';
	import type { Article, ViewId } from '#lib/types/data.js';
	import { num } from '#lib/i18n/utils.js';
	import type { ExtremeCategory, KeywordType } from '#lib/types/extremeAnalysis.js';
	import { t, currentLanguage } from '#lib/i18n/index.js';
	import { datasetState, articleState } from '#lib/stores/index.js';
	import { viewGroupOf } from '#lib/types/data.js';
	import { getModelDisplayName } from '#lib/utils/format.js';

	// UI
	import CSVExportButton from '#lib/components/ui/CSVExportButton.svelte';
	import ChartCard from '#lib/components/ui/ChartCard.svelte';
	import LoadingState from '#lib/components/common/LoadingState.svelte';

	/**
	 * The map is the one view with a heavyweight dependency: MapLibre GL is
	 * ~250 kB gzipped, more than the entire rest of the vendor bundle put
	 * together. Importing it statically would make all twelve other views pay
	 * for it, so it is pulled in on first visit to `?view=map` and the promise
	 * memoized so switching away and back doesn't re-suspend.
	 */
	let mapModulePromise: Promise<typeof import('#lib/components/viz/SentimentMap.svelte')> | null =
		null;

	function loadMapModule() {
		mapModulePromise ??= import('#lib/components/viz/SentimentMap.svelte').catch((error) => {
			mapModulePromise = null;
			throw error;
		});
		return mapModulePromise;
	}

	let chartModulePromise: Promise<typeof import('#lib/components/views/ChartViews.svelte')> | null =
		null;
	const chartViews = () =>
		(chartModulePromise ??= import('#lib/components/views/ChartViews.svelte').catch((error) => {
			chartModulePromise = null;
			throw error;
		}));
	const tableView = () => import('#lib/components/data-display/ArticleTable.svelte');
	const comparisonView = () => import('#lib/components/data-display/ComparisonView.svelte');
	const agreementView = () => import('#lib/components/data-display/AgreementView.svelte');
	const extremeView = () => import('#lib/components/views/ExtremeViewContent.svelte');
	// Two arbiter views, selected by generation rather than branched inside one
	// component: the v1 view is pairwise all the way down (pair picker,
	// `model_a_is_first`, two-way percentages) and has to stay stable for the
	// archive, while v2 asks one panel-wide question per article.
	const arbiterView = () => import('#lib/components/data-display/ArbiterView.svelte');
	const arbiterV2View = () => import('#lib/components/data-display/ArbiterV2View.svelte');

	interface ViewContentProps {
		/** Currently active view */
		activeView: ViewId;
		/** Selected extreme analysis category */
		selectedCategory: ExtremeCategory;
		/** Selected keyword type for extreme analysis */
		selectedKeywordType: KeywordType;
		/** Number of top items to show in extreme analysis */
		showTopN: number;
		/** Callback when article details should be shown */
		onShowDetails: (details: { article: Article; position: { x: number; y: number } }) => void;
	}

	let {
		activeView,
		selectedCategory,
		selectedKeywordType,
		showTopN,
		onShowDetails
	}: ViewContentProps = $props();

	// Methodology metadata for the eyebrow rule under each view title.
	// Uses the active dataset (model) and the corpus size — surface what's
	// most load-bearing for an academic reader at a glance.
	let modelLabel = $derived(getModelDisplayName(datasetState.selected, datasetState.available));
	let totalCount = $derived((articleState.datasets[datasetState.selected] || []).length);
	let visibleArticles = $derived(
		articleState.filtered ?? articleState.datasets[datasetState.selected] ?? []
	);
	let filteredCount = $derived(articleState.filtered?.length ?? totalCount);
	let comparisonMode = $derived(datasetState.isComparisonMode);

	/**
	 * How many of the articles on screen this model actually rated.
	 *
	 * Every model ships one row per article, so the sample count above says
	 * nothing about coverage — and coverage stopped being uniform when the panel
	 * grew: Qwen3.8 27B leaves 200 articles permanently unrated on top of the 50
	 * that no model rates (they are neither French nor English). "Sample ·
	 * 12,348 articles" on its own therefore reads as a claim the data does not
	 * support.
	 *
	 * Counted over the same set the sample number describes, so the two halves
	 * of the line agree under a filter, and rendered only when it differs — for
	 * the four models with full coverage the eyebrow is unchanged.
	 */
	let ratedCount = $derived.by(() => {
		let rated = 0;
		for (const article of visibleArticles) {
			if (article.sentiment_analysis?.polarite != null) rated++;
		}
		return rated;
	});

	function formatNum(n: number): string {
		try {
			return $num(n);
		} catch {
			return String(n);
		}
	}

	/**
	 * The selected model's unrated articles across the whole corpus, when they
	 * are a material share of it (more than 1%). Below that the gap is the
	 * articles no model rates, which every model shares; above it the model
	 * itself declined, and those declines are not a random subset — so the
	 * figures on screen describe the articles it rated, and the reader has to
	 * be told. Computed from the data rather than keyed to a model id, so a
	 * future model with the same gap is caught without a code change.
	 */
	let unratedCaveat = $derived.by(() => {
		if (comparisonMode || activeView === 'agreement') return null;
		const corpus = articleState.datasets[datasetState.selected] ?? [];
		if (corpus.length === 0) return null;
		let unrated = 0;
		for (const article of corpus) {
			if (article.sentiment_analysis?.polarite == null) unrated++;
		}
		if (unrated / corpus.length <= 0.01) return null;
		const share = new Intl.NumberFormat($currentLanguage, {
			style: 'percent',
			maximumFractionDigits: 1
		}).format(unrated / corpus.length);
		return $t.viewMeta.unratedCaveat
			.replace('{count}', formatNum(unrated))
			.replace('{share}', share);
	});

	let methodologyLine = $derived.by(() => {
		if (comparisonMode || activeView === 'agreement') {
			// Pair views (comparison, agreement) report their own sample sizes and
			// name both models; a single-model "Model · X" line would misdescribe
			// what is on screen. Suppress here.
			return null;
		}
		if (totalCount === 0) return null;
		const parts: string[] = [];
		parts.push(`${$t.viewMeta.model} · ${modelLabel}`);
		if (filteredCount === totalCount) {
			parts.push(`${$t.viewMeta.sample} · ${formatNum(totalCount)} ${$t.common.articles}`);
		} else {
			parts.push(
				`${$t.viewMeta.sample} · ${formatNum(filteredCount)} ${$t.common.of} ${formatNum(totalCount)} ${$t.common.articles}`
			);
		}
		if (ratedCount < filteredCount) {
			parts.push(`${$t.viewMeta.rated} · ${formatNum(ratedCount)}`);
		}
		return parts.join('  ·  ');
	});

	// Spelled out rather than indexed, so the catalogue checker sees each key.
	const groupLabels = $derived({
		corpus: $t.navGroups.corpus,
		model: $t.navGroups.model,
		panel: $t.navGroups.panel
	});

	type ViewKey = Exclude<ViewId, 'arbiter'>;

	// The eyebrow above each title is the view's navigation section
	// (VIEW_META's `group`), so the title says where in the dashboard you are.
	type ViewMeta = {
		title: string;
		lede: string;
	};

	let viewMeta = $derived<Record<ViewKey, ViewMeta>>({
		charts: {
			title: $t.nav.charts,
			lede: $t.charts.subtitle
		},
		trends: {
			title: $t.nav.trends,
			lede: $t.trends.subtitle
		},
		correlation: {
			title: $t.nav.distribution,
			lede: $t.correlation.subtitle
		},
		volume: {
			title: $t.nav.volume,
			lede: $t.volume.subtitle
		},
		seasonality: {
			title: $t.seasonality.title,
			lede: $t.seasonality.subtitle
		},
		heatmap: {
			title: $t.nav.heatmap,
			lede: $t.heatmap.subtitle
		},
		ranking: {
			title: $t.ranking.title,
			lede: $t.ranking.subtitle
		},
		map: {
			title: $t.map.title,
			lede: $t.map.subtitle
		},
		table: {
			title: $t.table.title,
			lede: $t.table.subtitle
		},
		agreement: {
			title: $t.agreement.title,
			lede: $t.agreement.subtitle
		},
		comparison: {
			title: $t.nav.comparison,
			lede: $t.comparison.subtitle
		},
		extremes: {
			title: $t.extremeAnalysis.title,
			lede: $t.extremeAnalysis.subtitle
		}
	});
</script>

{#snippet header(view: ViewKey, trail: import('svelte').Snippet | null = null)}
	{@const meta = viewMeta[view]}
	<header class="view-header">
		<div class="view-header-text">
			<p class="view-eyebrow">{groupLabels[viewGroupOf(view)]}</p>
			<h1 class="view-title" id="view-title">{meta.title}</h1>
			<p class="view-lede">{meta.lede}</p>
			{#if methodologyLine}
				<p class="view-methodology">{methodologyLine}</p>
			{/if}
			{#if unratedCaveat}
				<p class="view-caveat">
					{unratedCaveat}
					<a class="view-caveat-link" href="#methodology">{$t.viewMeta.unratedCaveatLink}</a>
				</p>
			{/if}
		</div>
		{#if trail}
			<div class="view-header-trail">{@render trail()}</div>
		{/if}
	</header>
{/snippet}

{#if activeView === 'charts'}
	<div class="view mb-6">
		{@render header('charts')}
		{#await chartViews()}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="charts" />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'trends'}
	<div class="view mb-6">
		{@render header('trends')}
		{#await chartViews()}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="trends" />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'correlation'}
	<div class="view mb-6">
		{@render header('correlation')}
		{#await chartViews()}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="correlation" />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'volume'}
	<div class="view mb-6">
		{@render header('volume')}
		{#await chartViews()}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="volume" />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'seasonality'}
	<div class="view mb-6">
		{@render header('seasonality')}
		{#await chartViews()}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="seasonality" />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'heatmap'}
	<div class="view mb-6">
		{@render header('heatmap')}
		{#await chartViews()}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="heatmap" />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'ranking'}
	<div class="view mb-6">
		{@render header('ranking')}
		{#await chartViews()}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="ranking" />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'map'}
	<div class="view mb-6">
		{@render header('map')}
		{#await loadMapModule()}
			<LoadingState />
		{:then module}
			{@const SentimentMap = module.default}
			<SentimentMap />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'table'}
	<div class="view mb-6">
		{#snippet tableTrail()}
			<CSVExportButton />
		{/snippet}
		{@render header('table', tableTrail)}
		{#await tableView()}<LoadingState />{:then module}
			{@const ArticleTable = module.default}
			<ChartCard variant="table"><ArticleTable {onShowDetails} /></ChartCard>
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'comparison'}
	<div class="view comparison-view mb-6">
		{@render header('comparison')}
		{#await comparisonView()}<LoadingState />{:then module}
			{@const ComparisonView = module.default}<ComparisonView />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'agreement'}
	<div class="view agreement-view mb-6">
		{@render header('agreement')}
		{#await agreementView()}<LoadingState />{:then module}
			{@const AgreementView = module.default}<AgreementView />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'extremes'}
	<div class="view extreme-view mb-6">
		{@render header('extremes')}
		{#await extremeView()}<LoadingState />{:then module}
			{@const ExtremeView = module.default}
			<ExtremeView {selectedCategory} {selectedKeywordType} {showTopN} />
		{:catch}<ViewLoadError />{/await}
	</div>
{:else if activeView === 'arbiter'}
	{#if datasetState.generation === 'v2'}
		{#await arbiterV2View()}<LoadingState />{:then module}
			{@const ArbiterV2View = module.default}<ArbiterV2View />
		{:catch}<ViewLoadError />{/await}
	{:else}
		{#await arbiterView()}<LoadingState />{:then module}
			{@const ArbiterView = module.default}<ArbiterView />
		{:catch}<ViewLoadError />{/await}
	{/if}
{/if}

<style>
	/* Editorial view header — eyebrow + title + lede.
	   No icon tile, no gradient text, no per-view colour theme. The chart that
	   follows IS the colour signal. */
	.view {
		width: 100%;
	}

	.view-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
		padding-bottom: var(--space-5);
		margin-bottom: var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
	}

	.view-header-text {
		min-width: 0;
		flex: 1;
	}

	.view-title {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		font-weight: 700;
		line-height: var(--line-height-tight);
		letter-spacing: var(--tracking-tight);
		color: var(--text-primary);
		margin: 0 0 var(--space-3);
	}

	.view-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: 0 0 var(--space-3);
	}

	/* Methodology metadata rule — wire-service style. Single line, monospace,
	   tabular numerals (inherited from body), reads first to anyone looking for
	   the methodological grounding of the chart below. */
	.view-methodology {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: var(--tracking-normal);
		padding-top: var(--space-3);
		border-top: 1px dashed var(--border-subtle);
		margin: 0;
		max-width: var(--prose-width);
	}

	/* The section the view belongs to, in the wire-ticker voice. */
	.view-eyebrow {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
		margin: 0 0 var(--space-2);
	}

	/* A coverage caveat, set as a footnote under the methodology rule. */
	.view-caveat {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: var(--space-2) 0 0;
	}

	.view-caveat-link {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.view-header-trail {
		flex-shrink: 0;
	}

	.comparison-view,
	.agreement-view,
	.extreme-view {
		/* 200px ≈ header + view heading chrome above the chart area */
		min-height: calc(100dvh - 200px);
	}

	@media (min-width: 640px) {
		.view-header {
			flex-direction: row;
			gap: var(--space-6);
		}

		.view-title {
			font-size: var(--font-size-3xl);
		}

		.view-lede {
			font-size: var(--font-size-lg);
		}
	}
</style>
