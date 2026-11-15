<!--
  PromptBlocks

  The body of an arbiter prompt dialog: each prompt text under its heading, in
  a monospace block. Render it inside PromptModal.

  It also loads the prompt texts. They are ~11 KiB gzip that only these dialogs
  show, so they load when the dialog opens — and the dialog's body exists only
  while it is open, whether a click or a `prompt=true` link opened it. Both
  methodology cards used to watch the URL flag in an `$effect` to start the
  load; mounting this component is now the only trigger.

  `blocks` is a function of the loaded module, so a card can pick texts by the
  prompt version its published file records.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/index.js';
	import { loadPromptTexts, promptTexts } from '#lib/data/promptTexts.svelte.js';

	type PromptModule = NonNullable<typeof promptTexts.current>;

	interface PromptBlocksProps {
		blocks: (texts: PromptModule) => { title: string; body: string }[];
	}

	let { blocks }: PromptBlocksProps = $props();

	onMount(() => {
		loadPromptTexts().catch((error) => console.error('Failed to load the prompt texts:', error));
	});
</script>

{#if promptTexts.current}
	{#each blocks(promptTexts.current) as block (block.title)}
		<section class="prompt-block">
			<h4 class="prompt-block-title">{block.title}</h4>
			<div class="prompt-code-container">
				<pre class="prompt-code">{block.body}</pre>
			</div>
		</section>
	{/each}
{:else}
	<p class="prompt-loading" role="status">{$t.messages.loading}</p>
{/if}

<style>
	.prompt-block + .prompt-block {
		margin-top: var(--space-6);
	}

	.prompt-block-title {
		margin: 0 0 var(--space-3);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--sentiment-arbiter);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
	}

	.prompt-code-container {
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
		overflow: hidden;
	}

	.prompt-code {
		margin: 0;
		padding: var(--space-4);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		white-space: pre-wrap;
		word-break: break-word;
		overflow-x: auto;
	}

	.prompt-loading {
		color: var(--text-muted);
	}

	@media (min-width: 640px) {
		.prompt-code {
			font-size: var(--font-size-xs);
		}
	}
</style>
