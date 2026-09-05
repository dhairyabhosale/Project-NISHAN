"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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

/* useLayoutEffect on the client, useEffect on the server, so the fit check runs
   before paint without warning during SSR. Assigned once at module scope - this
   is not a conditional hook call. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function SiteChrome({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /* WHY THIS EXISTS.
     The desktop nav is flex-none inside a min-w-0 flex-1 track with
     justify-end. flex-none means it never shrinks, so once its intrinsic width
     exceeds the track it does not clip, wrap or compress - it overflows the
     track's LEFT edge and slides straight across the logo lockup. Tamil hit
     this first: its nav measured 983px against a 811px track and covered the
     mark, the wordmark and the subtitle.

     Raising the breakpoint would not have helped. .shell is capped at
     max-width 1152px, so the track is ~811px at every viewport from 1248px up;
     a nav that does not fit at 1280 does not fit at 1920 either.

     So the nav is measured against its track and, when it does not fit, it is
     taken out of flow and the burger takes over - which is the behaviour
     already used below xl. It is moved to right-full rather than hidden with
     display:none so it stays measurable and can come back when the locale
     changes; being off to the left in LTR, it adds no scrollable overflow, and
     visibility:hidden keeps it out of the tab order and the a11y tree.

     Locale-agnostic on purpose: any label set that outgrows the track collapses,
     and every locale that fits is untouched. */
  const navRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const [navFits, setNavFits] = useState(true);

  useIsomorphicLayoutEffect(() => {
    const nav = navRef.current;
    const track = trackRef.current;
    if (!nav || !track || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      // Below xl the nav is display:none and measures 0, which reads as fitting.
      // That is correct: the burger is already showing at those widths.
      const needed = nav.scrollWidth;
      if (needed === 0) { setNavFits(true); return; }

      /* Measure against the space the nav would have IF IT WERE SHOWING, not
         the space left over now. Collapsing reveals the burger, and the burger
         takes its own width plus the gap beside it out of the track - so a
         collapsed nav shrinks the very track it is measured against and can
         never come back. That latch was real, not theoretical: switching Tamil
         back to English at 1440 left the nav collapsed, because English needs
         640px and the burger had cut the track from 690px to 634px.

         Adding the burger's footprint back makes the figure invariant to the
         state it decides, so the measurement is stable in both directions. */
      const burger = burgerRef.current;
      let available = track.clientWidth;
      if (burger && burger.offsetWidth > 0) {
        const row = burger.parentElement;
        const gap = row ? parseFloat(getComputedStyle(row).columnGap) || 0 : 0;
        available += burger.offsetWidth + gap;
      }
      setNavFits(needed <= available);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [locale]);

  return (
    <div className="flex min-h-screen flex-col bg-cyan-pale text-ink">
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
        <div className={`shell flex flex-wrap items-center justify-between gap-x-4 gap-y-3 xl:flex-nowrap ${isLandingPage ? "site-home-pill" : "pb-4 pt-14 lg:pt-12"}`}>
          <Link href="/" className="order-1 flex min-h-12 basis-full shrink-0 items-center rounded-card sm:basis-auto sm:min-w-[195px] xl:mr-2 xl:min-w-[175px]">
            <NishanLogo locale={locale} />
          </Link>

          <div ref={trackRef} className="relative order-3 flex basis-full min-w-0 items-center justify-end gap-3 lg:order-2 lg:w-0 lg:basis-0 lg:flex-1">
            <nav
              ref={navRef}
              aria-label={resolve("nav.menu", {}, locale)}
              className={
                "hidden min-w-0 flex-none items-center gap-2 xl:flex xl:flex-nowrap xl:justify-end xl:gap-5" +
                // Out of flow, off to the left, invisible: still measurable, adds
                // no horizontal overflow, and out of the tab order.
                (navFits ? "" : " xl:absolute xl:right-full xl:top-0 xl:invisible")
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
              ref={burgerRef}
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-label={resolve("nav.menu", {}, locale)}
              className={
                "grid size-12 shrink-0 place-items-center rounded-card hover:bg-white/10" +
                // Hidden at xl only while the desktop nav is actually showing.
                (navFits ? " xl:hidden" : "")
              }
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
            className={
              "shell border-t border-white/20 pb-4" +
              // Must open at xl too when the burger is the only way in.
              (navFits ? " xl:hidden" : "")
            }
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
              <ul className="mt-2 space-y-1">
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
