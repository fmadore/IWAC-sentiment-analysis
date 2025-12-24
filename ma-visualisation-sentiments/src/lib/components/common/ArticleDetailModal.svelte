<!--
  ArticleDetailModal Component
  
  A full-screen modal component for displaying article details with glass morphism styling.
  Uses the FullScreenModal wrapper for consistent full-screen experience.
  
  Usage:
  <ArticleDetailModal 
    article={selectedArticle} 
    open={showModal} 
    onClose={() => showModal = false} 
  />
-->
<script lang="ts">
  import type { Article } from '$lib/types/data';
  import { t } from '$lib/i18n';
  import { ArticleDetail } from '$lib/components/data-display';
  import { getJournalName } from '$lib/utils';
  import FullScreenModal from './FullScreenModal.svelte';
  import NewspaperIcon from '@lucide/svelte/icons/newspaper';

  interface ArticleDetailModalProps {
    /** The article to display */
    article: Article | null;
    /** Whether the modal is open */
    open: boolean;
    /** Callback when the modal should close */
    onClose: () => void;
  }

  let { 
    article, 
    open, 
    onClose
  }: ArticleDetailModalProps = $props();

  // Derive subtitle from article metadata
  let subtitle = $derived(
    article 
      ? `${getJournalName(article)} • ${article.publication_date ?? ''}` 
      : ''
  );
</script>

{#if article}
  <FullScreenModal 
    {open}
    {onClose}
    title={article['o:title'] ?? $t.article.titleNotAvailable}
    {subtitle}
    accentVariant="primary"
  >
    {#snippet headerIcon()}
      <NewspaperIcon size={20} class="text-primary-400" />
    {/snippet}
    
    <ArticleDetail {article} />
  </FullScreenModal>
{/if}
