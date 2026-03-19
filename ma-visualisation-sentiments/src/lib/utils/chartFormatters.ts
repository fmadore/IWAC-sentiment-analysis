/**
 * Shared tooltip formatter factories for ECharts components.
 * Each factory returns a formatter function capturing reactive values via getters.
 */

/**
 * Pie chart tooltip: color dot + name + value + percent.
 * Used by: SentimentChart (pie), SubjectivityChart (pie)
 */
export function createPieTooltipFormatter(options: {
	formatValue: (n: number) => string;
}): (params: unknown) => string {
	return function (params: any) {
		if (Array.isArray(params)) {
			return params
				.map(
					(param: any) =>
						`<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${param.color};"></span> ${param.seriesName}: ${param.value} (${param.percent}%)`
				)
				.join('<br/>');
		} else {
			return `<div style="font-weight:600;margin-bottom:8px;">${params.seriesName}</div>
				<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${params.color};"></span>
				${params.name}: <strong>${options.formatValue(params.value)}</strong> (${params.percent}%)`;
		}
	};
}

/**
 * Stacked bar chart tooltip: header + sorted items list + total.
 * Used by: SentimentChart (bar), SubjectivityChart (bar), CorrelationChart
 */
export function createStackedBarTooltipFormatter(options: {
	getTotalLabel: () => string;
	getIsMobile?: () => boolean;
	sort?: boolean;
	headerKey?: 'axisValueLabel' | 'name';
	scrollableList?: boolean;
	totalSuffix?: () => string;
}): (params: unknown) => string {
	const headerKey = options.headerKey ?? 'axisValueLabel';
	const sort = options.sort ?? true;
	const scrollable = options.scrollableList ?? false;

	return function (params: any) {
		if (!Array.isArray(params) || params.length === 0) {
			return '';
		}

		const items = sort
			? params.slice().sort((a: any, b: any) => b.value - a.value)
			: params;

		let listHtml = '';
		let total = 0;

		items.forEach((param: any) => {
			if (param.value > 0) {
				listHtml += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
					<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${param.color};"></span>
					<span style="flex:1;">${param.seriesName}</span>
					<strong>${param.value}</strong>
				</div>`;
			}
			total += param.value;
		});

		const isMobile = options.getIsMobile?.() ?? false;
		const listWrapper = scrollable
			? `<div style="max-height:${isMobile ? '150px' : '200px'};overflow-y:auto;margin-bottom:8px;">${listHtml}</div>`
			: listHtml;

		return `<div style="min-width:180px;">
			<div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);">${params[0][headerKey]}</div>
			${listWrapper}
			<div style="padding-top:6px;${scrollable ? '' : 'margin-top:4px;'}border-top:1px solid rgba(255,255,255,0.15);font-weight:600;">${options.getTotalLabel()}: ${total}${options.totalSuffix ? ' ' + options.totalSuffix() : ''}</div>
		</div>`;
	};
}

/**
 * Trend/line chart tooltip: header + items + conditional total.
 * Used by: SentimentTrendsChart, SubjectivityTrendsChart, VolumeChart
 */
export function createTrendTooltipFormatter(options: {
	getTotalLabel: () => string;
	sort?: boolean;
}): (params: unknown) => string {
	const sort = options.sort ?? false;

	return function (params: any) {
		if (!Array.isArray(params) || params.length === 0) {
			return '';
		}

		const items = sort
			? params.slice().sort((a: any, b: any) => b.value - a.value)
			: params;

		let listHtml = '';
		let total = 0;

		items.forEach((param: any) => {
			if (param.value > 0) {
				listHtml += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
					<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};"></span>
					<span style="flex:1;">${param.seriesName}</span>
					<strong>${param.value}</strong>
				</div>`;
			}
			total += param.value;
		});

		return `<div style="min-width:160px;">
			<div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);">${params[0].axisValue}</div>
			${listHtml}
			${total > 0 ? `<div style="padding-top:6px;margin-top:4px;border-top:1px solid rgba(255,255,255,0.15);font-weight:600;">${options.getTotalLabel()}: ${total}</div>` : ''}
		</div>`;
	};
}

/**
 * Simple single-item tooltip: header + key-value pair.
 * Used by: KeywordFrequencyChart
 */
export function createSimpleTooltipFormatter(options: {
	getLabel: () => string;
}): (params: unknown) => string {
	return function (params: any) {
		const data = Array.isArray(params) ? params[0] : params;
		return `<div style="min-width:140px;">
			<div style="font-weight:600;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.15);">${data.name}</div>
			<div style="display:flex;justify-content:space-between;">
				<span>${options.getLabel()}:</span>
				<strong>${data.value}</strong>
			</div>
		</div>`;
	};
}
