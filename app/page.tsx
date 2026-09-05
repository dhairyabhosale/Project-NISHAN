"use client";

/* S1 - Entry. CLAUDE.md §11.7.
 *
 * Job: make a person who cannot read English understand, in three seconds, that
 * this answers one question - and start.
 *
 * There is NO case-ID field here, and that absence is the product. Demanding a
 * reference the farmer does not hold is P2, the portal's core failure and the
 * thing we exist to fix. Identification happens at S2, where any one of three
 * identifiers is enough. A case reference still opens a case, but as a
 * secondary path on that screen (§12.4 reference mode), never the front door.
 *
 * No captcha (P1). No login. No scroll to reach the primary action. */

import Link from "next/link";
import { ResumeCase } from "../components/ResumeCase";
import { Voices } from "../components/Voices";
import { useLocale } from "../components/LocaleProvider";
import { resolve } from "../content/resolve";
import type { CatalogueKey } from "../lib/content";

type Choice = { key: string; label: CatalogueKey; hint: CatalogueKey; href: string; icon: JSX.Element };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const CHOICES: Choice[] = [
  {
    key: "not_arrived",
    label: "entry.choice.not_arrived",
    hint: "entry.choice.not_arrived_hint",
    href: "/who?ask=not_arrived",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="1.5" />
        <path d="M3 10h18M7 14h4" />
      </svg>
    )
  },
  {
    key: "not_registered",
    label: "entry.choice.not_registered",
    hint: "entry.choice.not_registered_hint",
    href: "/who?ask=not_registered",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </svg>
    )
  },
  {
    key: "ekyc",
    label: "entry.choice.ekyc",
    hint: "entry.choice.ekyc_hint",
    href: "/who?ask=ekyc",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="1.5" />
        <circle cx="9" cy="11" r="2.25" />
        <path d="M5.5 16.5c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4M15 10h4M15 13.5h4" />
      </svg>
    )
  },
  {
    key: "helping",
    label: "entry.choice.helping",
    hint: "entry.choice.helping_hint",
    href: "/who?ask=helping&assisted=1",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9.5" r="2.25" />
        <path d="M3.5 19c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5M16 14.5c2 .4 3.4 1.7 4 4.5" />
      </svg>
    )
  }
];

const STEPS = [1, 2, 3];
const FACTS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function EntryPage() {
  const { locale } = useLocale();
  const k = (x: string) => x as CatalogueKey;

  return (
    <main>
      {/* Hero band - anchors the page. Solid --teal-deep, and the text sits on
          the teal rather than on any image: white on --teal-deep measures
          5.32:1 and holds everywhere, which is not true of white on a
          photograph. */}
      <section className="on-teal relative bg-teal-deep py-14 text-paper md:py-20">
        <div className="shell">
          <h1 className="max-w-[20ch] text-answer font-semibold leading-tight md:text-[40px]">
            {resolve("entry.headline", {}, locale)}
          </h1>
          <p className="mt-5 prose-measure text-[20px] font-semibold leading-relaxed">{resolve("entry.standfirst", {}, locale)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/who" className="inline-flex min-h-14 items-center rounded-card bg-paper px-6 text-body font-semibold text-teal-deep">
              {resolve("hero.cta", {}, locale)}
            </Link>
            <Link href="/demo" className="inline-flex min-h-14 items-center rounded-card border-2 border-paper/70 px-6 text-body font-semibold text-paper">
              {resolve("hero.secondary", {}, locale)}
            </Link>
          </div>
        </div>
      </section>

      <section className="shell py-14">
        {/* Renders nothing on a first visit; one tap back on a return. */}
        <ResumeCase />
        <h2 className="mt-8 text-head font-semibold text-ink">{resolve("entry.choose", {}, locale)}</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {CHOICES.map((c) => (
            <li key={c.key}>
              <Link
                href={c.href}
                className="card-lift flex h-full min-h-[96px] items-center gap-4 rounded-card border border-rule bg-paper p-5 text-ink hover:bg-white"
              >
                <span className="shrink-0 text-teal-deep">{c.icon}</span>
                <span className="flex-1">
                  <span className="block text-body font-semibold leading-snug">{resolve(c.label, {}, locale)}</span>
                  <span className="mt-1 block text-label text-ink-soft">{resolve(c.hint, {}, locale)}</span>
                </span>
                <svg width="20" height="20" viewBox="0 0 20 20" {...stroke} aria-hidden="true" className="shrink-0 text-ink-soft">
                  <path d="m7 4 6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* A real sequence, so numbering it carries information. */}
      <section className="border-y border-rule bg-paper py-14">
        <div className="shell">
          <h2 className="text-head font-semibold text-ink">{resolve("how.heading", {}, locale)}</h2>
          <p className="mt-2 prose-measure text-body text-ink">{resolve("how.standfirst", {}, locale)}</p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((n) => (
              <li key={n} className="rounded-card border border-rule bg-cyan-pale p-5">
                <span className="data grid size-10 place-items-center rounded-card bg-teal-deep text-paper">{n}</span>
                <h3 className="mt-4 text-body font-semibold text-ink">{resolve(k("how." + n + ".title"), {}, locale)}</h3>
                <p className="mt-2 text-label text-ink">{resolve(k("how." + n + ".body"), {}, locale)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Voices />

      {/* Published figures reproduced, never computed by us - §18. */}
      <section className="py-14">
        <div className="shell">
        <h2 className="text-head font-semibold text-ink">{resolve("facts.heading", {}, locale)}</h2>
        <p className="mt-2 prose-measure text-label text-ink-soft">{resolve("facts.standfirst", {}, locale)}</p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((n) => (
            <div key={n} className="stat-cycle rounded-card border border-rule bg-paper p-5">
              <dt className="data text-head font-bold text-teal-deep">{resolve(k("facts." + n + ".value"), {}, locale)}</dt>
              <dd className="mt-2 text-label text-ink">{resolve(k("facts." + n + ".label"), {}, locale)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 prose-measure text-label text-ink-soft">{resolve("facts.source", {}, locale)}</p>
        </div>
      </section>

      {/* Coverage, without the tile grid becoming the front door. */}
      <section className="border-t border-rule bg-paper py-14">
        <div className="shell flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-head font-semibold text-ink">{resolve("services.title", {}, locale)}</h2>
            <p className="mt-2 prose-measure text-body text-ink">{resolve("services.standfirst", {}, locale)}</p>
          </div>
          <Link href="/services" className="inline-flex min-h-14 shrink-0 items-center rounded-card border-2 border-teal-deep px-6 text-body font-semibold text-teal-deep">
            {resolve("nav.services", {}, locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
