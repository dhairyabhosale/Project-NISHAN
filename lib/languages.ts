/* The language set pmkisan.gov.in offers - CLAUDE.md §10.2.
 *
 * The SELECTOR covers the full set. The TRANSLATIONS do not: English, Hindi,
 * Marathi and Tamil resolve fully; every other option says so in the selector
 * itself.
 *
 * A farmer who sees her language listed and then gets a half-English screen is
 * worse served than one who sees it listed as coming. The selector is honest
 * about its own state, which is the same principle that governs /whats-real. */

import type { Locale } from "./content";

export interface Language {
  /** ISO 639-1 code. */
  code: string;
  /** Name in English, so a helper scanning the list can find it. */
  english: string;
  /** Endonym, in its own script - how a speaker recognises her own language. */
  endonym: string;
  /** True only where every string resolves. */
  resolved: boolean;
}

export const LANGUAGES: readonly Language[] = [
  { code: "en", english: "English", endonym: "English", resolved: true },
  { code: "hi", english: "Hindi", endonym: "हिन्दी", resolved: true },
  { code: "mr", english: "Marathi", endonym: "मराठी", resolved: true },
  { code: "ta", english: "Tamil", endonym: "தமிழ்", resolved: true },
  { code: "as", english: "Assamese", endonym: "অসমীয়া", resolved: false },
  { code: "bn", english: "Bengali", endonym: "বাংলা", resolved: false },
  { code: "gu", english: "Gujarati", endonym: "ગુજરાતી", resolved: false },
  { code: "kn", english: "Kannada", endonym: "ಕನ್ನಡ", resolved: false },
  { code: "ml", english: "Malayalam", endonym: "മലയാളം", resolved: false },
  { code: "ne", english: "Nepali", endonym: "नेपाली", resolved: false },
  { code: "or", english: "Odia", endonym: "ଓଡ଼ିଆ", resolved: false },
  { code: "pa", english: "Punjabi", endonym: "ਪੰਜਾਬੀ", resolved: false },
  { code: "te", english: "Telugu", endonym: "తెలుగు", resolved: false },
  { code: "ur", english: "Urdu", endonym: "اردو", resolved: false }
];

/** Locales the catalogue actually carries a key set for. */
export const CATALOGUE_LOCALES: readonly Locale[] = ["en", "hi", "ta", "mr"];

export function isResolved(code: string): boolean {
  return LANGUAGES.find((l) => l.code === code)?.resolved === true;
}

/** Only a resolved locale changes what renders; everything else stays English
 *  and the selector says so. */
export function localeFor(code: string): Locale {
  return isResolved(code) ? (code as Locale) : "en";
}
