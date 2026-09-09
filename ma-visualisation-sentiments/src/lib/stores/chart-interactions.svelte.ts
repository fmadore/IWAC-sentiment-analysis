import { SvelteSet } from 'svelte/reactivity';
import type { ViewId } from '$lib/types/data';

export interface ChartInteraction {
	/** Legend positions stay stable when translated labels change. */
	hidden?: number[];
	zoom?: [number, number];
}
export type ChartInteractions = Record<string, ChartInteraction>;
export const chartInteractionsState = $state<Partial<Record<ViewId, ChartInteractions>>>({});

export function parseChartInteractions(raw: string | null): ChartInteractions {
	if (!raw || raw.length > 10_000) return {};
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		return Object.fromEntries(
			Object.entries(parsed).flatMap(([key, value]) => {
				if (!/^[a-z][a-z0-9-]{0,63}$/.test(key) || !value || typeof value !== 'object') return [];
				const result: ChartInteraction = {};
				if (
					Array.isArray(value.hidden) &&
					value.hidden.length <= 100 &&
					value.hidden.every(
						(n: unknown) => Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) < 100
					)
				) {
					result.hidden = [...new SvelteSet<number>(value.hidden)].sort((a, b) => a - b);
				}
				if (
					Array.isArray(value.zoom) &&
					value.zoom.length === 2 &&
					value.zoom.every(
						(n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100
					) &&
					value.zoom[0] <= value.zoom[1]
				) {
					result.zoom = [value.zoom[0], value.zoom[1]];
				}
				return Object.keys(result).length ? [[key, result]] : [];
			})
		);
	} catch {
		return {};
	}
}
