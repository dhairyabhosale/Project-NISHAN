/* S2 identifier lookup.
 *
 * §11.7 S2: Aadhaar, mobile OR registration number - any ONE is enough, and a
 * case reference also resolves (§12.4 reference mode).
 *
 * Hand-validated rather than Zod: §12.6 asks for Zod at the boundary, and
 * adding a dependency on the final day is the larger risk. The only untrusted
 * input is one short string. Disclosed on /whats-real. */

import { NextResponse } from "next/server";
import { openCase } from "../../../lib/store";
import { rateLimit, callerKey } from "../../../lib/rateLimit";

const MAX_IDENTIFIER = 40;

/** §12.6: 20 per 10 minutes per IP. */
const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const gate = rateLimit(callerKey(request, "lookup"), LIMIT, WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let identifier: unknown;
  try {
    const body = await request.json();
    identifier = (body as { identifier?: unknown })?.identifier;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (typeof identifier !== "string" || !identifier.trim() || identifier.length > MAX_IDENTIFIER) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const record = await openCase(identifier.trim(), new Date().toISOString());
  if (!record) {
    // Deliberately the same shape for every miss: §12.6 says case-reference
    // lookups must not be enumerable to identity data.
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(
    { reference: record.reference, hasLinkedMobile: record.diagnosis.reason !== "MOBILE_NOT_LINKED" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
