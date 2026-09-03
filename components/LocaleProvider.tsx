"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "../lib/content";
import { loadLocale } from "../content/resolve";
import { readStoredLocale, writeStoredLocale } from "../lib/localePreference";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** True while a chosen locale's catalogue is still downloading. */
  loading: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Storage, or null where the browser refuses it (private window, blocked site
 *  data) or where there is no window at all, which is every server render. */
function storage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [loading, setLoading] = useState(false);

  /* Only English ships in the bundle; the rest arrive when asked for. The UI
     stays in English until the catalogue lands, which is the same fallback an
     unresolved locale already has, so nothing renders half-translated. */
  const apply = useCallback((next: Locale) => {
    if (next === "en") { setLocaleState("en"); return; }
    setLoading(true);
    void loadLocale(next)
      .then(() => setLocaleState(next))
      .finally(() => setLoading(false));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    writeStoredLocale(storage(), next);
    apply(next);
  }, [apply]);

  /* AUDIT.md F4: restore the saved choice on load. Starting at "en" and
     restoring in an effect rather than reading storage during render is
     deliberate - the server has no storage, so any other initial value would
     disagree with the server HTML and be replaced on hydration anyway. */
  useEffect(() => {
    const saved = readStoredLocale(storage());
    if (saved && saved !== "en") apply(saved);
  }, [apply]);

  /* §11.8: the lang attribute has to match what is on screen, or a screen
     reader pronounces Devanagari with an English voice. It follows the locale
     rather than the saved preference, so during the moment before a catalogue
     lands the page is still honestly declared as English. */
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, loading }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider is required.");
  return value;
}
