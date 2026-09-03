/* Mock Government Systems Layer - HTTP surface.
 *
 * §8.3 puts the MGSL in its own route namespace with its own fault middleware.
 * The diagnosis engine calls the readers in-process rather than over HTTP (a
 * network hop inside one deployable would only add latency against §11.9's
 * 400ms budget). This surface exists so the seven systems are demonstrably
 * seven independent systems - the shot §17 calls for at 1:00–1:15 - and so a
 * fault can be triggered by URL in the video now that NSH-405 is cut.
 *
 * §16.6: no live government system is contacted here. Every response is
 * assembled from local synthetic fixtures.
 *
 * §12.6 asks that MGSL endpoints not be publicly routable except through the
 * app. In a single Next deployable that cannot be enforced at the network
 * layer, so this handler applies a same-origin check. That is a weaker
 * guarantee than §12.6 describes and is disclosed on /whats-real. */

import { NextResponse } from "next/server";
import { SYSTEM_CODES } from "../../../../lib/types/systems";
import type { SystemCode } from "../../../../lib/types/systems";
import { readFaultMap } from "../../../../mocks/fault";
import { rateLimit, callerKey } from "../../../../lib/rateLimit";
import { readSystem } from "../../../../mocks";

function isSystemCode(v: string): v is SystemCode {
  return (SYSTEM_CODES as readonly string[]).includes(v);
}

/** §12.6 - reject cross-origin callers. Same-origin requests from the app send
 *  no Origin header, or send our own. */
function sameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}

/** §12.6: the mock systems are the enumerable surface, so they get the
 *  tighter of the two limits - 10 a minute, as for a case read. */
const LIMIT = 10;
const WINDOW_MS = 60 * 1000;

export async function GET(request: Request, context: { params: { system: string } }) {
  const url = new URL(request.url);

  if (!sameOrigin(request, url)) {
    return NextResponse.json({ error: "CROSS_ORIGIN_BLOCKED" }, { status: 403 });
  }

  const gate = rateLimit(callerKey(request, "mock"), LIMIT, WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  const system = context.params.system;
  if (!isSystemCode(system)) {
    return NextResponse.json(
      { error: "UNKNOWN_SYSTEM", allowed: SYSTEM_CODES },
      { status: 404 }
    );
  }

  const reference = url.searchParams.get("ref")?.trim();
  if (!reference) {
    return NextResponse.json({ error: "MISSING_REF" }, { status: 400 });
  }

  const faults = readFaultMap(request.headers, url);
  const result = await readSystem(system, reference, faults[system] ?? {});

  // An unreachable system is reported as such rather than as an empty record.
  // Collapsing the two here would let the engine guess past a gap (§16.8).
  const status = result.ok ? 200 : result.error === "TIMEOUT" ? 504 : (result.status ?? 502);

  return NextResponse.json(result, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "X-NISHAN-Mock": "true"
    }
  });
}
