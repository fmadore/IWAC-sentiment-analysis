<script lang="ts">
	import { t } from '$lib/i18n';
	let { onClose }: { onClose: () => void } = $props();
</script>

<div class="alert alert-error p-4 mb-4" role="alert">
	<p>{$t.links.missing}</p>
	<button type="button" onclick={onClose}>{$t.links.close}</button>
</div>
