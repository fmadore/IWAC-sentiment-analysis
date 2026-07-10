/**
 * i18n types — derived, not hand-maintained.
 *
 * The English catalog is the single source of truth for the translation
 * shape. `fr.ts` is annotated with `Translations`, so a key missing from
 * (or added to only one of) the catalogs is a compile error instead of a
 * silent runtime fallback. Add new strings to en.ts and fr.ts only.
 */
import type { en } from './en.js';

export type Translations = typeof en;
