import { renderEvidence } from "../content/verdict";
import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";
import type { Diagnosis } from "../lib/types/diagnosis";

/**
 * §11.7 S5: what each record says, and what it should say.
 *
 * Reader-optional by design — S4 must stand on its own without it. It exists so
 * the verdict is checkable rather than asserted, and because §8.5 says this is
 * what drives the Visit Slip and the grievance draft for free: an officer can
 * read the field and the value and act without coming back to ask (§3.7).
 *
 * Values in mono: they are record entries, not prose (§11.4).
 */
export function EvidenceTable({ diagnosis, locale }: { diagnosis: Diagnosis; locale: Locale }) {
  const rows = renderEvidence(diagnosis, locale);
  if (!rows.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-head font-semibold text-ink">{resolve("evidence.heading", {}, locale)}</h2>
      <ul className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <li key={r.field + i} className="rounded-card border border-rule bg-paper p-4">
            <p className="text-label font-semibold text-ink">{r.field}</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-label text-ink-soft">{resolve("evidence.observed", {}, locale)}</dt>
              <dd className="data text-ink">{r.observed}</dd>
              <dt className="text-label text-ink-soft">{resolve("evidence.expected", {}, locale)}</dt>
              <dd className="data text-ink">{r.expected}</dd>
            </dl>
            <p className="mt-3 text-body text-ink">{r.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
