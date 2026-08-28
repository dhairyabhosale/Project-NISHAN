/* E8 — case persistence. CLAUDE.md §8.6, §8.8.
 *
 * IN-MEMORY ONLY. No SQLite, no file writes. Vercel's filesystem is read-only
 * and a write would take the live URL down, which R7 does not survive.
 *
 * The important design consequence, and the reason this is safe:
 *
 *   A CASE REFERENCE IS DERIVED, NOT ALLOCATED.
 *
 * The reference is a pure function of (beneficiaryRef, cycle). The engine is
 * deterministic (§8.5) and the fixtures are static, so a case can always be
 * RECONSTRUCTED from its reference alone — no shared state is needed between
 * the request that created it and the request that reads it. On a serverless
 * host where the two may land on different instances, a store that allocated
 * random references would hand out links that 404 a second later.
 *
 * What is genuinely ephemeral is the event log: events live only in the
 * instance that recorded them. That is disclosed on /whats-real rather than
 * papered over. */

import { diagnose } from "../engine/diagnose";
import { readSnapshot } from "../mocks";
import type { FaultMap } from "../mocks/fault";
import { PERSONAS, CURRENT_CYCLE, findPersonaByIdentifier } from "../mocks/fixtures";
import type { PersonaFixture } from "../mocks/fixtures";
import { diagnose as runDiagnose } from "../engine/diagnose";
import { readSystem } from "../mocks";
import { SYSTEM_CODES } from "./types/systems";
import type { SystemResult, SystemSnapshot, SystemCode } from "./types/systems";
import { stoppedAt, RAIL_GATES } from "./types/diagnosis";
import type { Diagnosis } from "./types/diagnosis";
import type { CaseState } from "./types/case";

export interface CaseEvent {
  at: string;
  actor: "citizen" | "helper" | "system";
  fromState: CaseState | null;
  toState: CaseState;
  kind: "diagnosis" | "fix_step" | "credit";
  detail: Record<string, unknown>;
  /** §8.7: a replayed action is a no-op if already applied. */
  idempotencyKey: string;
}

export interface CaseRecord {
  reference: string;
  beneficiaryRef: string;
  cycle: string;
  state: CaseState;
  diagnosis: Diagnosis;
  gates: ("PASSED" | "BLOCKED" | "UNREACHED")[];
  createdAt: string;
}

/* ── Reference derivation ─────────────────────────────────────────────────── */

/** §12.3 format: NSH-XXXX. Ours, and not a government reference format. */
export function referenceFor(beneficiaryRef: string, cycle: string): string {
  const seed = beneficiaryRef.toUpperCase() + "|" + cycle;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 4);
  return "NSH-" + hex;
}

/** Built once from the static persona set, so a cold instance can still resolve
 *  any reference a warm one handed out. */
const REFERENCE_INDEX: Map<string, string> = new Map(
  PERSONAS.map((p) => [referenceFor(p.ref, CURRENT_CYCLE), p.ref])
);

export function beneficiaryForReference(reference: string): string | null {
  return REFERENCE_INDEX.get(reference.trim().toUpperCase()) ?? null;
}

/* ── Rail gates ───────────────────────────────────────────────────────────── */

export function gatesFor(blocker: Diagnosis["primaryBlocker"]): CaseRecord["gates"] {
  const stop = stoppedAt(blocker);
  return RAIL_GATES.map((_, i) => {
    if (stop === -1) return i === 0 ? "PASSED" : "UNREACHED";
    if (stop >= RAIL_GATES.length) return "PASSED";
    return i < stop ? "PASSED" : i === stop ? "BLOCKED" : "UNREACHED";
  });
}

function stateFor(d: Diagnosis): CaseState {
  if (d.primaryBlocker === "B6c") return "RESOLVED_CREDITED";
  if (d.primaryBlocker === "B6a") return "WAITING";
  return "DIAGNOSED";
}

/* ── Store ────────────────────────────────────────────────────────────────── */

const events = new Map<string, CaseEvent[]>();

