import en from "./catalogue.en.json";
import hi from "./catalogue.hi.json";
import ta from "./catalogue.ta.json";
import type { CatalogueKey, Locale, ResolvedString, Slots } from "../lib/content";

const catalogues = { en, hi, ta } as const;

/** §10.3: an unknown slot renders as an em dash, never as an empty gap and
 *  never as a crash. A sentence with a hole in it is worse than one that says
 *  plainly that a value is missing. */
export const MISSING_SLOT = "—";

export function resolve(key: CatalogueKey, slots: Slots = {}, locale: Locale = "en"): ResolvedString {
  const template = catalogues[locale][key] ?? catalogues.en[key];
  if (template === undefined) return MISSING_SLOT;
  return template.replace(/\{(\w+)\}/g, (_, slot: string) => {
    const v = slots[slot];
    return v === undefined || v === null || v === "" ? MISSING_SLOT : String(v);
  });
}
