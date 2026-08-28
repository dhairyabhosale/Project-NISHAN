"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSelector } from "./LanguageSelector";
import { ConnectionStrip } from "./ConnectionStrip";
import { NishanLogo } from "./NishanLogo";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";

/**
 * §11.8 — the fixed-element budget is TWO, and this owns one of them.
 *
 *   Disclosure banner  fixed top, non-dismissible, every screen (§12.7)
 *   Primary action     fixed bottom, per screen (§11.5)
 *   Site header        scrolls away
 *
 * Three fixed bands at 360px leaves no room for content, and of the two the
 * banner matters more: a user must never be able to mistake this for the
 * official service at any point in the journey.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const { locale } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-cyan-pale text-ink">
      {/* §12.7 — non-dismissible, every screen. */}
      <div className="fixed inset-x-0 top-0 z-50 bg-pending px-4 py-2 text-center">
        <p className="shell text-[13px] font-semibold leading-snug text-ink">
          {resolve("banner.prototype", {}, locale)}
        </p>
      </div>

      {/* Solid band that anchors the page. Scrolls, per §11.8. */}
      <header className="on-teal mt-[42px] bg-teal-deep text-paper">
        <div className="shell flex items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="rounded-card">
            <NishanLogo locale={locale} />
          </Link>
          <div className="flex items-center gap-2">
            {/* Primary navigation. Three destinations, not sixteen tiles: the
                journey, the coverage page, and the disclosure. §11.7 keeps the
                entry screen to one question, so navigation lives up here. */}
            <nav aria-label={resolve("nav.menu", {}, locale)} className="hidden items-center gap-1 sm:flex">
              <Link href="/who" className="inline-flex min-h-12 items-center rounded-card px-3 text-label font-semibold text-paper hover:bg-white/10">
                {resolve("nav.find", {}, locale)}
              </Link>
              <Link href="/services" className="inline-flex min-h-12 items-center rounded-card px-3 text-label font-semibold text-paper hover:bg-white/10">
                {resolve("nav.services", {}, locale)}
              </Link>
              <Link href="/whats-real" className="inline-flex min-h-12 items-center rounded-card px-3 text-label font-semibold text-paper hover:bg-white/10">
                {resolve("nav.real", {}, locale)}
              </Link>
            </nav>
            <LanguageSelector />
          </div>
        </div>

        {/* Below sm the same three destinations sit on their own row rather
            than behind a hamburger: three links do not need to be hidden, and
            a drawer is one more thing to learn. */}
        <nav aria-label={resolve("nav.menu", {}, locale)} className="shell flex gap-1 overflow-x-auto pb-3 sm:hidden">
          <Link href="/who" className="inline-flex min-h-12 shrink-0 items-center rounded-card bg-white/10 px-3 text-label font-semibold text-paper">
            {resolve("nav.find", {}, locale)}
          </Link>
          <Link href="/services" className="inline-flex min-h-12 shrink-0 items-center rounded-card bg-white/10 px-3 text-label font-semibold text-paper">
            {resolve("nav.services", {}, locale)}
          </Link>
          <Link href="/whats-real" className="inline-flex min-h-12 shrink-0 items-center rounded-card bg-white/10 px-3 text-label font-semibold text-paper">
            {resolve("nav.real", {}, locale)}
          </Link>
        </nav>
      </header>

      <ConnectionStrip />

      <div className="flex-1">{children}</div>

      <footer className="mt-16 border-t border-rule bg-paper">
        <div className="shell flex flex-col gap-2 px-4 py-8">
          <Link href="/whats-real" className="text-body font-semibold text-teal-deep underline underline-offset-4">
            {resolve("footer.whats_real", {}, locale)}
          </Link>
          <p className="text-label text-ink-soft">{resolve("footer.note", {}, locale)}</p>
        </div>
      </footer>
    </div>
  );
}
