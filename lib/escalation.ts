/* Escalate and Track - the clock. CLAUDE.md §3.6, §8.6, §8.9.
 *
 * AUDIT.md Part 6 found two of the five capabilities in §6.1 absent. The pitch
 * leads with "a cause, an action, and a clock" and there was no clock. This
 * module is the clock.
 *
 * THE ONE DESIGN RULE HERE: nothing in this file reads the wall clock, and
 * nothing mutates. Every answer is a pure function of (filedAt, now). §8.5
 * demands that of the diagnosis engine and the same discipline applies here,
 * for the same reason - a deadline that depends on when you happened to look
 * is not a commitment, and cannot be tested.
 *
 * §8.9 describes an hourly job that selects overdue grievances and appends an
 * escalation event. There is no cron in this build, so the events are DERIVED
 * ON READ by `escalationEvents()` and appended through the existing idempotent
 * log. The result is identical - the same rows, with the same keys - because
 * `appendEvent` is a no-op on a duplicate key (§8.7). Calling it on every read
 * converges on exactly the log a scheduler would have built. That difference
 * is disclosed on /whats-real rather than glossed.
 *
 * THE LADDER, from §3.6, which is publicly documented and invisible to users:
 *
 *   filed          tier 1   help desk to the block or district officer
 *   + 15 days      tier 2   auto-escalation to the State Nodal Officer
 *   + 30 days      tier 3   PM-KISAN Division, which can direct a release
 *   + 60 days               the tier 3 window itself lapses
 *
 * CPGRAMS sits beside the ladder rather than on it. §3.6 makes it a statutory
 * appeal available once a grievance is "pending 30+ days", so it is OFFERED at
 * day 30 - while the case is still at tier 3 - and only becomes the case's own
 * state at day 60, which is where §8.6's diagram puts CPGRAMS_SUGGESTED. Those
 * two facts look contradictory until you notice one is an option the reader
 * gains and the other is what the case has become.
 */

import type { CaseEvent } from "./store";
import type { CaseState } from "./types/case";

export type Tier = 1 | 2 | 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days from filing at which each tier's window closes. §3.6. */
export const TIER_DUE_DAYS: Record<Tier, number> = { 1: 15, 2: 30, 3: 60 };

/** §3.6: the statutory appeal opens once a grievance has been pending 30 days. */
export const CPGRAMS_OFFER_DAY = 30;

export interface Clock {
  /** Which rung the case is on now. */
  tier: Tier;
  /** ISO date the current tier's window closes. */
  dueAt: string;
  /**
   * Whole days until `dueAt`. Negative once the date has passed.
   *
   * §11.10 cut the progress bar deliberately: a bar implies smooth progress
   * toward a guaranteed outcome, and nothing about this process is smooth or
   * guaranteed. A number states a commitment and makes its breach visible.
   */
  daysRemaining: number;
  /** True once the current window has closed with no result. */
  overdue: boolean;
  /** The case state this clock implies. */
  state: CaseState;
  /** §3.6 appeal route, available from day 30. */
  cpgramsOffered: boolean;
  /** Whole days since filing. */
  daysSinceFiled: number;
}

function startOfDay(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Whole days between two instants, counted in dates rather than hours, so a
 *  deadline does not read as "1 day left" for 47 hours. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((startOfDay(toIso) - startOfDay(fromIso)) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

/** The tier a case has reached by `now`. */
export function tierAt(filedAt: string, now: string): Tier {
  const age = daysBetween(filedAt, now);
  if (age >= TIER_DUE_DAYS[2]) return 3;
  if (age >= TIER_DUE_DAYS[1]) return 2;
  return 1;
}

const STATE_FOR_TIER: Record<Tier, CaseState> = {
  1: "GRIEVANCE_FILED",
  2: "ESCALATED_T2",
  3: "ESCALATED_T3"
};

/**
 * The whole clock, from the filing date and the moment you are asking.
 *
 * `now` is a parameter and not a default, on purpose. A default would let a
 * caller forget to pass it and get a value that changes under test.
 */
export function clockFor(filedAt: string, now: string): Clock {
  const daysSinceFiled = daysBetween(filedAt, now);
  const tier = tierAt(filedAt, now);
  const dueAt = addDays(filedAt, TIER_DUE_DAYS[tier]);
  const daysRemaining = daysBetween(now, dueAt);

  // Past the last rung's window the case is no longer escalating: the ladder
  // has run out, which is what CPGRAMS_SUGGESTED means in §8.6.
  const lapsed = daysSinceFiled >= TIER_DUE_DAYS[3];

  return {
    tier,
    dueAt,
    daysRemaining,
    overdue: daysRemaining < 0,
    state: lapsed ? "CPGRAMS_SUGGESTED" : STATE_FOR_TIER[tier],
    cpgramsOffered: daysSinceFiled >= CPGRAMS_OFFER_DAY,
    daysSinceFiled
  };
}

/**
 * Every event the log should hold for this grievance by `now`.
 *
 * Deterministic and append-only: the same filing and the same `now` always
 * produce the same rows with the same idempotency keys, so replaying this is a
 * no-op rather than a duplicate (§8.7). This is the function §8.9's hourly job
 * would call.
 *
 * Note what it does NOT do: it never removes or edits an earlier event. A case
 * that escalated to tier 3 still carries its tier 2 row, because the audit
 * trail and the citizen's timeline are the same object (§8.8) and a trail that
 * forgets is not a trail.
 */
export function escalationEvents(reference: string, filedAt: string, now: string): CaseEvent[] {
  const events: CaseEvent[] = [{
    at: filedAt,
    actor: "citizen",
    fromState: "GRIEVANCE_DRAFTED",
    toState: "GRIEVANCE_FILED",
    kind: "grievance",
    detail: { tier: 1, dueAt: addDays(filedAt, TIER_DUE_DAYS[1]) },
    idempotencyKey: reference + ":grievance:filed"
  }];

  const reached = tierAt(filedAt, now);
  for (const tier of [2, 3] as Tier[]) {
    if (reached < tier) continue;
    events.push({
      at: addDays(filedAt, TIER_DUE_DAYS[(tier - 1) as Tier]),
      actor: "system",
      fromState: STATE_FOR_TIER[(tier - 1) as Tier],
      toState: STATE_FOR_TIER[tier],
      kind: "escalation",
      detail: { tier, dueAt: addDays(filedAt, TIER_DUE_DAYS[tier]) },
      idempotencyKey: reference + ":escalation:t" + tier
    });
  }

  if (daysBetween(filedAt, now) >= TIER_DUE_DAYS[3]) {
    events.push({
      at: addDays(filedAt, TIER_DUE_DAYS[3]),
      actor: "system",
      fromState: "ESCALATED_T3",
      toState: "CPGRAMS_SUGGESTED",
      kind: "escalation",
      detail: { cpgrams: true },
      idempotencyKey: reference + ":escalation:cpgrams"
    });
  }

  return events;
}
