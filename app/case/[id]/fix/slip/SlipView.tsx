"use client";

/* S7 — Visit Slip. CLAUDE.md §11.7.
 *
 * Designed as a physical artifact, not a web page that happens to print. The
 * case reference is large mono at the top because it is the first thing an
 * officer will copy; the ask is one sentence in the officer's own vocabulary,
 * because §3.7 says a request naming the exact field and value resolves faster;
 * and there is blank space labelled "Officer's note", because a slip that gets
 * written on gets kept.
 *
 * The ask is the ONE place system vocabulary is allowed in our own prose — it
 * is addressed to an officer, not to a farmer, and §16.5 governs farmer-facing
 * copy. The verdict sentence beside it stays in plain language so she can read
 * what she is carrying. */

import Link from "next/link";
import { useLocale } from "../../../../../components/LocaleProvider";
import { resolve } from "../../../../../content/resolve";
import { renderVerdict } from "../../../../../content/verdict";
import { AUTHORITY_KEY, authorityFor, fixPathFor } from "../../../../../content/fixPaths";
import type { Diagnosis } from "../../../../../lib/types/diagnosis";
import type { CatalogueKey } from "../../../../../lib/content";

export function SlipView({ reference, diagnosis }: { reference: string; diagnosis: Diagnosis }) {
  const { locale } = useLocale();
  const path = fixPathFor(diagnosis.reason);
  const authority = authorityFor(diagnosis.reason);
  const verdict = renderVerdict(diagnosis, locale);
  const f = diagnosis.facts;
  const carry = path?.routes.find((r) => r.available)?.carryKeys ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 pb-40 pt-8 print:px-0 print:pb-0 print:pt-0">
      <div className="print:hidden">
        <Link href={"/case/" + encodeURIComponent(reference) + "/fix"}
              className="inline-flex min-h-12 items-center text-label font-bold text-ink underline underline-offset-4">
          {resolve("fix.back_to_case", {}, locale)}
        </Link>
      </div>

      <article className="mt-4 rounded-card border-2 border-ink bg-paper p-6 print:rounded-none print:border-0 print:p-0">
        <p className="text-label font-semibold uppercase tracking-wide text-ink-soft">
          {resolve("slip.title", {}, locale)} · {resolve("slip.for_officer", {}, locale)}
        </p>
        <p className="data mt-1 text-answer font-bold text-ink">{reference}</p>

        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-ink pt-4">
          <dt className="text-label text-ink-soft">{resolve("slip.case_for", {}, locale)}</dt>
          <dd className="text-body font-semibold text-ink">{f.name ?? "—"}</dd>
          <dt className="text-label text-ink-soft">{resolve("slip.village", {}, locale)}</dt>
          <dd className="text-body text-ink">{f.village ?? "—"}{f.state ? ", " + f.state : ""}</dd>
          <dt className="text-label text-ink-soft">{resolve("carry.reg_no", {}, locale)}</dt>
          <dd className="data text-ink">{f.reg_no ?? "—"}</dd>
          <dt className="text-label text-ink-soft">{resolve("slip.instalment", {}, locale)}</dt>
          <dd className="data text-ink">{f.cycle ?? "—"} · ₹{f.amount ?? "—"}</dd>
          {diagnosis.portalStatus && (
            <>
              <dt className="text-label text-ink-soft">{resolve("slip.portal_status", {}, locale)}</dt>
              <dd className="data text-ink">{diagnosis.portalStatus}</dd>
            </>
          )}
        </dl>

        <section className="mt-6 border-t border-ink pt-4">
          <h2 className="text-label font-semibold uppercase tracking-wide text-ink-soft">
            {resolve("slip.blocker_heading", {}, locale)}
          </h2>
          <p className="mt-2 max-w-[62ch] text-body text-ink">{verdict.sentence}</p>
        </section>

        <section className="mt-6 border-t border-ink pt-4">
          <h2 className="text-label font-semibold uppercase tracking-wide text-ink-soft">
            {resolve("slip.ask_heading", {}, locale)} · {resolve(AUTHORITY_KEY[authority], {}, locale)}
          </h2>
          <p className="mt-2 max-w-[62ch] text-body font-semibold text-ink">
            {path
              ? resolve(path.requestKey, f, locale)
              : resolve("fix.no_steps", { reg_no: f.reg_no ?? "", authority: resolve(AUTHORITY_KEY[authority], {}, locale) }, locale)}
          </p>
        </section>

        {carry.length > 0 && (
          <section className="mt-6 border-t border-ink pt-4">
            <h2 className="text-label font-semibold uppercase tracking-wide text-ink-soft">
              {resolve("slip.documents", {}, locale)}
            </h2>
            <ul className="mt-3 space-y-2">
              {carry.map((c) => (
                <li key={c} className="flex items-start gap-3 text-body text-ink">
                  <span aria-hidden="true" className="mt-1 size-4 shrink-0 border-2 border-ink" />
                  <span>{resolve(c as CatalogueKey, {}, locale)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* A slip that gets written on gets kept. */}
        <section className="mt-6 border-t border-ink pt-4">
          <h2 className="text-label font-semibold uppercase tracking-wide text-ink-soft">
            {resolve("slip.officer_note", {}, locale)}
          </h2>
          <div aria-hidden="true" className="mt-3 space-y-6">
            <div className="border-b border-rule" />
            <div className="border-b border-rule" />
            <div className="border-b border-rule" />
          </div>
        </section>

        <p className="mt-6 border-t border-ink pt-3 text-label text-ink-soft">
          {resolve("slip.footer", {}, locale)}
        </p>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper p-4 print:hidden">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper"
          >
            {resolve("slip.print", {}, locale)}
          </button>
        </div>
      </div>
    </main>
  );
}
