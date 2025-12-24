<script lang="ts">
  import '../app.postcss';
  import { AppHeader } from '$lib/components/layout';
  import { PWAManager } from '$lib/components';

  let { children } = $props();
</script>

<AppHeader />

{@render children()}

<PWAManager />

