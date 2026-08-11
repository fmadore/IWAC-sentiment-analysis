/**
 * The generation-2 methodology card claims to show the exact instruction the
 * models were sent, and its configuration list quotes the prompt fingerprint
 * the pipeline recorded alongside every cached answer. Nothing connected the
 * two: the prompt is authored upstream, in another repository that CI cannot
 * read, and it has already drifted once from what this app displayed.
 *
 * Hashing the French text the way `sentiment_core.prompt_fingerprint` does
 * closes the gap — editing the prompt here, or bumping the contract's
 * provenance value without bringing the text across, fails the build instead of
 * shipping a card that misdescribes the run. The trailing newline belongs to
 * `sentiment_prompt.md`, which the TypeScript literal cannot carry.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SENTIMENT_ANALYSIS_PROMPT_V2 } from './prompts';
import contractV2 from './sentiment-v2.json';

function fingerprint(text: string): string {
	return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);
}

describe('generation-2 sentiment prompt', () => {
	it('hashes to the fingerprint recorded with the run', () => {
		expect(fingerprint(`${SENTIMENT_ANALYSIS_PROMPT_V2.fr}\n`)).toBe(
			contractV2.provenance.sentimentPromptFingerprint
		);
	});

	it('ships an English translation of every French section', () => {
		const headings = (text: string) =>
			text.split('\n').filter((line) => line.startsWith('## ')).length;

		expect(headings(SENTIMENT_ANALYSIS_PROMPT_V2.en)).toBe(
			headings(SENTIMENT_ANALYSIS_PROMPT_V2.fr)
		);
	});
});
