"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";

/**
 * §11.8 connection states: online shows NOTHING, because silence is the correct
 * signal. The strip appears only when the connection is genuinely gone, and it
 * says what is true — the work is on the phone, not lost.
 *
 * §15 cut the service worker and the outbox, so this makes no promise about
 * replaying anything. It reports the state and names where the work is.
 */
export function ConnectionStrip() {
  const { locale } = useLocale();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" className="offline-strip px-4 py-2 text-center print:hidden">
      <p className="shell text-label font-semibold">{resolve("offline.strip", {}, locale)}</p>
    </div>
  );
}
