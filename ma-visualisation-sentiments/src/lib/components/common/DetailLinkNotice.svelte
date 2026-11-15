<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import ErrorNotice from './ErrorNotice.svelte';
	let { onClose }: { onClose: () => void } = $props();
</script>

<ErrorNotice message={$t.links.missing} actionLabel={$t.links.close} onAction={onClose} />
