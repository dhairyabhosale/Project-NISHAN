"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Locale } from "../lib/content";

interface LocaleContextValue { locale: Locale; setLocale: (locale: Locale) => void; }
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider is required.");
  return value;
}
