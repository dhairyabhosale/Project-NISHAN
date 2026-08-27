/* The diagnosis contract — CLAUDE.md §8.5.
 *
 * This is the canonical blocker taxonomy (§7.2, §7.3). `lib/types/blocker.ts`
 * holds an older, incompatible one that the case screen still reads through
 * `content/statusCodes.json`; §13.2 records that as a known conflict, and it is
 * reconciled at E4/NSH-304. Until then, THIS file is the authority. */

import type { SystemCode } from "./systems";

/** §7.2. Exactly one is returned per diagnosis. */
export type BlockerCode = "B0" | "B1" | "B2" | "B3" | "B4" | "B5" | "B6a" | "B6b" | "B6c";

/** §7.1 precedence. B6 splits into a/b/c only after the payment stage is reached,
 *  so the ordered gate list is six long, not nine. */
export const PRECEDENCE: readonly BlockerCode[] = ["B1", "B2", "B3", "B4", "B5"];

/**
 * §7.3. The sub-cause, not the blocker, decides which fix route works — content
 * is keyed on this. "Your e-KYC is pending" is useless; "the phone number on
 * your Aadhaar is one you no longer use, so the code can never reach you" is the
 * product.
 */
export type ReasonCode =
  // B1
  | "REGISTRATION_REJECTED" | "REGISTRATION_PENDING"
  // B2
  | "INCOME_TAX_PAYER" | "GOVT_EMPLOYEE" | "PENSIONER" | "LAND_ACQUIRED_AFTER_CUTOFF" | "FAMILY_DUPLICATE"
  // B3
  | "MOBILE_NOT_LINKED" | "DOB_MISMATCH" | "GENDER_MISMATCH" | "NAME_VARIANCE" | "EKYC_PENDING_ACTION"
  // B4
  | "MAPPER_INACTIVE" | "MAPPER_NOT_FOUND" | "MAPPER_DIFFERENT_BANK"
  // B5
  | "LAND_NAME_MISMATCH" | "LAND_NOT_SEEDED" | "STATE_HOLD"
  // B6a
  | "FTO_IN_QUEUE" | "RFT_SIGNED" | "SETTLEMENT_PENDING" | "NOT_YET_QUEUED"
  // B6b
  | "BANK_RETURNED" | "ACCOUNT_DORMANT" | "ACCOUNT_CLOSED"
  // B6c
  | "CREDITED"
  // B0
  | "SYSTEM_UNREACHABLE"
  // nothing blocking
  | "NONE";

export type Confidence = "certain" | "indeterminate";

/**
 * Why the engine says what it says.
 *
 * §8.5: "Every verdict names the system, the field, the value seen, the value
 * required. This drives the Visit Slip and the grievance draft for free." It is
 * not optional metadata — an officer has to be able to act on it, and §3.7 says
 * a grievance naming the exact field and value resolves faster because nobody
 * has to come back and ask.
 */
export interface Evidence {
  system: SystemCode;
  field: string;
  /** What the system actually holds. */
  observed: string;
  /** What it would need to hold for the money to move. */
  expected: string;
  /** One plain sentence an officer could read aloud. No system vocabulary. */
  note: string;
}

export interface Diagnosis {
  /** Exactly one. §6.2: never a table of six flags. */
  primaryBlocker: BlockerCode;
  /** The sub-cause. Drives all content. */
  reason: ReasonCode;
  confidence: Confidence;
  evidence: Evidence[];
  /** Slot values for content templates (§10.3). */
  facts: Record<string, string>;
  /** The raw string the official portal shows, kept so the farmer can match
   *  what she already saw (§11.7 S4). Secondary text, never the answer. */
  portalStatus: string | null;
  /** Lower-precedence blockers that are also live. Recorded for the grievance
   *  and the officer, NEVER shown as the verdict. */
  secondaryObservations: BlockerCode[];
  unreachableSystems: SystemCode[];
  rulesetVersion: string;
  /** ISO. Taken from the injected `now`, never from the system clock. */
  evaluatedAt: string;
}

export interface DiagnoseOptions {
  /** e.g. "2026-23". */
  cycle: string;
  /** ISO timestamp. Injected so the engine is deterministic (§8.5). */
  now: string;
}

/** Bumped whenever a rule changes. Stamped on every case (§8.5, §8.8). */
export const RULESET_VERSION = "1.0.0";
