import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

export function MoneyMarker({ amount, locale }: { amount: number; locale: Locale }) {
  return <div className="rail-marker absolute -left-2 top-1/2 z-10 -translate-x-full -translate-y-1/2 rounded-full bg-rupee px-3 py-2 text-xs font-black text-white shadow-md">{resolve("rail.marker", { amount }, locale)}</div>;
}
