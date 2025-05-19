<script lang="ts">
  // import '@skeletonlabs/skeleton/themes/theme-mint.css'; // Removed JS import for theme
  // import '@skeletonlabs/skeleton/utilities/utilities.css'; // Keep this commented out/removed
  import '../app.postcss';
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar
  background="bg-sky-700"
  shadow="shadow-md"
  padding="py-2 px-4"
  spaceY="space-y-0"
  centerAlign="items-center justify-center"
>
  {#snippet headline()}
    <span class="text-white text-lg font-semibold w-full text-center block">Analyse de sentiments</span>
  {/snippet}
</AppBar>

<slot /> 