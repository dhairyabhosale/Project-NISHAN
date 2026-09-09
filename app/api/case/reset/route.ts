/* Records that a case was put back to its diagnosed state.
 *
 * APPENDS, NEVER DELETES. §8.8's claim is that the citizen's timeline and the
 * audit trail are the same rows; a reset that removed the events it undid would
 * make that claim false and would quietly rewrite history to keep a demo tidy.
 * So the log ends up reading: diagnosed, action completed, case reset. All
 * three, in order, which is what actually happened.
 *
 * This is distinct from /api/case/delete, which exists for §12.5 and does hard
 * delete a case at the reader's request. Reset is not a deletion and does not
 * borrow its route.
 *
 * The body carries no detail beyond the reference and the time. What was
 * cleared is device state this endpoint never held, and §12.1 says data we do
 * not need we do not collect.
 */

import { NextResponse } from "next/server";
import { appendEvent, beneficiaryForReference } from "../../../../lib/store";
import { rateLimit, callerKey } from "../../../../lib/rateLimit";

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const gate = rateLimit(callerKey(request, "reset"), LIMIT, WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let reference: unknown;
  let at: unknown;
  try {
    const body = await request.json();
    reference = (body as { reference?: unknown })?.reference;
    at = (body as { at?: unknown })?.at;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (typeof reference !== "string" || typeof at !== "string") {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  if (!/^NSH-[0-9A-Fa-f]{4}$/.test(reference.trim()) || !Number.isFinite(Date.parse(at))) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const ref = reference.trim().toUpperCase();
  if (!beneficiaryForReference(ref)) {
    // Same shape for every miss: §12.6 keeps references from being enumerable.
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  /* NOT idempotent by a fixed key. A reader may reasonably reset the same case
     more than once in a session, and each reset is a real event at a real time.
     The timestamp is in the key so a replayed request is still a no-op, which
     is what §8.7 actually asks for. */
  const stamp = new Date(at).toISOString();
  const log = appendEvent(ref, {
    at: stamp,
    actor: "citizen",
    fromState: "FIX_DONE",
    toState: "DIAGNOSED",
    kind: "reset",
    detail: { scope: "device" },
    idempotencyKey: ref + ":reset:" + stamp
  });

  return NextResponse.json({ events: log.length }, { headers: { "Cache-Control": "no-store" } });
}
