import { expect, it } from 'vitest';
import { datasetReadiness } from './datasetReadiness';

it('does not gate a ready pair on unrelated failed prefetch', () => {
	const states = {
		luna: { status: 'ready' as const, data: [] },
		'mistral-small': { status: 'ready' as const, data: [] },
		qwen: { status: 'error' as const, error: new Error('offline') }
	};
	expect(datasetReadiness(['luna', 'mistral-small'], states)).toEqual({ ready: true, failed: [] });
	expect(datasetReadiness(['luna', 'qwen'], states)).toEqual({ ready: false, failed: ['qwen'] });
});
