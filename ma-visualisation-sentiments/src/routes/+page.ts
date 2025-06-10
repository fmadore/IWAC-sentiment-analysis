import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch }) => {
  // Plus besoin de charger le manifest, nous utilisons directement iwac_articles.json
  return {};
};