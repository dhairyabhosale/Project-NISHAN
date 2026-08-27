/* Case shape — CLAUDE.md §8.6.
 *
 * The verdict is a full `Diagnosis` (§8.5), not the three-field `Verdict` that
 * `lib/types/blocker.ts` used to define. That file and its taxonomy are deleted:
 * `lib/types/diagnosis.ts` is the single authority. */

import type { Diagnosis } from "./diagnosis";

/**
 * §8.6. `RESOLVED_CREDITED` is the ONLY success terminal, and requires a
 * matching credit in mBANK. A closed case without money renders as a failure
 * with a "reopen" action (§16.9).
 *
 * Reachable in Stage 1: DIAGNOSED, WAITING, FIX_IN_PROGRESS, FIX_DONE,
 * AWAITING_NEXT_CYCLE, RESOLVED_CREDITED, CLOSED_UNRESOLVED.
 * The grievance and escalation states are defined because the state machine is
 * specified in full, but NSH-401/402/403 are cut (§15), so nothing transitions
 * into them this round. They are not dead code to delete — they are the shape
 * the process actually has, and the product describes the ladder it does not
 * yet execute.
 */
export type CaseState =
  | "DIAGNOSED"
  | "WAITING"
  | "FIX_IN_PROGRESS"
  | "FIX_DONE"
  | "AWAITING_NEXT_CYCLE"
  | "FIX_FAILED"
  | "GRIEVANCE_DRAFTED"
  | "GRIEVANCE_FILED"
  | "ESCALATED_T2"
  | "ESCALATED_T3"
  | "CPGRAMS_SUGGESTED"
  | "RESOLVED_CREDITED"
  | "CLOSED_UNRESOLVED";

/** Stage 1 only transitions between these. */
export const REACHABLE_STATES: readonly CaseState[] = [
  "DIAGNOSED", "WAITING", "FIX_IN_PROGRESS", "FIX_DONE",
  "AWAITING_NEXT_CYCLE", "RESOLVED_CREDITED", "CLOSED_UNRESOLVED"
];

export interface StateTransition {
  from: CaseState;
  to: CaseState;
  eventId: string;
  occurredAt: string;
}

export interface Case {
  /** §12.3 case reference: NSH-XXXX. */
  reference: string;
  /** Synthetic beneficiary reference — never an identifier. */
  beneficiaryRef: string;
  cycle: string;
  state: CaseState;
  diagnosis: Diagnosis;
  createdAt: string;
  updatedAt: string;
}
