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
import type { CSSProperties } from "react";
import { CountUp } from "../components/CountUp";
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
      <section className="home-hero on-teal relative isolate flex items-center overflow-hidden text-paper">
        <picture className="absolute inset-0 -z-10 block">
          {/* One asset used to serve every viewport: 253kB and an LCP of
              5024ms on Slow 3G at 6x CPU, on the connection least able to
              afford it. sizes="100vw" because the hero is always full width,
              so the browser picks by device pixel width: a 360px phone at 1x
              takes the 480 (19kB), at 2x the 768 (37kB). */}
          <source
            type="image/webp"
            sizes="100vw"
            srcSet="/hero-farmer-480.webp 480w, /hero-farmer-768.webp 768w, /hero-farmer-1200.webp 1200w, /hero-farmer.webp 1672w"
          />
          <img
            src="/hero-farmer.png"
            width={1672}
            height={941}
            alt={resolve("hero.image_alt", {}, locale)}
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className="hero-img h-full w-full object-cover"
          />
        </picture>
        {/* No scrim, no wash, no panel: the words sit on the bare photograph.
            Chosen on the look, with the cost measured and accepted. Across the
            area the copy occupies the picture runs from luminance 0.005 to
            0.997, and nothing a text treatment can do closes that.

            Measured with the glyph fill hidden but .hero-shadow left on, so
            the figure is the ground the letterforms actually sit against:
            headline 1.13-1.84:1, standfirst 1.02-1.72:1, secondary action
            1.65-2.49:1, against the 7:1 CLAUDE.md §11.3 requires for body
            copy. The shadow is worth roughly a tenth of a point and is there
            for perceived edge, not for the number. At 375px part of the
            standfirst still lands on white grass at 1.02:1.

            §11.3 and this screen disagree. Recorded here rather than resolved
            silently. The primary action passes at 5.32:1 throughout, because
            it carries its own white fill. */}
        {/* The centring lives on the SECTION, not here. This div had its own
            min-height, so in a hero that is now 810px tall it sat at the top
            and left a third of the frame empty under the words. */}
        <div className="hero-clear shell relative w-full pb-24 md:pb-28">
          <div className="home-hero-copy max-w-[22rem] sm:max-w-[26rem] md:max-w-[30rem]">
            <h1
              className="rise hero-shadow max-w-[20ch] text-[34px] font-bold leading-tight md:text-[46px]"
              style={{ "--rise-delay": "90ms" } as CSSProperties}
            >
              {resolve("entry.headline", {}, locale)}
            </h1>
            <p
              className="rise hero-shadow mt-5 max-w-[52ch] text-[22px] font-bold leading-relaxed"
              style={{ "--rise-delay": "180ms" } as CSSProperties}
            >
              {resolve("entry.standfirst", {}, locale)}
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3" style={{ "--rise-delay": "270ms" } as CSSProperties}>
              <Link href="/who" className="btn-pop inline-flex min-h-14 items-center rounded-card bg-paper px-6 text-body font-semibold text-teal-deep">
                {resolve("hero.cta", {}, locale)}
              </Link>
              <Link href="/demo" className="btn-fill-invert hero-shadow inline-flex min-h-14 items-center rounded-card border-2 border-paper/70 px-6 text-body font-semibold text-paper">
                {resolve("hero.secondary", {}, locale)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-14">
        {/* Renders nothing on a first visit; one tap back on a return. */}
        <ResumeCase />
        <h2 data-reveal className="mt-8 text-head font-semibold text-ink">{resolve("entry.choose", {}, locale)}</h2>
        <ul data-reveal-group className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {CHOICES.map((c) => (
            <li key={c.key}>
              <Link
                href={c.href}
                className="card-lift flex h-full min-h-[96px] items-center gap-4 rounded-card border border-rule bg-paper p-5 text-ink hover:bg-white"
              >
                <span className="shrink-0 text-teal-deep">{c.icon}</span>
                {/* min-w-0: a flex item defaults to min-width:auto, so it
                    cannot shrink below its longest word. Tamil has no spaces to
                    break on in these labels, so the card grew to 356px inside a
                    320px screen and took the whole document with it. */}
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold leading-snug">{resolve(c.label, {}, locale)}</span>
                  <span className="mt-1 block text-label text-ink-soft">{resolve(c.hint, {}, locale)}</span>
                </span>
                <svg width="20" height="20" viewBox="0 0 20 20" {...stroke} aria-hidden="true" className="chev shrink-0 text-ink-soft">
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
          <h2 data-reveal className="text-head font-semibold text-ink">{resolve("how.heading", {}, locale)}</h2>
          <p data-reveal className="mt-2 prose-measure text-body text-ink">{resolve("how.standfirst", {}, locale)}</p>
          <ol data-reveal-group className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
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
      <section className="py-20">
        <div className="shell">
        <h2 data-reveal className="text-[28px] font-semibold leading-tight text-ink md:text-[34px]">{resolve("facts.heading", {}, locale)}</h2>
        <p data-reveal className="mt-3 prose-measure text-body text-ink-soft">{resolve("facts.standfirst", {}, locale)}</p>
        <dl data-reveal-group className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FACTS.map((n) => (
            <div key={n} className="stat-cycle rounded-card border border-rule bg-paper p-6">
              <dt className="stat-figure font-bold text-teal-deep">
                <CountUp value={resolve(k("facts." + n + ".value"), {}, locale)} />
              </dt>
              <dd className="mt-3 text-body leading-snug text-ink">{resolve(k("facts." + n + ".label"), {}, locale)}</dd>
            </div>
          ))}
        </dl>
        <p data-reveal className="mt-8 prose-measure text-label text-ink-soft">{resolve("facts.source", {}, locale)}</p>
        </div>
      </section>

      {/* Coverage, without the tile grid becoming the front door. */}
      <section className="border-t border-rule bg-paper py-14">
        <div data-reveal className="shell flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-head font-semibold text-ink">{resolve("services.title", {}, locale)}</h2>
            <p className="mt-2 prose-measure text-body text-ink">{resolve("services.standfirst", {}, locale)}</p>
          </div>
          <Link href="/services" className="btn-fill inline-flex min-h-14 shrink-0 items-center rounded-card border-2 border-teal-deep px-6 text-body font-semibold text-teal-deep">
            {resolve("nav.services", {}, locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
