"use client";

import { useEffect, useState } from "react";

export function NishanLoader({ dismissWhenReady = false }: { dismissWhenReady?: boolean }) {
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!dismissWhenReady) return;

    const frame = window.requestAnimationFrame(() => setExiting(true));
    const removal = window.setTimeout(() => {
      setVisible(false);
    }, 180);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(removal);
    };
  }, [dismissWhenReady]);

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
