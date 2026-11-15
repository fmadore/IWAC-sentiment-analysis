<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import ErrorNotice from './ErrorNotice.svelte';
</script>

<ErrorNotice
	message={$t.audit.viewLoadError}
	actionLabel={$t.audit.reload}
	onAction={() => window.location.reload()}
/>
