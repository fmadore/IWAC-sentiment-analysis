/**
 * The full prompt texts, loaded the first time a prompt modal opens.
 *
 * `prompts.ts` is about 11 KiB gzip of prose that only the prompt modals show,
 * behind an explicit click (or a `prompt=true` link). Importing it statically
 * from the methodology cards put it in the initial page chunk of every visit.
 */

type PromptModule = typeof import('./prompts');

let _prompts = $state.raw<PromptModule | null>(null);
let pending: Promise<PromptModule> | null = null;

/** The loaded prompt texts, or null until `loadPromptTexts` resolves. Reactive. */
export const promptTexts = {
	get current(): PromptModule | null {
		return _prompts;
	}
};

/** Load the prompt texts once; a failed load is retried on the next call. */
export function loadPromptTexts(): Promise<PromptModule> {
	pending ??= import('./prompts').then((module) => (_prompts = module));
	pending.catch(() => {
		pending = null;
	});
	return pending;
}
