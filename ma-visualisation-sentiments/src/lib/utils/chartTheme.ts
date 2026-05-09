/**
 * ECharts Theme Configuration
 *
 * Centralized theme configuration for all ECharts components.
 * Uses CSS custom properties from app.postcss for consistent styling.
 *
 * This module provides:
 * - Semantic color mappings for sentiment analysis data
 * - Consistent tooltip, legend, and axis styling
 * - Glass morphism effects for chart backgrounds
 * - Responsive font sizing utilities
 */

// =============================================================================
// SEMANTIC COLORS - Using CSS custom property values
// =============================================================================

/**
 * Polarity colors. Diverging red ↔ green ramp through low-chroma blue (neutral).
 * Equal lightness at the poles so 'Très négatif' and 'Très positif' areas read
 * with the same visual weight.
 *
 * NOTE: ECharts (zrender) does not parse modern CSS color spaces — `oklch()`
 * and `color-mix()` both fall back to #000000, which makes hover-brightening
 * turn bars invisible. Every value here is the sRGB-hex translation of the
 * OKLCH tokens in app.css. Source-of-truth conversion script:
 * `scripts/oklch-to-hex.py`.
 */
export const polarityColors = {
	'Très positif': '#00A245', // oklch(0.62 0.18 150)
	Positif: '#5CB572', // oklch(0.70 0.13 150)
	Neutre: '#7E95AD', // oklch(0.66 0.045 250)
	Négatif: '#E97871', // oklch(0.70 0.14 25)
	'Très négatif': '#E64343', // oklch(0.62 0.20 25)
	'Non applicable': '#6E7278' // oklch(0.55 0.01 260)
} as const;

/**
 * Subjectivity colors. Sequential cool→warm ramp by lightness (NOT a rainbow).
 * Score 1 = objective/calm; Score 5 = subjective/loud.
 */
export const subjectivityColors = {
	1: '#7AAEBF', // oklch(0.72 0.06 220)
	2: '#56AFB3', // oklch(0.70 0.085 200)
	3: '#86A468', // oklch(0.68 0.09 130)
	4: '#D2833B', // oklch(0.68 0.13 60)
	5: '#E76444' // oklch(0.66 0.17 35)
} as const;

/**
 * Legacy subjectivity colors mapped by French labels (for backwards compatibility)
 */
export const subjectivityColorsByLabel = {
	Factuel: '#7AAEBF',
	'Plutôt factuel': '#56AFB3',
	Mixte: '#86A468',
	'Plutôt subjectif': '#D2833B',
	Subjectif: '#E76444',
	'Non applicable': '#6E7278'
} as const;

/**
 * Centrality colors. Sequential single-hue amber ramp — more central = brighter.
 * No jump from gray to yellow like before; "more of one variable" reads as one
 * visual variable now.
 */
export const centralityColors = {
	'Non abordé': '#4E4D4A', // oklch(0.42 0.005 80)
	Marginal: '#75674F', // oklch(0.52 0.04 80)
	Secondaire: '#9E8150', // oklch(0.62 0.075 80)
	Central: '#CA9C48', // oklch(0.72 0.115 80)
	'Très central': '#F3B94C' // oklch(0.82 0.14 80)
} as const;

/**
 * Arbiter verdict colors. Reuses comparison-palette steel-blue for model A/B
 * to avoid implying that "model A wins" is positive (green) — verdicts are
 * descriptive, not evaluative. 'both' is the warm arbiter amber; 'neither'
 * is neutral grey.
 */
export const arbiterVerdictColors = {
	model_a: '#6FA5CB', // oklch(0.70 0.08 240)
	model_b: '#CC91DA', // oklch(0.74 0.12 320)
	both: '#E3AD4B', // oklch(0.78 0.13 80)
	neither: '#6E7278' // oklch(0.55 0.01 260)
} as const;

/**
 * Arbiter confidence colors. Stays inside the diverging polarity ramp so a
 * 'low confidence' chart reads with the same visual weight as a 'low signal'
 * sentiment chart elsewhere.
 */
export const arbiterConfidenceColors = {
	high: '#00A245',
	medium: '#E3AD4B',
	low: '#E64343'
} as const;

/**
 * Categorical palette for multi-series charts (countries, journals, etc.).
 * EXPLICITLY avoids the polarity reds and greens so a journal series can
 * never be confused with a sentiment series. Muted, low-to-medium chroma —
 * categorical encoding shouldn't shout. Hues spaced ≥40° apart.
 */
