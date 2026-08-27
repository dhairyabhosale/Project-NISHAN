import { resolve } from "../content/resolve";
import type { CatalogueKey, Locale } from "../lib/content";

export type GateState = "PASSED" | "BLOCKED" | "UNREACHED";

// §11.3 Money Rail colour mapping. §11.8: every state carries an icon AND a text
// label — colour never carries meaning alone. The check is --ink, not white:
// white on --green is 2.78:1, below the 3:1 floor for graphical objects.
const TONE: Record<GateState, string> = {
  PASSED: "border-green bg-green text-ink",
  BLOCKED: "border-stop bg-stop text-paper",
  UNREACHED: "border-rule bg-transparent text-ink-soft"
};

const STATE_KEY: Record<GateState, CatalogueKey> = {
  PASSED: "rail.passed",
  BLOCKED: "rail.blocked",
  UNREACHED: "rail.unreached"
};

function GateIcon({ state }: { state: GateState }) {
  const common = { width: 20, height: 20, viewBox: "0 0 20 20", "aria-hidden": true as const, fill: "none" };
  if (state === "PASSED") {
    return <svg {...common} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5 8 14.5 16 6" /></svg>;
  }
  if (state === "BLOCKED") {
    // A shut gate: the barrier drawn across the line.
    return <svg {...common} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 10h14M6.5 5.5v9M13.5 5.5v9" /></svg>;
  }
  return <svg {...common} stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"><circle cx="10" cy="10" r="7" /></svg>;
}

export function RailGate({ labelKey, state, locale }: { labelKey: CatalogueKey; state: GateState; locale: Locale }) {
  return (
    <div className={`relative min-h-16 rounded-card border-2 p-3 ${TONE[state]}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0"><GateIcon state={state} /></span>
        <div>
          <p className={`text-label font-semibold ${state === "PASSED" ? "text-ink" : ""}`}>{resolve(labelKey, {}, locale)}</p>
          <p className={`mt-1 text-label ${state === "BLOCKED" ? "text-paper" : state === "PASSED" ? "text-ink" : "text-ink-soft"}`}>
            {resolve(STATE_KEY[state], {}, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
