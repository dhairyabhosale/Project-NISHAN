/* Creates a user-defined demo case.
 *
 * Returns a LINK, not a stored record. The case travels encoded in its own URL
 * so it opens on any serverless instance and survives a restart - see
 * lib/demoCase.ts. Hand-validated, consistent with the 12.6 deviation already
 * disclosed on /whats-real. */

import { NextResponse } from "next/server";
import { encodeSpec, personaForSpec } from "../../../lib/demoCase";
import { referenceFor, CURRENT_CYCLE } from "../../../lib/store";
import { rateLimit, callerKey } from "../../../lib/rateLimit";

const MAX_NAME = 40;

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const gate = rateLimit(callerKey(request, "demo-case"), LIMIT, WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const { name, blocker } = (body ?? {}) as { name?: unknown; blocker?: unknown };
  if (typeof name !== "string" || typeof blocker !== "string") {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const clean = name.trim().slice(0, MAX_NAME);
  if (!clean) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const spec = { n: clean, b: blocker };
  const persona = personaForSpec(spec);
  if (!persona) return NextResponse.json({ error: "UNKNOWN_BLOCKER" }, { status: 400 });

  const reference = referenceFor(persona.ref, CURRENT_CYCLE);
  const href = "/case/" + encodeURIComponent(reference) + "?d=" + encodeSpec(spec);

  return NextResponse.json({ reference, href }, { headers: { "Cache-Control": "no-store" } });
}
