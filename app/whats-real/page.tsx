"use client";

/* S10 - What's real. CLAUDE.md §12.2.
 *
 * Reads as a spec sheet, not an apology. Several rows are unflattering on
 * purpose: a reviewer who finds one honest row trusts the rest, and overstating
 * on the one page whose entire job is honesty defeats the page.
 *
 * Only the STATUS TONE lives in this file. Every word is a catalogue key
 * (§16.4), which is also what lets this page be translated with the rest. */

import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

type Status = "real" | "simulated" | "partial" | "not_built" | "planned";

const TONE: Record<Status, string> = {
  real: "bg-green-soft text-ink",
  simulated: "bg-cyan-pale text-ink",
  partial: "bg-pending text-ink",
  not_built: "bg-cyan-pale text-ink-soft",
  planned: "bg-cyan-pale text-ink-soft"
};

/**
 * One entry per row, with the catalogue keys written out in full.
 *
 * They are literals rather than `"real.row." + i` on purpose. The index form
 * had to cast a runtime string to CatalogueKey, which switched the type check
 * off exactly where it was needed: this list carried a nineteenth status while
 * the catalogue held eighteen rows, and row 18 shipped to production as three
 * bare hyphens. The same silent cast had also let the tones drift two rows out
 * of step, so "Voice input - Planned" was being painted in the green REAL tone
 * on the one page whose whole job is to not overstate.
 *
 * Written as literals, a missing or misspelled key is a compile error, and the
 * status sits beside the row it describes where a drift is visible on sight.
 */
const ROWS: { status: Status; component: CatalogueKey; label: CatalogueKey; note: CatalogueKey }[] = [
  { status: "real",      component: "real.row.0.component",  label: "real.row.0.label",  note: "real.row.0.note" },
  { status: "real",      component: "real.row.1.component",  label: "real.row.1.label",  note: "real.row.1.note" },
  { status: "real",      component: "real.row.2.component",  label: "real.row.2.label",  note: "real.row.2.note" },
  { status: "not_built", component: "real.row.3.component",  label: "real.row.3.label",  note: "real.row.3.note" },
  { status: "partial",   component: "real.row.4.component",  label: "real.row.4.label",  note: "real.row.4.note" },
  { status: "partial",   component: "real.row.5.component",  label: "real.row.5.label",  note: "real.row.5.note" },
  { status: "partial",   component: "real.row.6.component",  label: "real.row.6.label",  note: "real.row.6.note" },
  { status: "simulated", component: "real.row.7.component",  label: "real.row.7.label",  note: "real.row.7.note" },
  { status: "simulated", component: "real.row.8.component",  label: "real.row.8.label",  note: "real.row.8.note" },
  { status: "simulated", component: "real.row.9.component",  label: "real.row.9.label",  note: "real.row.9.note" },
  { status: "simulated", component: "real.row.10.component", label: "real.row.10.label", note: "real.row.10.note" },
  { status: "real",      component: "real.row.11.component", label: "real.row.11.label", note: "real.row.11.note" },
  { status: "not_built", component: "real.row.12.component", label: "real.row.12.label", note: "real.row.12.note" },
  { status: "not_built", component: "real.row.13.component", label: "real.row.13.label", note: "real.row.13.note" },
  { status: "not_built", component: "real.row.14.component", label: "real.row.14.label", note: "real.row.14.note" },
  { status: "real",      component: "real.row.15.component", label: "real.row.15.label", note: "real.row.15.note" },
  { status: "planned",   component: "real.row.16.component", label: "real.row.16.label", note: "real.row.16.note" },
  { status: "planned",   component: "real.row.17.component", label: "real.row.17.label", note: "real.row.17.note" }
];

const LIMIT_COUNT = 7;

export default function WhatsRealPage() {
  const { locale } = useLocale();
  const k = (s: string) => s as CatalogueKey;

  return (
    <main className="page-in shell pb-16 pt-8">
      <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("real.title", {}, locale)}</h1>
      <p className="mt-4 prose-measure text-body text-ink">{resolve("real.intro", {}, locale)}</p>

      <ul className="mt-8 grid gap-3 lg:grid-cols-2">
        {ROWS.map((row) => (
          <li key={row.component} className="h-full rounded-card border border-rule bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-body font-semibold text-ink">
                {resolve(row.component, {}, locale)}
              </h2>
              <span className={`shrink-0 rounded-card px-2 py-1 text-[13px] font-semibold ${TONE[row.status]}`}>
                {resolve(row.label, {}, locale)}
              </span>
            </div>
            <p className="mt-2 prose-measure text-label text-ink">
              {resolve(row.note, {}, locale)}
            </p>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-head font-semibold text-ink">{resolve("real.limits_heading", {}, locale)}</h2>
      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {Array.from({ length: LIMIT_COUNT }, (_, i) => (
          <li key={i} className="flex gap-3 text-body text-ink">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink-soft" />
            <span className="prose-measure">{resolve(k("real.limit." + i), {}, locale)}</span>
          </li>
        ))}
      </ul>

      <section className="mt-12 rounded-card border border-rule bg-paper p-4">
        <h2 className="text-head font-semibold text-ink">{resolve("real.delete_heading", {}, locale)}</h2>
        <p className="mt-2 prose-measure text-body text-ink">{resolve("real.delete_body", {}, locale)}</p>
      </section>
    </main>
  );
}
