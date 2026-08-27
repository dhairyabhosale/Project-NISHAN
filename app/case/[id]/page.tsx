"use client";

/* S4 — Diagnosis. CLAUDE.md §11.7.
 *
 * E4 state: the taxonomy is reconciled and the rail runs on §11.2's seven
 * gates, driven by stoppedAt() from the real engine verdict rather than a
 * hand-written gates array.
 *
 * NOT YET HERE, and deliberately so:
 *   - the one-sentence verdict, which must be the largest thing on the page
 *   - the evidence table (§11.7 S5)
 * Both need text keyed on ReasonCode in the content layer. The engine's
 * `Evidence` currently carries English authored in engine/rules.ts, and
 * rendering that would put non-catalogue prose on the primary path, which §16.4
 * forbids and which is the claim the whole build rests on. E6 authors the
 * content; NSH-304 wires this screen to a live diagnosis instead of the
 * generated sample. */

import { useParams } from "next/navigation";
import sampleCase from "../../../data/sample-case.json";
import { CaseHeader } from "../../../components/CaseHeader";
import { MicButton } from "../../../components/MicButton";
import { MoneyRail } from "../../../components/MoneyRail";
import { StatusCodeChip } from "../../../components/StatusCodeChip";
import type { GateState } from "../../../components/RailGate";
import { useLocale } from "../../../components/LocaleProvider";
import { resolve } from "../../../content/resolve";

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

  const gates = sampleCase.gates as GateState[];
  const amount = Number(sampleCase.diagnosis.facts.amount ?? 2000);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <CaseHeader id={sampleCase.reference} amount={amount} locale={locale} />
      <MoneyRail gates={gates} blockedAtIndex={gates.indexOf("BLOCKED")} amount={amount} locale={locale} />
      <StatusCodeChip portalStatus={sampleCase.diagnosis.portalStatus} locale={locale} />
      <MicButton locale={locale} />
    </main>
  );
}
