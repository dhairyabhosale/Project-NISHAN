import { resolve } from "../content/resolve";
import type { CatalogueKey, Locale } from "../lib/content";

export function BlockerCard({ causeKey, actionKey, ownerKey, slaDays, locale }: { causeKey: CatalogueKey; actionKey: CatalogueKey; ownerKey: CatalogueKey; slaDays: number; locale: Locale }) {
  return <section className="mt-8 rounded-card border-2 border-rule bg-paper p-5"><h2 className="text-head font-semibold text-ink">{resolve("blocker.title", {}, locale)}</h2><dl className="mt-4 space-y-4"><div><dt className="text-label font-semibold text-ink-soft">{resolve("blocker.cause", {}, locale)}</dt><dd className="mt-1">{resolve(causeKey, {}, locale)}</dd></div><div><dt className="text-label font-semibold text-ink-soft">{resolve("blocker.action", {}, locale)}</dt><dd className="mt-1">{resolve(actionKey, {}, locale)}</dd></div><div><dt className="text-label font-semibold text-ink-soft">{resolve("blocker.owner", {}, locale)}</dt><dd className="mt-1">{resolve(ownerKey, {}, locale)}</dd></div></dl><p className="mt-5 border-t border-rule pt-4 font-bold text-ink">{resolve("blocker.sla", { days: slaDays }, locale)}</p></section>;
}
