<script lang="ts">
  // import '@skeletonlabs/skeleton/themes/theme-mint.css'; // Removed JS import for theme
  // import '@skeletonlabs/skeleton/utilities/utilities.css'; // Keep this commented out/removed
  import '../app.postcss';
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
  import FullscreenIcon from '@lucide/svelte/icons/maximize';
  import MinimizeIcon from '@lucide/svelte/icons/minimize';
  import { onMount } from 'svelte';

  let { children } = $props();
  let isFullscreen = $state(false);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  onMount(() => {
    // Listen for fullscreen change events
    document.addEventListener('fullscreenchange', () => {
      isFullscreen = !!document.fullscreenElement;
    });
  });
</script>

<AppBar
  background="bg-gradient-to-r from-primary-700 to-tertiary-700"
  shadow="shadow-xl"
  padding="py-3 px-4"
  classes="sticky top-0 z-10"
>
  {#snippet headline()}
    <div class="w-full flex items-center">
      <div class="flex-1 flex justify-end">
        <div class="flex-none w-10"></div>
      </div>
      <div class="flex-1 flex justify-center">
        <div class="flex flex-col items-center">
          <span class="text-white text-lg sm:text-2xl font-bold">Analyse de sentiments</span>
          <span class="text-white/80 text-xs sm:text-sm hidden sm:block">Visualisation et exploration des données d'articles</span>
        </div>
      </div>
      <div class="flex-1 flex justify-end">
        <button
          class="btn-icon variant-ghost-surface self-center"
          onclick={toggleFullscreen}
          title={isFullscreen ? "Quitter le mode plein écran" : "Passer en plein écran"}
        >
          {#if isFullscreen}
            <MinimizeIcon class="text-white" size={20} />
          {:else}
            <FullscreenIcon class="text-white" size={20} />
          {/if}
        </button>
      </div>
    </div>
  {/snippet}

  {#snippet trail()}
    <!-- Vide car bouton dans headline -->
  {/snippet}
</AppBar>

{@render children()}

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

  :global(.btn-icon) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    transition: all 0.2s;
  }

  :global(.btn-icon:hover) {
    background-color: rgba(255, 255, 255, 0.1);
  }
</style>