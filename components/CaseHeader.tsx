import Link from "next/link";
import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

export function CaseHeader({ id, amount, locale }: { id: string; amount: number; locale: Locale }) {
  return <header><Link href="/" className="inline-flex min-h-12 items-center text-sm font-bold underline underline-offset-4">← {resolve("case.back", {}, locale)}</Link><p className="data mt-5 text-ink-soft">{id}</p><h1 className="mt-1 text-answer font-semibold">{resolve("case.title", {}, locale)}</h1><p className="mt-2 text-head font-semibold text-teal-deep">{resolve("case.amount", { amount }, locale)}</p></header>;
}
