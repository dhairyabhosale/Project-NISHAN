"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Locale } from "../lib/content";
import { loadLocale } from "../content/resolve";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** True while a chosen locale's catalogue is still downloading. */
  loading: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [loading, setLoading] = useState(false);

  /* Only English ships in the bundle; the rest arrive when asked for. The UI
     stays in English until the catalogue lands, which is the same fallback an
     unresolved locale already has, so nothing renders half-translated. */
  const setLocale = useCallback((next: Locale) => {
    if (next === "en") { setLocaleState("en"); return; }
    setLoading(true);
    void loadLocale(next)
      .then(() => setLocaleState(next))
      .finally(() => setLoading(false));
  }, []);

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
