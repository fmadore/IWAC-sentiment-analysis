<script lang="ts">
  import '../app.postcss';
  import AppHeader from '$lib/components/ui/AppHeader.svelte';

  let { children } = $props();
</script>

<AppHeader />

{@render children()}

