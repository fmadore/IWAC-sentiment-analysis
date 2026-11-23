/**
 * The extremes controls take their values one way from the parent (none of the
 * props is `$bindable`), so a rejected keyword count has to put the current N
 * back in the field itself: otherwise typing 99 left the input showing 99
 * while the chart kept drawing the old count.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import ExtremeAnalysisControls from './ExtremeAnalysisControls.svelte';
import { fr } from '#lib/i18n/fr.js';

vi.mock('#lib/stores/index.js', () => ({ extremeState: { filtered: null } }));

afterEach(cleanup);

function setup(showTopN = 10) {
	const onTopNChange = vi.fn();
	const onCategoryChange = vi.fn();
	const view = render(ExtremeAnalysisControls, {
		props: {
			selectedCategory: 'polarity_very_negative',
			selectedKeywordType: 'subject',
			showTopN,
			onCategoryChange,
			onKeywordTypeChange: vi.fn(),
			onTopNChange
		}
	});
	const input = screen.getByLabelText(fr.extremeAnalysis.numberOfKeywords) as HTMLInputElement;
	return { ...view, input, onTopNChange, onCategoryChange };
}

describe('ExtremeAnalysisControls keyword count', () => {
	it('emits an in-range integer', async () => {
		const { input, onTopNChange } = setup();
		await fireEvent.change(input, { target: { value: '15' } });
		expect(onTopNChange).toHaveBeenCalledExactlyOnceWith(15);
	});

	it.each(['99', '4', '7.5', ''])(
		'resets %j to the current count without emitting',
		async (raw) => {
			const { input, onTopNChange } = setup(10);
			await fireEvent.change(input, { target: { value: raw } });
			expect(onTopNChange).not.toHaveBeenCalled();
			expect(input.value).toBe('10');
		}
	);

	it('shows the count the parent passes down', async () => {
		const { input, rerender } = setup(10);
		expect(input.value).toBe('10');
		await rerender({ showTopN: 20 });
		expect(input.value).toBe('20');
	});
});

describe('ExtremeAnalysisControls category', () => {
	it('reflects the selected category and emits a change', async () => {
		const { onCategoryChange } = setup();
		const select = screen.getByLabelText(fr.extremeAnalysis.selectCategory) as HTMLSelectElement;
		expect(select.value).toBe('polarity_very_negative');
		await fireEvent.change(select, { target: { value: 'centrality_very_central' } });
		expect(onCategoryChange).toHaveBeenCalledExactlyOnceWith('centrality_very_central');
	});
});
