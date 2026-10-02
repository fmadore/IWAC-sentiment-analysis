/** Exact panel patterns retain the article paths lost in adjacent-pair Sankey links. */
import { classifyDissent, usableValues, type ConsensusRow } from './consensus';
import type { AgreementDimension } from './agreementData';

export type PatternKind = 'all' | 'unanimous' | 'lone' | 'split';

export interface LabelPattern {
	key: string;
	values: number[];
	/** Sizes of equal-label groups, descending: e.g. [3, 2] or [2, 2, 1]. */
	splitSizes: number[];
	kind: Exclude<PatternKind, 'all'>;
	articleIds: string[];
	count: number;
	/** Fraction of all usable articles, independent of a pattern-group filter. */
	share: number;
}

export function buildLabelPatterns(
	rows: ConsensusRow[],
	dimension: AgreementDimension,
	modelCount: number,
	includeDeclined: boolean
): { patterns: LabelPattern[]; n: number } {
	const groups = new Map<string, { values: number[]; articleIds: string[] }>();
	let n = 0;
	for (const { row, values } of usableValues(rows, dimension, includeDeclined)) {
		if (values.length !== modelCount || modelCount < 2) continue;
		const key = values.join('-');
		const group = groups.get(key);
		if (group) group.articleIds.push(row.id);
		else groups.set(key, { values: [...values], articleIds: [row.id] });
		n++;
	}
	const patterns = [...groups].map(([key, group]): LabelPattern => {
		const frequencies = new Map<number, number>();
		for (const value of group.values) frequencies.set(value, (frequencies.get(value) ?? 0) + 1);
		const outcome = classifyDissent(group.values);
		return {
			key,
			...group,
			splitSizes: [...frequencies.values()].sort((a, b) => b - a),
			kind: outcome.kind === 'majority' ? 'lone' : outcome.kind,
			count: group.articleIds.length,
			share: group.articleIds.length / n
		};
	});
	patterns.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
	return { patterns, n };
}

export function filterLabelPatterns(patterns: LabelPattern[], kind: PatternKind): LabelPattern[] {
	return kind === 'all' ? patterns : patterns.filter((pattern) => pattern.kind === kind);
}