/**
 * Diagnose a beneficiary and return the case.
 *
 * Idempotent by construction: the same person and cycle always produce the same
 * reference and the same verdict, so calling this twice cannot create two cases
 * (§8.7). `now` is injected so the result stays deterministic (§8.5).
 */
export async function openCase(identifier: string, now: string, cycle = CURRENT_CYCLE, faults: FaultMap = {}): Promise<CaseRecord | null> {
  const persona = findPersonaByIdentifier(identifier);
  const beneficiaryRef = persona?.ref ?? beneficiaryForReference(identifier);
  if (!beneficiaryRef) return null;

  const snapshot = await readSnapshot(beneficiaryRef, faults);
  const diagnosis = diagnose(snapshot, { cycle, now });
  const reference = referenceFor(beneficiaryRef, cycle);

  const record: CaseRecord = {
    reference,
    beneficiaryRef,
    cycle,
    state: stateFor(diagnosis),
    diagnosis,
    gates: gatesFor(diagnosis.primaryBlocker),
    createdAt: now
  };

  appendEvent(reference, {
    at: now,
    actor: "system",
    fromState: null,
    toState: record.state,
    kind: "diagnosis",
    detail: { blocker: diagnosis.primaryBlocker, reason: diagnosis.reason, rulesetVersion: diagnosis.rulesetVersion },
    idempotencyKey: reference + ":diagnosis:" + diagnosis.rulesetVersion
  });

  return record;
}

/** Read a case by its reference. Reconstructed, so it works on a cold instance. */
export async function getCase(reference: string, now: string, cycle = CURRENT_CYCLE, faults: FaultMap = {}): Promise<CaseRecord | null> {
  const beneficiaryRef = beneficiaryForReference(reference);
  if (!beneficiaryRef) return null;
  return openCase(beneficiaryRef, now, cycle, faults);
}

/** §8.6: append-only. A duplicate idempotency key is a no-op, not a second row. */
export function appendEvent(reference: string, event: CaseEvent): CaseEvent[] {
  const log = events.get(reference) ?? [];
  if (log.some((e) => e.idempotencyKey === event.idempotencyKey)) return log;
  const next = [...log, event];
  events.set(reference, next);
  return next;
}

export function listEvents(reference: string): CaseEvent[] {
  return events.get(reference) ?? [];
}

/** §12.5: "Delete this case" hard-deletes the case and all its events. */
export function deleteCase(reference: string): boolean {
  return events.delete(reference);
}

/**
 * Diagnose a persona supplied directly rather than looked up by reference.
 *
 * Used by user-created demo cases, which are encoded into their link rather
 * than stored - see lib/demoCase.ts. The engine and the fault layer are the
 * same ones the seeded personas use, so a custom case is diagnosed by the real
 * rules and can disagree with the label the user picked.
 */
export async function openCustomCase(
  persona: PersonaFixture,
  now: string,
  cycle = CURRENT_CYCLE,
  faults: FaultMap = {}
): Promise<CaseRecord> {
  const results = await Promise.all(
    SYSTEM_CODES.map(async (code) => {
      const r = await readSystem(code, "__none__", faults[code] ?? {});
      // readSystem resolves fixtures by reference; a custom persona is handed
      // in directly, so graft its record onto the same result envelope. That
      // keeps fault injection, staleness and the reachable/unreachable split
      // behaving exactly as they do for a seeded persona.
      if (!r.ok) return r;
      return { ...r, record: persona[code] } as SystemResult<typeof code>;
    })
  );
  const byCode = Object.fromEntries(results.map((r) => [r.system, r])) as {
    [K in SystemCode]: SystemResult<K>;
  };
  const snapshot: SystemSnapshot = { beneficiaryRef: persona.ref, ...byCode };
  const diagnosis = runDiagnose(snapshot, { cycle, now });

  return {
    reference: referenceFor(persona.ref, cycle),
    beneficiaryRef: persona.ref,
    cycle,
    state: stateFor(diagnosis),
    diagnosis,
    gates: gatesFor(diagnosis.primaryBlocker),
    createdAt: now
  };
}

export { CURRENT_CYCLE };
