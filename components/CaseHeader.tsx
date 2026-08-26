import Link from "next/link";
import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

export function CaseHeader({ id, amount, locale }: { id: string; amount: number; locale: Locale }) {
  return <header><Link href="/" className="inline-flex min-h-12 items-center text-sm font-bold underline underline-offset-4">← {resolve("case.back", {}, locale)}</Link><p className="mt-5 text-sm text-neutral-600">{id}</p><h1 className="mt-1 text-3xl font-black">{resolve("case.title", {}, locale)}</h1><p className="mt-2 text-lg font-bold text-rupee">{resolve("case.amount", { amount }, locale)}</p></header>;
}
