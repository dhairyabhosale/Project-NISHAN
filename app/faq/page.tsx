"use client";

/* /faq - the ten questions people actually arrive with.
 *
 * Subject matter mirrors the official portal's FAQ, but the answers are written
 * to be acted on rather than to restate the rule. Where an answer names a
 * blocker we route the reader into the journey instead of leaving them to
 * work out which of sixteen links applies (P4, P9).
 *
 * Accordion rather than a wall of text: one idea open at a time is 6.2. */

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

const COUNT = 10;

export default function FaqPage() {
  const { locale } = useLocale();
  const [open, setOpen] = useState<number | null>(0);
  const k = (s: string) => s as CatalogueKey;

  return (
    <main className="page-in pb-16">
      <section className="on-teal bg-teal-deep py-12 text-paper md:py-16">
        <div className="shell">
          <h1 className="text-answer font-semibold leading-tight">{resolve("faq.title", {}, locale)}</h1>
          <p className="mt-4 prose-measure text-body opacity-95">{resolve("faq.standfirst", {}, locale)}</p>
        </div>
      </section>

      <section className="shell py-12">
        <ul className="space-y-3">
          {Array.from({ length: COUNT }, (_, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="overflow-hidden rounded-card border border-rule bg-paper">
                <h2>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={"faq-panel-" + i}
                    id={"faq-q-" + i}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 p-5 text-left hover:bg-cyan-pale"
                  >
                    <span className="text-body font-semibold text-ink">{resolve(k("faq." + i + ".q"), {}, locale)}</span>
                    <span
                      aria-hidden="true"
                      className={"grid size-8 shrink-0 place-items-center rounded-card border border-rule text-teal-deep transition-transform " + (isOpen ? "rotate-45" : "")}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                        <path d="M10 4v12M4 10h12" />
                      </svg>
                    </span>
                  </button>
                </h2>
                {isOpen && (
                  <div id={"faq-panel-" + i} role="region" aria-labelledby={"faq-q-" + i} className="accordion-in border-t border-rule px-5 pb-5 pt-4">
                    <p className="prose-measure text-body text-ink">{resolve(k("faq." + i + ".a"), {}, locale)}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-rule bg-paper py-12">
        <div className="shell flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-head font-semibold text-ink">{resolve("faq.still_stuck", {}, locale)}</h2>
            <p className="mt-2 prose-measure text-body text-ink">{resolve("faq.still_stuck_body", {}, locale)}</p>
          </div>
          <Link href="/who" className="inline-flex min-h-14 shrink-0 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper">
            {resolve("faq.cta", {}, locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
