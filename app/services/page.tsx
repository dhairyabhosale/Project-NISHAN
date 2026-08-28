"use client";

/* All PM-KISAN services — a coverage page, not a front door.
 *
 * The official Farmers Corner is sixteen undifferentiated tiles with names like
 * "Know Your Status" beside "Status of Self Registered Farmer". That is P4 and
 * P9, and it is the thing this product exists to fix, so it is NOT the entry
 * screen. This page exists so a visitor can see the whole surface, in plain
 * language, with the three things we answer separated from the rest.
 *
 * The links are ordinary anchors to the official site. Nothing here fetches a
 * government host (§16.6) — a link the user chooses to follow is not the app
 * contacting anything, and it is more honest than pretending we cover services
 * we do not. They point at the site root rather than guessed deep paths, since
 * verifying a deep link would mean requesting one. */

import Link from "next/link";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

const OFFICIAL = "https://pmkisan.gov.in/";

/** Indices 0-2 are answered inside NISHAN; the rest are not. */
const ANSWERED = [0, 1, 2];
const OTHERS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

const arrow = (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d="M7 13 13 7M7.5 7H13v5.5" />
  </svg>
);

export default function ServicesPage() {
  const { locale } = useLocale();
  const k = (s: string) => s as CatalogueKey;

  return (
    <main className="pb-16">
      <section className="on-teal bg-teal-deep py-12 text-paper md:py-16">
        <div className="shell">
          <h1 className="text-answer font-semibold leading-tight">{resolve("services.title", {}, locale)}</h1>
          <p className="mt-4 prose-measure text-body opacity-95">{resolve("services.standfirst", {}, locale)}</p>
        </div>
      </section>

      <section className="shell py-12">
        <h2 className="text-head font-semibold text-ink">{resolve("services.answered_heading", {}, locale)}</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {ANSWERED.map((i) => (
            <li key={i}>
              <Link href="/who" className="card-lift flex h-full flex-col rounded-card border-2 border-green bg-green-soft p-5">
                <span className="text-label font-semibold uppercase tracking-wide text-ink">
                  {resolve("services.we_answer", {}, locale)}
                </span>
                <span className="mt-2 text-body font-semibold text-ink">{resolve(k("svc." + i + ".name"), {}, locale)}</span>
                <span className="mt-2 text-label text-ink">{resolve(k("svc." + i + ".body"), {}, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-rule bg-paper py-12">
        <div className="shell">
          <h2 className="text-head font-semibold text-ink">{resolve("services.other_heading", {}, locale)}</h2>
          <p className="mt-2 prose-measure text-label text-ink-soft">{resolve("services.leaving", {}, locale)}</p>
          <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {OTHERS.map((i) => (
              <li key={i}>
                <a
                  href={OFFICIAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-lift flex h-full flex-col rounded-card border border-rule bg-cyan-pale p-5"
                >
                  <span className="text-body font-semibold text-ink">{resolve(k("svc." + i + ".name"), {}, locale)}</span>
                  <span className="mt-2 flex-1 text-label text-ink">{resolve(k("svc." + i + ".body"), {}, locale)}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-label font-semibold text-teal-deep">
                    {resolve("services.open_official", {}, locale)}
                    {arrow}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="shell py-12">
        <Link
          href="/who"
          className="inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
        >
          {resolve("services.cta", {}, locale)}
        </Link>
      </section>
    </main>
  );
}
