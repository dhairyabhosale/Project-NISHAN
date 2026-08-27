import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

/**
 * Where the ₹2,000 is standing.
 *
 * §11.5: the only 999px radius in the product. Near-square corners read as
 * document, so the single round element is the money — that is the whole
 * reason the rule exists, and it is why nothing else may borrow it.
 *
 * §11.5 motion: this is the ONE orchestrated moment in the build. It settles
 * into position over 400ms and the shut gate draws after it. Everything else is
 * instant, and `prefers-reduced-motion` renders the final state.
 */
export function MoneyMarker({
  amount,
  locale,
  credited = false
}: {
  amount: string;
  locale: Locale;
  credited?: boolean;
}) {
  return (
    <div className="rail-marker absolute -top-3 left-[6px] z-20">
      <span
        className={`inline-flex items-center gap-1.5 rounded-marker px-3 py-1.5 text-label font-bold shadow-md ${
          credited ? "bg-green text-ink" : "bg-teal-deep text-paper"
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {credited ? <path d="M3 8.5 6.5 12 13 4.5" /> : <path d="M8 2.5v11M4.5 10 8 13.5 11.5 10" />}
        </svg>
        {resolve(credited ? "rail.marker_credited" : "rail.marker", { amount }, locale)}
      </span>
    </div>
  );
}
