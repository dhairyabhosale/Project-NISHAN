import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

// §11.3: --teal-deep fill, --white text. §11.5: the only 999px radius in the UI
// — near-square corners read as document, so the single round element is the money.
export function MoneyMarker({ amount, locale }: { amount: number; locale: Locale }) {
  return (
    <div className="rail-marker absolute -left-2 top-1/2 z-10 -translate-x-full -translate-y-1/2 rounded-marker bg-teal-deep px-3 py-2 text-label font-bold text-paper shadow-md">
      {resolve("rail.marker", { amount }, locale)}
    </div>
  );
}
