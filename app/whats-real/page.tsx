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

/** Row order matches the catalogue's real.row.N.* keys. */
const STATUSES: Status[] = [
  "real", "real", "real", "not_built", "partial", "partial", "partial",
  "simulated", "simulated", "simulated", "simulated", "real",
  "not_built", "not_built", "not_built", "not_built", "planned", "planned"
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
        {STATUSES.map((status, i) => (
          <li key={i} className="h-full rounded-card border border-rule bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-body font-semibold text-ink">
                {resolve(k("real.row." + i + ".component"), {}, locale)}
              </h2>
              <span className={`shrink-0 rounded-card px-2 py-1 text-[13px] font-semibold ${TONE[status]}`}>
                {resolve(k("real.row." + i + ".label"), {}, locale)}
              </span>
            </div>
            <p className="mt-2 prose-measure text-label text-ink">
              {resolve(k("real.row." + i + ".note"), {}, locale)}
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
