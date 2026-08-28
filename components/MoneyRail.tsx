import { MoneyMarker } from "./MoneyMarker";
import { RailGate, type GateState } from "./RailGate";
import type { CatalogueKey, Locale } from "../lib/content";
import { resolve } from "../content/resolve";

/* The Money Rail - CLAUDE.md §11.2. The one memorable thing; everything else on
 * screen is quiet.
 *
 * Seven gates in pipeline order, labels from the content layer. The line runs
 * --teal-deep down to the stop and --rule below it, so the eye lands on the
 * marker without being told to.
 *
 * Why a rail and not a grid of six flags: flags are the current portal's
 * information architecture restated prettily. The rail encodes what flags
 * cannot - that these are SEQUENTIAL gates, that everything above the stop
 * already worked, and that exactly one thing is in the way. */

const GATE_KEYS: CatalogueKey[] = [
  "rail.registered", "rail.eligible", "rail.identity", "rail.state_signed",
  "rail.payment_file", "rail.bank_linked", "rail.credited"
];

const DOT: Record<GateState, string> = {
  PASSED: "bg-green border-cyan-pale",
  BLOCKED: "bg-stop border-cyan-pale",
  UNREACHED: "bg-cyan-pale border-rule"
};

export function MoneyRail({
  gates,
  blockedAtIndex,
  amount,
  locale,
  credited = false
}: {
  gates: GateState[];
  blockedAtIndex: number;
  amount: string;
  locale: Locale;
  credited?: boolean;
}) {
  // B6c: every gate cleared, so the marker sits at the bottom in the cleared
  // state rather than against a shut gate. §11.2 - this is what makes "your
  // money arrived and nobody told you" land.
  const markerAt = credited ? gates.length - 1 : blockedAtIndex;

  return (
    <section aria-label={resolve("case.rail_label", {}, locale)} className="mt-10">
      <ol className="space-y-4">
        {gates.map((state, index) => {
          const beforeStop = markerAt === -1 ? index === 0 : index <= markerAt;
          return (
            <li key={GATE_KEYS[index]} className="relative pl-14">
              {/* the rail line, drawn behind the bead */}
              <span
                aria-hidden="true"
                className={`absolute left-[19px] top-[-16px] h-[calc(100%+32px)] w-[3px] ${
                  beforeStop ? "bg-teal-deep" : "bg-rule"
                } ${index === 0 ? "top-1/2 h-1/2" : ""} ${index === gates.length - 1 ? "h-1/2" : ""}`}
              />
              <span
                aria-hidden="true"
                className={`absolute left-[12px] top-7 z-10 size-[17px] rounded-full border-[3px] ${DOT[state]}`}
              />
              {index === markerAt && <MoneyMarker amount={amount} locale={locale} credited={credited} />}
              <RailGate labelKey={GATE_KEYS[index]} state={state} locale={locale} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
