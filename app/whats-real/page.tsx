"use client";

import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";

const sections = [["real.real_heading", "real.real_body"], ["real.simulated_heading", "real.simulated_body"], ["real.no_ai_heading", "real.no_ai_body"], ["real.next_heading", "real.next_body"]] as const;
export default function WhatsRealPage() { const { locale } = useLocale(); return <main className="mx-auto max-w-2xl px-4 py-10"><h1 className="text-3xl font-black">{resolve("real.title", {}, locale)}</h1><div className="mt-8 space-y-5">{sections.map(([heading, body]) => <section key={heading} className="rounded-card bg-paper p-5"><h2 className="text-xl font-black">{resolve(heading, {}, locale)}</h2><p className="mt-3 leading-relaxed text-ink">{resolve(body, {}, locale)}</p></section>)}</div></main>; }
