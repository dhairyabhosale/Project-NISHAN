import { MoneyMarker } from "./MoneyMarker";
import { RailGate, type GateState } from "./RailGate";
import type { CatalogueKey, Locale } from "../lib/content";
import { resolve } from "../content/resolve";

// NOTE (§11.2): this is 8 gates with labels that do not match the 7-gate table in
// CLAUDE.md §11.2, and it lives here rather than in the content layer. Both are
// known divergences recorded in §13.2. Retokenised, not restructured.
const GATE_KEYS: CatalogueKey[] = [
  "rail.scheme", "rail.aadhaar", "rail.ekyc", "rail.land",
  "rail.exclusion", "rail.treasury", "rail.bank_mapping", "rail.credited"
];

// §11.3: rail line is --teal-deep above the block, --rule below it.
const DOT: Record<GateState, string> = {
  PASSED: "bg-green",
  BLOCKED: "bg-stop",
  UNREACHED: "bg-rule"
};

export function MoneyRail({ gates, blockedAtIndex, amount, locale }: { gates: GateState[]; blockedAtIndex: number; amount: number; locale: Locale }) {
  return (
    <section aria-label={resolve("case.rail_label", {}, locale)} className="mt-8">
      <ol className="space-y-2">
        {gates.map((state, index) => {
          const line = index <= blockedAtIndex ? "before:bg-teal-deep" : "before:bg-rule";
          return (
            <li
              key={GATE_KEYS[index]}
              className={`relative pl-12 before:absolute before:left-5 before:top-[-8px] before:h-[calc(100%+16px)] before:w-0.5 first:before:top-1/2 first:before:h-1/2 last:before:h-1/2 ${line}`}
            >
              <span className={`absolute left-[14px] top-6 z-10 size-4 rounded-full border-2 border-cyan-pale ${DOT[state]}`} />
              {index === blockedAtIndex && <MoneyMarker amount={amount} locale={locale} />}
              <RailGate labelKey={GATE_KEYS[index]} state={state} locale={locale} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
