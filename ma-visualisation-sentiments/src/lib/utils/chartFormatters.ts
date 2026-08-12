/**
 * Shared tooltip formatter factories for ECharts components.
 * Each factory returns a formatter function capturing reactive values via getters.
 *
 * Numbers go through `formatNumber` / `formatPercent` rather than being
 * interpolated raw: a tooltip reading "12 305" and "58,1 %" in French but
 * "12,305" and "58.1%" in English is the whole point of taking `lang` as a
 * getter here. This module is not a component, so it cannot read the `$num`
 * store — the caller supplies the language instead.
 */
import type { Language } from '$lib/i18n';
import { formatNumber, formatPercent } from '$lib/i18n/utils';

/**
 * Subset of ECharts tooltip callback params we rely on.
 * ECharts passes many possible shapes; we only use these fields.
 */
interface TooltipParam {
	name?: string;
	value: number;
	percent?: number;
	color?: string;
	seriesName?: string;
	axisValue?: string | number;
	axisValueLabel?: string;
	/** Raw datum when a series supplies objects rather than bare numbers. */
	data?: { value: number; rawCount?: number } | number;
}

/** Pull the raw article count a share-mode series carries alongside its percentage. */
function getRawCount(param: TooltipParam): number | null {
	const datum = param.data;
	if (datum && typeof datum === 'object' && typeof datum.rawCount === 'number') {
		return datum.rawCount;
	}
	return null;
}

/**
 * A shape for each polarity step, so the swatch is not encoded by hue alone.
 *
 * The polarity ramp is deliberately equal-lightness at the poles — the right
 * call for honest area comparison, since a 'Très négatif' bar should not read
 * heavier than a 'Très positif' one at equal area. The cost is that the two
 * poles then differ *only* in hue, and for roughly 8% of male readers red and
 * green are the same colour. Badges and chips survive that because they carry
 * their label; a bare colour swatch does not.
 *
 * The ramp itself is unchanged. The swatch simply also carries a direction:
 * pointing up for positive, down for negative, flat for neutral, hollow for
 * "no stance". Keys are the stored French values, as everywhere else.
 */
const POLARITY_GLYPHS: Record<string, string> = {
	'Très positif': '▲',
	Positif: '△',
	Neutre: '■',
	Négatif: '▽',
	'Très négatif': '▼',
	'Non applicable': '○'
};

/**
 * Swatch markup for a tooltip row: the series colour, plus a shape whenever the
 * series is a polarity step. Returns a plain colour chip for everything else,
 * where hue is not carrying an ordered meaning.
 */
function swatch(color: string | undefined, seriesName: string | undefined, round = false): string {
	const glyph = seriesName ? POLARITY_GLYPHS[seriesName] : undefined;

	if (glyph) {
		return `<span aria-hidden="true" style="display:inline-block;width:10px;text-align:center;line-height:10px;font-size:10px;color:${color};">${glyph}</span>`;
	}

	return `<span style="display:inline-block;width:10px;height:10px;border-radius:${round ? '50%' : '2px'};background:${color};"></span>`;
}

/**
 * Tooltip building blocks.
 *
 * The four factories below cover the recurring tooltip *shapes*; these cover
 * the one-off panels that don't fit any of them, which otherwise each re-typed
 * the same flex markup and the same hairline-rule header. Kept here rather than
 * in a component because ECharts formatters return an HTML string, so there is
 * no Svelte to render — and this module is already the exempted home for the
 * literal rgba() a zrender tooltip needs.
 */

/** Header row: a bold title over a hairline rule. */
export function tooltipHeader(title: string): string {
	return `<div style="font-weight:600;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(243,245,249,0.14);">${title}</div>`;
}

/** Label on the left, value on the right. */
export function tooltipRow(label: string, value: string): string {
	return `<div style="display:flex;justify-content:space-between;gap:12px;padding:2px 0;">
		<span>${label}:</span><strong>${value}</strong>
	</div>`;
}

/**
 * A series row: swatch, name, value. Uses the same `swatch()` as the factories,
 * so a polarity series keeps its glyph and is never encoded by hue alone.
 */
