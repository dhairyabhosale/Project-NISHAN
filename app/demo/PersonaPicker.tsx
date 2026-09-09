"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetCase, reportReset } from "../../lib/caseReset";
import { DiagnosticWait, useDiagnosticWait } from "../../components/DiagnosticWait";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

export interface PersonaCard {
  ref: string;
  label: string;
  reference: string;
  aadhaar: string;
  regNo: string;
  portalStatus: string;
  category: "healthy" | "ekyc" | "bank" | "land" | "eligibility";
}

export function PersonaPicker({ personas }: { personas: PersonaCard[] }) {
  const { locale } = useLocale();
  const k = (s: string) => s as CatalogueKey;
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [selectedRef, setSelectedRef] = useState<string>(personas[0]?.ref ?? "");
  const [working, run] = useDiagnosticWait();
  /* null = not asked yet. "none" vs "done" so the control reports what it
     actually did rather than claiming a reset it did not perform, which is the
     rule DeleteCaseButton already follows. */
  const [wiped, setWiped] = useState<"none" | "done" | null>(null);

  const filtered = filter === "all"
    ? personas
    : personas.filter((p) => p.category === filter);

  const selectedPersona = personas.find((p) => p.ref === selectedRef) ?? personas[0];
  const filterTabs = [
    { id: "all", label: resolve("demo.filter_all", {}, locale) },
    { id: "healthy", label: resolve("demo.filter_healthy", {}, locale) },
    { id: "ekyc", label: resolve("demo.filter_ekyc", {}, locale) },
    { id: "bank", label: resolve("demo.filter_bank", {}, locale) },
    { id: "land", label: resolve("demo.filter_land", {}, locale) },
    { id: "eligibility", label: resolve("demo.filter_eligibility", {}, locale) }
  ];

  /* The same code path as "Do this again" on a completed action: both clear
     device state through lib/caseReset and both append a reset event rather
     than editing the log. This one clears everything for the case - completed
     actions, filed complaint, ticked fix steps - so the persona reads exactly
     as it did when first diagnosed. */
  function resetSelected() {
    if (!selectedPersona) return;
    const removed = resetCase(selectedPersona.reference);
    setWiped(removed.length === 0 ? "none" : "done");
    if (removed.length > 0) void reportReset(selectedPersona.reference, new Date().toISOString());
  }

  function runSelected() {
    if (!selectedPersona) return;
    const ref = selectedPersona.reference;
    run(() => router.push("/case/" + encodeURIComponent(ref)));
  }

  return (
    <main className="page-in shell pb-16 pt-8">
      {working && <DiagnosticWait />}
      <h1 className="text-answer font-semibold leading-tight text-ink">
        {resolve("demo.title", {}, locale)}
      </h1>
      <p className="mt-3 prose-measure text-body text-ink">
        {resolve("demo.standfirst", {}, locale)}
      </p>

      <div className="mt-6 rounded-card border-2 border-pending bg-paper p-4">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-pending" aria-hidden="true" />
          <span className="text-label font-bold uppercase tracking-wider text-ink">
            {resolve("demo.test_data_pill", {}, locale)}
          </span>
        </div>
        <p className="mt-1 text-label font-semibold text-ink">
          {resolve("demo.disclaimer", {}, locale)}
        </p>
      </div>

      <section className="mt-8 rounded-card border-2 border-teal-deep bg-paper p-5 shadow-sm">
        <h2 className="text-head font-semibold text-ink">
          {resolve("demo.judge_heading", {}, locale)}
        </h2>
        <p className="mt-1 text-label text-ink-soft">
          {resolve("demo.judge_sub", {}, locale)}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="scenario-select" className="block text-label font-semibold text-ink">
              {resolve("demo.select_scenario", {}, locale)}
            </label>
            <select
              id="scenario-select"
              value={selectedRef}
              onChange={(e) => { setSelectedRef(e.target.value); setWiped(null); }}
              className="mt-2 min-h-12 w-full rounded-card border-2 border-rule bg-paper px-3 text-body font-medium text-ink focus:border-teal-deep"
            >
              {personas.map((p) => (
                <option key={p.ref} value={p.ref}>
                  {p.label} - {resolve(k("persona." + p.ref + ".stopped"), {}, locale)}
                </option>
              ))}
            </select>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runSelected}
                disabled={working}
                className="btn-pop inline-flex min-h-12 items-center rounded-card bg-teal-deep px-5 text-label font-semibold text-paper hover:bg-teal-deep/90 disabled:opacity-70"
              >
                {resolve("demo.run_test", {}, locale)} &rarr;
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRef(personas[0]?.ref ?? ""); setWiped(null); }}
                className="btn-pop inline-flex min-h-12 items-center rounded-card border border-rule px-4 text-label font-semibold text-ink hover:bg-cyan-pale"
              >
                {resolve("demo.reset", {}, locale)}
              </button>
            </div>

            {/* A demo control, and it says so - §11.7 S11 keeps this surface
                visibly separate from the citizen product. Same pending border
                as the time-travel panel on the timeline, for the same reason. */}
            <section className="mt-6 rounded-card border-2 border-pending bg-paper p-4">
              <h3 className="text-label font-bold uppercase tracking-wider text-ink">
                {resolve("demo.reset_heading", {}, locale)}
              </h3>
              <p className="mt-2 prose-measure text-label text-ink">{resolve("demo.reset_note", {}, locale)}</p>
              <button
                type="button"
                onClick={resetSelected}
                disabled={!selectedPersona}
                className="btn-fill mt-4 inline-flex min-h-12 items-center rounded-card border-2 border-teal-deep px-4 text-label font-semibold text-teal-deep disabled:opacity-70"
              >
                {resolve("demo.reset_action", {}, locale)}
              </button>
              {wiped && (
                <p role="status" className="mt-3 rounded-card border border-teal-deep bg-cyan-pale p-3 text-label font-semibold text-ink">
                  {resolve(wiped === "none" ? "demo.reset_none" : "demo.reset_done", {}, locale)}
                </p>
              )}
            </section>
          </div>

          {selectedPersona && (
            <div className="rounded-card border border-rule bg-cyan-pale/50 p-4 text-label">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{selectedPersona.label}</span>
                <span className="data font-bold text-teal-deep">{selectedPersona.reference}</span>
              </div>
              <div className="mt-3 space-y-1.5 text-ink-soft">
                <p><strong className="text-ink font-semibold">{resolve("demo.field_aadhaar", {}, locale)}</strong> <span className="data">{selectedPersona.aadhaar}</span></p>
                <p><strong className="text-ink font-semibold">{resolve("demo.field_reg", {}, locale)}</strong> <span className="data">{selectedPersona.regNo}</span></p>
                <p><strong className="text-ink font-semibold">{resolve("demo.field_portal", {}, locale)}</strong> <span className="data font-medium text-ink">{selectedPersona.portalStatus}</span></p>
                <p><strong className="text-ink font-semibold">{resolve("demo.field_verdict", {}, locale)}</strong> <span className="font-bold text-teal-deep">{resolve(k("persona." + selectedPersona.ref + ".stopped"), {}, locale)}</span></p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap gap-2 border-b border-rule pb-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              aria-pressed={filter === tab.id}
              className={`min-h-12 rounded-card px-3 py-2 text-label font-semibold transition-colors ${
                filter === tab.id
                  ? "bg-teal-deep text-paper"
                  : "border border-rule bg-paper text-ink hover:bg-cyan-pale"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ul className="mt-6 grid grid-cols-1 max-w-4xl gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <li key={p.ref} className="min-w-0">
              <Link
                href={"/case/" + encodeURIComponent(p.reference)}
                className="card-lift flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-card border border-rule bg-paper p-5 transition-shadow hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-body font-bold text-ink">{p.label}</span>
                    <span className="data text-label font-semibold text-teal-deep">{p.reference}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-cyan-pale px-2 py-0.5 text-label font-bold text-teal-deep">
                      {resolve(k("persona." + p.ref + ".stopped"), {}, locale)}
                    </span>
                  </div>
                  <p className="mt-3 text-label text-ink leading-relaxed font-medium">
                    {resolve(k("persona." + p.ref + ".summary"), {}, locale)}
                  </p>
                  <p className="mt-2 text-label text-ink-soft">
                    <span className="font-semibold text-ink">{resolve("demo.portal_reported", {}, locale)}</span> <span className="data">{p.portalStatus}</span>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-rule pt-3 text-label font-semibold text-teal-deep">
                  <span>{resolve("demo.run_test", {}, locale)}</span>
                  <span aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-card border border-rule bg-paper p-5">
        <h2 className="text-head font-semibold text-ink">{resolve("demo.build_own", {}, locale)}</h2>
        <Link
          href="/demo/new"
          className="btn-pop mt-3 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper hover:bg-teal-deep/90"
        >
          {resolve("newdemo.create", {}, locale)}
        </Link>
      </section>

    </main>
  );
}