"use client";

/* S4 — Diagnosis. CLAUDE.md §11.7.
 *
 * The verdict sentence is the largest thing on the page and sits ABOVE the
 * rail: the rail is evidence for a claim already made, not a puzzle to solve.
 *
 * Every word here comes from the catalogue, keyed on ReasonCode. The engine
 * supplies codes and values only, so §16.4 holds on the primary path.
 *
 * NSH-304 replaces the generated sample with a live diagnosis and splits the
 * evidence table onto its own /why screen (§11.6 S5). */

import { useParams } from "next/navigation";
import sampleCase from "../../../data/sample-case.json";
import { CaseHeader } from "../../../components/CaseHeader";
import { EvidenceTable } from "../../../components/EvidenceTable";
import { MicButton } from "../../../components/MicButton";
import { MoneyRail } from "../../../components/MoneyRail";
import { StatusCodeChip } from "../../../components/StatusCodeChip";
import { Verdict } from "../../../components/Verdict";
import type { GateState } from "../../../components/RailGate";
import { useLocale } from "../../../components/LocaleProvider";
import { resolve } from "../../../content/resolve";
import type { Diagnosis } from "../../../lib/types/diagnosis";

export default function CasePage() {
  const { locale } = useLocale();
  const params = useParams<{ id: string }>();

  if (params.id !== sampleCase.reference) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-head font-semibold text-ink">{resolve("case.not_found", {}, locale)}</h1>
        <MicButton locale={locale} />
      </main>
    );
  }

  const diagnosis = sampleCase.diagnosis as unknown as Diagnosis;
  const gates = sampleCase.gates as GateState[];
  const amount = diagnosis.facts.amount ?? "2,000";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <CaseHeader id={sampleCase.reference} amount={amount} locale={locale} />
      <div className="mt-6">
        <Verdict diagnosis={diagnosis} locale={locale} />
      </div>
      <MoneyRail gates={gates} blockedAtIndex={gates.indexOf("BLOCKED")} amount={amount} locale={locale} />
      <StatusCodeChip portalStatus={diagnosis.portalStatus} locale={locale} />
      <EvidenceTable diagnosis={diagnosis} locale={locale} />
      <MicButton locale={locale} />
    </main>
  );
}
