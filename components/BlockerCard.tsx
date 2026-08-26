import { resolve } from "../content/resolve";
import type { CatalogueKey, Locale } from "../lib/content";

export function BlockerCard({ causeKey, actionKey, ownerKey, slaDays, locale }: { causeKey: CatalogueKey; actionKey: CatalogueKey; ownerKey: CatalogueKey; slaDays: number; locale: Locale }) {
  return <section className="mt-8 rounded-2xl border-2 border-alert bg-red-50 p-5"><h2 className="text-xl font-black text-alert">{resolve("blocker.title", {}, locale)}</h2><dl className="mt-4 space-y-4"><div><dt className="text-sm font-bold">{resolve("blocker.cause", {}, locale)}</dt><dd className="mt-1">{resolve(causeKey, {}, locale)}</dd></div><div><dt className="text-sm font-bold">{resolve("blocker.action", {}, locale)}</dt><dd className="mt-1">{resolve(actionKey, {}, locale)}</dd></div><div><dt className="text-sm font-bold">{resolve("blocker.owner", {}, locale)}</dt><dd className="mt-1">{resolve(ownerKey, {}, locale)}</dd></div></dl><p className="mt-5 border-t border-red-200 pt-4 font-bold">{resolve("blocker.sla", { days: slaDays }, locale)}</p></section>;
}
