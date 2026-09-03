"use client";

/* Register your own demo case.
 *
 * Picking a blocker chooses the SITUATION, not the answer. The case is built by
 * cloning the fixture that already produces that blocker and swapping in a new
 * name and fresh 12.3 synthetic identifiers, then the real engine diagnoses it
 * by the real precedence rules - so if the records and the label disagreed, the
 * engine would win. Nothing here fakes a verdict.
 *
 * The case is encoded into its own link rather than stored, so it opens on any
 * server instance and survives a restart. */

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "../../../components/LocaleProvider";
import { resolve } from "../../../content/resolve";
import type { CatalogueKey } from "../../../lib/content";

export interface BlockerOption {
  blocker: string;
  reason: string;
  ref: string;
}

export function NewDemoForm({ blockers }: { blockers: BlockerOption[] }) {
  const { locale } = useLocale();
  const k = (s: string) => s as CatalogueKey;
  const [name, setName] = useState("");
  const [blocker, setBlocker] = useState(blockers[0]?.blocker ?? "B3");
  const [link, setLink] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/demo-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), blocker })
      });
      if (!res.ok) { setError(true); return; }
      const data = (await res.json()) as { reference: string; href: string };
      setReference(data.reference);
      setLink(data.href);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const selected = (b: string) =>
    blocker === b ? "border-teal-deep bg-green-soft" : "border-rule bg-paper";

  return (
    <main className="page-in shell pb-48 pt-8 sm:pb-28">
      <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("newdemo.title", {}, locale)}</h1>
      <p className="mt-3 prose-measure text-body text-ink">{resolve("newdemo.standfirst", {}, locale)}</p>

      <p className="mt-6 rounded-card border border-pending bg-paper p-4 text-label font-semibold text-ink">
        {resolve("newdemo.synthetic", {}, locale)}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <label htmlFor="demo-name" className="block text-label font-semibold text-ink">
            {resolve("newdemo.name_label", {}, locale)}
          </label>
          <input
            id="demo-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            autoComplete="off"
            className="mt-2 min-h-14 w-full rounded-card border-2 border-rule bg-paper px-4 text-body text-ink"
          />
          <p className="mt-2 text-label text-ink-soft">{resolve("newdemo.name_hint", {}, locale)}</p>
        </div>

        <fieldset>
          <legend className="text-label font-semibold text-ink">{resolve("newdemo.blocker_label", {}, locale)}</legend>
          <ul className="mt-2 space-y-2">
            {blockers.map((b) => (
              <li key={b.blocker}>
                <label className={"flex min-h-14 cursor-pointer items-start gap-3 rounded-card border p-3 " + selected(b.blocker)}>
                  <input
                    type="radio"
                    name="blocker"
                    value={b.blocker}
                    checked={blocker === b.blocker}
                    onChange={() => setBlocker(b.blocker)}
                    className="mt-1 size-5 shrink-0"
                  />
                  <span>
                    <span className="block text-body font-semibold text-ink">{resolve(k("persona." + b.ref + ".stopped"), {}, locale)}</span>
                    <span className="block text-label text-ink-soft">{resolve(k("persona." + b.ref + ".summary"), {}, locale)}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-card border-2 border-pending bg-paper p-3 text-body text-ink">
          {resolve("newdemo.error", {}, locale)}
        </p>
      )}

      {link && reference && (
        <section className="mt-8 rounded-card border-2 border-green bg-green-soft p-5">
          <h2 className="text-head font-semibold text-ink">{resolve("newdemo.ready", {}, locale)}</h2>
          <p className="data mt-2 text-answer font-bold text-ink">{reference}</p>
          <Link
            href={link}
            className="mt-4 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
          >
            {resolve("newdemo.open", {}, locale)}
          </Link>
          <p className="mt-3 text-label text-ink">{resolve("newdemo.share", {}, locale)}</p>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper p-4 pb-24 sm:pb-4">
        <div className="shell">
          <button
            type="button"
            onClick={() => void create()}
            disabled={busy || !name.trim()}
            className="min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
          >
            {resolve("newdemo.create", {}, locale)}
          </button>
        </div>
      </div>
    </main>
  );
}
