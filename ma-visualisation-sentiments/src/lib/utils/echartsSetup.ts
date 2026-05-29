/**
 * Centralised ECharts module registration.
 *
 * Every chart component previously repeated the same `use([...])` block with
 * a slightly different subset of imports. The app is a single bundle that
 * renders every chart type, so registering the union once here removes that
 * boilerplate without any practical tree-shaking cost.
 *
 * Usage in a chart component:
 *   import { Chart } from 'svelte-echarts';
 *   import { init } from '$lib/utils/echartsSetup';
 */
import { init, use } from 'echarts/core';
import { BarChart, PieChart, LineChart, HeatmapChart } from 'echarts/charts';
import {
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	DataZoomComponent,
	VisualMapComponent
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

use([
	BarChart,
	PieChart,
	LineChart,
	HeatmapChart,
	TitleComponent,
	TooltipComponent,
	GridComponent,
	LegendComponent,
	DataZoomComponent,
	VisualMapComponent,
	LabelLayout,
	UniversalTransition,
	CanvasRenderer
]);

export { init };
