import { resolve } from "../content/resolve";
import type { CatalogueKey, Locale } from "../lib/content";

export function StatusCodeChip({ code, meaningKey, locale }: { code: string; meaningKey: CatalogueKey; locale: Locale }) {
  return <div className="rounded-card border border-rule bg-cyan-pale p-3"><p className="data text-ink-soft">{resolve("blocker.raw_code", { code }, locale)}</p><p className="mt-2 text-label font-semibold text-ink">{resolve("status.meaning", {}, locale)}: {resolve(meaningKey, {}, locale)}</p></div>;
}
