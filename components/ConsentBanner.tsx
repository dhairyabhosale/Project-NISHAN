import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

export function ConsentBanner({ locale }: { locale: Locale }) { return <aside className="rounded-card border border-rule bg-cyan-pale p-4 text-label font-semibold text-ink">{resolve("assisted.notice", {}, locale)}</aside>; }
