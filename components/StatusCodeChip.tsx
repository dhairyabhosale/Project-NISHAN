import { resolve } from "../content/resolve";
import type { CatalogueKey, Locale } from "../lib/content";

export function StatusCodeChip({ code, meaningKey, locale }: { code: string; meaningKey: CatalogueKey; locale: Locale }) {
  return <div className="rounded-xl bg-neutral-100 p-3"><p className="text-xs font-bold uppercase tracking-wide text-neutral-600">{resolve("blocker.raw_code", { code }, locale)}</p><p className="mt-2 text-sm font-semibold">{resolve("status.meaning", {}, locale)}: {resolve(meaningKey, {}, locale)}</p></div>;
}
