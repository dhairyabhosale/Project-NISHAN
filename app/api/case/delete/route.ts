/* AUDIT.md F12 - "Delete this case". CLAUDE.md §12.2 and §12.5.
 *
 * §12.5 promises a control that hard-deletes the case and all its events and
 * clears local storage. Only the prose existed; there was no control and no
 * endpoint behind one.
 *
 * The browser sends the references it knows about, which it learns from its own
 * saved fix-path progress. There are no accounts here, so there is nothing else
 * to identify a case by - and that is the point: a reader who clears this has
 * no orphaned identity left behind, because there was never one to orphan.
 *
 * Deleting a reference nobody owns is harmless. The event log is the only
 * server-side state in the build, it holds no identifiers of its own, and the
 * case itself is derived from static fixtures rather than stored - so this
 * removes the record of the visit, which is all there is to remove. That
 * limitation is stated on /whats-real rather than dressed up.
 */

import { NextResponse } from "next/server";
import { deleteCase } from "../../../../lib/store";
import { rateLimit, callerKey } from "../../../../lib/rateLimit";

const MAX_REFERENCES = 50;
const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const gate = rateLimit(callerKey(request, "case-delete"), LIMIT, WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let references: unknown;
  try {
    const body = await request.json();
    references = (body as { references?: unknown })?.references;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (!Array.isArray(references) || references.length > MAX_REFERENCES) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  let deleted = 0;
  for (const ref of references) {
    if (typeof ref !== "string") continue;
    if (!/^NSH-[0-9A-Fa-f]{4}$/.test(ref.trim())) continue;
    if (deleteCase(ref.trim().toUpperCase())) deleted += 1;
  }

  // The count, never which ones: §12.6 keeps reference lookups from being
  // enumerable, and a delete endpoint that reported hits would undo that.
  return NextResponse.json({ deleted }, { headers: { "Cache-Control": "no-store" } });
}
