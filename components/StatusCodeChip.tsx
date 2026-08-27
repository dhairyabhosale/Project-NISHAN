import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

/**
 * The raw string the official portal shows, as mono secondary text.
 *
 * §11.7 S4 keeps this deliberately: the farmer can match what she already saw
 * on pmkisan.gov.in and trust we mean the same case. It is the ONE place system
 * vocabulary is allowed on a farmer-facing screen — "FTO Generated, Payment
 * Under Process" is the government's own wording, quoted, not our prose. §16.5
 * governs what we write, not what we quote.
 *
 * It is never the answer. It sits below the verdict, smaller.
 */
export function StatusCodeChip({ portalStatus, locale }: { portalStatus: string | null; locale: Locale }) {
  if (!portalStatus) return null;
  return (
    <div className="mt-6 rounded-card border border-rule bg-cyan-pale p-3">
      <p className="text-label font-semibold text-ink-soft">{resolve("status.portal_label", {}, locale)}</p>
      <p className="data mt-1 text-ink">{portalStatus}</p>
    </div>
  );
}
