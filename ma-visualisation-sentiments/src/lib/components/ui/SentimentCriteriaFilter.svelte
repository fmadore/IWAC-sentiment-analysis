<!-- Composant SentimentCriteriaFilter.svelte --> 
<script lang="ts">
  import { polarityFilter, subjectivityFilterRange } from '$lib/stores.ts'; // Ajustez chemin
  import PolarityFilter from './PolarityFilter.svelte';
  import SubjectivityFilter from './SubjectivityFilter.svelte';

  const allPolarities = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];
  // Pour le score de subjectivité, un simple input range ou deux inputs number
  let minSubjectivity = $subjectivityFilterRange ? $subjectivityFilterRange[0] : 1;
  let maxSubjectivity = $subjectivityFilterRange ? $subjectivityFilterRange[1] : 5;

  function updateSubjectivity() {
      subjectivityFilterRange.set([minSubjectivity, maxSubjectivity]);
  }

  // Gérer la sélection des polarités avec des checkboxes
  function handlePolarityChange(event: Event) {
      const target = event.target as HTMLInputElement;
      const polarity = target.value;
      const checked = target.checked;
      if (checked) {
          polarityFilter.update((current: string[]) => [...current, polarity]);
      } else {
          polarityFilter.update((current: string[]) => current.filter((p: string) => p !== polarity));
      }
  }
</script>

<div class="sentiment-criteria-filters">
  <PolarityFilter />
  <SubjectivityFilter />
</div>

<style>
  .sentiment-criteria-filters {
    /* Add any desired layout styles for the group here */
    /* For example, if you want them side-by-side in a flex container on wider screens */
    /* display: flex; */
    /* gap: 20px; */
    /* flex-wrap: wrap; */
  }
</style> 