"use client";

/* S6 - Fix Path. CLAUDE.md §11.7.
 *
 * The recommended route is expanded; the others sit under "Other ways to do
 * this" - and a route that cannot work for this person is shown RULED OUT WITH
 * THE REASON, never hidden. That is §10.4, and it is the most useful thing on
 * the screen: the official portal offers Lakshmi an OTP by default, which is
 * exactly the one route that cannot reach her.
 *
 * Progress is kept in localStorage. §15 cut the service worker and the outbox,
 * so what survives is progress that persists across a reload and never leaves
 * the phone (§12.2). The promise is stated in words, not implied by a spinner. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "../../../../components/LocaleProvider";
import { resolve } from "../../../../content/resolve";
import { renderVerdict } from "../../../../content/verdict";
import { ReadAloudButton } from "../../../../components/ReadAloudButton";
import { AUTHORITY_KEY, authorityFor, fixPathFor, needsOfficer } from "../../../../content/fixPaths";
import type { Diagnosis } from "../../../../lib/types/diagnosis";
import type { CatalogueKey } from "../../../../lib/content";

const tick = { fill: "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function FixView({ reference, diagnosis }: { reference: string; diagnosis: Diagnosis }) {
  const { locale } = useLocale();
  const path = fixPathFor(diagnosis.reason);
  const authority = authorityFor(diagnosis.reason);
  const officer = needsOfficer(diagnosis.reason);
  const verdict = renderVerdict(diagnosis, locale);

  const storageKey = "nishan:fix:" + reference;
  const [done, setDone] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setDone(JSON.parse(raw) as string[]);
    } catch {
      /* private mode or storage disabled - the screen still works, progress
         just does not persist. Never let storage take the page down. */
    }
    setLoaded(true);
  }, [storageKey]);

  function toggle(step: string) {
    setDone((prev) => {
      const next = prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step];
      try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* see above */ }
      return next;
    });
  }

  const primary = path?.routes.find((r) => r.available) ?? null;
  const others = path?.routes.filter((r) => r !== primary) ?? [];
  const steps = primary?.stepKeys ?? [];
  const total = steps.length;
  const doneCount = steps.filter((s) => done.includes(s)).length;

  const fixSpokenText = primary
    ? resolve(primary.labelKey, {}, locale) + ". " + steps.map((s) => resolve(s as CatalogueKey, {}, locale)).join(". ")
    : "";

  return (
    <main className="page-in shell pb-48 pt-8 sm:pb-28">
      <Link href={"/case/" + encodeURIComponent(reference)}
            className="inline-flex min-h-12 items-center text-label font-bold text-ink underline underline-offset-4">
        {resolve("fix.back_to_case", {}, locale)}
      </Link>

      <h1 className="mt-4 text-answer font-semibold leading-tight text-ink">{resolve("fix.title", {}, locale)}</h1>
      <p className="mt-3 prose-measure text-body text-ink">{verdict.sentence}</p>

      <div className="grid gap-x-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="lg:order-2">
      <section className="mt-8 rounded-card border border-rule bg-paper p-4">
        <h2 className="text-label font-semibold uppercase tracking-wide text-ink-soft">
          {resolve("fix.authority_heading", {}, locale)}
        </h2>
        <p className="mt-2 text-head font-semibold text-ink">{resolve(AUTHORITY_KEY[authority], {}, locale)}</p>
        <p className="mt-2 text-label text-ink-soft">
          {resolve(officer ? "fix.needs_officer" : "fix.self_serve", {}, locale)}
        </p>
      </section>

      </div>
      <div className="lg:order-1">
      {primary ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-head font-semibold text-ink flex-1 min-w-[200px]">{resolve(primary.labelKey, {}, locale)}</h2>
            {fixSpokenText && <ReadAloudButton text={fixSpokenText} className="shrink-0" />}
          </div>
          <p className="mt-1 text-label text-ink-soft">
            {resolve("fix.effect_days", { days: primary.effectDays }, locale)}
          </p>
          {loaded && total > 0 && (
            <p className="mt-3 text-label font-semibold text-teal-deep">
              {resolve("fix.progress", { done: doneCount, total }, locale)}
            </p>
          )}

          <ol className="mt-4 space-y-3">
            {steps.map((s, i) => {
              const isDone = done.includes(s);
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    aria-pressed={isDone}
                    className={`flex w-full items-start gap-3 rounded-card border p-4 text-left ${
                      isDone ? "border-green bg-green-soft" : "border-rule bg-paper"
                    }`}
                  >
                    <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-card border-2 ${
                      isDone ? "border-ink text-ink" : "border-rule text-ink-soft"
                    }`}>
                      {isDone
                        ? <svg width="16" height="16" viewBox="0 0 20 20" {...tick} aria-hidden="true"><path d="m4 10.5 4 4 8-9" /></svg>
                        : <span className="data text-label">{i + 1}</span>}
                    </span>
                    <span className="flex-1 text-body text-ink">{resolve(s, {}, locale)}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {primary.carryKeys.length > 0 && (
            <div className="mt-6 rounded-card border border-rule bg-paper p-4">
              <h3 className="text-label font-semibold uppercase tracking-wide text-ink-soft">
                {resolve("fix.carry_heading", {}, locale)}
              </h3>
              <ul className="mt-3 space-y-2">
                {primary.carryKeys.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-body text-ink">
                    <span aria-hidden="true" className="mt-1.5 size-4 shrink-0 rounded-[2px] border-2 border-ink-soft" />
                    <span>{resolve(c, {}, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section className="mt-8 rounded-card border border-rule bg-paper p-4">
          <p className="text-body text-ink">
            {resolve("fix.no_steps", {
              reg_no: diagnosis.facts.reg_no ?? "",
              authority: resolve(AUTHORITY_KEY[authority], {}, locale)
            }, locale)}
          </p>
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="text-head font-semibold text-ink">{resolve("fix.other_routes", {}, locale)}</h2>
          <ul className="mt-4 space-y-3">
            {others.map((r) => (
              <li key={r.id} className={`rounded-card border p-4 ${r.available ? "border-rule bg-paper" : "border-pending bg-paper"}`}>
                <p className="text-body font-semibold text-ink">{resolve(r.labelKey, {}, locale)}</p>
                {r.available ? (
                  <ol className="mt-3 space-y-2">
                    {r.stepKeys.map((s) => (
                      <li key={s} className="text-body text-ink">{resolve(s, {}, locale)}</li>
                    ))}
                  </ol>
                ) : (
                  <>
                    <p className="mt-3 text-label font-semibold uppercase tracking-wide text-ink-soft">
                      {resolve("fix.ruled_out", {}, locale)}
                    </p>
                    <p className="mt-1 prose-measure text-body text-ink">
                      {resolve(r.unavailableBecauseKey as CatalogueKey, {}, locale)}
                    </p>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      </div>
      </div>

      {/* Where the journey forks. A blocker only an officer can clear needs a
          complaint with a deadline behind it (§3.6); a self-serve one does not,
          and offering one anyway would send a reader to file about something
          they can finish themselves in ten minutes. */}
      {officer && (
        <p className="mt-8 prose-measure rounded-card border border-rule bg-paper p-4 text-label text-ink">
          {resolve("fix.complain_note", {}, locale)}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper p-4 pb-24 sm:pb-4">
        <div className="shell flex flex-col gap-3 sm:flex-row">
          <Link
            href={"/case/" + encodeURIComponent(reference) + "/fix/slip"}
            className={
              "flex min-h-14 flex-1 items-center justify-center rounded-card text-body font-semibold " +
              (officer ? "border-2 border-teal-deep text-teal-deep" : "bg-teal-deep text-paper")
            }
          >
            {resolve("fix.slip_cta", {}, locale)}
          </Link>
          {officer && (
            <Link
              href={"/case/" + encodeURIComponent(reference) + "/complaint"}
              className="flex min-h-14 flex-1 items-center justify-center rounded-card bg-teal-deep px-4 text-center text-body font-semibold text-paper"
            >
              {resolve("fix.complain_cta", {}, locale)}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
