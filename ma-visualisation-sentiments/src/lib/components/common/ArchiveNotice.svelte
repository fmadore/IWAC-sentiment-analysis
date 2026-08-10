<!--
  ArchiveNotice Component

  Shown only while the archived (v1) analysis is on screen. Its job is to make
  an old reading unmistakable: a reader arriving on a cited ?dataset=chatgpt URL
  should never mistake it for the current analysis, and should be one click from
  the current one.

  Renders nothing for the current generation, so it can be mounted
  unconditionally by the page.
-->
<script lang="ts">
	import { datasetState, uiState } from '$lib/stores';
	import { updateURL } from '$lib/stores/url';
	import { t } from '$lib/i18n';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { CURRENT_GENERATION } from '$lib/domain/sentimentContract';

	function returnToCurrent() {
		datasetState.setGeneration(CURRENT_GENERATION);
		updateURL(uiState.activeView, datasetState.isComparisonMode);
	}
</script>

{#if datasetState.isArchived}
	<aside class="archive-notice" aria-label={$t.generations.archivedLabel}>
		<span class="archive-icon" aria-hidden="true">
			<ArchiveIcon size={16} />
		</span>
		<p class="archive-text">
			<strong>{$t.generations.archivedTitle}</strong>
			<span class="archive-detail">{$t.generations.archivedDescription}</span>
		</p>
		<button class="archive-action" type="button" onclick={returnToCurrent}>
			{$t.generations.backToCurrent}
			<ArrowRightIcon size={14} />
		</button>
	</aside>
{/if}

<style>
	.archive-notice {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-4);
		border: 1px solid var(--status-warning);
		border-radius: var(--radius-panel);
		background: var(--surface-card);
		color: var(--text-primary);
	}

	.archive-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--status-warning);
		flex-shrink: 0;
	}

	.archive-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin: 0;
		min-width: 0;
		flex: 1 1 20rem;
		font-size: var(--font-size-sm);
	}

	.archive-detail {
		color: var(--text-secondary);
	}

	/* No global .btn exists — every control declares its own box. */
	.archive-action {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-panel);
		background: var(--surface-elevated);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.archive-action:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}
</style>
