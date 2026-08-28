"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BhashiniWidget } from "./BhashiniWidget";
import { ConnectionStrip } from "./ConnectionStrip";
import { LanguageSelector } from "./LanguageSelector";
import { NishanLogo } from "./NishanLogo";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";
import type { CatalogueKey } from "../lib/content";

/* Site chrome - header, footer, and the two global affordances.
 *
 * The header carries the official portal's whole service surface, but REGROUPED
 * by what a person wants to do rather than by each service's official name.
 * That regrouping is the point: P4 is that the portal's links have
 * near-identical names ("Know Your Status" beside "Status of Self Registered
 * Farmer") with nothing to say which one you need.
 *
 * The §12.7 disclosure band now sits at the end of the footer, by instruction.
 * A chip stays in the header so a reviewer cannot use the whole site without
 * seeing that this is a prototype - the footer is a scroll away, and that
 * control is the one the honesty criterion turns on. */

const MENU: { label: CatalogueKey; items: { label: CatalogueKey; href: string }[] }[] = [
  {
    label: "nav.payments",
    items: [
      { label: "svc.0.name", href: "/who" },
      { label: "svc.1.name", href: "/who" },
      { label: "svc.7.name", href: "/services#svc-7" }
    ]
  },
  {
    label: "nav.registration",
    items: [
      { label: "svc.3.name", href: "/services#svc-3" },
      { label: "svc.4.name", href: "/services#svc-4" },
      { label: "svc.5.name", href: "/services#svc-5" },
      { label: "svc.6.name", href: "/services#svc-6" }
    ]
  },
  {
    label: "nav.help",
    items: [
      { label: "svc.2.name", href: "/who" },
      { label: "faq.title", href: "/faq" },
      { label: "contact.title", href: "/contact" },
      { label: "svc.13.name", href: "/services#svc-13" },
      { label: "svc.14.name", href: "/faq" }
    ]
  }
];

export function SiteChrome({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-cyan-pale text-ink">
      {/* 12.7 - persistent, non-dismissible, on every screen. Styled as a
          version badge and pinned to the viewport so it survives scrolling.
          The full sentence still closes every page in the footer. */}
      <span
        className="fixed right-3 top-3 z-[60] rounded-card border border-ink/15 bg-pending px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-ink shadow-sm print:hidden"
        title={resolve("banner.prototype", {}, locale)}
      >
        {resolve("banner.chip", {}, locale)}
      </span>

      <header className="on-teal bg-teal-deep text-paper">
        <div className="shell flex items-center justify-between gap-3 py-4 pe-[104px]">
          <Link href="/" className="rounded-card">
            <NishanLogo locale={locale} />
          </Link>

          <div className="flex items-center gap-2">
            <nav aria-label={resolve("nav.menu", {}, locale)} className="hidden items-center gap-1 lg:flex">
              {MENU.map((group) => (
                <div
                  key={group.label}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(group.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    aria-expanded={openMenu === group.label}
                    onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}
                    className="inline-flex min-h-12 items-center gap-1.5 whitespace-nowrap rounded-card px-3 text-label font-semibold hover:bg-white/10"
                  >
                    {resolve(group.label, {}, locale)}
                    <svg
                      width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                      strokeWidth="2.25" strokeLinecap="round" aria-hidden="true"
                      className={openMenu === group.label ? "rotate-180 transition-transform" : "transition-transform"}
                    >
                      <path d="m4 7 6 6 6-6" />
                    </svg>
                  </button>

                  {openMenu === group.label && (
                    <ul className="panel-in on-paper absolute left-0 top-full z-40 w-64 overflow-hidden rounded-card border border-rule bg-paper py-1 shadow-lg">
                      {group.items.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            onClick={() => setOpenMenu(null)}
                            className="flex min-h-12 items-center px-4 text-label text-ink hover:bg-cyan-pale"
                          >
                            {resolve(item.label, {}, locale)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              <Link href="/services" className="inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-3 text-label font-semibold hover:bg-white/10">
                {resolve("nav.services", {}, locale)}
              </Link>
              <Link href="/whats-real" className="inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-3 text-label font-semibold hover:bg-white/10">
                {resolve("nav.real", {}, locale)}
              </Link>
            </nav>

            <LanguageSelector />

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-label={resolve("nav.menu", {}, locale)}
              className="grid size-12 shrink-0 place-items-center rounded-card hover:bg-white/10 lg:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {mobileOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav aria-label={resolve("nav.menu", {}, locale)} className="shell border-t border-white/20 pb-4 lg:hidden">
            {MENU.map((group) => (
              <div key={group.label} className="border-b border-white/15 py-2">
                <p className="py-1 text-label font-bold uppercase tracking-wide opacity-80">{resolve(group.label, {}, locale)}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.label + item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-12 items-center text-body"
                  >
                    {resolve(item.label, {}, locale)}
                  </Link>
                ))}
              </div>
            ))}
            <Link href="/services" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center border-b border-white/15 text-body font-semibold">
              {resolve("nav.services", {}, locale)}
            </Link>
            <Link href="/whats-real" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center text-body font-semibold">
              {resolve("nav.real", {}, locale)}
            </Link>
          </nav>
        )}
      </header>

      <ConnectionStrip />

      <div className="flex-1">{children}</div>

      <footer className="mt-16 border-t border-rule bg-paper">
        <div className="shell py-10">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-label font-bold uppercase tracking-wide text-ink-soft">{resolve("nav.services", {}, locale)}</h2>
              <Link href="/services" className="mt-2 flex min-h-12 items-center text-body text-teal-deep underline underline-offset-4">
                {resolve("services.title", {}, locale)}
              </Link>
              <Link href="/whats-real" className="flex min-h-12 items-center text-body text-teal-deep underline underline-offset-4">
                {resolve("footer.whats_real", {}, locale)}
              </Link>
            </div>
            <div>
              <h2 className="text-label font-bold uppercase tracking-wide text-ink-soft">{resolve("footer.about_heading", {}, locale)}</h2>
              <p className="mt-2 prose-measure text-label text-ink">{resolve("footer.note", {}, locale)}</p>
            </div>
          </div>

          <p className="mt-10 rounded-card border-2 border-pending bg-paper p-4 text-center text-body font-semibold text-ink">
            {resolve("banner.prototype", {}, locale)}
          </p>
        </div>
      </footer>

      <BhashiniWidget />
    </div>
  );
}
