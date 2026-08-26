import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

export function ConsentBanner({ locale }: { locale: Locale }) { return <aside className="rounded-xl border border-rupee bg-amber-50 p-4 text-sm font-semibold text-ink">{resolve("assisted.notice", {}, locale)}</aside>; }
