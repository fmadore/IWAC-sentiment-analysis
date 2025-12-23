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
 * Polarity colors matching --sentiment-polarity-* CSS variables
 */
export const polarityColors = {
  'Très positif': '#22C55E',    // --sentiment-polarity-very-positive
  'Positif': '#4ADE80',         // --sentiment-polarity-positive
  'Neutre': '#3B82F6',          // --sentiment-polarity-neutral
  'Négatif': '#F87171',         // --sentiment-polarity-negative
  'Très négatif': '#EF4444',    // --sentiment-polarity-very-negative
  'Non applicable': '#6B7280'   // --sentiment-polarity-na
} as const;

/**
 * Subjectivity colors matching --sentiment-subjectivity-* CSS variables
 */
export const subjectivityColors = {
  1: '#06B6D4',  // --sentiment-subjectivity-1 (Very Objective)
  2: '#22D3EE',  // --sentiment-subjectivity-2 (Rather Objective)
  3: '#8B5CF6',  // --sentiment-subjectivity-3 (Mixed)
  4: '#FB923C',  // --sentiment-subjectivity-4 (Rather Subjective)
  5: '#F97316'   // --sentiment-subjectivity-5 (Very Subjective)
} as const;

/**
 * Legacy subjectivity colors mapped by French labels (for backwards compatibility)
 */
export const subjectivityColorsByLabel = {
  'Factuel': '#06B6D4',        // Score 1 - Very Objective
  'Plutôt factuel': '#22D3EE', // Score 2 - Rather Objective
  'Mixte': '#8B5CF6',          // Score 3 - Mixed
  'Plutôt subjectif': '#FB923C', // Score 4 - Rather Subjective
  'Subjectif': '#F97316',      // Score 5 - Very Subjective
  'Non applicable': '#6B7280'  // N/A - Gray
} as const;

/**
 * Centrality colors matching --sentiment-centrality-* CSS variables
 */
export const centralityColors = {
  'Non abordé': '#475569',     // --sentiment-centrality-not-addressed
  'Marginal': '#64748B',       // --sentiment-centrality-marginal
  'Secondaire': '#94A3B8',     // --sentiment-centrality-secondary
  'Central': '#FCD34D',        // --sentiment-centrality-central
  'Très central': '#FBBF24'    // --sentiment-centrality-very-central
} as const;

/**
 * Modern color palette for multi-series charts (countries, journals, etc.)
 * Uses a harmonious set of colors that work well on dark backgrounds
 */
export const seriesColorPalette = [
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#FBBF24', // Amber
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#A855F7', // Violet
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Yellow
  '#84CC16', // Lime
  '#F43F5E'  // Rose
] as const;

// =============================================================================
// THEME CONFIGURATION HELPERS
// =============================================================================

/**
 * Get responsive font size based on mobile state
 */
export function getFontSize(isMobile: boolean, type: 'title' | 'label' | 'legend' | 'tooltip' = 'label'): number {
  const sizes = {
    title: { mobile: 12, desktop: 16 },
    label: { mobile: 9, desktop: 11 },
    legend: { mobile: 10, desktop: 12 },
    tooltip: { mobile: 10, desktop: 12 }
  };
  return isMobile ? sizes[type].mobile : sizes[type].desktop;
}

/**
 * Common title style configuration
 */
export function getTitleStyle(isMobile: boolean) {
  return {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: 'bold' as const,
    fontSize: getFontSize(isMobile, 'title'),
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
  };
}

/**
 * Common tooltip configuration with glass morphism effect
 */
export function getTooltipConfig(isMobile: boolean) {
  return {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 8,
    padding: [12, 16],
    textStyle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: getFontSize(isMobile, 'tooltip'),
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    },
    extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);'
  };
}

/**
 * Common legend configuration
 */
