/* S9 - the case timeline. CLAUDE.md §11.7 S9, §8.8.
 *
 * §8.8 makes a claim worth defending: the citizen's timeline and the audit
 * trail are THE SAME OBJECT. Nothing about the case is reconstructed or
 * inferred for display.
 *
 * That is why this file only maps an event to the sentence describing it. It
 * does not decide what happened, does not order the rows, and cannot invent a
 * row - every entry the screen shows came out of the append-only log in
 * lib/store. If this file went missing the history would still be complete;
 * it would just be unreadable.
 *
 * The mapping is keyed on (kind, toState) rather than on a message stored in
 * the event. Storing prose in the log would freeze it in one language at the
 * moment it was written, and a reader who switches to Hindi would get a
 * timeline half in English. The log holds facts; the words are resolved at
 * render time like every other string in the build (§16.4).
 */

import type { CaseEvent } from "../lib/store";
import type { CatalogueKey } from "../lib/content";

/** §11.7 S9: date, what happened, and who did it. */
export const ACTOR_KEY: Record<CaseEvent["actor"], CatalogueKey> = {
  citizen: "timeline.actor.citizen",
  helper: "timeline.actor.helper",
  system: "timeline.actor.system",
  office: "timeline.actor.office"
};

/**
 * The sentence for one event.
 *
 * Falls back on `kind` when a state is not specially described, so a new
 * transition renders a true generic line rather than the missing marker. An
 * unreadable-but-present row is better than a hole in a history.
 */
export function describe(event: CaseEvent): CatalogueKey {
  if (event.kind === "escalation") {
    if (event.toState === "ESCALATED_T2") return "timeline.event.escalated_state";
    if (event.toState === "ESCALATED_T3") return "timeline.event.escalated_division";
    if (event.toState === "CPGRAMS_SUGGESTED") return "timeline.event.cpgrams";
  }
  if (event.kind === "grievance") return "timeline.event.grievance_filed";
  if (event.kind === "credit") return "timeline.event.credited";
  if (event.kind === "fix_step") return "timeline.event.fix_step";
  if (event.kind === "action") {
    return event.toState === "FIX_DONE" ? "timeline.event.action_done" : "timeline.event.action_started";
  }
  return "timeline.event.diagnosis";
}

/** Terminal states get their own treatment, because §16.9 says only one of
 *  them is a success and the screen has to make that visible rather than
 *  merely typed. */
export type Terminal = "credited" | "closed" | null;

export function terminalOf(state: string): Terminal {
  if (state === "RESOLVED_CREDITED") return "credited";
  if (state === "CLOSED_UNRESOLVED") return "closed";
  return null;
}
