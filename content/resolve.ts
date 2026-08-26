import en from "./catalogue.en.json";
import hi from "./catalogue.hi.json";
import ta from "./catalogue.ta.json";
import type { CatalogueKey, Locale, ResolvedString, Slots } from "../lib/content";

const catalogues = { en, hi, ta } as const;

export function resolve(key: CatalogueKey, slots: Slots = {}, locale: Locale = "en"): ResolvedString {
  const template = catalogues[locale][key] ?? catalogues.en[key];
  return template.replace(/\{(\w+)\}/g, (_, slot: string) => String(slots[slot] ?? ""));
}
