"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { resolve } from "../content/resolve";
import { MicButton } from "../components/MicButton";
import { useLocale } from "../components/LocaleProvider";

export default function LandingPage() {
  const { locale } = useLocale(); const router = useRouter(); const [caseId, setCaseId] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); router.push(`/case/${encodeURIComponent(caseId || "NSH-4F2A")}`); }
  return <main className="mx-auto max-w-2xl px-4 py-10"><h1 className="max-w-xl text-4xl font-black leading-tight">{resolve("landing.title", {}, locale)}</h1><p className="mt-4 max-w-lg text-lg leading-relaxed text-ink">{resolve("landing.description", {}, locale)}</p><form onSubmit={submit} className="mt-8 max-w-lg space-y-3"><label className="block text-base font-bold" htmlFor="case-id">{resolve("landing.case_label", {}, locale)}</label><input id="case-id" value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder={resolve("landing.case_placeholder", {}, locale)} className="min-h-14 w-full rounded-card border-2 border-rule bg-paper px-4 text-lg"/><button className="min-h-12 w-full rounded-card bg-teal-deep px-5 text-body font-bold text-paper" type="submit">{resolve("landing.submit", {}, locale)}</button></form><p className="mt-5 text-label text-ink-soft">{resolve("landing.sample_hint", {}, locale)}</p><MicButton locale={locale}/></main>;
}
