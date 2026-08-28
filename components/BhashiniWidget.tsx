"use client";

/* Bhashini voice assistant — launcher and panel. CLAUDE.md §9.4.
 *
 * WHAT THIS IS NOT: it is not a chatbot, and it never becomes one. §16.3 bans a
 * conversational assistant and §4 explains why — Kisan e-Mitra already answers
 * questions in eleven languages, and matching the incumbent at its own game
 * loses. This is a voice INPUT affordance in a familiar launcher shape.
 *
 * It requests no microphone permission, imports no speech library, holds no
 * conversation state, and has no handler beyond opening and closing its own
 * panel. Voice is Stage 2, and the panel says so rather than implying it works.
 */

import { useEffect, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";

export function BhashiniWidget() {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={wrap} className="fixed bottom-4 right-4 z-50 print:hidden">
      {open && (
        <section
          role="dialog"
          aria-label={resolve("bhashini.title", {}, locale)}
          className="panel-in on-paper mb-3 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-rule bg-paper shadow-lg"
        >
          <header className="on-teal flex items-center justify-between gap-3 bg-teal-deep px-4 py-3 text-paper">
            <span className="flex items-center gap-2">
              <MicGlyph size={18} />
              <span className="text-body font-semibold">{resolve("bhashini.title", {}, locale)}</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={resolve("bhashini.close", {}, locale)}
              className="grid size-9 place-items-center rounded-card hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </header>

          <div className="p-4">
            <p className="inline-flex items-center gap-2 rounded-card bg-pending px-3 py-1.5 text-label font-semibold text-ink">
              {resolve("bhashini.coming_soon", {}, locale)}
            </p>
            <p className="mt-3 text-body text-ink">{resolve("bhashini.body", {}, locale)}</p>
            <p className="mt-3 text-label text-ink-soft">{resolve("bhashini.note", {}, locale)}</p>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-card bg-rule text-body font-semibold text-ink-soft"
            >
              <MicGlyph size={20} />
              {resolve("bhashini.speak", {}, locale)}
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-14 items-center gap-2.5 rounded-marker bg-teal-deep px-4 text-body font-semibold text-paper shadow-lg transition-transform hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <MicGlyph size={22} />
        <span>{resolve("bhashini.title", {}, locale)}</span>
      </button>
    </div>
  );
}

function MicGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7" />
    </svg>
  );
}
