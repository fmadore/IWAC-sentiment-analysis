/**
 * Dataset State Module
 *
 * Manages dataset configuration and selection state using Svelte 5 runes.
 *
 * Two analysis generations are published. v2 is the showcased set; v1 stays
 * selectable so its URLs and figures keep resolving, but nothing offers it up
 * except the archive link in the methodology card. The active generation is
 * *derived* from the selected id rather than stored, so there is no way for a
 * generation flag and a model id to disagree.
 */

import type { AssetPath } from '$app/types';
import type { DatasetId, DatasetOption, GenerationId, ModelPair } from '#lib/types/data.js';
import { seriesColorPalette } from '#lib/utils/chartTheme.js';
import {
	assertCoversDatasetIds,
	CURRENT_GENERATION,
	DATASET_IDS,
	datasetIdsOf,
	defaultDatasetOf,
	defaultPairOf,
	generationOf,
	getPairModels,
	isDatasetId,
	isModelPair,
	modelDisplayName,
	pairIdsOf,
	type ModelNameVariant
} from '#lib/domain/sentimentContract.js';

// ============================================
// Dataset Configuration (Static)
// ============================================

/**
 * What each model needs beyond the contract: its data file, its logo and its
 * maker's brand colour. Names come from the contract (`modelDisplayName`) and
 * series colours from the categorical palette, so neither is repeated here.
 */
interface ModelAssets {
	logo: AssetPath;
	/**
	 * The maker's brand colour, for logo surrounds only. Never a data series:
	 * OpenAI's green and Mistral's red are the polarity ramp's hues, and three
	 * of the v2 brands are near-identical blues. Duplicated from the
	 * `--brand-*` tokens on purpose, because logo code cannot read CSS custom
	 * properties.
	 */
	brandColor: string;
}

const MODEL_ASSETS: Readonly<Record<DatasetId, ModelAssets>> = Object.freeze({
	chatgpt: { logo: 'logo/ChatGPT_logo.svg', brandColor: '#10a37f' },
	gemini: { logo: 'logo/Gemini_logo.svg', brandColor: '#8e75b2' },
	mistral: { logo: 'logo/Mistral_AI_logo.svg', brandColor: '#F54E42' },
	luna: { logo: 'logo/ChatGPT_logo.svg', brandColor: '#10a37f' },
	'mistral-small': { logo: 'logo/Mistral_AI_logo.svg', brandColor: '#F54E42' },
	deepseek: { logo: 'logo/DeepSeek_logo.svg', brandColor: '#4d6bfe' },
	gemma: { logo: 'logo/Gemma_logo.png', brandColor: '#338dff' },
	qwen: { logo: 'logo/Qwen_logo.png', brandColor: '#615ced' },
	haiku: { logo: 'logo/Claude_logo.svg', brandColor: '#d97757' }
});

/**
 * A model's series colour: the categorical chart palette, indexed by the
 * model's position in its generation, so a model keeps one colour on every
 * chart, card and table of the dashboard. The palette avoids the polarity reds
 * and greens by construction, so a model series never reads as a claim about
 * sentiment. The two generations reuse the same steps; they are never on
 * screen together.
 */
export function modelSeriesColor(id: DatasetId): string {
	const index = datasetIdsOf(generationOf(id)).indexOf(id);
	return seriesColorPalette[index % seriesColorPalette.length];
}

/** A model's brand colour — for logo surrounds only, never a data series. */
export function modelBrandColor(id: DatasetId): string {
	return MODEL_ASSETS[id].brandColor;
}

/** A model's logo in `static/`; render it through `asset()`. */
export function modelLogo(id: DatasetId): AssetPath {
	return MODEL_ASSETS[id].logo;
}

/**
 * A model's display name. `short` is what `name` carries and what
 * `getModelDisplayName` returns; `long` is the contract's release-tagged name.
 */
export function modelName(id: DatasetId, variant: ModelNameVariant = 'short'): string {
	return modelDisplayName(id, variant);
}

const DATASETS: DatasetOption[] = DATASET_IDS.map((id) => ({
	id,
	generation: generationOf(id),
	name: modelDisplayName(id, 'short'),
	file: `/data/iwac_sentiment_${id}.json`,
	logo: MODEL_ASSETS[id].logo,
	// `color` is the series colour every existing call site reads; the brand
	// colour is deliberately behind its own accessor.
	color: modelSeriesColor(id)
}));

assertCoversDatasetIds('MODEL_ASSETS', Object.keys(MODEL_ASSETS));