export function tooltipSeriesRow(
	color: string | undefined,
	name: string | undefined,
	value: string
): string {
	return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
		${swatch(color, name, true)}
		<span style="flex:1;">${name}</span>
		<strong>${value}</strong>
	</div>`;
}

/** A row set off from the ones above it by a rule — a total, or a summary. */
export function tooltipFooterRow(label: string, value: string): string {
	return `<div style="display:flex;justify-content:space-between;gap:12px;padding-top:6px;margin-top:4px;border-top:1px solid rgba(243,245,249,0.14);">
		<span>${label}:</span><strong>${value}</strong>
	</div>`;
}

/** Wrap rows in the panel every tooltip uses, with a minimum width. */
export function tooltipPanel(minWidth: number, ...sections: string[]): string {
	return `<div style="min-width:${minWidth}px;">${sections.join('')}</div>`;
}

/**
 * Pie chart tooltip: color dot + name + value + percent.
 * Used by: SentimentChart (pie), SubjectivityChart (pie)
 */
export function createPieTooltipFormatter(options: {
	formatValue: (n: number) => string;
	/** Active language, read at format time so a switch re-renders correctly. */
	lang: () => Language;
}): (params: unknown) => string {
	return function (params: unknown) {
		const lang = options.lang();
		if (Array.isArray(params)) {
			return (params as TooltipParam[])
				.map(
					(param) =>
						`${swatch(param.color, param.seriesName, true)} ${param.seriesName}: ${formatNumber(param.value, lang)} (${formatPercent((param.percent ?? 0) / 100, 1, lang)})`
				)
				.join('<br/>');
		} else {
			const p = params as TooltipParam;
			return `<div style="font-weight:600;margin-bottom:8px;">${p.seriesName}</div>
				${swatch(p.color, p.name, true)}
				${p.name}: <strong>${options.formatValue(p.value)}</strong> (${formatPercent((p.percent ?? 0) / 100, 1, lang)})`;
		}
	};
}

/**
 * Stacked bar chart tooltip: header + sorted items list + total.
 * Used by: SentimentChart (bar), SubjectivityChart (bar), CorrelationChart
 */
export function createStackedBarTooltipFormatter(options: {
	getTotalLabel: () => string;
	/** Active language, read at format time so a switch re-renders correctly. */
	lang: () => Language;
	getIsMobile?: () => boolean;
	sort?: boolean;
	headerKey?: 'axisValueLabel' | 'name';
	scrollableList?: boolean;
	totalSuffix?: () => string;
}): (params: unknown) => string {
	const headerKey = options.headerKey ?? 'axisValueLabel';
	const sort = options.sort ?? true;
	const scrollable = options.scrollableList ?? false;

	return function (params: unknown) {
		if (!Array.isArray(params) || params.length === 0) {
			return '';
		}

		const lang = options.lang();
		const typed = params as TooltipParam[];
		const items = sort ? typed.slice().sort((a, b) => b.value - a.value) : typed;

		let listHtml = '';
		let total = 0;

		items.forEach((param) => {
			if (param.value > 0) {
				listHtml += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
					${swatch(param.color, param.seriesName)}
					<span style="flex:1;">${param.seriesName}</span>
					<strong>${formatNumber(param.value, lang)}</strong>
				</div>`;
			}
			total += param.value;
		});

		const isMobile = options.getIsMobile?.() ?? false;
		const listWrapper = scrollable
			? `<div style="max-height:${isMobile ? '150px' : '200px'};overflow-y:auto;margin-bottom:8px;">${listHtml}</div>`
			: listHtml;

		return `<div style="min-width:180px;">
			<div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);">${typed[0][headerKey]}</div>
			${listWrapper}
			<div style="padding-top:6px;${scrollable ? '' : 'margin-top:4px;'}border-top:1px solid rgba(255,255,255,0.15);font-weight:600;">${options.getTotalLabel()}: ${formatNumber(total, lang)}${options.totalSuffix ? ' ' + options.totalSuffix() : ''}</div>
		</div>`;
	};
}

/**
 * Trend/line chart tooltip: header + items + conditional total.
 * Used by: SentimentTrendsChart, SubjectivityTrendsChart, VolumeChart
 */
export function createTrendTooltipFormatter(options: {
	getTotalLabel: () => string;
	/** Active language, read at format time so a switch re-renders correctly. */
	lang: () => Language;
	sort?: boolean;
	/**
	 * Share mode: series values are percentages and each datum carries its
	 * `rawCount`. The tooltip then reads "34.2% (58)" and the total row shows the
	 * year's article count rather than a meaningless 100%.
	 */
	share?: () => boolean;
}): (params: unknown) => string {
	const sort = options.sort ?? false;

	return function (params: unknown) {
		if (!Array.isArray(params) || params.length === 0) {
			return '';
		}

		const lang = options.lang();
		const isShare = options.share?.() ?? false;
		const typed = params as TooltipParam[];
		const items = sort ? typed.slice().sort((a, b) => b.value - a.value) : typed;

		let listHtml = '';
		let total = 0;

		items.forEach((param) => {
			const rawCount = getRawCount(param);
			if (param.value > 0) {
				const display = isShare
					? `${formatPercent(param.value / 100, 1, lang)}${rawCount === null ? '' : ` <span style="opacity:0.65;font-weight:400;">(${formatNumber(rawCount, lang)})</span>`}`
					: formatNumber(param.value, lang);
				listHtml += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
					${swatch(param.color, param.seriesName, true)}
					<span style="flex:1;">${param.seriesName}</span>
					<strong>${display}</strong>
				</div>`;
			}
			total += isShare ? (rawCount ?? 0) : param.value;
		});

		return `<div style="min-width:160px;">
			<div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);">${typed[0].axisValue}</div>
			${listHtml}
			${total > 0 ? `<div style="padding-top:6px;margin-top:4px;border-top:1px solid rgba(255,255,255,0.15);font-weight:600;">${options.getTotalLabel()}: ${formatNumber(total, lang)}</div>` : ''}
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
	return function (params: unknown) {
		const data = (Array.isArray(params) ? params[0] : params) as TooltipParam;
		return `<div style="min-width:140px;">
			<div style="font-weight:600;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.15);">${data.name}</div>
			<div style="display:flex;justify-content:space-between;">
				<span>${options.getLabel()}:</span>
				<strong>${data.value}</strong>
			</div>
		</div>`;
	};
}
