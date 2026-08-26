"use client";

import { useParams } from "next/navigation";
import statusCodes from "../../../content/statusCodes.json";
import sampleCase from "../../../data/sample-case.json";
import { ActionChecklist } from "../../../components/ActionChecklist";
import { BlockerCard } from "../../../components/BlockerCard";
import { CaseHeader } from "../../../components/CaseHeader";
import { MicButton } from "../../../components/MicButton";
import { MoneyRail } from "../../../components/MoneyRail";
import { StatusCodeChip } from "../../../components/StatusCodeChip";
import type { GateState } from "../../../components/RailGate";
import { useLocale } from "../../../components/LocaleProvider";
import { resolve } from "../../../content/resolve";
import type { CatalogueKey } from "../../../lib/content";

type StatusEntry = { plainCauseKey: CatalogueKey; actionKey: CatalogueKey; ownerKey: CatalogueKey; slaDays: number; };
export default function CasePage() {
  const { locale } = useLocale(); const params = useParams<{ id: string }>();
  if (params.id !== sampleCase.id) return <main className="mx-auto max-w-2xl px-4 py-10"><h1 className="text-2xl font-black">{resolve("case.not_found", {}, locale)}</h1><MicButton locale={locale}/></main>;
  const code = sampleCase.verdict.statusCode as keyof typeof statusCodes; const entry = statusCodes[code] as StatusEntry;
  const gates = sampleCase.gates as GateState[];
  return <main className="mx-auto max-w-2xl px-4 py-8"><CaseHeader id={sampleCase.id} amount={sampleCase.amount} locale={locale}/><MoneyRail gates={gates} blockedAtIndex={gates.indexOf("BLOCKED")} amount={sampleCase.amount} locale={locale}/><StatusCodeChip code={code} meaningKey={entry.plainCauseKey} locale={locale}/><BlockerCard {...entry} causeKey={entry.plainCauseKey} actionKey={entry.actionKey} ownerKey={entry.ownerKey} locale={locale}/><ActionChecklist locale={locale}/><MicButton locale={locale}/></main>;
}
