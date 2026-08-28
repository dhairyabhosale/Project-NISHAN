import en from "./catalogue.en.json";
import type { CatalogueKey, Locale, ResolvedString, Slots } from "../lib/content";

/* Only English is bundled. §11.9 caps the primary path at 150KB of JS, and
 * four full catalogues is roughly 100KB of JSON on its own - the target user is
 * on 2G and should not download Tamil to read English.
 *
 * Other locales are fetched on demand when one is chosen, and registered here.
 * resolve() stays SYNCHRONOUS because it is called from every render path;
 * until a locale finishes loading it falls back to English, which is the same
 * behaviour an unresolved locale already has. */

type Catalogue = Record<string, string>;

const loaded: Partial<Record<Locale, Catalogue>> = { en: en as Catalogue };

export function isLocaleLoaded(locale: Locale): boolean {
  return loaded[locale] !== undefined;
}

export async function loadLocale(locale: Locale): Promise<void> {
  if (loaded[locale]) return;
  switch (locale) {
    case "hi": loaded.hi = (await import("./catalogue.hi.json")).default as Catalogue; return;
    case "ta": loaded.ta = (await import("./catalogue.ta.json")).default as Catalogue; return;
    case "mr": loaded.mr = (await import("./catalogue.mr.json")).default as Catalogue; return;
    default: return;
  }
}

/** §10.3: an unknown slot renders as a dash, never as an empty gap and never as
 *  a crash. A sentence with a hole in it is worse than one that says plainly
 *  that a value is missing. */
export const MISSING_SLOT = "-";

/** Placeholder marker for a locale whose values have not been written yet. */
export const UNTRANSLATED = /^TODO_[A-Z]{2}:/;

/**
 * §10.2: never render a half-translated screen.
 *
 * A value that is still a placeholder falls back to English SILENTLY - the
 * language selector already tells the user which locales are unresolved, and an
 * apology inside every sentence would repeat it twenty times per screen.
 */
export function resolve(key: CatalogueKey, slots: Slots = {}, locale: Locale = "en"): ResolvedString {
  const localised = loaded[locale]?.[key];
  const template =
    localised === undefined || UNTRANSLATED.test(localised) ? (en as Catalogue)[key] : localised;

  if (template === undefined) return MISSING_SLOT;

  return template.replace(/\{(\w+)\}/g, (_, slot: string) => {
    const v = slots[slot];
    return v === undefined || v === null || v === "" ? MISSING_SLOT : String(v);
  });
}