export const seriesColorPalette = [
	'#6DABDF', // steel blue
	'#50BFBE', // teal
	'#E3AD4B', // amber
	'#C38ECF', // muted magenta
	'#5DC0A7', // sea green (cooler than polarity green)
	'#9FA5E3', // dusty violet
	'#E7A875', // ochre
	'#6EB1BD', // slate
	'#C9B773', // wheat
	'#D48AAD', // muted rose (cooler than polarity red)
	'#84B3CA', // pale steel
	'#A0BC86' // sage
] as const;

// =============================================================================
// CHART STYLING CONSTANTS
// Centralized values for consistent chart styling
// =============================================================================

/**
 * Chart color constants. ECharts (zrender) only parses hex / rgb(a) / hsl(a) /
 * named colors — `oklch()` and `color-mix()` fall back to #000000, which
 * makes hover brightness adjustments turn bars invisible. So everything
 * here is hex / rgba, derived from the OKLCH tokens in app.css via
 * `scripts/oklch-to-hex.py`. Backgrounds and chrome are OPAQUE — tooltip
 * blur was an AI dataviz tell. Text is tinted toward the brand hue (260)
 * so it integrates with the editorial dark surface.
 */
export const chartColors = {
	text: {
		primary: '#F3F5F9', // oklch(0.97 0.005 260)
		secondary: '#D5D7DB', // oklch(0.88 0.005 260)
		muted: '#A9ABAE', // oklch(0.74 0.005 260)
		subtle: '#848689', // oklch(0.62 0.005 260)
		faint: '#4B4D50' // oklch(0.42 0.005 260)
	},
	background: {
		// Opaque editorial tooltip — high contrast, hairline border.
		tooltip: '#13161C', // oklch(0.20 0.012 260)
		dark: '#13161C'
	},
	border: {
		subtle: 'rgba(243, 245, 249, 0.08)',
		light: 'rgba(243, 245, 249, 0.14)',
		medium: 'rgba(243, 245, 249, 0.22)'
	},
	shadow: {
		default: 'rgba(0, 0, 0, 0.35)',
		emphasis: 'rgba(0, 0, 0, 0.45)'
	},
	/**
	 * Chrome accent for chart UI affordances (DataZoom handle, brush, axis-pointer
	 * highlights). Uses the editorial amber primary so it doesn't collide with
	 * the polarity-neutral blue (which used to be the same #3B82F6 — that was
	 * the bug DataZoom carried).
	 */
	chrome: {
		accent: '#E3AD4B', // oklch(0.78 0.13 80)
		accentSoft: 'rgba(227, 173, 75, 0.22)',
		accentFaint: 'rgba(227, 173, 75, 0.12)'
	}
} as const;

// =============================================================================
// THEME CONFIGURATION HELPERS
// =============================================================================

/**
 * Get responsive font size based on mobile state
 */
export function getFontSize(
	isMobile: boolean,
	type: 'title' | 'label' | 'legend' | 'tooltip' = 'label'
): number {
	const sizes = {
		title: { mobile: 12, desktop: 16 },
		label: { mobile: 9, desktop: 11 },
		legend: { mobile: 10, desktop: 12 },
		tooltip: { mobile: 10, desktop: 12 }
	};
	return isMobile ? sizes[type].mobile : sizes[type].desktop;
}

/**
 * Common title style configuration. Charts inside ChartCard now get their
 * title from the card header, so this is rarely used — kept for charts that
 * render standalone (heatmap legend titles, etc.).
 */
export function getTitleStyle(isMobile: boolean) {
	return {
		color: chartColors.text.primary,
		fontWeight: 600 as const,
		fontSize: getFontSize(isMobile, 'title'),
		fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, "Times New Roman", Times, serif'
	};
}

/**
 * Tooltip — opaque editorial panel, no backdrop blur. Tooltips appear *over*
 * chart canvases; blur there read as cheap glass-over-data. FT/Bloomberg
 * tooltips are flat and high-contrast.
 */
export function getTooltipConfig(_isMobile: boolean) {
	return {
		backgroundColor: chartColors.background.tooltip,
		borderColor: chartColors.border.medium,
		borderWidth: 1,
		borderRadius: 6,
		padding: [10, 14],
		textStyle: {
			color: chartColors.text.secondary,
			fontSize: getFontSize(_isMobile, 'tooltip'),
			fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
		},
		extraCssText: `box-shadow: 0 8px 24px ${chartColors.shadow.emphasis};`
	};
}

/**
 * Common legend configuration
 */
export function getLegendConfig(
	isMobile: boolean,
	orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
	return {
		textStyle: {
			color: chartColors.text.secondary,
			fontSize: getFontSize(isMobile, 'legend'),
			fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
		},
		type: 'scroll' as const,
		orient: isMobile && orientation === 'horizontal' ? 'vertical' : orientation,
		left: isMobile ? 'right' : 'center',
		itemWidth: isMobile ? 12 : 20,
		itemHeight: isMobile ? 8 : 12,
		itemGap: isMobile ? 8 : 12,
		pageIconColor: chartColors.text.subtle,
		pageIconInactiveColor: chartColors.text.faint,
		pageTextStyle: {
			color: chartColors.text.subtle
		}
	};
}

