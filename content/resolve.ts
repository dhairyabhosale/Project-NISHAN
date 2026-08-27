import en from "./catalogue.en.json";
import hi from "./catalogue.hi.json";
import ta from "./catalogue.ta.json";
import type { CatalogueKey, Locale, ResolvedString, Slots } from "../lib/content";

const catalogues = { en, hi, ta } as const;

/** §10.3: an unknown slot renders as an em dash, never as an empty gap and
 *  never as a crash. A sentence with a hole in it is worse than one that says
 *  plainly that a value is missing. */
export const MISSING_SLOT = "—";

/** Placeholder marker for a locale whose values have not been written yet. */
export const UNTRANSLATED = /^TODO_[A-Z]{2}:/;

/**
 * §10.2: never render a half-translated screen.
 *
 * `hi` and `ta` carry placeholder values so their key sets stay identical to
 * English, which is what lets a translator fill them in one pass. Those
 * placeholders must never reach a user: a farmer seeing "TODO_TA: Your identity
 * check is not finished" is worse served than one seeing plain English. So a
 * value that is still a placeholder falls back to English SILENTLY — the
 * language selector already tells her which locales are unresolved, and an
 * apology inside every sentence would say it twenty more times.
 */
export function resolve(key: CatalogueKey, slots: Slots = {}, locale: Locale = "en"): ResolvedString {
  const localised = catalogues[locale][key];
  const template =
    localised === undefined || UNTRANSLATED.test(localised) ? catalogues.en[key] : localised;

  if (template === undefined) return MISSING_SLOT;

  return template.replace(/\{(\w+)\}/g, (_, slot: string) => {
    const v = slots[slot];
    return v === undefined || v === null || v === "" ? MISSING_SLOT : String(v);
  });
}
