"use client";

/* S1 — Entry. CLAUDE.md §11.7.
 *
 * Job: make a person who cannot read English understand, in three seconds, that
 * this answers one question — and start.
 *
 * There is NO case-ID field here, and that absence is the product. Demanding a
 * reference the farmer does not hold is P2, the portal's core failure and the
 * thing we exist to fix. Identification happens at S2, where any one of three
 * identifiers is enough. A case reference still opens a case, but as a
 * secondary path on that screen (§12.4 reference mode), never the front door.
 *
 * No captcha (P1). No login. No scroll to reach the primary action. */

import Link from "next/link";
import { MicButton } from "../components/MicButton";
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

export default function EntryPage() {
  const { locale } = useLocale();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <h1 className="max-w-[19ch] text-answer font-semibold leading-tight text-ink">
        {resolve("entry.headline", {}, locale)}
      </h1>
      <p className="mt-4 max-w-[58ch] text-body text-ink">{resolve("entry.standfirst", {}, locale)}</p>

      <h2 className="mt-10 text-head font-semibold text-ink">{resolve("entry.choose", {}, locale)}</h2>

      <ul className="mt-4 space-y-3">
        {CHOICES.map((c) => (
          <li key={c.key}>
            <Link
              href={c.href}
              className="flex min-h-[76px] items-center gap-4 rounded-card border border-rule bg-paper p-4 text-ink hover:bg-white/70"
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

      <div className="mt-10 rounded-card border border-rule bg-paper p-4">
        <Link href="/demo" className="text-body font-semibold text-teal-deep underline underline-offset-4">
          {resolve("entry.demo", {}, locale)}
        </Link>
      </div>

      <MicButton locale={locale} />
    </main>
  );
}
