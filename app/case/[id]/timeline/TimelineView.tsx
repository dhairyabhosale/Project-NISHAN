"use client";

/* S9 - Timeline. CLAUDE.md §11.7 S9, §8.8, §16.9.
 *
 * The rows come from the append-only log. This component decides the order and
 * the words, never the content - which is what lets the page say honestly that
 * an auditing officer would read the same list.
 *
 * WHY THE CLIENT MERGES ANYTHING AT ALL: the filing date lives on the device
 * (lib/grievanceStore explains why - a server-held filing would vanish between
 * two page loads on this host). So the server contributes the events it knows,
 * the device contributes the filing, and the escalation rows are derived from
 * that filing by the SAME pure function the server would use. Merged by
 * idempotency key, so a row known to both appears once (§8.7).
 *
 * §16.9 is made visible here rather than merely typed: RESOLVED_CREDITED is the
 * only success terminal, and CLOSED_UNRESOLVED renders as the failure it is,
 * with a way back out.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "../../../../components/LocaleProvider";
import { resolve } from "../../../../content/resolve";
import { ACTOR_KEY, describe, terminalOf } from "../../../../content/timeline";
import { clockFor, escalationEvents } from "../../../../lib/escalation";
import { readFiledAt } from "../../../../lib/grievanceStore";
import type { CaseEvent } from "../../../../lib/store";
import type { Diagnosis } from "../../../../lib/types/diagnosis";
import type { CaseState } from "../../../../lib/types/case";

export function TimelineView({
  reference, state, diagnosis, serverEvents, advance, now
}: {
  reference: string;
  state: CaseState;
  diagnosis: Diagnosis;
  serverEvents: CaseEvent[];
  advance: number;
  now: string;
}) {
  const { locale } = useLocale();
  const [filedAt, setFiledAt] = useState<string | null>(null);

  useEffect(() => { setFiledAt(readFiledAt(reference)); }, [reference]);

  const events = useMemo(() => {
    const byKey = new Map<string, CaseEvent>();
    for (const e of serverEvents) byKey.set(e.idempotencyKey, e);
    if (filedAt) for (const e of escalationEvents(reference, filedAt, now)) byKey.set(e.idempotencyKey, e);
    return Array.from(byKey.values()).sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  }, [serverEvents, filedAt, reference, now]);

  const clock = filedAt ? clockFor(filedAt, now) : null;
  const terminal = terminalOf(clock?.state ?? state);
  const href = "/case/" + encodeURIComponent(reference);

  return (
    <main className="page-in shell pb-16 pt-8">
      <Link href={href} className="flex min-h-12 items-center text-label font-semibold text-teal-deep underline">
        {resolve("timeline.back", {}, locale)}
      </Link>

      <h1 className="mt-2 text-answer font-semibold leading-tight text-ink">{resolve("timeline.title", {}, locale)}</h1>
      <p className="mt-3 prose-measure text-body text-ink">{resolve("timeline.standfirst", {}, locale)}</p>

      {/* Terminal states, styled apart. §16.9. */}
      {terminal === "credited" && (
        <p className="mt-6 rounded-card border-2 border-green bg-green-soft p-4 text-body font-semibold text-ink">
          {resolve("timeline.terminal.credited", diagnosis.facts, locale)}
        </p>
      )}
      {terminal === "closed" && (
        <div className="mt-6 rounded-card border-2 border-stop bg-paper p-4">
          <p className="text-body font-semibold text-ink">{resolve("timeline.terminal.closed", {}, locale)}</p>
          <Link href={href + "/complaint"} className="mt-3 inline-flex min-h-12 items-center rounded-card bg-stop px-5 text-body font-semibold text-paper">
            {resolve("timeline.reopen", {}, locale)}
          </Link>
        </div>
      )}

      {/* The clock, as a days-remaining count. §11.10 cut the progress bar. */}
      {clock && !terminal && (
        <section className="mt-6 rounded-card border-2 border-teal-deep bg-paper p-5">
          <h2 className="text-label font-semibold uppercase tracking-wide text-ink-soft">
            {resolve("clock.heading", {}, locale)}
          </h2>
          <p className="mt-2 text-answer font-semibold leading-tight text-ink">
            {clock.overdue
              ? resolve("clock.overdue", { days: Math.abs(clock.daysRemaining) }, locale)
              : clock.daysRemaining === 0
                ? resolve("clock.last_day", {}, locale)
                : resolve("clock.days_left", { days: clock.daysRemaining }, locale)}
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-label text-ink-soft">{resolve("clock.due_on", {}, locale)}</dt>
              <dd className="data text-body font-semibold text-ink">{clock.dueAt.slice(0, 10)}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-soft">{resolve("clock.filed_on", {}, locale)}</dt>
              <dd className="data text-body font-semibold text-ink">{filedAt?.slice(0, 10)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-body text-ink">
            {resolve(clock.tier === 1 ? "clock.with_block" : clock.tier === 2 ? "clock.with_state" : "clock.with_division", {}, locale)}
          </p>
          {clock.state === "CPGRAMS_SUGGESTED" && (
            <p className="mt-3 prose-measure text-label text-ink">{resolve("clock.ladder_end", {}, locale)}</p>
          )}
        </section>
      )}

      {clock?.cpgramsOffered && !terminal && (
        <section className="mt-4 rounded-card border-2 border-pending bg-paper p-5">
          <h2 className="text-head font-semibold text-ink">{resolve("cpgrams.heading", {}, locale)}</h2>
          <p className="mt-2 prose-measure text-body text-ink">{resolve("cpgrams.body", {}, locale)}</p>
        </section>
      )}

      <ol className="mt-8 space-y-3">
        {events.length === 0 && (
          <li className="rounded-card border border-rule bg-paper p-5 text-body text-ink">
            {resolve("timeline.empty", {}, locale)}
          </li>
        )}
        {events.map((e) => (
          <li key={e.idempotencyKey} className="rounded-card border border-rule bg-paper p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="data text-label font-semibold text-teal-deep">{e.at.slice(0, 10)}</span>
              <span className="rounded-card bg-cyan-pale px-2 py-1 text-label text-ink">
                {resolve(ACTOR_KEY[e.actor] ?? "timeline.actor.system", {}, locale)}
              </span>
            </div>
            <p className="mt-2 prose-measure text-body text-ink">{resolve(describe(e), {}, locale)}</p>
          </li>
        ))}
      </ol>

      <p className="mt-6 prose-measure text-label text-ink-soft">{resolve("timeline.audit_note", {}, locale)}</p>

      {/* §8.9's time travel, and it says what it is. Not disguised as a feature. */}
      <section className="mt-10 rounded-card border-2 border-pending bg-paper p-5">
        <h2 className="text-label font-bold uppercase tracking-wider text-ink">
          {resolve("demo.travel_heading", {}, locale)}
        </h2>
        <p className="mt-2 prose-measure text-label text-ink">{resolve("demo.travel_note", {}, locale)}</p>
        {advance > 0 && (
          <p className="mt-3 rounded-card bg-pending p-2 text-label font-semibold text-ink">
            {resolve("demo.travel_active", { days: advance }, locale)}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={href + "/timeline?advance=" + (advance + 15)}
            className="inline-flex min-h-12 items-center rounded-card border-2 border-teal-deep px-4 text-label font-semibold text-teal-deep"
          >
            {resolve("demo.travel_15", {}, locale)}
          </Link>
          {advance > 0 && (
            <Link
              href={href + "/timeline"}
              className="inline-flex min-h-12 items-center rounded-card border border-rule px-4 text-label font-semibold text-ink"
            >
              {resolve("demo.travel_reset", {}, locale)}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
