<script lang="ts">
	import { SvelteURL } from 'svelte/reactivity';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LinkIcon from '@lucide/svelte/icons/link';
	import { t } from '$lib/i18n';
	import { buildURLSearchParams, getCurrentState } from '$lib/stores/url';
	import { resolve } from '$app/paths';
	let status = $state<'idle' | 'copied' | 'failed'>('idle');
	async function copyLink() {
		try {
			const url = new SvelteURL(resolve('/'), window.location.origin);
			url.search = buildURLSearchParams(getCurrentState()).toString();
			await navigator.clipboard.writeText(url.href);
			status = 'copied';
		} catch {
			status = 'failed';
		}
	}
</script>

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
<span class="sr-only" role="status"
	>{status === 'copied' ? $t.links.copied : status === 'failed' ? $t.links.copyFailed : ''}</span
>

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
	.copy-link:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
