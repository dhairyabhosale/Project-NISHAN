"use client";

import Link from "next/link";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";

export interface PersonaCard {
  ref: string;
  label: string;
  demonstrates: string;
  blocker: string;
  reason: string;
  reference: string;
}

export function PersonaPicker({ personas }: { personas: PersonaCard[] }) {
  const { locale } = useLocale();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("demo.title", {}, locale)}</h1>
      <p className="mt-3 max-w-[58ch] text-body text-ink">{resolve("demo.standfirst", {}, locale)}</p>

      {/* §12.3 — persona names are fictional and labelled as such. */}
      <p className="mt-6 rounded-card border border-pending bg-paper p-4 text-label font-semibold text-ink">
        {resolve("demo.disclaimer", {}, locale)}
      </p>

      <ul className="mt-8 space-y-3">
        {personas.map((p) => (
          <li key={p.ref}>
            <Link
              href={"/case/" + encodeURIComponent(p.reference)}
              className="block rounded-card border border-rule bg-paper p-4 hover:bg-white/70"
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

      <section className="mt-10 rounded-card border border-rule bg-paper p-4">
        <h2 className="text-head font-semibold text-ink">{resolve("demo.fault_heading", {}, locale)}</h2>
        <p className="mt-2 max-w-[58ch] text-body text-ink">{resolve("demo.fault_body", {}, locale)}</p>
      </section>
    </main>
  );
}
