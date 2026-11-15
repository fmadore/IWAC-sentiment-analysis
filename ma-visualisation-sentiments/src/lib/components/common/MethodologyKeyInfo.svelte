<!--
  MethodologyKeyInfo

  The row of key-fact cards at the top of an arbiter methodology card (blind
  evaluation, full text, independent verdict…). Shared by the archived and the
  panel arbiter cards, which each pass their own facts; the two had carried the
  same grid and card CSS with drifted colours.

  The card title is the methodology card's `h2`, so each fact is an `h3`.
-->
<script lang="ts" module>
	import type { Component } from 'svelte';

	export interface KeyInfoItem {
		icon: Component<{ size?: number | string }>;
		/** Tint of the icon tile. */
		tone: 'blind' | 'arbiter' | 'positive';
		title: string;
		description: string;
	}
</script>

<script lang="ts">
	let { items }: { items: KeyInfoItem[] } = $props();
</script>

<div class="key-info-grid">
	{#each items as item (item.title)}
		<div class="key-info-card">
			<div class="key-info-icon" data-tone={item.tone} aria-hidden="true">
				<item.icon size={20} />
			</div>
			<div>
				<h3 class="key-info-title">{item.title}</h3>
				<p class="key-info-desc">{item.description}</p>
			</div>
		</div>
	{/each}
</div>

<style>
	.key-info-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.key-info-card {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	.key-info-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-panel);
		flex-shrink: 0;
	}

	.key-info-icon[data-tone='blind'] {
		background: var(--sentiment-subjectivity-3-bg);
		border: 1px solid var(--sentiment-subjectivity-3-border);
		color: var(--sentiment-subjectivity-3);
	}

	.key-info-icon[data-tone='arbiter'] {
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter);
	}

	.key-info-icon[data-tone='positive'] {
		background: var(--sentiment-polarity-very-positive-bg);
		border: 1px solid var(--sentiment-polarity-very-positive-border);
		color: var(--sentiment-polarity-positive);
	}

	.key-info-title {
		margin: 0 0 var(--space-1);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.key-info-desc {
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: var(--line-height-snug);
	}

	@media (min-width: 640px) {
		.key-info-grid {
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		}
	}
</style>
