/**
 * Centralised ECharts module registration (tree-shakeable `echarts/core` build).
 *
 * The registration MUST be reachable from the `init` export. A bare top-level
 * `use([...])` call gets tree-shaken out of the production bundle because
 * package.json marks JS modules side-effect-free (`"sideEffects": ["**\/*.css"]`)
 * and chart components only import `init` — so the unused side effect is dropped.
 * That left ECharts with no registered chart types and crashed the minified build
 * with `$l[a] is not a constructor` (it worked in dev, which doesn't tree-shake).
 *
 * Performing the `use([...])` lazily inside `init` ties it to the used export, so
 * it can never be removed regardless of the `sideEffects` config.
 *
 * Usage in a chart component:
 *   import { Chart } from 'svelte-echarts';
 *   import { init } from '$lib/utils/echartsSetup';
 */
import { init as coreInit, use } from 'echarts/core';
import {
	BarChart,
	PieChart,
	LineChart,
	HeatmapChart,
	ScatterChart,
	// Backs the confidence-interval whiskers on the newspaper ranking chart.
	CustomChart
} from 'echarts/charts';
import {
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	DataZoomComponent,
	VisualMapComponent,
	// Polar coordinates back the Hijri seasonality chart's cycle layout.
	PolarComponent,
	// Reference lines (the neutral marker on the newspaper ranking chart).
	MarkLineComponent
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

function ensureRegistered(): void {
	if (registered) return;
	registered = true;
	use([
		BarChart,
		PieChart,
		LineChart,
		HeatmapChart,
		ScatterChart,
		CustomChart,
		TitleComponent,
		TooltipComponent,
		GridComponent,
		LegendComponent,
		DataZoomComponent,
		VisualMapComponent,
		PolarComponent,
		MarkLineComponent,
		LabelLayout,
		UniversalTransition,
		CanvasRenderer
	]);
}

/**
 * Drop-in replacement for ECharts' `init` that registers the required modules on
 * first use. svelte-echarts receives this as its `init` prop.
 */
export const init = ((...args: Parameters<typeof coreInit>) => {
	ensureRegistered();
	return coreInit(...args);
}) as typeof coreInit;
