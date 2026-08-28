"use client";

import { useEffect, useState } from "react";

const INITIAL_LOADER_KEY = "nishan-initial-loader-shown";
const MINIMUM_DISPLAY_MS = 2000;

export function NishanLoader({ dismissWhenReady = false }: { dismissWhenReady?: boolean }) {
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!dismissWhenReady) return;

    let wait = 0;
    if (!window.sessionStorage.getItem(INITIAL_LOADER_KEY)) {
      window.sessionStorage.setItem(INITIAL_LOADER_KEY, "1");
      wait = Math.max(0, MINIMUM_DISPLAY_MS - (Date.now() - startedAt));
    }

    const exit = window.setTimeout(() => setExiting(true), wait);
    const removal = window.setTimeout(() => setVisible(false), wait + 180);

    return () => {
      window.clearTimeout(exit);
      window.clearTimeout(removal);
    };
  }, [dismissWhenReady, startedAt]);

  if (!visible) return null;

  return (
    <div className={`nishan-loading-screen${exiting ? " is-exiting" : ""}`} role="status" aria-live="polite" aria-label="Loading NISHAN">
      <div className="sentinel-loader" aria-hidden="true">
        <div className="sentinel-box" />
      </div>
      <span className="sr-only">Loading NISHAN</span>
    </div>
  );
}