/**
 * Common axis line style
 */
export function getAxisLineStyle() {
	return {
		lineStyle: {
			color: chartColors.border.medium,
			width: 1
		}
	};
}

/**
 * Axis pointer configuration for cross-style tooltips
 * Used in line/area charts for precise value display
 */
export function getAxisPointerConfig() {
	return {
		type: 'cross' as const,
		label: {
			backgroundColor: chartColors.background.tooltip,
			borderColor: chartColors.border.medium,
			color: chartColors.text.secondary
		},
		crossStyle: {
			color: chartColors.text.faint
		}
	};
}

/**
 * Common axis label style
 */
export function getAxisLabelStyle(isMobile: boolean) {
	return {
		color: chartColors.text.muted,
		fontSize: getFontSize(isMobile, 'label'),
		fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
	};
}

/**
 * Common split line style for grid
 */
export function getSplitLineStyle() {
	return {
		lineStyle: {
			color: chartColors.border.subtle,
			type: 'dashed' as const
		}
	};
}

/**
 * Common grid configuration
 */
export function getGridConfig(
	isMobile: boolean,
	options?: {
		hasLegendTop?: boolean;
		hasDataZoom?: boolean;
		legendPosition?: 'top' | 'bottom';
	}
) {
	const { hasLegendTop = true, hasDataZoom = false, legendPosition = 'top' } = options || {};

	return {
		left: isMobile ? '5%' : '3%',
		right: isMobile ? '5%' : '4%',
		top: isMobile
			? hasLegendTop && legendPosition === 'top'
				? '25%'
				: '15%'
			: hasLegendTop && legendPosition === 'top'
				? '18%'
				: '12%',
		bottom: isMobile
			? hasDataZoom
				? '18%'
				: legendPosition === 'bottom'
					? '25%'
					: '12%'
			: hasDataZoom
				? '15%'
				: legendPosition === 'bottom'
					? '15%'
					: '8%',
		containLabel: true
	};
}

/**
 * DataZoom for time-series charts. Uses the editorial amber chrome accent
 * so the selection band can never be confused with the polarity-neutral
 * series colour (the previous #3B82F6 collision).
 */
export function getDataZoomConfig(isMobile: boolean) {
	return [
		{
			type: 'slider' as const,
			start: 0,
			end: 100,
			bottom: isMobile ? '5%' : '2%',
			height: isMobile ? 18 : 22,
			backgroundColor: chartColors.border.subtle,
			borderColor: chartColors.border.light,
			fillerColor: chartColors.chrome.accentFaint,
			handleStyle: {
				color: chartColors.chrome.accent,
				borderColor: chartColors.chrome.accent,
				borderWidth: 0
			},
			moveHandleStyle: {
				color: chartColors.chrome.accent,
				opacity: 0.6
			},
			emphasis: {
				handleStyle: {
					borderWidth: 0
				}
			},
			textStyle: {
				color: chartColors.text.muted,
				fontFamily: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
				fontSize: isMobile ? 10 : 11
			},
			dataBackground: {
				lineStyle: {
					color: chartColors.border.medium,
					width: 1
				},
				areaStyle: {
					color: chartColors.border.subtle
				}
			},
			selectedDataBackground: {
				lineStyle: {
					color: chartColors.chrome.accentSoft
				},
				areaStyle: {
					color: chartColors.chrome.accentFaint
				}
			}
		},
		{
			type: 'inside' as const,
			start: 0,
			end: 100
		}
	];
}

/**
 * Emphasis configuration for focus effects
 */
export function getEmphasisConfig() {
	return {
		focus: 'series' as const,
		blurScope: 'coordinateSystem' as const
	};
}

/**
 * Line series — flat strokes, no drop shadow. Drop shadows on lines were
 * a 2010s polish gesture; investigative line charts are crisp and matte.
 */
export function getLineSeriesStyle(isMobile: boolean, color: string) {
	return {
		lineStyle: {
			width: isMobile ? 1.75 : 2
		},
		symbolSize: isMobile ? 4 : 6,
		symbol: 'circle' as const,
		itemStyle: {
			color,
			borderWidth: 0
		}
	};
}

/**
 * Bar series — FLAT fill, no gradient, no rounded corners. FT/Reuters/
 * Bellingcat all use flat square-cornered bars. A gradient implies a change;
 * the bars here are constants, so the gradient is decoration.
 */
export function getBarSeriesStyle(color: string, _horizontal: boolean = false) {
	return {
		itemStyle: {
			color,
			borderRadius: 0
		}
	};
}

