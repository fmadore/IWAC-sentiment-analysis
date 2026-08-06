<script lang="ts">
	import { currentLanguage, switchLanguage, getAvailableLanguages } from '$lib/i18n';
	import { DropdownMenu } from '$lib/components/common';
	import GlobeIcon from '@lucide/svelte/icons/globe';

	let languages = getAvailableLanguages();

	// Transform languages to DropdownMenu items
	let menuItems = $derived(
		languages.map((lang) => ({
			id: lang.code,
			label: lang.name
		}))
	);

	let currentLang = $derived(languages.find((lang) => lang.code === $currentLanguage));

	function handleSelect(langCode: string) {
		switchLanguage(langCode as 'en' | 'fr');
	}
</script>

<DropdownMenu
	items={menuItems}
	selectedId={$currentLanguage}
	onSelect={handleSelect}
	menuMinWidth="120px"
	buttonMinWidth="120px"
	zIndex={1000}
	ariaLabel="Change language"
>
	{#snippet trigger()}
		<GlobeIcon size={18} />
		<span class="language-label">
			{currentLang?.name || 'Language'}
		</span>
	{/snippet}

	{#snippet itemRenderer({ item, isSelected })}
		<span class="language-name">{item.label}</span>
		{#if isSelected}
			<span class="check-mark">✓</span>
		{/if}
	{/snippet}
</DropdownMenu>

<style>
	.language-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
	}

	.language-name {
		flex: 1;
		text-align: left;
	}

	.check-mark {
		color: var(--color-success-500);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-lg);
	}

	/* Below 1024px this sits at the foot of the nav drawer rather than in the
	   header, so the label always has room and is never dropped to a bare
	   globe icon. */
	@media (min-width: 640px) {
		.language-label {
			font-size: var(--font-size-base);
		}
	}
</style>
