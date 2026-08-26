"use client";

import { resolve } from "../content/resolve";
import { useLocale } from "./LocaleProvider";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  return <fieldset className="flex min-h-12 items-center gap-1 rounded-full border border-stone bg-white p-1"><legend className="sr-only">{resolve("language.label", {}, locale)}</legend>{(["en", "hi", "ta"] as const).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} aria-pressed={locale === item} className={`min-h-10 rounded-full px-3 text-sm font-bold ${locale === item ? "bg-ink text-white" : "text-ink"}`}>{resolve(`language.${item}`, {}, locale)}</button>)}</fieldset>;
}
