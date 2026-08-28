"use client";

/* Illustrative voices - a continuously rotating strip.
 *
 * THESE ARE NOT REAL QUOTES, AND THE SECTION SAYS SO ABOVE THE FOLD.
 *
 * Fabricated citizen testimonials about a live government scheme, presented as
 * genuine, is the one thing on this build's list that could actually fail the
 * honesty criterion - and 12.3 forbids anything that could be mistaken for a
 * real record. So: no invented full names, no photographs, no locations
 * specific enough to identify anyone, and every attribution begins with the
 * word Illustrative. The label costs four words and it is what makes the
 * section publishable.
 *
 * The quotes describe the failure modes the engine actually diagnoses, so the
 * section earns its place rather than decorating the page.
 *
 * CSS marquee, no library. Pauses on hover and on keyboard focus so a reader is
 * never outrun, and stops entirely under prefers-reduced-motion. */

import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";
import type { CatalogueKey } from "../lib/content";

const COUNT = 5;

export function Voices() {
  const { locale } = useLocale();
  const k = (s: string) => s as CatalogueKey;

  const cards = Array.from({ length: COUNT }, (_, i) => (
    <figure
      key={i}
      className="w-[19rem] shrink-0 rounded-card border border-rule bg-paper p-5 sm:w-[22rem]"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-teal-deep">
        <path d="M9 7H5.5A1.5 1.5 0 0 0 4 8.5V12h5V7ZM20 7h-3.5A1.5 1.5 0 0 0 15 8.5V12h5V7Z" />
        <path d="M9 12c0 3-1.6 4.6-4 5M20 12c0 3-1.6 4.6-4 5" />
      </svg>
      <blockquote className="mt-3 text-body text-ink">{resolve(k("voices." + i + ".quote"), {}, locale)}</blockquote>
      <figcaption className="mt-3 text-label text-ink-soft">{resolve(k("voices." + i + ".name"), {}, locale)}</figcaption>
    </figure>
  ));

  return (
    <section className="border-y border-rule bg-cyan-pale py-14">
      <div className="shell">
        <h2 className="text-head font-semibold text-ink">{resolve("voices.heading", {}, locale)}</h2>
        {/* The label sits above the quotes, not under them. */}
        <p className="mt-2 prose-measure rounded-card border border-pending bg-paper p-3 text-label font-semibold text-ink">
          {resolve("voices.illustrative", {}, locale)}
        </p>
      </div>

      <div className="marquee mt-8 overflow-hidden">
        <div className="marquee-track flex w-max gap-4 px-4">
          {cards}
          {/* Duplicated so the track can loop seamlessly. Hidden from assistive
              tech, which reads the first set once. */}
          <div aria-hidden="true" className="flex gap-4">{cards}</div>
        </div>
      </div>
    </section>
  );
}
