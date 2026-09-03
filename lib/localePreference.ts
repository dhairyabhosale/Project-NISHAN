/* AUDIT.md F4 - the language choice has to survive a page load.
 *
 * It used to live in React state alone, so picking हिन्दी and then following any
 * link put the reader back in English. /whats-real claims Hindi and Marathi are
 * fully resolved, and a claim the product contradicts on the next click reads
 * as a false claim rather than a rough edge.
 *
 * WHY localStorage AND NOT A COOKIE, given a cookie could be read on the server
 * and let the HTML arrive already translated:
 *
 *   The Hindi catalogue is 111KB and Marathi 114KB. Serialising one into every
 *   response would put that on the wire on every page load, uncached, for a
 *   reader §5.1 places on 2G. The same bytes fetched as a chunk are downloaded
 *   once and cached for the rest of the session. Same payload, paid once
 *   instead of every navigation, and it does not block first paint.
 *
 *   The cost of that choice, stated rather than hidden: the server HTML is
 *   English, so a returning Hindi reader sees English for the moment before the
 *   catalogue lands, and a reader with no JavaScript at all gets English. The
 *   language selector already declares which locales resolve; it does not
 *   promise server-side rendering of them.
 *
 * §12.5 also already commits to "language preference (localStorage only)", so
 * this keeps the build and its data policy in step.
 *
 * The logic is here, as pure functions over a Storage-like object, so it can be
 * tested without a browser - which is the F17 lesson applied.
 */

import type { Locale } from "./content";
import { CATALOGUE_LOCALES } from "./languages";

export const LOCALE_STORAGE_KEY = "nishan.locale";

/** The subset of Storage this needs. Lets a test pass a plain object, and lets
 *  the caller pass window.localStorage without a cast. */
export interface LocaleStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isLocale(value: string): value is Locale {
  return (CATALOGUE_LOCALES as readonly string[]).includes(value);
}

/**
 * The stored preference, or null if there isn't a usable one.
 *
 * Every failure returns null rather than throwing. Storage access itself throws
 * in a private window and wherever site data is blocked, and a reader whose
 * browser refuses storage should still get a working page in English.
 */
export function readStoredLocale(store: LocaleStore | null | undefined): Locale | null {
  if (!store) return null;
  try {
    const raw = store.getItem(LOCALE_STORAGE_KEY);
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return isLocale(trimmed) ? trimmed : null;
  } catch {
    return null;
  }
}

/** Persist a choice. Silently does nothing where storage is unavailable: a
 *  preference that cannot be saved is not worth failing a click over. */
export function writeStoredLocale(store: LocaleStore | null | undefined, locale: Locale): void {
  if (!store) return;
  try {
    store.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* private window, or site data blocked */
  }
}
