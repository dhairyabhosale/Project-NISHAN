"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BhashiniWidget } from "./BhashiniWidget";
import { ConnectionStrip } from "./ConnectionStrip";
import { LanguageSelector } from "./LanguageSelector";
import { NishanLogo } from "./NishanLogo";
import { RouteSweep } from "./RouteSweep";
import { ScrollReveal } from "./ScrollReveal";
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
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /* THE NAV NO LONGER MEASURES ITSELF. It used to: the nav was compared against
     its track and, when it did not fit, it was taken out of flow and the burger
     took over. That was a locale-triggered collapse wearing a measurement's
     clothes, because the only label set that ever failed the test was Tamil.

     It produced three faults. On any route but the landing page Tamil collapsed
     at every desktop width, because the nav needed 983px against a 527px track.
     On the landing page it LATCHED: the pill gives the track flex: 1 1 auto, so
     once the nav went out of flow the track had no in-flow content and measured
     0px wide, and 0 is smaller than every locale's nav. Switching back to
     English re-ran the effect, measured 0 again, and stayed collapsed until a
     hard reload. And it meant a hamburger could appear on a 1920px screen,
     which is not a thing a desktop should ever show.

     The rule now is one line long: below lg the burger, at lg and above the
     full nav, in every locale. There is no state, so there is nothing to go
     stale, and the answer cannot depend on anything but the viewport.

     Tamil is made to FIT instead, in globals.css, by tightening only its own
     spacing under html[lang="ta"]. That is why this file no longer needs to
     know which language it is rendering. */

  return (
    <div className="flex min-h-screen flex-col bg-cyan-pale text-ink">
      {/* Both render nothing. One arms below-the-fold reveals, the other
          draws the route change on the top edge. */}
      <ScrollReveal />
      <RouteSweep />
      {/* Solid --teal-deep on EVERY route, landing page included. The
          transparent-over-the-hero variant is gone with the media it existed
          for: white nav over a photograph is not a colour problem that can be
          solved, because the strip the header sits across runs from luminance
          0.065 to 0.947 - dark trees against bright sky - and no text colour
          clears that range. The band sits above the image instead. */}
      <header className={`on-teal relative text-paper ${isLandingPage ? "site-home-header" : "bg-teal-deep"}`}>
        <p className="site-prototype-badge absolute right-3 top-2 z-10 rounded-card border-2 border-pending bg-pending px-2.5 py-1 text-label font-bold text-ink sm:right-4">
          {resolve("banner.chip", {}, locale)}
        </p>
        {/* `rise` here rather than on <header>: this lives in the layout, so it
            plays once per full page load and not on client-side navigation,
            which is the "first time" the entrance is meant to mark. */}
        <div className={`rise shell flex flex-wrap items-center justify-between gap-x-4 gap-y-3 lg:flex-nowrap ${isLandingPage ? "site-home-pill" : "pb-4 pt-14 lg:pt-12"}`}>
          <Link href="/" className="order-1 flex min-h-12 basis-full shrink-0 items-center rounded-card sm:basis-auto sm:min-w-[195px] lg:mr-2 lg:min-w-[175px]">
            <NishanLogo locale={locale} />
          </Link>

          <div className="relative order-3 flex basis-full min-w-0 items-center justify-end gap-3 lg:order-2 lg:w-0 lg:basis-0 lg:flex-1">
            <nav
              aria-label={resolve("nav.menu", {}, locale)}
              className={
                "site-nav hidden min-w-0 flex-none items-center gap-2 lg:flex lg:flex-nowrap lg:justify-end lg:gap-5"
              }
            >
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
                    className="nav-pop inline-flex min-h-12 items-center gap-1 whitespace-nowrap rounded-card px-1.5 text-label font-semibold lg:px-0"
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

              <Link href="/how-it-works" className="nav-pop inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-1.5 text-label font-semibold lg:px-0">
                {resolve("nav.how_it_works", {}, locale)}
              </Link>
              <Link href="/demo" className="nav-pop inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-1.5 text-label font-semibold lg:px-0">
                {resolve("nav.demo", {}, locale)}
              </Link>
              <Link href="/services" className="nav-pop inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-1.5 text-label font-semibold lg:px-0">
                {resolve("nav.services", {}, locale)}
              </Link>
              <Link href="/whats-real" className="nav-pop inline-flex min-h-12 items-center whitespace-nowrap rounded-card px-1.5 text-label font-semibold lg:px-0">
                {resolve("nav.real", {}, locale)}
              </Link>
            </nav>

          </div>

          <div className="order-2 ml-auto flex basis-full items-center justify-end gap-2 sm:basis-auto lg:order-3 lg:shrink-0 lg:ml-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-label={resolve("nav.menu", {}, locale)}
              // Viewport only. No locale, at any width, may bring this back
              // on a desktop screen.
              className="grid size-12 shrink-0 place-items-center rounded-card hover:bg-white/10 lg:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {mobileOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            aria-label={resolve("nav.menu", {}, locale)}
            className="shell border-t border-white/20 pb-4 lg:hidden"
          >
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
              className="btn-pop grid min-h-12 min-w-12 shrink-0 place-items-center rounded-card border border-teal-deep bg-teal-deep px-3 text-body font-semibold text-paper hover:bg-teal-deep/90"
            >
              <span aria-hidden="true">↑</span>
              <span className="sr-only">{resolve("footer.back_to_top", {}, locale)}</span>
            </button>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-label font-bold uppercase tracking-wide text-ink-soft">{resolve("nav.services", {}, locale)}</h2>
              <ul className="mt-2 space-y-2">
                <li>
                  <Link href="/who" className="flex min-h-12 items-center text-body text-teal-deep hover:underline">
                    {resolve("nav.find", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="flex min-h-12 items-center text-body text-teal-deep hover:underline">
                    {resolve("nav.how_it_works", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="flex min-h-12 items-center text-body text-teal-deep hover:underline">
                    {resolve("nav.demo", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="flex min-h-12 items-center text-body text-teal-deep hover:underline">
                    {resolve("services.title", {}, locale)}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-label font-bold uppercase tracking-wide text-ink-soft">{resolve("footer.whats_real", {}, locale)}</h2>
              <ul className="mt-2 space-y-2">
                <li>
                  <Link href="/whats-real" className="flex min-h-12 items-center text-body text-teal-deep hover:underline">
                    {resolve("footer.whats_real", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="flex min-h-12 items-center text-body text-teal-deep hover:underline">
                    {resolve("faq.title", {}, locale)}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="flex min-h-12 items-center text-body text-teal-deep hover:underline">
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
