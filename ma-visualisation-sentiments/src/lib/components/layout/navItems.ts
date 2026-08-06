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
import type { ViewId } from '$lib/types/data';
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

export const NAV_ITEMS: NavItem[] = [
	{ id: 'charts', icon: ChartIcon, labelKey: 'charts' },
	{ id: 'trends', icon: TrendingUpIcon, labelKey: 'trends' },
	{ id: 'correlation', icon: BarChart3Icon, labelKey: 'distribution' },
	{ id: 'volume', icon: AreaChartIcon, labelKey: 'volume' },
	{ id: 'seasonality', icon: MoonStarIcon, labelKey: 'seasonality' },
	{ id: 'heatmap', icon: ActivityIcon, labelKey: 'heatmap' },
	{ id: 'ranking', icon: NewspaperIcon, labelKey: 'ranking' },
	{ id: 'map', icon: MapIcon, labelKey: 'map' },
	{ id: 'table', icon: TableIcon, labelKey: 'table' },
	{ id: 'comparison', icon: GitCompareIcon, labelKey: 'comparison' },
	{ id: 'agreement', icon: ScaleIcon, labelKey: 'agreement' },
	{ id: 'extremes', icon: FlameIcon, labelKey: 'extremes' },
	{ id: 'arbiter', icon: GavelIcon, labelKey: 'arbiter' }
];
