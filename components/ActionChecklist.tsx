import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

export function ActionChecklist({ locale }: { locale: Locale }) { return <section className="mt-8"><h2 className="text-xl font-black">{resolve("checklist.title", {}, locale)}</h2><ol className="mt-4 space-y-3">{["checklist.one", "checklist.two", "checklist.three"].map((key, index) => <li key={key} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{index + 1}</span><span>{resolve(key as "checklist.one", {}, locale)}</span></li>)}</ol></section>; }
