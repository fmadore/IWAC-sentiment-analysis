<script lang="ts">
	import { SvelteURL } from 'svelte/reactivity';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LinkIcon from '@lucide/svelte/icons/link';
	import { t } from '#lib/i18n/index.js';
	import { buildURLSearchParams, getCurrentState } from '#lib/stores/url/index.js';
	import { resolve } from '$app/paths';
	let status = $state<'idle' | 'copied' | 'failed'>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	// Feedback is visible as well as announced: a failed copy used to be told
	// only to screen readers, so a sighted reader pasted a stale link.
	// Success clears itself; a failure stays until the next attempt.
	function settle(next: 'copied' | 'failed') {
		status = next;
		clearTimeout(resetTimer);
		if (next === 'copied') resetTimer = setTimeout(() => (status = 'idle'), 2500);
	}

	$effect(() => () => clearTimeout(resetTimer));

	async function copyLink() {
		try {
			const url = new SvelteURL(resolve('/'), window.location.origin);
			url.search = buildURLSearchParams(getCurrentState()).toString();
			await navigator.clipboard.writeText(url.href);
			settle('copied');
		} catch {
			settle('failed');
		}
	}
</script>

<span class="copy-link-wrap">
	<button
		type="button"
		class="copy-link"
		onclick={copyLink}
		aria-label={$t.links.copy}
		title={$t.links.copy}
	>
		{#if status === 'copied'}<CheckIcon size={18} aria-hidden="true" />{:else}<LinkIcon
				size={18}
				aria-hidden="true"
			/>{/if}
	</button>
	<span class="copy-feedback" role="status" data-status={status}
		>{status === 'copied' ? $t.links.copied : status === 'failed' ? $t.links.copyFailed : ''}</span
	>
</span>

<style>
	.copy-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--size-control-lg);
		min-height: var(--size-control-lg);
		flex-shrink: 0;
		background: var(--surface-card);
		color: var(--text-secondary);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-panel);
		cursor: pointer;
	}
	.copy-link:hover {
		color: var(--text-primary);
		border-color: var(--border-hover);
	}
	.copy-link-wrap {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
	}

	/* Floats under the button so the header row never reflows. Empty and
	   unpadded when idle, so nothing paints — but never display:none, which
	   would take the live region out of the accessibility tree. */
	.copy-feedback {
		position: absolute;
		top: calc(100% + var(--space-1));
		right: 0;
		z-index: var(--z-popover);
		max-width: 16rem;
		width: max-content;
		font-size: var(--font-size-xs);
		line-height: var(--line-height-snug);
		color: var(--text-primary);
	}

	.copy-feedback[data-status='copied'],
	.copy-feedback[data-status='failed'] {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-panel);
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-default);
		box-shadow: var(--elevation-sticky);
	}

	.copy-feedback[data-status='failed'] {
		border-color: var(--status-error);
		color: var(--color-error-200);
	}
</style>
