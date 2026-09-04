"use client";

/* The rendered diagnosis. §11.7 S4.
 *
 * Order is the argument: the verdict sentence first and largest, then the rail
 * as evidence for a claim already made, then the government's own wording so
 * she can match what she was told, then the record detail for anyone who wants
 * to check us. A puzzle to solve would be the portal's mistake repeated. */

import Link from "next/link";
import { CaseHeader } from "../../../components/CaseHeader";
import { EvidenceTable } from "../../../components/EvidenceTable";
import { MoneyRail } from "../../../components/MoneyRail";
import { StatusCodeChip } from "../../../components/StatusCodeChip";
import { Verdict } from "../../../components/Verdict";
import type { GateState } from "../../../components/RailGate";
import { CaseStatus } from "../../../components/CaseStatus";
import { useLocale } from "../../../components/LocaleProvider";
import { resolve } from "../../../content/resolve";
import type { Diagnosis } from "../../../lib/types/diagnosis";

export function CaseView({
  reference,
  gates,
  diagnosis
}: {
  reference: string;
  gates: GateState[];
  diagnosis: Diagnosis;
}) {
  const { locale } = useLocale();
  const amount = diagnosis.facts.amount ?? "2,000";
  const credited = diagnosis.primaryBlocker === "B6c";

  return (
    <main className="page-in shell pb-48 pt-8 sm:pb-28">
      <CaseHeader id={reference} amount={amount} locale={locale} />

      <div className="mt-6">
        <Verdict diagnosis={diagnosis} locale={locale} />
      </div>

      {/* The persistent view: where this stands, what is done, what is pending,
          what is next. Also what remembers the reference for the return path. */}
      <CaseStatus reference={reference} diagnosis={diagnosis} />

      <div className="grid gap-x-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <MoneyRail
          gates={gates}
          blockedAtIndex={gates.indexOf("BLOCKED")}
          amount={amount}
          locale={locale}
          credited={credited}
        />

        <div className="lg:pt-10">
          <StatusCodeChip portalStatus={diagnosis.portalStatus} locale={locale} />
          <EvidenceTable diagnosis={diagnosis} locale={locale} />
        </div>
      </div>

      {/* Track (§6.1 capability 5) is reachable from the case, not orphaned. A
          secondary link rather than a second pinned button: the primary action
          is still to fix the thing, and §6.2 allows one primary per screen. */}
      <p className="mt-8">
        <Link
          href={"/case/" + encodeURIComponent(reference) + "/timeline"}
          className="inline-flex min-h-12 items-center rounded-card border-2 border-teal-deep px-5 text-body font-semibold text-teal-deep"
        >
          {resolve("case.timeline_cta", {}, locale)}
        </Link>
      </p>

      {/* §11.5 - primary action pinned bottom, 56px, thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper p-4 pb-24 sm:pb-4">
        <div className="shell">
          <Link
            href={"/case/" + encodeURIComponent(reference) + "/fix"}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-card bg-teal-deep text-body font-semibold text-paper"
          >
            {resolve("case.fix_cta", {}, locale)}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m7 4 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
