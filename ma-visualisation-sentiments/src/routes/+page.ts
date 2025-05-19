import type { PageLoad } from './$types.js';
import type { DatasetInfo, Article, Dataset } from '$lib/types/data'; // Ajustez le chemin

export const load: PageLoad = async ({ fetch }) => {
  try {
    const manifestResponse = await fetch('/data/manifest.json'); // SvelteKit fetch peut accéder à static
    if (!manifestResponse.ok) {
      throw new Error('Failed to load manifest');
    }
    const availableDatasets: DatasetInfo[] = await manifestResponse.json();
    return {
      availableDatasets
    };
  } catch (error) {
    console.error("Error loading manifest:", error);
    return {
      availableDatasets: [],
      error: "Could not load dataset list."
    };
  }
};