/* Putting one case back to the state it was diagnosed in.
 *
 * WHY THIS EXISTS. Everything a reader does to a case is recorded on the
 * device and nothing removed it: a completed action, a filed grievance, a
 * ticked fix step. Complete the camera e-KYC once and that browser reads
 * "recorded as complete" for good, so the camera step is unreachable for the
 * rest of the session. On a judged demo the first tester locks the feature out
 * for everyone who follows on that device.
 *
 * ONE CODE PATH, TWO CONTROLS. "Do this again" on a completed action clears
 * that one completion; "Reset this case" on /demo clears everything this device
 * holds for the case. Both come through here, so the demo control cannot drift
 * away from the thing the reader actually uses.
 *
 * THE SERVER LOG IS NOT TOUCHED. §8.8 makes the citizen's timeline and the
 * audit trail the same rows, so a reset that deleted events would rewrite
 * history to make the demo look tidy. The reset is appended as an event of its
 * own instead: the log shows the action, then the reset, in order. That is also
 * why this module only ever removes DEVICE keys - deleting a case is a
 * different, deliberate act with its own control (§12.5).
 */

import { clearAllActionsFrom, ACTION_KEY_PREFIX, type ActionStore } from "./actionStore";
import { GRIEVANCE_KEY_PREFIX } from "./grievanceStore";

/** The fix-path checklist. Written inline by FixView and ComplaintView, so the
 *  prefix is repeated here rather than imported from a component. */
export const FIX_KEY_PREFIX = "nishan:fix:";

/** Every per-case key this build writes. Anything added later belongs here, or
 *  a reset will leave part of the case behind and the bug comes back wearing a
 *  different hat. */
export const CASE_KEY_PREFIXES = [ACTION_KEY_PREFIX, GRIEVANCE_KEY_PREFIX, FIX_KEY_PREFIX] as const;

export interface ResettableStore extends ActionStore {
  removeItem(key: string): void;
}

function storage(): ResettableStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Clear every device key for one case. Returns the keys actually removed, so a
 *  caller can report what it did rather than claiming a reset it did not
 *  perform - the same rule DeleteCaseButton follows. */
export function resetCaseOn(store: ResettableStore | null | undefined, reference: string): string[] {
  if (!store) return [];
  const ref = reference.trim().toUpperCase();
  const removed: string[] = [];

  // Actions go through the store that owns their shape, so the written value
  // stays valid rather than becoming a key holding something unparseable.
  const had = clearAllActionsFrom(store, ref);
  void had;

  for (const prefix of CASE_KEY_PREFIXES) {
    const key = prefix + ref;
    try {
      if (store.getItem(key) === null) continue;
      store.removeItem(key);
      removed.push(key);
    } catch {
      /* storage refused; there was nothing this call could clear */
    }
  }
  return removed;
}

export function resetCase(reference: string): string[] {
  return resetCaseOn(storage(), reference);
}

/** Tell the server a reset happened, so the event log records it.
 *
 * Best effort, and deliberately so: the device is already clear by the time
 * this runs, and §5.1 says the network will sometimes not be there. A reset
 * that failed to reach the log is still a reset.
 */
export async function reportReset(reference: string, at: string): Promise<void> {
  try {
    await fetch("/api/case/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reference, at })
    });
  } catch {
    /* offline: the device is reset regardless */
  }
}
