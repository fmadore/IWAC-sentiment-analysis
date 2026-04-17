<!-- Composant JournalFilter.svelte -->
<script lang="ts">
	import { availableJournals, journalFilters } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { FilterCard, FilterChip, SearchInput } from '$lib/components/common';

	// Variables locales
	let selectedJournals = $derived($journalFilters);
	let searchTerm = $state('');
	let showAll = $state(false);
	const INITIAL_DISPLAY_COUNT = 8;

	let journals = $derived($availableJournals);

	// Filtrer les journaux selon le terme de recherche
	let filteredJournals = $derived(
		journals.filter((journal) => journal.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	// Journaux à afficher (limités ou tous selon showAll)
	let displayedJournals = $derived(
		showAll ? filteredJournals : filteredJournals.slice(0, INITIAL_DISPLAY_COUNT)
	);

	let hasMoreJournals = $derived(filteredJournals.length > INITIAL_DISPLAY_COUNT);

	function toggleJournal(journal: string) {
		const updated = selectedJournals.includes(journal)
			? selectedJournals.filter((j) => j !== journal)
			: [...selectedJournals, journal];
		journalFilters.set(updated);
	}

	function toggleShowAll() {
		showAll = !showAll;
	}

	function clearAll() {
		journalFilters.set([]);
	}
</script>

<FilterCard
	title={$t.filters.journal}
	count={journals.length}
	showClear={selectedJournals.length > 0}
	onClear={clearAll}
>
	{#snippet beforeChips()}
		<!-- Search bar -->
		{#if journals.length > 6}
			<div class="search-container">
				<SearchInput bind:value={searchTerm} placeholder={$t.filters.searchJournals} />
			</div>
		{/if}

		<!-- Results counter -->
		{#if searchTerm}
			<div class="results-count">
				{$t.filters.showingJournals}
				{filteredJournals.length}
				{$t.filters.of}
				{journals.length}
			</div>
		{/if}
	{/snippet}

	{#snippet chips()}
		{#each displayedJournals as journal (journal)}
			<FilterChip
				label={journal}
				selected={selectedJournals.includes(journal)}
				onclick={() => toggleJournal(journal)}
			/>
		{/each}
	{/snippet}

	{#snippet footer()}
		<!-- Show more/less button -->
		{#if hasMoreJournals && !searchTerm}
			<button class="toggle-btn" onclick={toggleShowAll}>
				{showAll
					? `${$t.common.viewLess} (${INITIAL_DISPLAY_COUNT})`
					: `${$t.common.viewMore} (+${filteredJournals.length - INITIAL_DISPLAY_COUNT})`}
			</button>
		{/if}
	{/snippet}
</FilterCard>

<style>
	.search-container {
		margin-bottom: var(--space-3);
	}

	.results-count {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-bottom: var(--space-2);
	}

	.toggle-btn {
		display: inline-flex;
		align-items: center;
		margin-top: var(--space-2);
		padding: var(--space-1-5) var(--space-3);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-md);
		cursor: pointer;
		background: transparent;
		border: 1px solid var(--border-default);
		color: var(--text-muted);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.toggle-btn:hover {
		background: var(--surface-subtle);
		border-color: var(--border-hover);
		color: var(--color-surface-50);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.toggle-btn {
			transition: none;
		}
	}
</style>
