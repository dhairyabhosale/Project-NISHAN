"use client";

/* S8 - Grievance. CLAUDE.md §11.7 S8, §3.7.
 *
 * This is the screen that demonstrates §3.7, and the demonstration is the chip
 * row rather than the letter. Every chip is a fact the case already held before
 * the reader arrived: the instalment, the release date, the exact string the
 * government website shows, the land record number, the registration number.
 * A farmer who cannot read the status page could not have listed any of them,
 * and an officer who receives them does not have to write back and ask.
 *
 * The draft is shown BEFORE filing and is editable, because a complaint the
 * reader has not read is not their complaint.
 *
 * The disclosure at the file button is §12.7 and is not negotiable: the button
 * looks and behaves exactly like one that files a real grievance, which is the
 * single most misleading moment in the product if it is left unlabelled.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "../../../../components/LocaleProvider";
import { resolve } from "../../../../content/resolve";
import { factChips, draftBody } from "../../../../content/grievance";
import { fixPathFor, needsOfficer, authorityFor, AUTHORITY_KEY } from "../../../../content/fixPaths";
import { clockFor } from "../../../../lib/escalation";
import { readFiledAt, writeFiledAt } from "../../../../lib/grievanceStore";
import type { Diagnosis } from "../../../../lib/types/diagnosis";

export function ComplaintView({ reference, diagnosis, initialDraft, totalSteps }: {
  reference: string;
  diagnosis: Diagnosis;
  initialDraft: string;
  totalSteps: number;
}) {
  const { locale } = useLocale();
  const officer = needsOfficer(diagnosis.reason);
  const path = fixPathFor(diagnosis.reason);
  const authority = authorityFor(diagnosis.reason);

  const [filedAt, setFiledAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stepsDone, setStepsDone] = useState(0);
  const [body, setBody] = useState(initialDraft);
  /* Once the reader has typed, the draft is theirs and nothing regenerates it.
     Without this, reading storage or switching language would silently discard
     an edit - and a complaint the reader did not write is the thing this screen
     exists to avoid. */
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setFiledAt(readFiledAt(reference));
    try {
      const raw = window.localStorage.getItem("nishan:fix:" + reference);
      if (raw) setStepsDone((JSON.parse(raw) as string[]).length);
    } catch { /* storage refused; the draft simply omits the steps line */ }
    setLoaded(true);
  }, [reference]);

  /* The draft is generated once the saved progress is known, so the steps line
     is right the first time rather than rewriting itself under the reader. */
  useEffect(() => {
    if (loaded && !dirty) setBody(draftBody(diagnosis, stepsDone, totalSteps, locale));
  }, [loaded, dirty, stepsDone, totalSteps, diagnosis, locale]);

  const chips = useMemo(
    () => factChips(diagnosis, stepsDone, totalSteps, locale),
    [diagnosis, stepsDone, totalSteps, locale]
  );

  async function file() {
    setBusy(true);
    const now = new Date().toISOString();
    // Written to the device BEFORE the network attempt, so a lost connection
    // cannot lose the filing (§8.7's ordering, applied to what survives here).
    writeFiledAt(reference, now);
    setFiledAt(now);
    try {
      await fetch("/api/grievance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference, filedAt: now })
      });
    } catch { /* offline: the clock still runs from the saved date */ }
    setBusy(false);
  }

  if (!officer) {
    return (
      <main className="page-in shell pb-16 pt-8">
        <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("complaint.title", {}, locale)}</h1>
        <p className="mt-4 prose-measure text-body text-ink">{resolve("complaint.not_needed", {}, locale)}</p>
        <p className="mt-4 prose-measure text-body text-ink">{resolve("complaint.not_needed_2", {}, locale)}</p>
        <Link href={"/case/" + encodeURIComponent(reference) + "/fix"}
              className="mt-8 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper">
          {resolve("complaint.back", {}, locale)}
        </Link>
      </main>
    );
  }

  if (filedAt) {
    const clock = clockFor(filedAt, new Date().toISOString());
    return (
      <main className="page-in shell pb-16 pt-8">
        <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("complaint.filed_heading", {}, locale)}</h1>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-rule bg-paper p-5">
            <dt className="text-label text-ink-soft">{resolve("complaint.filed_reference", {}, locale)}</dt>
            <dd className="data mt-1 text-answer font-bold text-teal-deep">{reference}</dd>
          </div>
          <div className="rounded-card border-2 border-teal-deep bg-paper p-5">
            <dt className="text-label text-ink-soft">{resolve("complaint.filed_expected", {}, locale)}</dt>
            <dd className="data mt-1 text-answer font-bold text-ink">{clock.dueAt.slice(0, 10)}</dd>
          </div>
        </dl>

        <p className="mt-6 prose-measure text-body text-ink">{resolve("complaint.filed_if_passes", {}, locale)}</p>

        <Link href={"/case/" + encodeURIComponent(reference) + "/timeline"}
              className="mt-8 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper">
          {resolve("complaint.filed_timeline", {}, locale)}
        </Link>
      </main>
    );
  }

  return (
    <main className="page-in shell pb-48 pt-8 sm:pb-28">
      <Link href={"/case/" + encodeURIComponent(reference) + "/fix"} className="flex min-h-12 items-center text-label font-semibold text-teal-deep underline">
        {resolve("complaint.back", {}, locale)}
      </Link>

      <h1 className="mt-2 text-answer font-semibold leading-tight text-ink">{resolve("complaint.title", {}, locale)}</h1>
      <p className="mt-3 prose-measure text-body text-ink">{resolve("complaint.standfirst", {}, locale)}</p>

      {/* §3.7 made visible. Not decoration: this row is the argument. */}
      <section className="mt-8 rounded-card border border-rule bg-paper p-5">
        <h2 className="text-head font-semibold text-ink">{resolve("complaint.facts_heading", {}, locale)}</h2>
        <p className="mt-2 prose-measure text-label text-ink-soft">{resolve("complaint.facts_note", {}, locale)}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li key={c.labelKey} className="rounded-card border border-teal-deep bg-cyan-pale px-3 py-2">
              <span className="block text-label text-ink-soft">{resolve(c.labelKey, {}, locale)}</span>
              <span className="block max-w-[42ch] text-label font-semibold text-ink">{c.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <label htmlFor="draft" className="mt-8 block text-label font-semibold text-ink">
        {resolve("complaint.draft_label", {}, locale)}
      </label>
      <p className="mt-1 text-label text-ink-soft">{resolve("complaint.edit_hint", {}, locale)}</p>
      <textarea
        id="draft"
        value={body}
        onChange={(e) => { setDirty(true); setBody(e.target.value); }}
        rows={16}
        className="mt-2 w-full rounded-card border-2 border-rule bg-paper p-4 text-body leading-relaxed text-ink"
      />

      <section className="mt-8 rounded-card border border-rule bg-paper p-5">
        <h2 className="text-head font-semibold text-ink">{resolve("complaint.routing_heading", {}, locale)}</h2>
        <p className="mt-2 prose-measure text-body text-ink">
          {resolve("complaint.routing_body", { authority: resolve(AUTHORITY_KEY[authority], {}, locale) }, locale)}
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper p-4 pb-24 sm:pb-4">
        <div className="shell">
          {/* §12.7: in place, at the moment a reader is most likely to believe
              this is the real service. */}
          <p className="mb-3 rounded-card border-2 border-pending bg-paper p-3 text-label font-semibold text-ink">
            {resolve("complaint.disclosure", {}, locale)}
          </p>
          <button
            type="button"
            onClick={file}
            disabled={busy || !loaded || body.trim().length === 0}
            className="min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
          >
            {resolve(busy ? "complaint.filing" : "complaint.file", {}, locale)}
          </button>
        </div>
      </div>
    </main>
  );
}
