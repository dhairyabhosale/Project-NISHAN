"use client";

import { useEffect, useState } from "react";
import { resolve } from "../content/resolve";
import { useLocale } from "./LocaleProvider";

export function AccessibilityControls() {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    try {
      const savedLarge = localStorage.getItem("nishan_large_text") === "1";
      const savedContrast = localStorage.getItem("nishan_high_contrast") === "1";
      if (savedLarge) {
        setLargeText(true);
        document.documentElement.classList.add("font-large");
      }
      if (savedContrast) {
        setHighContrast(true);
        document.documentElement.classList.add("high-contrast");
      }
    } catch {
      // safe fallback
    }
  }, []);

  function toggleLargeText() {
    const next = !largeText;
    setLargeText(next);
    if (next) {
      document.documentElement.classList.add("font-large");
      try { localStorage.setItem("nishan_large_text", "1"); } catch {}
    } else {
      document.documentElement.classList.remove("font-large");
      try { localStorage.removeItem("nishan_large_text"); } catch {}
    }
  }

  function toggleHighContrast() {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.documentElement.classList.add("high-contrast");
      try { localStorage.setItem("nishan_high_contrast", "1"); } catch {}
    } else {
      document.documentElement.classList.remove("high-contrast");
      try { localStorage.removeItem("nishan_high_contrast"); } catch {}
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={resolve("a11y.trigger", {}, locale)}
        title={resolve("a11y.trigger", {}, locale)}
        className="inline-flex min-h-12 items-center gap-1.5 rounded-card px-2.5 text-label font-semibold hover:bg-white/10"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="4" r="2" />
          <path d="m4 9 8 2 8-2" />
          <path d="M12 11v11" />
          <path d="m7 22 5-6 5 6" />
        </svg>
        <span className="hidden sm:inline">{resolve("a11y.trigger", {}, locale)}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={resolve("a11y.panel_title", {}, locale)}
          className="panel-in on-paper absolute right-0 top-full z-50 mt-1 w-72 rounded-card border-2 border-rule bg-paper p-4 shadow-xl text-ink"
        >
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <h3 className="text-label font-bold uppercase tracking-wide text-ink-soft">
              {resolve("a11y.panel_title", {}, locale)}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={resolve("lang.close", {}, locale)}
              className="grid size-8 place-items-center rounded-card hover:bg-cyan-pale text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <span className="block text-label font-semibold text-ink">
                {resolve("a11y.font_size", {}, locale)}
              </span>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={toggleLargeText}
                  aria-pressed={!largeText}
                  className={"flex-1 min-h-10 rounded-card border px-3 text-label font-semibold " + (!largeText ? "border-teal-deep bg-teal-deep text-paper" : "border-rule bg-paper text-ink")}
                >
                  {resolve("a11y.font_normal", {}, locale)}
                </button>
                <button
                  type="button"
                  onClick={toggleLargeText}
                  aria-pressed={largeText}
                  className={"flex-1 min-h-10 rounded-card border px-3 text-label font-bold text-[16px] " + (largeText ? "border-teal-deep bg-teal-deep text-paper" : "border-rule bg-paper text-ink")}
                >
                  {resolve("a11y.font_large", {}, locale)}
                </button>
              </div>
            </div>

            <div>
              <span className="block text-label font-semibold text-ink">
                {resolve("a11y.contrast", {}, locale)}
              </span>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={toggleHighContrast}
                  aria-pressed={!highContrast}
                  className={"flex-1 min-h-10 rounded-card border px-3 text-label font-semibold " + (!highContrast ? "border-teal-deep bg-teal-deep text-paper" : "border-rule bg-paper text-ink")}
                >
                  {resolve("a11y.font_normal", {}, locale)}
                </button>
                <button
                  type="button"
                  onClick={toggleHighContrast}
                  aria-pressed={highContrast}
                  className={"flex-1 min-h-10 rounded-card border px-3 text-label font-semibold " + (highContrast ? "border-teal-deep bg-teal-deep text-paper" : "border-rule bg-paper text-ink")}
                >
                  {resolve("a11y.contrast", {}, locale)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