// ============================================
// Svelte 5 Runes State
// ============================================

let _selectedDataset = $state<DatasetId>(defaultDatasetOf(CURRENT_GENERATION));
let _comparisonMode = $state<boolean>(false);
let _comparisonPair = $state<ModelPair>(defaultPairOf(CURRENT_GENERATION));

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * Dataset state object with reactive getters and setters.
 * Use this API for new code.
 *
 * @example
 * // Read state
 * const current = datasetState.selected;
 *
 * // Write state
 * datasetState.selected = 'luna';
 *
 * // Get dataset config
 * const config = datasetState.getById('luna');
 */
export const datasetState = {
	// Every dataset of every generation. Pickers should use `availableInGeneration`
	// instead, so the archived models stay out of the way.
	get available(): DatasetOption[] {
		return DATASETS;
	},

	/** The datasets a picker should offer: those of the active generation. */
	get availableInGeneration(): DatasetOption[] {
		const ids = datasetIdsOf(this.generation);
		return DATASETS.filter((dataset) => ids.includes(dataset.id));
	},

	/** The pair ids a picker should offer, in contract order. */
	get pairsInGeneration(): readonly ModelPair[] {
		return pairIdsOf(this.generation);
	},

	/**
	 * The generation currently on screen, derived from whichever id is in play.
	 * Comparison mode is driven by the pair, every other view by the dataset.
	 */
	get generation(): GenerationId {
		return generationOf(_comparisonMode ? _comparisonPair : _selectedDataset);
	},

	/** True while the archived analysis is being shown. */
	get isArchived(): boolean {
		return this.generation !== CURRENT_GENERATION;
	},

	// Selected dataset. The getter is narrowed to the DatasetId union; the
	// Invalid external values are rejected at their parsing boundary.
	get selected(): DatasetId {
		return _selectedDataset;
	},
	set selected(value: DatasetId) {
		if (!isDatasetId(value)) throw new Error(`Unknown dataset: ${value}`);
		_selectedDataset = value;
	},

	// Comparison mode
	get isComparisonMode() {
		return _comparisonMode;
	},
	set isComparisonMode(value: boolean) {
		if (value === _comparisonMode) return;
		// Carry the generation across the mode switch. Without this, entering
		// comparison from an archived model would silently jump to the current
		// generation's default pair, and leaving it would jump back.
		if (value) {
			if (generationOf(_comparisonPair) !== generationOf(_selectedDataset)) {
				_comparisonPair = defaultPairOf(generationOf(_selectedDataset));
			}
		} else if (generationOf(_selectedDataset) !== generationOf(_comparisonPair)) {
			_selectedDataset = getPairModels(_comparisonPair)[0];
		}
		_comparisonMode = value;
	},
	toggleComparisonMode() {
		this.isComparisonMode = !_comparisonMode;
	},

	/**
	 * The active model pair, always of the generation on screen.
	 *
	 * The stored pair can belong to the other generation, because outside
	 * comparison mode the generation follows `_selectedDataset` and nothing
	 * reconciles the two — `set isComparisonMode` only does it on the mode
	 * switch. That left the agreement view, which is not comparison mode but
	 * reads this pair, asking for a v2 pair while the v1 corpora were the ones
	 * being loaded: its models were never present, `pairAgreement` returned null,
	 * and the whole archived view sat in its loading state forever.
	 *
	 * Answering with the active generation's default makes "the pair belongs to
	 * the generation on screen" true by construction instead of by whoever
	 * remembers to reconcile it. Inside comparison mode the generation is derived
	 * FROM this pair, so the guard can never fire there.
	 */
	get pair(): ModelPair {
		return generationOf(_comparisonPair) === this.generation
			? _comparisonPair
			: defaultPairOf(this.generation);
	},
	set pair(value: ModelPair) {
		if (!isModelPair(value)) throw new Error(`Unknown model pair: ${value}`);
		_comparisonPair = value;
	},

	/**
	 * Switch the whole dashboard to another generation, keeping the current
	 * mode. Used by the archive link and by the "back to current" control.
	 */
	setGeneration(generation: GenerationId) {
		_comparisonPair = defaultPairOf(generation);
		_selectedDataset = defaultDatasetOf(generation);
	},

	// Utility: Get dataset by ID
	getById(id: string): DatasetOption | undefined {
		return DATASETS.find((d) => d.id === id);
	},

	// Utility: Get current dataset config
	get current(): DatasetOption | undefined {
		return DATASETS.find((d) => d.id === _selectedDataset);
	}
};
