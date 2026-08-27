import { resolve } from "../content/resolve";
import type { CatalogueKey, Locale } from "../lib/content";

export type GateState = "PASSED" | "BLOCKED" | "UNREACHED";

/* §11.3 Money Rail mapping, and §11.8: colour never carries meaning alone.
 *
 * Each state differs in THREE ways at once — shape, weight and label — so the
 * rail reads correctly to someone who cannot distinguish red from green, and on
 * a cheap screen in daylight:
 *
 *   PASSED     tick, quiet fill, settled
 *   BLOCKED    a barrier drawn ACROSS the rail, heavier border, offset
 *   UNREACHED  dashed outline, no fill, receded
 *
 * The check is --ink, not white: white on --green is 2.78:1, below the 3:1
 * floor for graphical objects (§11.3 rule 1). */

const TONE: Record<GateState, string> = {
  PASSED: "border-green bg-green-soft",
  BLOCKED: "border-stop border-l-[6px] bg-paper",
  UNREACHED: "border-dashed border-rule bg-transparent"
};

const LABEL_TONE: Record<GateState, string> = {
  PASSED: "text-ink",
  BLOCKED: "text-ink",
  UNREACHED: "text-ink-soft"
};

const STATE_KEY: Record<GateState, CatalogueKey> = {
  PASSED: "rail.passed",
  BLOCKED: "rail.blocked",
  UNREACHED: "rail.unreached"
};

function GateIcon({ state }: { state: GateState }) {
  const base = { width: 22, height: 22, viewBox: "0 0 22 22", fill: "none", "aria-hidden": true as const };

  if (state === "PASSED") {
    return (
      <svg {...base} stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 11.5 9 16l8.5-9" />
      </svg>
    );
  }
  if (state === "BLOCKED") {
    // A shut gate: the barrier drawn across the line, with its posts.
    return (
      <svg {...base} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M3 11h16" />
        <path d="M7 5.5v11M15 5.5v11" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg {...base} stroke="currentColor" strokeWidth="1.75" strokeDasharray="3 3">
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

export function RailGate({
  labelKey,
  state,
  locale
}: {
  labelKey: CatalogueKey;
  state: GateState;
  locale: Locale;
}) {
  return (
    <div className={`relative min-h-[72px] rounded-card border-2 p-4 ${TONE[state]}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 ${state === "BLOCKED" ? "text-stop" : state === "PASSED" ? "text-ink" : "text-ink-soft"}`}>
          <GateIcon state={state} />
        </span>
        <div className="min-w-0">
          <p className={`text-body font-semibold leading-snug ${LABEL_TONE[state]}`}>
            {resolve(labelKey, {}, locale)}
          </p>
          <p className={`mt-1 text-label ${state === "BLOCKED" ? "font-semibold text-stop" : "text-ink-soft"}`}>
            {resolve(STATE_KEY[state], {}, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
