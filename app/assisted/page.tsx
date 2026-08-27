"use client";

import { useState } from "react";
import { ConsentBanner } from "../../components/ConsentBanner";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";

export default function AssistedPage() {
  const { locale } = useLocale(); const [consented, setConsented] = useState(false); const [recorded, setRecorded] = useState(false);
  return <main className="mx-auto max-w-2xl px-4 py-10"><h1 className="text-3xl font-black">{resolve("assisted.title", {}, locale)}</h1><p className="mt-4 max-w-xl text-lg leading-relaxed">{resolve("assisted.description", {}, locale)}</p><div className="mt-8"><ConsentBanner locale={locale}/></div><label className="mt-6 flex min-h-12 items-start gap-3 rounded-card bg-paper p-4 font-bold"><input className="mt-1 size-5" type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)}/><span>{resolve("assisted.consent_label", {}, locale)}</span></label><button type="button" disabled={!consented} onClick={() => setRecorded(true)} className="mt-5 min-h-12 w-full rounded-card bg-teal-deep px-5 text-body font-bold text-paper disabled:bg-rule disabled:text-ink-soft">{resolve("assisted.continue", {}, locale)}</button>{recorded && <p className="mt-4 rounded-card bg-green-soft p-4 font-bold text-ink">{resolve("assisted.recorded", {}, locale)}</p>}</main>;
}
