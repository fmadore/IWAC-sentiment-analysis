<!--
  ComparisonDetailModal Component
  
  A full-screen modal component for displaying comparison details with glass morphism styling.
  Uses the FullScreenModal wrapper for consistent full-screen experience.
  
  Features:
  - Full-screen modal with comparison gradient accent
  - Displays ComparisonDetail content
  - Header shows article title and metadata
  
  Usage:
  <ComparisonDetailModal 
    comparison={selectedComparison} 
    open={showModal} 
    onClose={() => showModal = false} 
  />
-->
<script lang="ts">
	import type { ComparisonData } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import ComparisonDetail from '$lib/components/data-display/ComparisonDetail.svelte';
	import FullScreenModal from './FullScreenModal.svelte';
	import { getJournalName } from '$lib/utils/format';
	import GitCompareArrowsIcon from '@lucide/svelte/icons/git-compare-arrows';

	interface ComparisonDetailModalProps {
		/** The comparison data to display */
		comparison: ComparisonData | null;
		/** Whether the modal is open */
		open: boolean;
		/** Callback when the modal should close */
		onClose: () => void;
	}

	let { comparison, open, onClose }: ComparisonDetailModalProps = $props();

	// Derive title and subtitle from comparison data
	let title = $derived(comparison?.article?.['o:title'] ?? $t.nav.comparison);

	let subtitle = $derived.by(() => {
		if (!comparison?.article) return '';
		const journal = getJournalName(comparison.article);
		const date = comparison.article.publication_date ?? '';
		return `${journal} • ${date}`;
	});

	// Check if there are discrepancies
	let hasDiscrepancies = $derived(comparison ? comparison.discrepancies.hasConflict : false);
</script>

{#if comparison}
	<FullScreenModal {open} {onClose} {title} {subtitle} accentVariant="comparison">
		{#snippet headerIcon()}
			<GitCompareArrowsIcon size={20} class="text-secondary-400" />
		{/snippet}

		{#snippet headerActions()}
			{#if hasDiscrepancies}
				<span class="discrepancy-badge">
					{$t.comparison.highConflicts}
				</span>
			{/if}
		{/snippet}

		<ComparisonDetail {comparison} />
	</FullScreenModal>
{/if}

<style>
	.discrepancy-badge {
		display: none;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-1-5) var(--space-3);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		border-radius: var(--radius-hairline);
		background: var(--sentiment-discrepancy-bg);
		border: 1px solid var(--sentiment-discrepancy-border);
		color: var(--sentiment-discrepancy-light);
		white-space: nowrap;
	}

	@media (min-width: 640px) {
		.discrepancy-badge {
			display: inline-flex;
		}
	}
</style>