export function getLegendConfig(isMobile: boolean, orientation: 'horizontal' | 'vertical' = 'horizontal') {
  return {
    textStyle: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: getFontSize(isMobile, 'legend'),
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    },
    type: 'scroll' as const,
    orient: isMobile && orientation === 'horizontal' ? 'vertical' : orientation,
    left: isMobile ? 'right' : 'center',
    itemWidth: isMobile ? 12 : 20,
    itemHeight: isMobile ? 8 : 12,
    itemGap: isMobile ? 8 : 12,
    pageIconColor: 'rgba(255, 255, 255, 0.7)',
    pageIconInactiveColor: 'rgba(255, 255, 255, 0.3)',
    pageTextStyle: {
      color: 'rgba(255, 255, 255, 0.7)'
    }
  };
}

/**
 * Common axis line style
 */
export function getAxisLineStyle() {
  return {
    lineStyle: {
      color: 'rgba(255, 255, 255, 0.2)',
      width: 1
    }
  };
}

/**
 * Common axis label style
 */
export function getAxisLabelStyle(isMobile: boolean) {
  return {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: getFontSize(isMobile, 'label'),
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
  };
}

/**
 * Common split line style for grid
 */
export function getSplitLineStyle() {
  return {
    lineStyle: {
      color: 'rgba(255, 255, 255, 0.08)',
      type: 'dashed' as const
    }
  };
}

/**
 * Common grid configuration
 */
export function getGridConfig(isMobile: boolean, options?: {
  hasLegendTop?: boolean;
  hasDataZoom?: boolean;
  legendPosition?: 'top' | 'bottom';
}) {
  const { hasLegendTop = true, hasDataZoom = false, legendPosition = 'top' } = options || {};
  
  return {
    left: isMobile ? '5%' : '3%',
    right: isMobile ? '5%' : '4%',
    top: isMobile 
      ? (hasLegendTop && legendPosition === 'top' ? '25%' : '15%')
      : (hasLegendTop && legendPosition === 'top' ? '18%' : '12%'),
    bottom: isMobile
      ? (hasDataZoom ? '18%' : (legendPosition === 'bottom' ? '25%' : '12%'))
      : (hasDataZoom ? '15%' : (legendPosition === 'bottom' ? '15%' : '8%')),
    containLabel: true
  };
}

/**
 * Common DataZoom configuration for time-series charts
 */
export function getDataZoomConfig(isMobile: boolean) {
  return [
    {
      type: 'slider' as const,
      start: 0,
      end: 100,
      bottom: isMobile ? '5%' : '2%',
      height: isMobile ? 18 : 24,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      fillerColor: 'rgba(59, 130, 246, 0.2)',
      handleStyle: {
        color: '#3B82F6',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1
      },
      textStyle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: isMobile ? 9 : 10
      },
      dataBackground: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        areaStyle: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      },
      selectedDataBackground: {
        lineStyle: {
          color: 'rgba(59, 130, 246, 0.5)'
        },
        areaStyle: {
          color: 'rgba(59, 130, 246, 0.1)'
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
 * Common line series style
 */
export function getLineSeriesStyle(isMobile: boolean, color: string) {
  return {
    lineStyle: {
      width: isMobile ? 2 : 3,
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      shadowBlur: 4,
      shadowOffsetY: 2
    },
    symbolSize: isMobile ? 5 : 7,
    symbol: 'circle' as const,
    itemStyle: {
      color,
      borderColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 1
    }
  };
}

/**
 * Common bar series style with gradient
 */
export function getBarSeriesStyle(color: string, horizontal: boolean = false) {
  const gradientDirection = horizontal 
    ? { x: 0, y: 0, x2: 1, y2: 0 }
    : { x: 0, y: 1, x2: 0, y2: 0 };
  
  return {
    itemStyle: {
      color: {
        type: 'linear' as const,
        ...gradientDirection,
        colorStops: [
          { offset: 0, color },
          { offset: 1, color: adjustBrightness(color, -20) }
        ]
      },
      borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
    }
  };
}

/**
 * Pie chart series style
 */
export function getPieSeriesStyle(isMobile: boolean) {
  return {
    radius: ['42%', '72%'],
    center: ['50%', '55%'],
    label: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: getFontSize(isMobile, 'label'),
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    },
    labelLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.3)'
      }
    },
    emphasis: {
      label: {
        fontWeight: 'bold' as const
      },
      itemStyle: {
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.4)'
      }
    }
  };
}

/**
 * Adjust color brightness
 */
export function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
