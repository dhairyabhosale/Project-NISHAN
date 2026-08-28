"use client";

import Link from "next/link";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

export interface PersonaCard {
  ref: string;
  label: string;
  demonstrates: string;
  blocker: string;
  reason: string;
  reference: string;
}

/** Each spec silences a different system, so the engine hits its gap at a
 *  different gate and the INDETERMINATE verdict names a different cleared set. */
const FAULTS: { spec: string; label: CatalogueKey }[] = [
  { spec: "mNPCI:timeout", label: "demo.fault.npci" },
  { spec: "mUIDAI:timeout", label: "demo.fault.uidai" },
  { spec: "mSCHEME:timeout", label: "demo.fault.scheme" }
];

export function PersonaPicker({ personas }: { personas: PersonaCard[] }) {
  const { locale } = useLocale();
  // Ramesh clears the first three gates, so silencing a later system shows the
  // engine listing what it DID confirm before it stopped.
  const first = personas[1]?.reference ?? personas[0]?.reference ?? "";

  return (
    <main className="page-in shell pb-16 pt-8">
      <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("demo.title", {}, locale)}</h1>
      <p className="mt-3 prose-measure text-body text-ink">{resolve("demo.standfirst", {}, locale)}</p>

      {/* §12.3 — persona names are fictional and labelled as such. */}
      <p className="mt-6 rounded-card border border-pending bg-paper p-4 text-label font-semibold text-ink">
        {resolve("demo.disclaimer", {}, locale)}
      </p>

      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {personas.map((p) => (
          <li key={p.ref}>
            <Link
              href={"/case/" + encodeURIComponent(p.reference)}
              className="card-lift block h-full rounded-card border border-rule bg-paper p-5 hover:bg-white"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-body font-semibold text-ink">{p.label}</span>
                <span className="data text-label text-ink-soft">{p.reference}</span>
              </div>
              <p className="mt-2 text-label font-semibold uppercase tracking-wide text-teal-deep">
                {resolve("demo.demonstrates", {}, locale)} · {p.blocker}
              </p>
              <p className="mt-1 text-label text-ink-soft">{p.demonstrates}</p>
            </Link>
          </li>
        ))}
      </ul>

      {/* One tap each. A reviewer should never have to hand-edit a URL to see
          the engine refuse to guess - that refusal is the strongest twenty
          seconds in the demo. */}
      <section className="mt-10 rounded-card border-2 border-pending bg-paper p-5">
        <h2 className="text-head font-semibold text-ink">{resolve("demo.fault_heading", {}, locale)}</h2>
        <p className="mt-2 prose-measure text-body text-ink">{resolve("demo.fault_body", {}, locale)}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {FAULTS.map((f) => (
            <li key={f.spec}>
              <Link
                href={"/case/" + encodeURIComponent(first) + "?fault=" + encodeURIComponent(f.spec)}
                className="card-lift flex h-full flex-col rounded-card border border-rule bg-cyan-pale p-4"
              >
                <span className="text-body font-semibold text-ink">{resolve(f.label, {}, locale)}</span>
                <span className="data mt-2 text-label text-ink-soft">?fault={f.spec}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
