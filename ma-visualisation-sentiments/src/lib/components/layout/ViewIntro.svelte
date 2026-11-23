<!--
  ViewIntro

  The standing orientation above every view: what the dashboard is, that a
  panel of models read the corpus, and that none of them is a ground truth —
  so agreement between them is consistency, not accuracy. Present by default;
  a reader can hide it for the rest of the browser session.

  Panel and corpus sizes are read from the contract and the loaded corpus, never
  typed into the copy: the panel has already changed size twice.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import { t } from '#lib/i18n/index.js';
	import { num } from '#lib/i18n/utils.js';
	import { datasetState, articleState, uiState } from '#lib/stores/index.js';
	import { datasetIdsOf } from '#lib/domain/sentimentContract.js';
	import { readStorage, writeStorage } from '#lib/utils/safeStorage.js';

	const STORAGE_KEY = 'iwac-intro-dismissed';

	let dismissed = $state(false);
	onMount(() => {
		dismissed = readStorage('sessionStorage', STORAGE_KEY) === '1';
	});

	function dismiss() {
		dismissed = true;
		writeStorage('sessionStorage', STORAGE_KEY, '1');
	}

	const panelSize = $derived(datasetIdsOf(datasetState.generation).length);
	const corpusSize = $derived((articleState.datasets[datasetState.selected] ?? []).length);

	const body = $derived(
		corpusSize > 0
			? $t.intro.body.replace('{models}', $num(panelSize)).replace('{articles}', $num(corpusSize))
			: $t.intro.bodyNoCount.replace('{models}', $num(panelSize))
	);
</script>

{#if !dismissed}
	<aside class="view-intro" aria-label={$t.intro.label}>
		<div class="intro-text">
			<p class="intro-title">{$t.intro.title}</p>
			<p class="intro-body">{body}</p>
			<p class="intro-body">
				{$t.intro.caveat}
				{#if uiState.activeView !== 'agreement'}
					<button type="button" class="intro-link" onclick={() => uiState.showView('agreement')}
						>{$t.intro.agreementLink}</button
					>
				{/if}
			</p>
		</div>
		<button type="button" class="intro-dismiss" onclick={dismiss} aria-label={$t.intro.dismiss}>
			<XIcon size={16} />
		</button>
	</aside>
{/if}

<style>
	.view-intro {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-3);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	.intro-text {
		flex: 1;
		min-width: 0;
	}

	.intro-title {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
		margin: 0 0 var(--space-1);
	}

	.intro-body {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: 0;
	}

	.intro-body + .intro-body {
		margin-top: var(--space-1);
	}

	/* A link in the prose's voice; a button because it changes the view
	   through the store, which owns the URL. */
	.intro-link {
		display: inline;
		padding: 0;
		background: none;
		border: 0;
		font: inherit;
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.intro-link:hover {
		color: var(--text-primary);
	}

	.intro-dismiss {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--size-control-md);
		height: var(--size-control-md);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-panel);
		color: var(--text-muted);
		cursor: pointer;
	}

	.intro-dismiss:hover {
		color: var(--text-primary);
		border-color: var(--border-default);
	}
</style>
