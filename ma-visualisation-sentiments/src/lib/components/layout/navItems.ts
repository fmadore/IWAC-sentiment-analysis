/**
 * The sidebar navigation registry.
 *
 * Lives here rather than inside SidebarNav.svelte because AppHeader also needs
 * it: below 1024px the header renders a mono context line naming the current
 * view, and that name has to come from the same list the sidebar highlights or
 * the two can disagree.
 *
 * Order is the rendered order. `id` is a ViewId — the union is enforced here so
 * a typo produces a compile error rather than a nav item that quietly never
 * matches `uiState.activeView`.
 */

import type { Component } from 'svelte';
import { VIEW_GROUPS, viewGroupOf, type ViewGroup, type ViewId } from '#lib/types/data.js';
import ChartIcon from '@lucide/svelte/icons/bar-chart-2';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
import AreaChartIcon from '@lucide/svelte/icons/area-chart';
import ActivityIcon from '@lucide/svelte/icons/activity';
import TableIcon from '@lucide/svelte/icons/table';
import GitCompareIcon from '@lucide/svelte/icons/git-compare';
import FlameIcon from '@lucide/svelte/icons/flame';
import GavelIcon from '@lucide/svelte/icons/gavel';
import ScaleIcon from '@lucide/svelte/icons/scale';
import MoonStarIcon from '@lucide/svelte/icons/moon-star';
import NewspaperIcon from '@lucide/svelte/icons/newspaper';
import MapIcon from '@lucide/svelte/icons/map';

/** Translation keys under `$t.nav`. */
export type NavLabelKey =
	| 'charts'
	| 'trends'
	| 'distribution'
	| 'volume'
	| 'seasonality'
	| 'heatmap'
	| 'ranking'
	| 'map'
	| 'table'
	| 'comparison'
	| 'agreement'
	| 'extremes'
	| 'arbiter';

export interface NavItem {
	id: ViewId;
	icon: Component;
	labelKey: NavLabelKey;
}

/**
 * Order within a section is the rendered order; which section a view sits in
 * is VIEW_META's `group`, never restated here (see NAV_SECTIONS).
 */
export const NAV_ITEMS: NavItem[] = [
	// Corpus: what the collection holds, when and where.
	{ id: 'volume', icon: AreaChartIcon, labelKey: 'volume' },
	{ id: 'seasonality', icon: MoonStarIcon, labelKey: 'seasonality' },
	{ id: 'map', icon: MapIcon, labelKey: 'map' },
	{ id: 'table', icon: TableIcon, labelKey: 'table' },
	// One model's reading.
	{ id: 'charts', icon: ChartIcon, labelKey: 'charts' },
	{ id: 'trends', icon: TrendingUpIcon, labelKey: 'trends' },
	{ id: 'correlation', icon: BarChart3Icon, labelKey: 'distribution' },
	{ id: 'heatmap', icon: ActivityIcon, labelKey: 'heatmap' },
	{ id: 'ranking', icon: NewspaperIcon, labelKey: 'ranking' },
	{ id: 'extremes', icon: FlameIcon, labelKey: 'extremes' },
	// Between models.
	{ id: 'agreement', icon: ScaleIcon, labelKey: 'agreement' },
	{ id: 'comparison', icon: GitCompareIcon, labelKey: 'comparison' },
	{ id: 'arbiter', icon: GavelIcon, labelKey: 'arbiter' }
];

export interface NavSection {
	group: ViewGroup;
	items: NavItem[];
}

/** The sidebar's labelled sections, each view placed by `VIEW_META[id].group`. */
export const NAV_SECTIONS: NavSection[] = VIEW_GROUPS.map((group) => ({
	group,
	items: NAV_ITEMS.filter((item) => viewGroupOf(item.id) === group)
}));
