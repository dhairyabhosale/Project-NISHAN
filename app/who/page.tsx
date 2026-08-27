"use client";

/* S2 — Identify. CLAUDE.md §11.7.
 *
 * Three tabs of equal weight. Any ONE identifier is enough, because P2 is that
 * the portal makes a registration number the primary key and most farmers do
 * not have one. "Do not have this?" switches to an alternative and never dead-
 * ends. No captcha (P1).
 *
 * The case-reference box at the bottom is §12.4 reference mode: a helper can
 * send a reference and the beneficiary can open it. It is deliberately last and
 * deliberately small — a secondary path, never the front door. */

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

type Tab = "aadhaar" | "mobile" | "regno";

const TABS: { id: Tab; tab: CatalogueKey; label: CatalogueKey; hint: CatalogueKey; mode: "numeric" | "text" }[] = [
  { id: "aadhaar", tab: "who.tab.aadhaar", label: "who.label.aadhaar", hint: "who.hint.aadhaar", mode: "numeric" },
  { id: "mobile", tab: "who.tab.mobile", label: "who.label.mobile", hint: "who.hint.mobile", mode: "numeric" },
  { id: "regno", tab: "who.tab.regno", label: "who.label.regno", hint: "who.hint.regno", mode: "text" }
];

function IdentifyForm() {
  const { locale } = useLocale();
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
    <main className="shell pb-40 pt-8">
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
        className="mt-6 grid gap-x-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
        onSubmit={(e: FormEvent) => { e.preventDefault(); void lookup(value); }}
      >
        <div>
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
        <p className="mt-2 text-label text-ink-soft">{resolve(active.hint, {}, locale)}</p>

        {error && (
          <p className="mt-4 rounded-card border-2 border-pending bg-paper p-3 text-body text-ink" role="alert">
            {error}
          </p>
        )}

        </div>
        <div>
        <details className="mt-6 rounded-card border border-rule bg-paper p-4">
          <summary className="cursor-pointer text-body font-semibold text-teal-deep">
            {resolve("who.dont_have", {}, locale)}
          </summary>
          <p className="mt-3 text-body text-ink">{resolve("who.dont_have_body", {}, locale)}</p>
        </details>

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

        </div>

        {/* §11.5 — primary action pinned to the bottom for thumb reach. */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper p-4">
          <div className="shell">
            <button
              type="submit"
              disabled={busy || !value.trim()}
              className="min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
            >
              {resolve("who.submit", {}, locale)}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default function IdentifyPage() {
  return (
    <Suspense fallback={null}>
      <IdentifyForm />
    </Suspense>
  );
}
