/* Mock Government Systems Layer - the seven readers.
 *
 * CLAUDE.md §8.1: "The UI is the thin part. The Mock Government Systems Layer
 * and the Diagnosis Engine are the product." Seven independently modelled,
 * independently failing systems of record.
 *
 * §16.6: nothing here contacts a live government system, in any environment,
 * for any reason. There is no network call in this file. */

import type {
  RecordBySystem, SystemCode, SystemResult, SystemSnapshot
} from "../lib/types/systems";
import { SYSTEM_CODES } from "../lib/types/systems";
import type { FaultMap, FaultProfile } from "./fault";
import { TIMEOUT_MS, delay, seededUnitInterval } from "./fault";
import { findPersonaByIdentifier, findPersonaByRef } from "./fixtures";
import type { PersonaFixture } from "./fixtures";

function now(): string {
  return new Date().toISOString();
}

/** Subtract an ISO-8601-ish duration ("P7D", "PT6H") from a timestamp. Only the
 *  day and hour forms are supported; that is all `staleBy` needs. */
function shiftBack(iso: string, duration: string): string {
  const m = /^P(?:(\d+)D)?(?:T(\d+)H)?$/.exec(duration.trim().toUpperCase());
  if (!m) return iso;
  const ms = (Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600) * 1000;
  return new Date(new Date(iso).getTime() - ms).toISOString();
}

/**
 * Read one system for one beneficiary, applying any injected fault.
 *
 * The return type separates "reachable, holds no record" from "did not answer".
 * That distinction is load-bearing: §16.8 forbids guessing past a gap, and the
 * engine must return INDETERMINATE rather than fall through when a system it
 * needed is unreachable.
 */
export async function readSystem<S extends SystemCode>(
  system: S,
  reference: string,
  fault: FaultProfile = {}
): Promise<SystemResult<S>> {
  // 1. Never respond.
  if (fault.timeout) {
    await delay(TIMEOUT_MS);
    return { system, ok: false, error: "TIMEOUT", observedAt: now() };
  }

  // 2. Deterministic failure, for the demo.
  if (fault.forceStatus && fault.forceStatus >= 400) {
    return { system, ok: false, error: "HTTP_ERROR", status: fault.forceStatus, observedAt: now() };
  }

  // 3. Random-looking failure that is in fact reproducible for a given case -
  //    §8.5 requires same inputs → same output, always.
  if (fault.failureRate && fault.failureRate > 0) {
    if (seededUnitInterval(system + "|" + reference) < fault.failureRate) {
      return { system, ok: false, error: "HTTP_ERROR", status: 503, observedAt: now() };
    }
  }

  // 4. Simulate 2G or a loaded portal.
  if (fault.latencyMs && fault.latencyMs > 0) await delay(fault.latencyMs);

  const persona: PersonaFixture | null =
    findPersonaByRef(reference) ?? findPersonaByIdentifier(reference);

  const observedAt = fault.staleBy ? shiftBack(now(), fault.staleBy) : now();

  // Hand out a COPY, never the fixture itself. A caller that mutates a snapshot
  // - a rule experimenting, a route handler, a test - would otherwise corrupt
  // the shared persona store for the life of the process, and every later read
  // would silently return different data. That breaks the determinism §8.5
  // requires, and it breaks it invisibly.
  const source = persona ? persona[system] : null;
  const record = (source ? structuredClone(source) : null) as RecordBySystem[S] | null;

  return fault.staleBy
    ? { system, ok: true, record, observedAt, stale: true }
    : { system, ok: true, record, observedAt };
}

/* ── The seven named systems (§8.4) ──────────────────────────────────────── */

export const mSCHEME = (ref: string, f?: FaultProfile) => readSystem("mSCHEME", ref, f);
export const mUIDAI = (ref: string, f?: FaultProfile) => readSystem("mUIDAI", ref, f);
export const mPFMS = (ref: string, f?: FaultProfile) => readSystem("mPFMS", ref, f);
export const mNPCI = (ref: string, f?: FaultProfile) => readSystem("mNPCI", ref, f);
export const mLAND = (ref: string, f?: FaultProfile) => readSystem("mLAND", ref, f);
export const mBANK = (ref: string, f?: FaultProfile) => readSystem("mBANK", ref, f);
export const mITD = (ref: string, f?: FaultProfile) => readSystem("mITD", ref, f);

/**
 * Read all seven in parallel and assemble the snapshot the engine consumes.
 *
 * Reading in parallel is not just speed: it means one slow or dead system does
 * not serialise behind the others, so a single injected fault produces exactly
 * one unreachable entry rather than cascading.
 */
export async function readSnapshot(reference: string, faults: FaultMap = {}): Promise<SystemSnapshot> {
  const results = await Promise.all(
    SYSTEM_CODES.map((code) => readSystem(code, reference, faults[code] ?? {}))
  );

  const byCode = Object.fromEntries(results.map((r) => [r.system, r])) as {
    [K in SystemCode]: SystemResult<K>;
  };

  return { beneficiaryRef: reference, ...byCode };
}

export { SYSTEM_CODES };
export type { FaultMap, FaultProfile };
