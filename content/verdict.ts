/* Verdict and evidence rendering - CLAUDE.md §10.
 *
 * The engine decides WHAT is true; this decides HOW it is said. Every word
 * comes from the catalogue, keyed on ReasonCode, so the claim that no model
 * writes anything a farmer reads stays checkable by opening a JSON file. */

import { resolve } from "./resolve";
import type { CatalogueKey, Locale } from "../lib/content";
import type { Diagnosis, Evidence } from "../lib/types/diagnosis";

export interface RenderedVerdict {
  /** One sentence. The largest thing on S4 (§11.7). */
  sentence: string;
  /** Two or three sentences on why this happens and what it means. */
  why: string;
  /** True when the payment is past the date it was expected by. */
  overdue: boolean;
}

export interface RenderedEvidence {
  system: string;
  field: string;
  observed: string;
  expected: string;
  note: string;
}

function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

/** Whole days between two ISO dates. Deterministic: no clock read. */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(dayOf(fromIso) + "T00:00:00.000Z").getTime();
  const b = new Date(dayOf(toIso) + "T00:00:00.000Z").getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Is this a payment that was promised by a date now past?
 *
 * §10.5 requires every wait to state what happens if it does not end. A payment
 * released on 20 June with an expected-by of 27 June, shown to someone in
 * August, is not "on its way" - telling her so is worse than telling her
 * nothing, because it invites her to keep waiting on a payment that is stuck.
 */
export function isOverdue(diagnosis: Diagnosis): boolean {
  if (diagnosis.primaryBlocker !== "B6a") return false;
  const expected = diagnosis.facts.expected_by;
  if (!expected) return false;
  return dayOf(expected) < dayOf(diagnosis.evaluatedAt);
}

/** Slots available to a verdict: everything the engine derived, plus anything
 *  the winning evidence carried, plus the overdue day count. */
function verdictSlots(diagnosis: Diagnosis): Record<string, string> {
  const fromEvidence: Record<string, string> = {};
  for (const e of diagnosis.evidence) Object.assign(fromEvidence, e.slots ?? {});

  const slots: Record<string, string> = { ...fromEvidence, ...diagnosis.facts };
  if (diagnosis.facts.expected_by) {
    const overdueDays = daysBetween(diagnosis.facts.expected_by, diagnosis.evaluatedAt);
    if (overdueDays > 0) slots.days_overdue = String(overdueDays);
  }
  return slots;
}

export function renderVerdict(diagnosis: Diagnosis, locale: Locale = "en"): RenderedVerdict {
  const overdue = isOverdue(diagnosis);
  const base = overdue ? "PAYMENT_OVERDUE" : diagnosis.reason;
  const slots = verdictSlots(diagnosis);

  return {
    sentence: resolve(("verdict." + base + ".sentence") as CatalogueKey, slots, locale),
    why: resolve(("verdict." + base + ".why") as CatalogueKey, slots, locale),
    overdue
  };
}

function renderValue(v: Evidence["observed"], locale: Locale): string {
  // Data passes through untranslated: a date, an amount or a name read from a
  // record is the record, and rewording it would falsify what the system holds.
  return v.kind === "data" ? v.value : resolve(("evidence.value." + v.code) as CatalogueKey, {}, locale);
}

export function renderEvidence(diagnosis: Diagnosis, locale: Locale = "en"): RenderedEvidence[] {
  return diagnosis.evidence.map((e) => ({
    system: e.system,
    field: resolve(("evidence.field." + e.field) as CatalogueKey, {}, locale),
    observed: renderValue(e.observed, locale),
    expected: renderValue(e.expected, locale),
    note: resolve(("evidence.note." + e.note) as CatalogueKey, { ...verdictSlots(diagnosis), ...(e.slots ?? {}) }, locale)
  }));
}
