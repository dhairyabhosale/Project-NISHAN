"use client";

/* AUDIT.md F12 - the "Delete this case" control §12.2 and §12.5 both require.
 *
 * Two taps, not one. A single button that wipes without asking is the wrong
 * shape for a control whose whole purpose is that the reader is in charge of
 * their own data - and §8.7's duplicate-action guard exists because this build
 * takes irreversible actions seriously.
 *
 * It reports what it actually did. If there was nothing saved it says so
 * rather than claiming a deletion, because a page that says "deleted" when it
 * deleted nothing is the same category of untruth /whats-real exists to avoid.
 */

import { useState } from "react";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";

const PREFIX = "nishan";
const FIX_PREFIX = "nishan:fix:";

/** Every key this build has ever written, so nothing is left behind. */
function ourKeys(): string[] {
  try {
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out.push(k);
    }
    return out;
  } catch {
    return [];
  }
}

export function DeleteCaseButton() {
  const { locale } = useLocale();
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<"none" | "done" | null>(null);
  const [busy, setBusy] = useState(false);

  async function wipe() {
    setBusy(true);
    const keys = ourKeys();
    const references = keys
      .filter((k) => k.startsWith(FIX_PREFIX))
      .map((k) => k.slice(FIX_PREFIX.length));

    if (references.length > 0) {
      // Best effort. The local wipe below is the part that must not be
      // conditional on a network that §5.1 says will sometimes not be there.
      try {
        await fetch("/api/case/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ references: references.slice(0, 50) })
        });
      } catch { /* offline: the device is still cleared */ }
    }

    try {
      for (const k of keys) window.localStorage.removeItem(k);
    } catch { /* storage refused; there was nothing to clear */ }

    setResult(keys.length === 0 ? "none" : "done");
    setAsking(false);
    setBusy(false);
  }

  if (result) {
    return (
      <p className="mt-4 rounded-card border-2 border-teal-deep bg-cyan-pale p-3 text-body text-ink" role="status">
        {resolve(result === "none" ? "real.delete_none" : "real.delete_done", {}, locale)}
      </p>
    );
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="mt-4 inline-flex min-h-12 items-center rounded-card border-2 border-stop px-5 text-body font-semibold text-stop"
      >
        {resolve("real.delete_action", {}, locale)}
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={wipe}
        disabled={busy}
        className="inline-flex min-h-12 items-center rounded-card bg-stop px-5 text-body font-semibold text-paper disabled:opacity-70"
      >
        {resolve("real.delete_confirm", {}, locale)}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className="inline-flex min-h-12 items-center rounded-card border border-rule px-5 text-body font-semibold text-ink"
      >
        {resolve("real.delete_cancel", {}, locale)}
      </button>
    </div>
  );
}
