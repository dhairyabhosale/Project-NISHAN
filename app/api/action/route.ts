/* Records a completed in-browser action in the server-side event log.
 *
 * The device is the record of record (lib/actionStore explains why). This exists
 * so §8.8's claim holds - the citizen's timeline and the audit trail are the
 * same rows - within whichever instance served the request.
 *
 * Idempotent by key, so a replayed request cannot record the same action twice
 * or move the expected-by date the reader was already given (§8.7).
 *
 * The `detail` a caller sends is NOT stored. A new mobile number or a chosen
 * spelling is the reader's data, this endpoint has no need of it, and §12.1
 * says data we do not need we do not collect. Only the fact that the action
 * happened is recorded.
 */

import { NextResponse } from "next/server";
import { appendEvent, beneficiaryForReference } from "../../../lib/store";
import { ACTION_IDS } from "../../../lib/actions";
import { rateLimit, callerKey } from "../../../lib/rateLimit";

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const gate = rateLimit(callerKey(request, "action"), LIMIT, WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let reference: unknown;
  let action: unknown;
  let at: unknown;
  try {
    const body = await request.json();
    reference = (body as { reference?: unknown })?.reference;
    action = (body as { action?: unknown })?.action;
    at = (body as { at?: unknown })?.at;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (typeof reference !== "string" || typeof action !== "string" || typeof at !== "string") {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  if (!(ACTION_IDS as readonly string[]).includes(action)) {
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

  const log = appendEvent(ref, {
    at: new Date(at).toISOString(),
    actor: "citizen",
    fromState: "FIX_IN_PROGRESS",
    toState: "FIX_DONE",
    kind: "action",
    detail: { action },
    idempotencyKey: ref + ":action:" + action
  });

  return NextResponse.json({ events: log.length }, { headers: { "Cache-Control": "no-store" } });
}