/**
 * Pie / donut series — flat fills, no shadow on emphasis. Hover signal is
 * a 2px white border on the active slice. Donut radius slightly leaner than
 * the previous 42/72 to leave room for centre labels.
 */
export function getPieSeriesStyle(isMobile: boolean) {
	return {
		radius: ['38%', '70%'],
		center: ['50%', '54%'],
		itemStyle: {
			borderColor: '#0A0D12', // app-bg in hex — slices don't bleed into each other on dark surface
			borderWidth: 1
		},
		label: {
			color: chartColors.text.secondary,
			fontSize: getFontSize(isMobile, 'label'),
			fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
		},
		labelLine: {
			lineStyle: {
				color: chartColors.border.medium
			}
		},
		emphasis: {
			label: {
				fontWeight: 600 as const
			},
			itemStyle: {
				borderColor: chartColors.text.primary,
				borderWidth: 1.5,
				shadowBlur: 0
			}
		}
	};
}

/**
 * Adjust color brightness. Hex input gets channel-shifted; OKLCH input passes
 * through unchanged (callers should be migrated off bar-gradient styling
 * per the Phase 2 dataviz refactor — investigative charts use flat fills).
 */
export function adjustBrightness(color: string, percent: number): string {
	if (!color.startsWith('#')) return color;
	const num = parseInt(color.replace('#', ''), 16);
	if (Number.isNaN(num)) return color;
	const amt = Math.round(2.55 * percent);
	const R = Math.max(0, Math.min(255, (num >> 16) + amt));
	const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
	const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
	return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Get color with opacity. Hex → rgba; OKLCH → color-mix with transparent
 * (ECharts ≥6 accepts modern CSS color syntax).
 */
export function withOpacity(color: string, opacity: number): string {
	if (color.startsWith('#')) {
		const hex = color.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	}
	const pct = Math.round(opacity * 100);
	return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

/**
 * VisualMap configuration for heatmaps
 */
export function getVisualMapConfig(isMobile: boolean, min: number, max: number, colors: string[]) {
	return {
		min,
		max,
		calculable: true,
		orient: 'horizontal' as const,
		left: 'center',
		bottom: '5%',
		textStyle: {
			color: 'rgba(255, 255, 255, 0.85)',
			fontSize: getFontSize(isMobile, 'label')
		},
		inRange: {
			color: colors
		},
		itemWidth: isMobile ? 15 : 20,
		itemHeight: isMobile ? 100 : 140
	};
}

/**
 * Animation configuration
 */
export function getAnimationConfig() {
	return {
		animation: true,
		animationDuration: 800,
		animationEasing: 'cubicOut' as const,
		animationDurationUpdate: 300,
		animationEasingUpdate: 'cubicInOut' as const
	};
}

/**
 * Staggered animation delay for bar series (v6 enhancement)
 * Creates a progressive reveal effect where bars appear sequentially
 */
export function getStaggeredAnimationDelay(baseDelay: number = 30) {
	return {
		animationDuration: 800,
		animationEasing: 'cubicOut' as const,
		animationDelay: (idx: number) => idx * baseDelay
	};
}

/**
 * Universal transition configuration (v6 enhancement)
 * Enables smooth morphing animation when switching between chart types (e.g., bar ↔ pie)
 * Requires UniversalTransition feature to be registered via use()
 */
export function getUniversalTransitionConfig() {
	return {
		universalTransition: {
			enabled: true,
			divideShape: 'clone' as const
		}
	};
}

/**
 * Accessibility configuration with decal patterns (v6 enhancement)
 * Adds visual patterns to chart elements for better colorblind accessibility
 */
export function getAccessibilityConfig(enabled: boolean = true) {
	return {
		aria: {
			enabled,
			decal: {
				show: enabled
			}
		}
	};
}

// =============================================================================
// COMPLETE CHART OPTIONS BUILDER
// =============================================================================

export interface ChartOptionsBase {
	isMobile: boolean;
	title: string;
	hasLegend?: boolean;
	hasDataZoom?: boolean;
	legendPosition?: 'top' | 'bottom';
}

/**
 * Create base chart options with common configurations
 */
export function createBaseChartOptions(config: ChartOptionsBase) {
	const { isMobile, title, hasLegend = true, hasDataZoom = false, legendPosition = 'top' } = config;

	return {
		backgroundColor: 'transparent',
		title: {
			text: title,
			left: 'center',
			top: '2%',
			textStyle: getTitleStyle(isMobile)
		},
		tooltip: getTooltipConfig(isMobile),
		grid: getGridConfig(isMobile, { hasLegendTop: hasLegend, hasDataZoom, legendPosition }),
		...getAnimationConfig()
	};
}
