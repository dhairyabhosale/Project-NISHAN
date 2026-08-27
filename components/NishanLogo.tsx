import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

export function NishanLogo({ locale }: { locale: Locale }) {
  return <div className="flex items-center gap-2" aria-label={resolve("logo.label", {}, locale)}><svg aria-hidden="true" width="33" height="33" viewBox="0 0 33 33" fill="none"><path d="M5 28 15 5l13 23" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/><circle cx="15" cy="5" r="3" fill="currentColor"/></svg><div><p className="text-lg font-black leading-none">{resolve("logo.label", {}, locale)}</p><p className="mt-1 text-[11px] opacity-90">{resolve("logo.tagline", {}, locale)}</p></div></div>;
}
