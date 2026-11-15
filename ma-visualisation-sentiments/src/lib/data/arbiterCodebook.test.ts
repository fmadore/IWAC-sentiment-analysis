/**
 * The panel arbiter's current prompt carries the annotation codebook verbatim.
 *
 * Prompt v2.2.0 gave the judge its own short scale reference, and one of its
 * rules contradicted the codebook the annotating models had followed. The rules
 * the two must share live in `arbiter-codebook-fixtures.json`, which the Python
 * suite (`test_arbiter_codebook.py`) reads against the prompt the script sends;
 * this test reads it against the texts the methodology cards display.
 */
import { describe, expect, it } from 'vitest';
import fixture from './arbiter-codebook-fixtures.json';
import contractV2 from './sentiment-v2.json';
import {
	ARBITER_SYSTEM_INSTRUCTIONS_V2,
	ARBITER_SYSTEM_INSTRUCTION_V2_2_0,
	SENTIMENT_ANALYSIS_PROMPT_V2,
	arbiterSystemInstructionV2
} from './prompts';

const current = ARBITER_SYSTEM_INSTRUCTIONS_V2[fixture.promptVersion];

describe('arbiter codebook parity', () => {
	it('names the contract default and every accepted version', () => {
		expect(fixture.promptVersion).toBe(contractV2.arbiter.promptVersion);
		expect(Object.keys(ARBITER_SYSTEM_INSTRUCTIONS_V2).sort()).toEqual(
			[...contractV2.arbiter.acceptedPromptVersions].sort()
		);
	});

	it.each(fixture.rules)('shares rule %#', (rule) => {
		expect(SENTIMENT_ANALYSIS_PROMPT_V2.fr).toContain(rule);
		expect(current).toContain(rule);
	});

	it('drops the contradicting rule only from the new prompt', () => {
		for (const rule of fixture.contradicted) {
			expect(current).not.toContain(rule);
			expect(ARBITER_SYSTEM_INSTRUCTION_V2_2_0).toContain(rule);
		}
	});

	it('shows the published run’s prompt when a file predates the field', () => {
		expect(arbiterSystemInstructionV2(undefined)).toBe(ARBITER_SYSTEM_INSTRUCTION_V2_2_0);
		expect(arbiterSystemInstructionV2('v2.3.0')).toBe(current);
		expect(arbiterSystemInstructionV2('v0.0.0')).toBe(ARBITER_SYSTEM_INSTRUCTION_V2_2_0);
	});
});
