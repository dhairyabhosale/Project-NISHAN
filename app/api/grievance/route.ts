/* Records a filing in the server-side event log.
 *
 * The device is the record of record for the filing date (lib/grievanceStore
 * explains why). This endpoint exists so the audit trail in §8.8 is real
 * within the instance that serves a request: the citizen's timeline and the
 * audit log are the same rows, and that claim needs the rows to exist.
 *
 * Idempotent by construction. materialiseGrievance appends through the
 * existing log, which is a no-op on a duplicate key (§8.7), so a replayed
 * request cannot file twice or restart a clock.
 */

import { NextResponse } from "next/server";
import { beneficiaryForReference, materialiseGrievance } from "../../../lib/store";
import { parseFiledAt } from "../../../lib/grievanceStore";
import { rateLimit, callerKey } from "../../../lib/rateLimit";

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const gate = rateLimit(callerKey(request, "grievance"), LIMIT, WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let reference: unknown;
  let filedAt: unknown;
  try {
    const body = await request.json();
    reference = (body as { reference?: unknown })?.reference;
    filedAt = (body as { filedAt?: unknown })?.filedAt;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (typeof reference !== "string" || typeof filedAt !== "string") {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const clean = parseFiledAt(filedAt);
  if (!clean || !/^NSH-[0-9A-Fa-f]{4}$/.test(reference.trim())) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const ref = reference.trim().toUpperCase();
  if (!beneficiaryForReference(ref)) {
    // Same shape for every miss: §12.6 keeps references from being enumerable.
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const log = materialiseGrievance(ref, clean, new Date().toISOString());
  return NextResponse.json({ events: log.length }, { headers: { "Cache-Control": "no-store" } });
}
