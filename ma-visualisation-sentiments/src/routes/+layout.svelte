<script lang="ts">
  // import '@skeletonlabs/skeleton/themes/theme-mint.css'; // Removed JS import for theme
  // import '@skeletonlabs/skeleton/utilities/utilities.css'; // Keep this commented out/removed
  import '../app.postcss';
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar
  background="bg-gradient-to-r from-primary-700 to-tertiary-700"
  shadow="shadow-xl"
  padding="py-3 px-4"
  spaceY="space-y-0"
  centerAlign="items-center justify-center"
  classes="sticky top-0 z-10"
>
  {#snippet headline()}
    <div class="flex flex-col">
      <span class="text-white text-2xl font-bold w-full text-center block">Analyse de sentiments</span>
      <span class="text-white/80 text-sm w-full text-center block">Visualisation et exploration des données d'articles</span>
    </div>
  {/snippet}
</AppBar>

<slot />

<style>
  :global(.app-bar) {
    background-image: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    backdrop-filter: blur(4px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
</style> 