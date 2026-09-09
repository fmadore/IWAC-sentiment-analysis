import type { ViewId } from '$lib/types/data';

interface Option<T extends string | number | boolean> {
	views: readonly ViewId[];
	default: T;
	parse: (value: string) => T | undefined;
}

function choice<const T extends string>(
	views: ViewId[],
	value: T,
	values: readonly T[]
): Option<T> {
	return {
		views,
		default: value,
		parse: (raw) => (values.includes(raw as T) ? (raw as T) : undefined)
	};
}

function integer(views: ViewId[], value: number, min: number, max: number): Option<number> {
	return {
		views,
		default: value,
		parse: (raw) =>
			/^\d+$/.test(raw) && Number(raw) >= min && Number(raw) <= max ? Number(raw) : undefined
	};
}

/** Every explicit view control has a stable name, default and validation boundary. */
export const VIEW_OPTIONS = {
	reasoning: {
		views: ['comparison', 'arbiter'],
		default: false,
		parse: (raw: string) => (raw === 'true' ? true : raw === 'false' ? false : undefined)
	} as Option<boolean>,
	arbiterSummary: {
		views: ['comparison'],
		default: false,
		parse: (raw: string) => (raw === 'true' ? true : raw === 'false' ? false : undefined)
	} as Option<boolean>,
	polarityChart: choice(['charts'], 'bar', ['bar', 'pie']),
	polarityGrouping: choice(['charts'], 'global', ['global', 'journal']),
	subjectivityChart: choice(['charts'], 'bar', ['bar', 'pie']),
	subjectivityGrouping: choice(['charts'], 'global', ['global', 'journal']),
	polarityTrend: choice(['trends'], 'count', ['count', 'share']),
	subjectivityTrend: choice(['trends'], 'count', ['count', 'share']),
	volumeChart: choice(['volume'], 'area', ['area', 'line']),
	seasonalityChart: choice(['seasonality'], 'polar', ['polar', 'bar']),
	rankingMeasure: choice(['ranking'], 'polarity', ['polarity', 'subjectivity', 'centrality']),
	mapDimension: choice(['map'], 'polarity', ['polarity', 'subjectivity', 'centrality']),
	placeId: integer(['map'], 0, 0, Number.MAX_SAFE_INTEGER),
	breakdown: choice(['comparison'], 'decade', ['decade', 'country']),
	dissent: choice(['agreement'], 'stacked', ['stacked', 'ternary']),
	category: choice(['extremes'], 'polarity_very_negative', [
		'polarity_very_negative',
		'polarity_very_positive',
		'subjectivity_extreme_high',
		'subjectivity_extreme_low',
		'centrality_very_central',
		'centrality_not_central'
	]),
	keywordType: choice(['extremes'], 'subject', ['subject', 'spatial']),
	topN: integer(['extremes'], 10, 5, 25),
	scanPage: integer([], 1, 1, 100_000),
	mapCamera: {
		views: ['map'],
		default: '',
		parse: (raw: string) => {
			if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,\d+(\.\d+)?$/.test(raw)) return undefined;
			const [lng, lat, zoom] = raw.split(',').map(Number);
			return Math.abs(lng) <= 180 && Math.abs(lat) <= 85 && zoom >= 0.6 && zoom <= 9
				? raw
				: undefined;
		}
	} as Option<string>,
	arbiterDimension: choice(['arbiter'], 'all', ['all', 'polarity', 'subjectivity', 'centrality']),
	tableSort: choice(['table'], 'titre', [
		'titre',
		'journal',
		'date',
		'centralite',
		'polarite',
		'subjectivite'
	]),
	tableOrder: choice(['table'], 'asc', ['asc', 'desc']),
	tablePage: integer(['table'], 1, 1, 1_000_000),
	tableSize: choice(['table'], '50', ['25', '50', '100', '200']),
	comparisonSort: choice(['comparison'], 'discrepancy', ['discrepancy', 'date', 'title']),
	comparisonOrder: choice(['comparison'], 'desc', ['asc', 'desc']),
	comparisonPage: integer(['comparison'], 1, 1, 1_000_000),
	comparisonSize: choice(['comparison'], '25', ['10', '25', '50', '100']),
	comparisonLayout: choice(['comparison'], 'table', ['table', 'cards']),
	arbiterSort: choice(['arbiter'], 'date', ['title', 'date', 'verdict', 'confidence']),
	arbiterOrder: choice(['arbiter'], 'desc', ['asc', 'desc']),
	arbiterPage: integer(['arbiter'], 1, 1, 1_000_000),
	arbiterSize: choice(['arbiter'], '25', ['10', '25', '50', '100']),
	arbiterLayout: choice(['arbiter'], 'table', ['table', 'cards']),
	panelSort: choice(['arbiter'], 'spread', ['spread', 'date', 'title', 'verdict', 'confidence']),
	panelOrder: choice(['arbiter'], 'desc', ['asc', 'desc']),
	panelPage: integer(['arbiter'], 1, 1, 1_000_000),
	panelSize: choice(['arbiter'], '25', ['10', '25', '50', '100']),
	prompt: {
		views: [],
		default: false,
		parse: (raw: string) => (raw === 'true' ? true : raw === 'false' ? false : undefined)
	} as Option<boolean>
};

export type ViewOptions = { [K in keyof typeof VIEW_OPTIONS]: (typeof VIEW_OPTIONS)[K]['default'] };
export type ViewOptionKey = keyof ViewOptions;
export const VIEW_OPTION_KEYS = Object.keys(VIEW_OPTIONS) as ViewOptionKey[];

export function defaultViewOptions(): ViewOptions {
	return Object.fromEntries(
		VIEW_OPTION_KEYS.map((key) => [key, VIEW_OPTIONS[key].default])
	) as ViewOptions;
}

export const viewOptionsState = $state(defaultViewOptions());

export function optionApplies(key: ViewOptionKey, view: ViewId | undefined): boolean {
	const views = VIEW_OPTIONS[key].views;
	return views.length === 0 || (view !== undefined && views.includes(view));
}

export function parseViewOptions(
	params: URLSearchParams,
	view: ViewId | undefined
): Partial<ViewOptions> {
	const entries = VIEW_OPTION_KEYS.flatMap((key) => {
		const raw = params.get(key);
		const value = raw === null ? undefined : VIEW_OPTIONS[key].parse(raw);
		return value !== undefined && optionApplies(key, view) ? [[key, value]] : [];
	});
	return Object.fromEntries(entries);
}

/** Selection remains an ID while its asynchronously loaded analysis is pending. */
export const arbiterSelectionState = $state({ articleId: null as string | null });

export function paginationURLState(prefix: 'table' | 'comparison' | 'arbiter' | 'panel') {
	const pageKey = `${prefix}Page` as const;
	const sizeKey = `${prefix}Size` as const;
	return {
		get currentPage() {
			return viewOptionsState[pageKey];
		},
		set currentPage(value: number) {
			viewOptionsState[pageKey] = value;
		},
		get itemsPerPage() {
			return Number(viewOptionsState[sizeKey]);
		},
		set itemsPerPage(value: number) {
			const parsed = VIEW_OPTIONS[sizeKey].parse(String(value));
			if (parsed !== undefined) Object.assign(viewOptionsState, { [sizeKey]: parsed });
		}
	};
}
