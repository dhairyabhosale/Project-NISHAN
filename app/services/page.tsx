"use client";

/* All PM-KISAN services - a page of decisions, not a page of links.
 *
 * THE QUESTION THIS PAGE HAS TO SURVIVE: what is the use of a site that sends
 * me to the original one? The previous version could not answer it. Every row
 * outside the three we handled said, in effect, "use the official site", which
 * reads as an excuse and invites exactly that question.
 *
 * Now every row carries a REASON, and the reasons divide into four kinds:
 *
 *   complete   we finish it here, and the row says what the official route does
 *              instead - an app download, or a trip to a counter (P10)
 *   better     the service exists there; we say what answer we add
 *   portal     it writes into a government system we have no sanctioned way to
 *              write to (§2.3), and a form that looked real and submitted
 *              nothing would be worse than a link
 *   scope      a real service we chose not to build, with the product reason
 *
 * The rows are ordinary anchors to the official site where they belong there.
 * Nothing here fetches a government host (§16.6) - a link the reader chooses to
 * follow is not the app contacting anything. They point at the site root rather
 * than guessed deep paths, since verifying a deep link would mean requesting one.
 */

import Link from "next/link";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

const OFFICIAL = "https://pmkisan.gov.in/";

type Tier = "complete" | "better" | "portal" | "scope";

/**
 * Which row is which, and where a completable one goes.
 *
 * The completable rows link to /who rather than straight to an action, because
 * an action needs a case and a case needs an identity. Sending someone to a
 * form for a blocker they may not have would be the same discourtesy as the
 * portal's twelve undifferentiated tiles (P4).
 */
const ROWS: { i: number; tier: Tier; href?: string }[] = [
  // Finish here. P10, answered.
  { i: 17, tier: "complete", href: "/who" },
  { i: 6, tier: "complete", href: "/who" },
  { i: 18, tier: "complete", href: "/who" },
  { i: 19, tier: "complete", href: "/who" },
  // Answered better.
  { i: 0, tier: "better", href: "/who" },
  { i: 1, tier: "better", href: "/who" },
  { i: 2, tier: "better", href: "/who" },
  { i: 13, tier: "better", href: "/who" },
  { i: 7, tier: "better", href: "/who" },
  { i: 14, tier: "better", href: "/faq" },
  // Theirs, because they write into a record we may not touch.
  { i: 3, tier: "portal" },
  { i: 4, tier: "portal" },
  { i: 5, tier: "portal" },
  { i: 12, tier: "portal" },
  { i: 15, tier: "portal" },
  { i: 16, tier: "portal" },
  // Out of scope by decision. §12.8 point 8.
  { i: 8, tier: "scope" },
  { i: 9, tier: "scope" },
  { i: 10, tier: "scope" },
  { i: 11, tier: "scope" }
];

const TIER_HEADING: Record<Tier, CatalogueKey> = {
  complete: "services.tier_complete",
  better: "services.tier_better",
  portal: "services.tier_portal",
  scope: "services.tier_scope"
};

const TIER_NOTE: Record<Tier, CatalogueKey> = {
  complete: "services.tier_complete_note",
  better: "services.tier_better_note",
  portal: "services.tier_portal_note",
  scope: "services.tier_scope_note"
};

const TIER_CARD: Record<Tier, string> = {
  complete: "border-2 border-green bg-green-soft",
  better: "border-2 border-teal-deep bg-paper",
  portal: "border border-rule bg-cyan-pale",
  scope: "border border-rule bg-paper"
};

const arrow = (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d="M7 13 13 7M7.5 7H13v5.5" />
  </svg>
);

export default function ServicesPage() {
  const { locale } = useLocale();
  const k = (s: string) => s as CatalogueKey;

  function Row({ i, tier, href }: { i: number; tier: Tier; href?: string }) {
    const inner = (
      <>
        <span className="text-body font-semibold text-ink">{resolve(k("svc." + i + ".name"), {}, locale)}</span>
        <span className="mt-1 block text-label text-ink">{resolve(k("svc." + i + ".body"), {}, locale)}</span>
        {/* The reason is the row. Without it this page is a list of links. */}
        <span className="mt-3 block border-t border-rule pt-3">
          <span className="block text-label font-bold uppercase tracking-wide text-ink-soft">
            {resolve("services.reason_label", {}, locale)}
          </span>
          <span className="mt-1 block text-label text-ink">{resolve(k("svc." + i + ".reason"), {}, locale)}</span>
        </span>
        {href && (
          <span className="mt-3 block text-label font-semibold text-teal-deep">
            {resolve("services.start_here", {}, locale)}
          </span>
        )}
        {!href && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-label font-semibold text-teal-deep">
            {resolve("services.open_official", {}, locale)}
            {arrow}
          </span>
        )}
      </>
    );

    const className = "card-lift flex h-full flex-col rounded-card p-5 " + TIER_CARD[tier];

    return (
      <li id={"svc-" + i} className="scroll-mt-24">
        {href
          ? <Link href={href} className={className}>{inner}</Link>
          : <a href={OFFICIAL} target="_blank" rel="noopener noreferrer" className={className}>{inner}</a>}
      </li>
    );
  }

  return (
    <main className="page-in pb-16">
      <section className="on-teal bg-teal-deep py-12 text-paper md:py-16">
        <div className="shell">
          <h1 className="text-answer font-semibold leading-tight">{resolve("services.title", {}, locale)}</h1>
          <p className="mt-4 prose-measure text-[20px] font-semibold leading-relaxed">
            {resolve("services.standfirst", {}, locale)}
          </p>
        </div>
      </section>

      {(["complete", "better", "portal", "scope"] as Tier[]).map((tier, index) => (
        <section
          key={tier}
          className={index % 2 === 1 ? "border-y border-rule bg-paper py-12" : "py-12"}
        >
          <div className="shell">
            <h2 className="text-head font-semibold text-ink">{resolve(TIER_HEADING[tier], {}, locale)}</h2>
            <p className="mt-2 prose-measure text-body text-ink">{resolve(TIER_NOTE[tier], {}, locale)}</p>
            <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {ROWS.filter((r) => r.tier === tier).map((r) => <Row key={r.i} {...r} />)}
            </ul>
          </div>
        </section>
      ))}

      <section className="shell py-4">
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
