import { MoneyMarker } from "./MoneyMarker";
import { RailGate, type GateState } from "./RailGate";
import type { CatalogueKey, Locale } from "../lib/content";
import { resolve } from "../content/resolve";

// §11.2's seven gates, in pipeline order. The order comes from RAIL_GATES in the
// type layer; these are only the catalogue keys that label them, so the gate
// taxonomy has one home and the labels have another.
const GATE_KEYS: CatalogueKey[] = [
  "rail.registered", "rail.eligible", "rail.identity", "rail.state_signed",
  "rail.payment_file", "rail.bank_linked", "rail.credited"
];

// §11.3: rail line is --teal-deep above the block, --rule below it.
const DOT: Record<GateState, string> = {
  PASSED: "bg-green",
  BLOCKED: "bg-stop",
  UNREACHED: "bg-rule"
};

export function MoneyRail({ gates, blockedAtIndex, amount, locale }: { gates: GateState[]; blockedAtIndex: number; amount: string; locale: Locale }) {
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
