import { resolve } from "../content/resolve";
import type { CatalogueKey, Locale } from "../lib/content";

export type GateState = "PASSED" | "BLOCKED" | "UNREACHED";
export function RailGate({ labelKey, state, locale }: { labelKey: CatalogueKey; state: GateState; locale: Locale }) {
  const stateKey = state === "PASSED" ? "rail.passed" : state === "BLOCKED" ? "rail.blocked" : "rail.unreached";
  const tone = state === "BLOCKED" ? "border-alert bg-red-50 text-alert" : state === "UNREACHED" ? "border-neutral-200 bg-neutral-50 text-neutral-400" : "border-neutral-300 bg-white text-ink";
  return <div className={`relative min-h-16 rounded-xl border-2 p-3 ${tone}`}><p className="font-bold">{resolve(labelKey, {}, locale)}</p><p className="mt-1 text-sm">{resolve(stateKey, {}, locale)}</p></div>;
}
