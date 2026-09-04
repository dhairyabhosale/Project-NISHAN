"use client";

import { useEffect, useRef, useState } from "react";
import { resolve } from "../content/resolve";
import { LANGUAGES, localeFor } from "../lib/languages";
import { useLocale } from "./LocaleProvider";

/**
 * §10.2 - the selector covers every language the official portal offers; the
 * translations do not. Choosing an unresolved language keeps the interface in
 * English and says so once, in place.
 *
 * An expanding panel rather than a native select: the endonym has to be legible
 * in its own script at 18px, and a native control cannot promise that across
 * fourteen scripts on a ₹7,000 Android.
 */
export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  function choose(code: string, english: string, resolved: boolean) {
    setLocale(localeFor(code));
    setOpen(false);
    setNote(resolved ? null : resolve("lang.kept_english", { language: english }, "en"));
  }

  return (
    <div className="relative" ref={panel}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        /* No fill. The other nav items are plain white text, and a solid teal
           box here made the language control look like the primary action on
           the page. An outline keeps it findable without competing, and over
           the hero video it lets the footage show through rather than punching
           a rectangle out of it. */
        className="inline-flex min-h-12 items-center gap-2 rounded-card border border-paper/70 px-3 text-label font-semibold text-paper"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="10" cy="10" r="7.25" />
          <path d="M2.75 10h14.5M10 2.75c1.9 2 2.9 4.4 2.9 7.25S11.9 15.25 10 17.25c-1.9-2-2.9-4.4-2.9-7.25S8.1 4.75 10 2.75Z" />
        </svg>
        <span>{current.endonym}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true"
             className={open ? "rotate-180 transition-transform" : "transition-transform"}>
          <path d="m4 7 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={resolve("lang.choose", {}, "en")}
          className="panel-in on-paper absolute right-0 z-40 mt-2 max-h-[60vh] w-[17rem] overflow-y-auto rounded-card border border-rule bg-paper shadow-lg"
        >
          <p className="border-b border-rule px-4 py-3 text-label font-semibold text-ink-soft">
            {resolve("lang.choose", {}, "en")}
          </p>
          <ul>
            {LANGUAGES.map((l) => {
              const selected = l.code === locale || (!l.resolved && locale === "en" && l.code === "en");
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => choose(l.code, l.english, l.resolved)}
                    className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-rule px-4 py-2 text-left last:border-b-0 hover:bg-cyan-pale"
                  >
                    <span>
                      <span className="block text-body text-ink">{l.endonym}</span>
                      <span className="block text-label text-ink-soft">{l.english}</span>
                    </span>
                    {!l.resolved && (
                      <span className="shrink-0 rounded-card bg-cyan-pale px-2 py-1 text-[13px] font-semibold text-ink-soft">
                        {resolve("lang.coming", {}, "en")}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {note && (
        <p className="on-paper absolute right-0 top-full z-30 mt-2 w-[17rem] rounded-card border border-rule bg-paper p-3 text-label text-ink">
          {note}
        </p>
      )}
    </div>
  );
}
