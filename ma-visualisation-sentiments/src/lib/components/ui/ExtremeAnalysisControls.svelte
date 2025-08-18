<script lang="ts">
  import { t } from '$lib/i18n';
  import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';

  // Props
  interface Props {
    selectedCategory: ExtremeCategory;
    selectedKeywordType: KeywordType;
    showTopN: number;
    onCategoryChange: (category: ExtremeCategory) => void;
    onKeywordTypeChange: (type: KeywordType) => void;
    onTopNChange: (value: number) => void;
  }

  let { 
    selectedCategory, 
    selectedKeywordType, 
    showTopN, 
    onCategoryChange,
    onKeywordTypeChange,
    onTopNChange
  }: Props = $props();

  // Handle category change
  function handleCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onCategoryChange(target.value as ExtremeCategory);
  }

  // Handle keyword type change  
  function handleKeywordTypeChange(type: KeywordType) {
    onKeywordTypeChange(type);
  }

  // Handle number change
  function handleTopNChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onTopNChange(parseInt(target.value, 10));
  }
</script>

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white responsive-title">Contrôles d'analyse</h3>
  
  <div class="controls-grid">
    <!-- Category Select -->
    <div class="control-group">
      <label for="category-select" class="control-label">
        {$t.extremeAnalysis.selectCategory}
      </label>
      <select
        id="category-select"
        bind:value={selectedCategory}
        onchange={handleCategoryChange}
        class="select-input glass-medium"
      >
        <option value="subjectivity_extreme_high">
          {$t.extremeAnalysis.categories.subjectivityHigh}
        </option>
        <option value="subjectivity_extreme_low">
          {$t.extremeAnalysis.categories.subjectivityLow}
        </option>
        <option value="polarity_very_negative">
          {$t.extremeAnalysis.categories.polarityNegative}
        </option>
        <option value="polarity_very_positive">
          {$t.extremeAnalysis.categories.polarityPositive}
        </option>
        <option value="centrality_very_central">
          {$t.extremeAnalysis.categories.centralityHigh}
        </option>
        <option value="centrality_not_central">
          {$t.extremeAnalysis.categories.centralityLow}
        </option>
      </select>
    </div>

    <!-- Keyword Type Toggle -->
    <div class="control-group">
      <span class="control-label" id="keyword-type-label">
        {$t.extremeAnalysis.selectKeywordType}
      </span>
      <div class="btn-group-toggle">
        <button
          class="btn-toggle hover-lift {selectedKeywordType === 'subject' ? 'active' : ''}"
          onclick={() => handleKeywordTypeChange('subject')}
          aria-pressed={selectedKeywordType === 'subject'}
        >
          {$t.extremeAnalysis.subjectKeywords}
        </button>
        <button
          class="btn-toggle hover-lift {selectedKeywordType === 'spatial' ? 'active' : ''}"
          onclick={() => handleKeywordTypeChange('spatial')}
          aria-pressed={selectedKeywordType === 'spatial'}
        >
          {$t.extremeAnalysis.spatialKeywords}
        </button>
      </div>
    </div>

    <!-- Keywords Count -->
    <div class="control-group">
      <label for="keywords-count" class="control-label">
        {$t.extremeAnalysis.numberOfKeywords || 'Number of Keywords'}
      </label>
      <input
        id="keywords-count"
        type="number"
        min="5"
        max="25"
        bind:value={showTopN}
        onchange={handleTopNChange}
        class="number-input glass-medium"
      />
    </div>
  </div>
</div>

<style>
  /* Controls Grid */
  .controls-grid {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr;
    gap: 2rem;
    align-items: flex-end;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  /* Select Input */
  .select-input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    min-height: 42px;
    width: 100%;
    cursor: pointer;
    outline: none;
  }

  .select-input:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .select-input:focus {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Fix dropdown options styling */
  .select-input option {
    background: #1e293b;
    color: white;
    padding: 0.5rem;
    border: none;
  }

  .select-input option:hover {
    background: #334155;
  }

  .select-input option:checked {
    background: #3b82f6;
    color: white;
  }

  /* Button Toggle Group */
  .btn-group-toggle {
    display: flex;
    gap: 0;
    border-radius: 0.5rem;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .btn-toggle {
    flex: 1;
    padding: 0.625rem 1rem;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .btn-toggle:not(:last-child) {
    border-right: 1px solid rgba(255, 255, 255, 0.15);
  }

  .btn-toggle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .btn-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn-toggle:hover::before {
    opacity: 1;
  }

  .btn-toggle.active {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.2));
    color: white;
    font-weight: 600;
  }

  /* Number Input */
  .number-input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    min-height: 42px;
    width: 100%;
    max-width: 120px;
    outline: none;
  }

  .number-input:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .number-input:focus {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Chrome, Safari, Edge, Opera */
  .number-input::-webkit-outer-spin-button,
  .number-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  .number-input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  /* Glass Effects */
  :global(.glass-medium) {
    backdrop-filter: blur(12px);
  }

  /* Hover Lift Effect */
  :global(.hover-lift) {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  :global(.hover-lift:hover) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  /* Card Styles */
  :global(.card) {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    transition: all 0.3s ease;
  }

  :global(.card:hover) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }

  /* Responsive title adjustments */
  .responsive-title {
    @media (max-width: 768px) {
      font-size: 1rem !important;
      margin-bottom: 0.75rem !important;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9rem !important;
      margin-bottom: 0.5rem !important;
    }
  }

  /* Mobile Responsiveness */
  @media (max-width: 1024px) {
    .controls-grid {
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .control-group:last-child {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .number-input {
      max-width: 120px;
    }
  }

  @media (max-width: 768px) {
    .controls-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .control-group {
      width: 100%;
    }

    .control-label {
      font-size: 0.8125rem;
    }

    .select-input,
    .btn-toggle,
    .number-input {
      font-size: 0.8125rem;
      padding: 0.5rem 0.75rem;
      min-height: 38px;
    }

    .number-input {
      max-width: 100px;
    }
  }

  @media (max-width: 480px) {
    .controls-grid {
      gap: 0.75rem;
    }

    .control-label {
      font-size: 0.75rem;
    }

    .select-input,
    .btn-toggle,
    .number-input {
      font-size: 0.75rem;
      padding: 0.375rem 0.625rem;
      min-height: 34px;
    }
  }

  /* Large Screens */
  @media (min-width: 1200px) {
    .controls-grid {
      gap: 2rem;
    }
  }
</style>
