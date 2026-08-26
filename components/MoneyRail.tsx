import { MoneyMarker } from "./MoneyMarker";
import { RailGate, type GateState } from "./RailGate";
import type { CatalogueKey, Locale } from "../lib/content";
import { resolve } from "../content/resolve";

const GATE_KEYS: CatalogueKey[] = ["rail.scheme", "rail.aadhaar", "rail.ekyc", "rail.land", "rail.exclusion", "rail.treasury", "rail.bank_mapping", "rail.credited"];
export function MoneyRail({ gates, blockedAtIndex, amount, locale }: { gates: GateState[]; blockedAtIndex: number; amount: number; locale: Locale }) {
  return <section aria-label={resolve("case.rail_label", {}, locale)} className="mt-8"><div className="space-y-2">{gates.map((state, index) => <div key={GATE_KEYS[index]} className="relative pl-12 before:absolute before:left-5 before:top-[-8px] before:h-[calc(100%+16px)] before:w-0.5 before:bg-neutral-300 first:before:top-1/2 first:before:h-1/2 last:before:h-1/2"><span className={`absolute left-[14px] top-6 z-10 size-4 rounded-full border-2 border-white ${state === "BLOCKED" ? "bg-alert" : state === "UNREACHED" ? "bg-neutral-300" : "bg-ink"}`}/>{index === blockedAtIndex && <MoneyMarker amount={amount} locale={locale}/>}<RailGate labelKey={GATE_KEYS[index]} state={state} locale={locale}/></div>)}</div></section>;
}
