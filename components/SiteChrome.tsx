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

/* Site chrome - header, footer, and global affordances. */

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
      { label: "svc.2.name", href: "/services#svc-2" },
      { label: "contact.title", href: "/contact" },
      { label: "faq.title", href: "/faq" }
    ]
  }
];

export function SiteChrome({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="flex min-h-screen flex-col bg-cyan-pale text-ink">
      <header className="on-teal relative bg-teal-deep text-paper">
        <p className="site-prototype-badge absolute right-3 top-2 z-10 rounded-card border-2 border-pending bg-paper px-2.5 py-1 text-label font-bold text-pending sm:right-4">
          {resolve("banner.chip", {}, locale)}
        </p>
        <div className="shell flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-4 pt-14 lg:pt-12 xl:flex-nowrap">
          <Link href="/" className="order-1 basis-full shrink-0 rounded-card sm:basis-auto sm:min-w-[195px] xl:mr-2 xl:min-w-[175px]">
            <NishanLogo locale={locale} />
          </Link>

          <div className="order-3 flex basis-full min-w-0 items-center justify-end gap-3 lg:order-2 lg:w-0 lg:basis-0 lg:flex-1">
            <nav aria-label={resolve("nav.menu", {}, locale)} className="hidden min-w-0 flex-none items-center gap-2 xl:flex xl:flex-nowrap xl:justify-end xl:gap-5">
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
                    className="inline-flex min-h-12 items-center gap-1 whitespace-nowrap rounded-card px-1.5 text-label font-semibold hover:bg-white/10 xl:px-0"
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

              <Link href="/how-it-works" className="inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-1.5 text-label font-semibold hover:bg-white/10 xl:px-0">
                {resolve("nav.how_it_works", {}, locale)}
              </Link>
              <Link href="/demo" className="inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-1.5 text-label font-semibold hover:bg-white/10 xl:px-0">
                {resolve("nav.demo", {}, locale)}
              </Link>
              <Link href="/services" className="inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-1.5 text-label font-semibold hover:bg-white/10 xl:px-0">
                {resolve("nav.services", {}, locale)}
              </Link>
              <Link href="/whats-real" className="inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-1.5 text-label font-semibold hover:bg-white/10 xl:px-0">
                {resolve("nav.real", {}, locale)}
              </Link>
            </nav>

          </div>

          <div className="order-2 ml-auto flex basis-full items-center justify-end gap-2 sm:basis-auto lg:order-3 lg:shrink-0 xl:ml-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-label={resolve("nav.menu", {}, locale)}
              className="grid size-12 shrink-0 place-items-center rounded-card hover:bg-white/10 xl:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {mobileOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav aria-label={resolve("nav.menu", {}, locale)} className="shell border-t border-white/20 pb-4 xl:hidden">
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
            <Link href="/how-it-works" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center border-b border-white/15 text-body font-semibold">
              {resolve("nav.how_it_works", {}, locale)}
            </Link>
            <Link href="/demo" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center border-b border-white/15 text-body font-semibold">
              {resolve("nav.demo", {}, locale)}
            </Link>
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
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={backToTop}
              aria-label={resolve("footer.back_to_top", {}, locale)}
              className="grid min-h-12 min-w-12 shrink-0 place-items-center rounded-card border border-teal-deep bg-teal-deep px-3 text-body font-semibold text-paper hover:bg-teal-deep/90"
            >
              <span aria-hidden="true">↑</span>
              <span className="sr-only">{resolve("footer.back_to_top", {}, locale)}</span>
            </button>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-label font-bold uppercase tracking-wide text-ink-soft">{resolve("nav.services", {}, locale)}</h2>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link href="/who" className="flex min-h-10 items-center text-body text-teal-deep hover:underline">
                    {resolve("nav.find", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="flex min-h-10 items-center text-body text-teal-deep hover:underline">
                    {resolve("nav.how_it_works", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="flex min-h-10 items-center text-body text-teal-deep hover:underline">
                    {resolve("nav.demo", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="flex min-h-10 items-center text-body text-teal-deep hover:underline">
                    {resolve("services.title", {}, locale)}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-label font-bold uppercase tracking-wide text-ink-soft">{resolve("footer.whats_real", {}, locale)}</h2>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link href="/whats-real" className="flex min-h-10 items-center text-body text-teal-deep hover:underline">
                    {resolve("footer.whats_real", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="flex min-h-10 items-center text-body text-teal-deep hover:underline">
                    {resolve("faq.title", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="flex min-h-10 items-center text-body text-teal-deep hover:underline">
                    {resolve("contact.title", {}, locale)}
                  </Link>
                </li>
              </ul>
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
