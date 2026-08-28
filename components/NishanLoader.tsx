"use client";

import { useEffect, useRef, useState } from "react";

export function NishanLoader({ dismissWhenReady = false }: { dismissWhenReady?: boolean }) {
  const [exiting, setExiting] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dismissWhenReady) return;

    const frame = window.requestAnimationFrame(() => setExiting(true));
    const removal = window.setTimeout(() => {
      screenRef.current?.remove();
    }, 180);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(removal);
    };
  }, [dismissWhenReady]);

  return (
    <div ref={screenRef} className={`nishan-loading-screen${exiting ? " is-exiting" : ""}`} role="status" aria-live="polite" aria-label="Loading NISHAN">
      <div className="sentinel-loader" aria-hidden="true">
        <div className="sentinel-box" />
      </div>
      <span className="sr-only">Loading NISHAN</span>
    </div>
  );
}
