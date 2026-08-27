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
        <p className="mx-auto max-w-2xl text-[13px] font-semibold leading-snug text-ink">
          {resolve("banner.prototype", {}, locale)}
        </p>
      </div>

      {/* Solid band that anchors the page. Scrolls, per §11.8. */}
      <header className="on-teal mt-[42px] bg-teal-deep text-paper">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="rounded-card">
            <NishanLogo locale={locale} />
          </Link>
          <LanguageSelector />
        </div>
      </header>

      <ConnectionStrip />

      <div className="flex-1">{children}</div>

      <footer className="mt-16 border-t border-rule bg-paper">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-8">
          <Link href="/whats-real" className="text-body font-semibold text-teal-deep underline underline-offset-4">
            {resolve("footer.whats_real", {}, locale)}
          </Link>
          <p className="text-label text-ink-soft">{resolve("footer.note", {}, locale)}</p>
        </div>
      </footer>
    </div>
  );
}
