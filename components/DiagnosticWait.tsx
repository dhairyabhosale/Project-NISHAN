"use client";

/* The pause before a verdict.
 *
 * Held for 1.5s on the two entry points into a case: the OTP screen and the
 * demo picker's run control. What the wait covers is real work - the engine
 * reconciles seven mocked systems on the next screen - but the hold itself is
 * deliberate rather than measured, so the copy says what is being done and
 * never claims how long it took or that anything was contacted.
 *
 * role="status" with aria-live polite and aria-busy: a screen reader is told
 * the app is working, once, rather than being handed a spinner it cannot see.
 * Under reduced motion the blanket rule in globals.css lands the loader on its
 * final frame; the wait still happens, it simply does not spin.
 */

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";

export const DIAGNOSTIC_MS = 1500;

/* Returns [running, start]. The caller renders <DiagnosticWait /> while running
   is true and does its navigation in the callback. Guarded so a second press
   cannot queue a second navigation, which is the Loading Buttons rule. */
export function useDiagnosticWait(): [boolean, (then: () => void) => void] {
  const [running, setRunning] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => { pending(); }, DIAGNOSTIC_MS);
    return () => clearTimeout(t);
  }, [pending]);

  const start = (then: () => void) => {
    if (running) return;
    setRunning(true);
    setPending(() => then);
  };

  return [running, start];
}

export function DiagnosticWait() {
  const { locale } = useLocale();
  return (
    <div className="diag-veil" role="status" aria-live="polite" aria-busy="true">
      <div className="shell flex flex-col items-center text-center">
        <div className="loader" />
        <p className="mt-8 text-head font-semibold text-ink">{resolve("diag.title", {}, locale)}</p>
        <p className="mt-2 max-w-[42ch] text-body text-ink">{resolve("diag.body", {}, locale)}</p>
      </div>
    </div>
  );
}
