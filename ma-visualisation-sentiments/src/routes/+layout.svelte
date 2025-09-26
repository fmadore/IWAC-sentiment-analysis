<script lang="ts">
  import '../app.postcss';
  import AppHeader from '$lib/components/ui/AppHeader.svelte';
  import PWAManager from '$lib/components/PWAManager.svelte';

  let { children } = $props();
</script>

<AppHeader />

{@render children()}

<PWAManager />

