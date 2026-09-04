"use client";

/* S2 - Identify. CLAUDE.md §11.7.
 *
 * Three tabs of equal weight. Any ONE identifier is enough, because P2 is that
 * the portal makes a registration number the primary key and most farmers do
 * not have one. "Do not have this?" switches to an alternative and never dead-
 * ends. No captcha (P1).
 *
 * The case-reference box at the bottom is §12.4 reference mode: a helper can
 * send a reference and the beneficiary can open it. It is deliberately last and
 * deliberately small - a secondary path, never the front door. */

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResumeCase } from "../../components/ResumeCase";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

export interface DemoCase {
  reference: string;
  label: string;
  personaRef: string;
}

type Tab = "aadhaar" | "mobile" | "regno";

const TABS: { id: Tab; tab: CatalogueKey; label: CatalogueKey; hint: CatalogueKey; mode: "numeric" | "text" }[] = [
  { id: "aadhaar", tab: "who.tab.aadhaar", label: "who.label.aadhaar", hint: "who.hint.aadhaar", mode: "numeric" },
  { id: "mobile", tab: "who.tab.mobile", label: "who.label.mobile", hint: "who.hint.mobile", mode: "numeric" },
  { id: "regno", tab: "who.tab.regno", label: "who.label.regno", hint: "who.hint.regno", mode: "text" }
];

export function IdentifyForm({ personas }: { personas: DemoCase[] }) {
  const { locale } = useLocale();
  const k = (s: string) => s as CatalogueKey;
  const router = useRouter();
  const params = useSearchParams();
  const assisted = params.get("assisted") === "1";

  const [tab, setTab] = useState<Tab>("aadhaar");
  const [value, setValue] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active = TABS.find((t) => t.id === tab)!;

  async function lookup(identifier: string) {
    if (!identifier.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      if (!res.ok) {
        setError(resolve("who.not_found", {}, locale));
        return;
      }
      const { reference: ref } = (await res.json()) as { reference: string };
      router.push("/who/verify?ref=" + encodeURIComponent(ref));
    } catch {
      setError(resolve("who.not_found", {}, locale));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-in shell pb-16 pt-8">
      {/* A returning reader should never have to type an identifier twice. */}
      <div className="mb-8"><ResumeCase /></div>

      <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("who.title", {}, locale)}</h1>
      <p className="mt-3 prose-measure text-body text-ink">{resolve("who.standfirst", {}, locale)}</p>

      {assisted && (
        <p className="mt-6 rounded-card border border-rule bg-paper p-4 text-body text-ink">
          {resolve("assisted.notice", {}, locale)}
        </p>
      )}

      <div role="tablist" aria-label={resolve("who.title", {}, locale)} className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setValue(""); setError(null); }}
            className={`min-h-12 flex-1 rounded-card border px-3 text-label font-semibold ${
              tab === t.id ? "border-teal-deep bg-teal-deep text-paper" : "border-rule bg-paper text-ink"
            }`}
          >
            {resolve(t.tab, {}, locale)}
          </button>
        ))}
      </div>

      <form
        className="mt-6"
        onSubmit={(e: FormEvent) => { e.preventDefault(); void lookup(value); }}
      >
        <label htmlFor="identifier" className="block text-label font-semibold text-ink">
          {resolve(active.label, {}, locale)}
        </label>
        <input
          id="identifier"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode={active.mode}
          autoComplete="off"
          className="data mt-2 min-h-14 w-full rounded-card border-2 border-rule bg-paper px-4 text-ink"
        />
        {error && (
          <p className="mt-4 rounded-card border-2 border-pending bg-paper p-3 text-body text-ink" role="alert">
            {error}
          </p>
        )}

        <details className="mt-3">
          <summary className="flex min-h-12 cursor-pointer items-center text-label font-semibold text-teal-deep">
            {resolve("who.dont_have", {}, locale)}
          </summary>
          <p className="mt-2 text-label text-ink">{resolve("who.dont_have_body", {}, locale)}</p>
        </details>
        <p className="mt-2 text-label text-ink-soft">{resolve(active.hint, {}, locale)}</p>

        <section className="mt-8 rounded-card border border-rule bg-paper p-4">
          <h2 className="text-label font-semibold text-ink">{resolve("who.reference_heading", {}, locale)}</h2>
          <p className="mt-2 text-label text-ink-soft">{resolve("who.reference_body", {}, locale)}</p>
          <label htmlFor="reference" className="mt-4 block text-label font-semibold text-ink">
            {resolve("who.reference_label", {}, locale)}
          </label>
          <input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            autoComplete="off"
            className="data mt-2 min-h-12 w-full rounded-card border border-rule bg-cyan-pale px-3 text-ink"
          />
          <button
            type="button"
            onClick={() => void lookup(reference)}
            className="mt-3 min-h-12 rounded-card border border-teal-deep px-4 text-label font-semibold text-teal-deep"
          >
            {resolve("who.reference_submit", {}, locale)}
          </button>
        </section>

        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="mt-6 min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper disabled:bg-teal-deep disabled:text-paper"
        >
          {resolve("who.submit", {}, locale)}
        </button>

        {/* A reviewer should not have to type a synthetic Aadhaar number to
            see the product work. Each card is a real case that diagnoses live. */}
        <section className="mt-8">
          <h2 className="text-head font-semibold text-ink">{resolve("who.demo_heading", {}, locale)}</h2>
          <p className="mt-2 prose-measure text-label text-ink-soft">{resolve("who.demo_body", {}, locale)}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {personas.map((p) => (
              <li key={p.reference}>
                <button
                  type="button"
                  onClick={() => router.push("/case/" + encodeURIComponent(p.reference))}
                  className="card-lift flex h-full w-full flex-col items-start rounded-card border border-rule bg-paper p-4 text-left hover:bg-white"
                >
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span className="text-body font-semibold text-ink">{p.label}</span>
                    <span className="data text-label text-ink-soft">{p.reference}</span>
                  </span>
                  <span className="mt-2 text-label font-semibold uppercase tracking-wide text-teal-deep">{resolve(k("persona." + p.personaRef + ".stopped"), {}, locale)}</span>
                  <span className="mt-1 text-label text-ink-soft">{resolve(k("persona." + p.personaRef + ".summary"), {}, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </form>
    </main>
  );
}
