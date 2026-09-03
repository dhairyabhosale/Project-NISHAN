/* AUDIT.md F17 - route-level smoke tests.
 *
 * tsconfig.test.json excludes app/ and components/, so nothing above the
 * content layer could be tested at all. That exclusion is why F4, F5 and F8 all
 * shipped while 156 tests reported green. F8 in particular - a row of three
 * bare hyphens on the honesty page - was visible in the served HTML of a single
 * route, and one fetch would have caught it.
 *
 * Rather than pull JSX into the test build, this suite starts the real
 * production server and reads what it actually serves. That tests the thing
 * that ships, including the server components the unit tests cannot reach.
 *
 * It is never vacuous: if there is no build it makes one, so the suite cannot
 * quietly pass by testing nothing. In practice the build already exists,
 * because the working protocol builds before it tests.
 *
 * SCOPE, stated honestly: the server renders in the default locale, so the
 * assertions here cover English. Locale coverage across hi/ta/mr is asserted
 * at the catalogue and resolver level in content.test.ts and taxonomy.test.ts,
 * and the locale a request asks for is covered below via the cookie. */

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { MISSING_SLOT } from "../content/resolve";

const ROOT = path.join(__dirname, "..", "..");
const PORT = Number(process.env.NISHAN_TEST_PORT ?? 3399);
/* localhost, not 127.0.0.1. `next start` reports its own hostname in
   request.url, so the same-origin check on /api/mock/* compares an Origin
   header against "localhost:PORT". Reaching the server by IP made every
   cross-origin check return 403 - which silently satisfied the assertion below
   that scans the response for real-looking identifiers, because a 403 body
   contains none. Same trap as the F8 detector: an assertion that cannot fail. */
const BASE = "http://localhost:" + PORT;

let server: ChildProcess | null = null;

/** Every page fetched once in before(), so the assertions below read the same
 *  response instead of re-requesting it a dozen times. */
const served: Record<string, string> = {};

const NEWLINE = String.fromCharCode(10);

/** Routes that must render for a citizen. The case references are derived, so
 *  they are the same on every machine - see store.test.ts. */
const PAGES = [
  "/", "/who", "/who/verify?ref=NSH-D33F", "/services", "/faq", "/contact",
  "/how-it-works", "/whats-real", "/demo", "/demo/new",
  "/case/NSH-D33F", "/case/NSH-D33F/fix", "/case/NSH-D33F/fix/slip",
  "/case/NSH-3D44", "/case/NSH-7CF2",
  // Escalate and Track. NSH-3DCE is Sarala M., the one blocker in the build
  // that only an officer can clear, so it is the case that reaches these.
  "/case/NSH-3DCE", "/case/NSH-3DCE/fix", "/case/NSH-3DCE/complaint",
  "/case/NSH-D33F/complaint",
  "/case/NSH-3DCE/timeline", "/case/NSH-3DCE/timeline?advance=15",
  "/case/NSH-3DCE/timeline?advance=45", "/case/NSH-3D44/timeline"
];

async function get(url: string, init?: RequestInit): Promise<{ status: number; body: string }> {
  const res = await fetch(BASE + url, init);
  return { status: res.status, body: await res.text() };
}

/** Visible text: drop scripts and tags so assertions read the page, not the
 *  React payload, which legitimately contains escaped machine values. */
function visible(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, "\n")
    .replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ");
}

/** The <main> of a page, so an assertion about "did this route render" cannot
 *  be satisfied by the header and footer alone. The first version of the SSR
 *  check measured the whole document and would have passed on a page whose
 *  main was empty, which is precisely the F6 failure it exists to catch. */
function mainText(html: string): string {
  const open = html.indexOf("<main");
  if (open === -1) return "";
  const start = html.indexOf(">", open) + 1;
  const end = html.indexOf("</main>", start);
  if (end === -1) return "";
  return visible(html.slice(start, end)).split(NEWLINE).map((l) => l.trim()).filter(Boolean).join(" ");
}

before(async () => {
  if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
    // Never skip. A smoke suite that silently tests nothing is worse than none.
    execFileSync("npx", ["next", "build"], { cwd: ROOT, stdio: "ignore", shell: true, timeout: 600_000 });
  }
  server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: ROOT, stdio: "ignore", shell: true });

  const deadline = Date.now() + 90_000;
  for (;;) {
    try {
      await fetch(BASE + "/");
      for (const route of PAGES) served[route] = (await get(route)).body;
      return;
    } catch { /* not up yet */ }
    if (Date.now() > deadline) throw new Error("server did not start on " + BASE);
    await new Promise((r) => setTimeout(r, 400));
  }
}, { timeout: 700_000 });

after(() => {
  if (!server?.pid) return;
  try {
    if (process.platform === "win32") execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    else server.kill("SIGTERM");
  } catch { /* already gone */ }
});

describe("F17 - every route renders", () => {
  for (const route of PAGES) {
    it("serves " + route, async () => {
      const { status, body } = await get(route);
      assert.equal(status, 200, route + " returned " + status);
      assert.ok(body.length > 500, route + " served only " + body.length + " bytes");
    });
  }

  it("returns 404 with our own page, not Next's default", async () => {
    const { status, body } = await get("/no-such-page-exists");
    assert.equal(status, 404);
    assert.ok(visible(body).includes("There is nothing at this address"), "not our 404 page");
    assert.equal(/next-error-h1/.test(body), false, "Next's built-in error page leaked through");
  });
});

describe("F17 - every route is readable without JavaScript", () => {
  // The splash regression (F1) made every route a blank overlay when JS did not
  // run. The server HTML is what a 2G phone paints first, so it is asserted.
  for (const route of PAGES) {
    it("server-renders real content on " + route, () => {
      const text = mainText(served[route]);
      assert.ok(text.length > 250,
        route + " server-rendered only " + text.length + " characters inside <main>");
    });
  }

  it("serves no full-screen overlay that only JavaScript can remove", async () => {
    for (const [route, body] of Object.entries(served)) {
      assert.equal(/nishan-loading-screen/.test(body), false, route + " carries the deleted splash");
    }
  });
});

describe("F17 - no unresolved content reaches any rendered route", () => {
  // The assertion that would have caught F8 on its own.
  it("renders no TODO_ placeholder", async () => {
    for (const [route, body] of Object.entries(served)) {
      assert.equal(/TODO_[A-Z]{2}:/.test(visible(body)), false, route + " rendered an untranslated placeholder");
    }
  });

  it("renders no unfilled {slot}", async () => {
    for (const route of PAGES) {
      const { body } = await get(route);
      const unfilled = visible(body).match(/\{[a-z_]{3,}\}/g);
      assert.equal(unfilled, null, route + " left " + JSON.stringify(unfilled) + " unfilled");
    }
  });

  it("renders no row whose every field resolved to the missing marker", () => {
    // F8 exactly: a card whose component, label and note were all MISSING_SLOT,
    // which reached production as three bare hyphens.
    //
    // Blank lines are dropped BEFORE the window is taken. Doing it the other
    // way round - which is how this assertion was first written - made it
    // silently vacuous, because the markup puts whitespace between the fields
    // and the three markers were never three CONSECUTIVE raw lines.
    for (const [route, body] of Object.entries(served)) {
      const lines = visible(body).split(NEWLINE).map((l) => l.trim()).filter(Boolean);
      const marker = lines.filter((l) => l === MISSING_SLOT).length;
      for (let i = 0; i + 2 < lines.length; i++) {
        const run = [lines[i], lines[i + 1], lines[i + 2]];
        assert.notDeepEqual(run, [MISSING_SLOT, MISSING_SLOT, MISSING_SLOT],
          route + " rendered a row with every field missing (" + marker + " markers on the page)");
      }
    }
  });

  it("renders no undefined, NaN or [object Object]", async () => {
    for (const [route, body] of Object.entries(served)) {
      const text = visible(body);
      for (const leak of ["undefined", "NaN", "[object Object]"]) {
        assert.equal(text.includes(leak), false, route + " rendered " + leak);
      }
    }
  });
});

describe("F17 - the journey says what it should", () => {
  const expectations: [string, string][] = [
    ["/", "Every PM-KISAN service"],
    ["/who", "Who are we looking up?"],
    ["/who/verify?ref=NSH-D33F", "simulated code"],
    ["/case/NSH-D33F", "Your identity check is not finished"],
    ["/case/NSH-D33F/fix", "Common Service Centre"],
    ["/case/NSH-D33F/fix/slip", "NSHDEMO-1001"],
    ["/case/NSH-3D44", "reached your account"],
    ["/case/NSH-7CF2", "was not accepted"],
    ["/whats-real", "What is real"],
    ["/how-it-works", "seven government records"]
  ];

  for (const [route, needle] of expectations) {
    it(route + " contains its point", async () => {
      assert.ok(visible((await get(route)).body).includes(needle), route + " is missing: " + needle);
    });
  }

  it("carries the §12.7 disclosure on every route", async () => {
    for (const [route, body] of Object.entries(served)) {
      assert.ok(visible(body).includes("not the official PM-KISAN service"),
        route + " is missing the prototype disclosure");
    }
  });

  it("shows an unknown case reference as not found, never as a case", async () => {
    const text = visible((await get("/case/NSH-0000")).body);
    assert.equal(text.includes("Your identity check"), false, "invented a verdict for an unknown reference");
  });
});

describe("F17 - the API boundary", () => {
  it("resolves a persona by Aadhaar", async () => {
    const res = await fetch(BASE + "/api/lookup", {
      method: "POST", headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({ identifier: "9999 4412 8830" })
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).reference, "NSH-D33F");
  });

  it("rejects malformed input with a typed error, never a crash", async () => {
    for (const body of ['{"identifier":{"$ne":1}}', "not json", "{}", "[]"]) {
      const res = await fetch(BASE + "/api/lookup", {
        method: "POST", headers: { "content-type": "application/json", origin: BASE }, body
      });
      assert.equal(res.status, 400, "body " + body + " returned " + res.status);
    }
  });

  it("blocks a cross-origin read of the mock systems", async () => {
    const res = await fetch(BASE + "/api/mock/mUIDAI?ref=P1", { headers: { origin: "https://evil.example" } });
    assert.equal(res.status, 403);
  });

  it("returns only synthetic identifiers from the mock systems", async () => {
    const res = await fetch(BASE + "/api/mock/mUIDAI?ref=P1", { headers: { origin: BASE } });
    assert.equal(res.status, 200, "expected a real record to scan, got " + res.status);
    const body = await res.json();
    assert.ok(body.record, "no record in the response, so this assertion would scan nothing");
    const text = JSON.stringify(body);
    for (const m of text.replace(/[\s-]/g, "").matchAll(/(?<!\d)\d{12}(?!\d)/g)) {
      assert.ok(m[0].startsWith("9999"), "non-synthetic 12-digit run served: " + m[0]);
    }
  });
});

describe("F18 - the §12.6 response headers", () => {
  const required: [string, RegExp][] = [
    ["content-security-policy", /connect-src 'self'/],
    ["content-security-policy", /object-src 'none'/],
    ["content-security-policy", /frame-ancestors 'none'/],
    ["x-content-type-options", /^nosniff$/],
    ["referrer-policy", /strict-origin-when-cross-origin/],
    ["permissions-policy", /microphone=\(\)/],
    ["permissions-policy", /camera=\(\)/],
    ["permissions-policy", /geolocation=\(\)/]
  ];

  it("sets every specified header on a page response", async () => {
    const res = await fetch(BASE + "/");
    for (const [header, shape] of required) {
      const value = res.headers.get(header);
      assert.ok(value, "missing header: " + header);
      assert.match(value, shape, header + " = " + value);
    }
  });

  it("sets them on every route, not just the landing page", async () => {
    for (const route of PAGES) {
      const res = await fetch(BASE + route);
      assert.ok(res.headers.get("permissions-policy"), route + " has no Permissions-Policy");
      assert.ok(res.headers.get("content-security-policy"), route + " has no CSP");
    }
  });

  it("denies the microphone, which is the claim the mic button makes in words", async () => {
    // §9.4 says the button requests no permission. This header is how a
    // reviewer checks that in devtools instead of taking it on trust.
    const policy = (await fetch(BASE + "/")).headers.get("permissions-policy") ?? "";
    for (const feature of ["microphone", "camera", "geolocation"]) {
      assert.match(policy, new RegExp(feature + "=\(\)"), feature + " is not denied: " + policy);
    }
  });
});

describe("F18 - rate limiting is wired to the endpoints", () => {
  it("refuses a caller who exceeds the mock-system quota", async () => {
    // §12.6 caps case-shaped reads at 10 a minute. The mock endpoints are the
    // enumerable surface, so they carry that limit.
    const codes: number[] = [];
    for (let i = 0; i < 14; i++) {
      const res = await fetch(BASE + "/api/mock/mUIDAI?ref=P1", {
        headers: { origin: BASE, "x-forwarded-for": "198.51.100.42" }
      });
      codes.push(res.status);
    }
    assert.ok(codes.includes(429), "no request was refused: " + codes.join(","));
    assert.equal(codes[0], 200, "the first request should have succeeded");
  });

  it("sends Retry-After with a refusal", async () => {
    for (let i = 0; i < 14; i++) {
      await fetch(BASE + "/api/mock/mUIDAI?ref=P1", {
        headers: { origin: BASE, "x-forwarded-for": "198.51.100.99" }
      });
    }
    const res = await fetch(BASE + "/api/mock/mUIDAI?ref=P1", {
      headers: { origin: BASE, "x-forwarded-for": "198.51.100.99" }
    });
    assert.equal(res.status, 429);
    assert.ok(Number(res.headers.get("retry-after")) >= 1, "no usable Retry-After");
  });

  it("does not let one caller exhaust another's quota", async () => {
    for (let i = 0; i < 14; i++) {
      await fetch(BASE + "/api/mock/mUIDAI?ref=P1", {
        headers: { origin: BASE, "x-forwarded-for": "198.51.100.7" }
      });
    }
    const other = await fetch(BASE + "/api/mock/mUIDAI?ref=P1", {
      headers: { origin: BASE, "x-forwarded-for": "203.0.113.200" }
    });
    assert.equal(other.status, 200, "a different caller was blocked by someone else's usage");
  });
});

describe("F12 - the delete endpoint", () => {
  const post = (body: string) => fetch(BASE + "/api/case/delete", {
    method: "POST", headers: { "content-type": "application/json", origin: BASE }, body
  });

  it("accepts a list of references and reports a count", async () => {
    const res = await post(JSON.stringify({ references: ["NSH-D33F"] }));
    assert.equal(res.status, 200);
    assert.equal(typeof (await res.json()).deleted, "number");
  });

  it("never reports WHICH references existed", async () => {
    // §12.6 keeps reference lookups from being enumerable to identity data. A
    // delete that echoed hits back would hand that enumeration straight over.
    const res = await post(JSON.stringify({ references: ["NSH-D33F", "NSH-0000"] }));
    const body = await res.json();
    assert.deepEqual(Object.keys(body), ["deleted"], "the response leaks more than a count");
  });

  it("ignores anything that is not reference-shaped rather than acting on it", async () => {
    const res = await post(JSON.stringify({ references: ["", "../../etc", "NSH-ZZZZ", 42, null, {}] }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).deleted, 0);
  });

  it("rejects malformed bodies and oversized lists", async () => {
    assert.equal((await post("not json")).status, 400);
    assert.equal((await post(JSON.stringify({ references: "NSH-D33F" }))).status, 400);
    assert.equal((await post(JSON.stringify({}))).status, 400);
    const tooMany = Array.from({ length: 51 }, () => "NSH-D33F");
    assert.equal((await post(JSON.stringify({ references: tooMany }))).status, 400);
  });

  it("actually removes the events, so a second delete finds nothing", async () => {
    await fetch(BASE + "/case/NSH-3DCE");            // opening records a diagnosis event
    const first = await post(JSON.stringify({ references: ["NSH-3DCE"] }));
    assert.equal((await first.json()).deleted, 1, "the case had no events to delete");
    const second = await post(JSON.stringify({ references: ["NSH-3DCE"] }));
    assert.equal((await second.json()).deleted, 0, "the events survived the first delete");
  });
});

describe("Escalate - the complaint screen", () => {
  const OFFICER = "/case/NSH-3DCE/complaint";   // Sarala M., B5, needs an officer
  const SELF = "/case/NSH-D33F/complaint";      // Lakshmi D., B3, fixes it herself

  it("§3.7: the draft names every fact a farmer could not have supplied", async () => {
    const text = visible(served[OFFICER]);
    for (const fact of ["NSHDEMO-1003", "2026-06-20", "Stopped by State", "KH-40552", "2,000"]) {
      assert.ok(text.includes(fact), "the complaint screen omits " + fact);
    }
  });

  it("carries the §12.7 disclosure at the file button", async () => {
    assert.ok(visible(served[OFFICER]).includes("not sent to any government office"),
      "the filing disclosure is missing, which is the most misleading moment in the product");
  });

  it("states the routing in prose, with no tier numbers", async () => {
    const text = visible(served[OFFICER]);
    assert.ok(text.includes("State Nodal Officer"), "the routing does not say where it goes");
    assert.equal(/\b(tier|Tier)\s*[123]\b/.test(text), false, "tier numbers leaked into user-facing copy");
    assert.equal(/\bT[123]\b/.test(text), false, "tier codes leaked into user-facing copy");
  });

  it("shows the draft before filing, in an editable field", async () => {
    assert.match(served[OFFICER], /<textarea/, "the draft is not editable");
  });

  it("turns a self-serve blocker away instead of inviting a pointless complaint", () => {
    /* Asserted on behaviour, not on prose. An earlier version of this checked
       for a phrase, and rewriting the copy broke the test without anything
       being wrong with the product - which teaches the wrong lesson when it
       goes red. What must be true is that no draft and no file button are
       offered, and that the reader is sent back to the steps. */
    assert.equal(/<textarea/.test(served[SELF]), false, "a self-serve case got a draft");
    assert.equal(visible(served[SELF]).includes("not sent to any government office"), false,
      "a self-serve case got the filing disclosure, so it got a file button");
    assert.ok(served[SELF].includes("/case/NSH-D33F/fix"), "no route back to the steps");
    assert.ok(mainText(served[SELF]).length > 250, "the turn-away page is too thin to be useful");
  });

  it("is reachable from the Fix Path for an officer blocker, and not otherwise", async () => {
    assert.ok(served["/case/NSH-3DCE/fix"].includes("/complaint"),
      "the officer case has no route to the complaint screen");
    assert.equal(served["/case/NSH-D33F/fix"].includes("/complaint"), false,
      "a self-serve Fix Path offers a complaint it should not");
  });
});

describe("Track - the timeline", () => {
  const T = "/case/NSH-3DCE/timeline";

  it("renders the events the server holds, without JavaScript", () => {
    // §8.8: the timeline IS the audit trail. The diagnosis event exists the
    // moment a case is opened, so it must be in the first response.
    const text = mainText(served[T]);
    assert.ok(text.includes("seven government records"), "no diagnosis event in the server HTML");
    assert.ok(text.length > 250, "only " + text.length + " characters of timeline");
  });

  it("says the list is the record, not a summary written for the screen", () => {
    assert.ok(visible(served[T]).includes("not a summary written for this screen"));
  });

  it("labels the time-travel control as a demo control", () => {
    // §8.9 and §15: the capability ships, and it does not pretend to be a
    // citizen feature.
    assert.ok(visible(served[T]).includes("Demo control"), "the control is unlabelled");
    assert.ok(visible(served[T]).includes("not part of the citizen product"));
  });

  it("advances the clock by link, so a shifted view is shareable", () => {
    assert.ok(served[T].includes("advance=15"), "no time-travel link");
    assert.ok(visible(served["/case/NSH-3DCE/timeline?advance=15"]).includes("15 days from now"),
      "advancing did not change what the page says");
  });

  it("ignores a hostile advance value instead of trusting it", async () => {
    for (const bad of ["-500", "abc", "1e9", "99999", ""]) {
      const { status, body } = await get(T + "?advance=" + encodeURIComponent(bad));
      assert.equal(status, 200, "advance=" + bad + " returned " + status);
      assert.equal(/NaN|Invalid Date/.test(visible(body)), false, "advance=" + bad + " broke a date");
    }
  });

  it("shows a credited case as the success terminal, with amount and date", () => {
    // §16.9: RESOLVED_CREDITED is the only success terminal and it has to LOOK
    // like one, not merely be typed as one.
    const text = visible(served["/case/NSH-3D44/timeline"]);
    assert.ok(text.includes("2026-06-24"), "the credit date is missing");
    assert.ok(text.includes("closed the right way"), "a credited case is not shown as a win");
  });

  it("is reachable from the case screen", () => {
    assert.ok(served["/case/NSH-3DCE"].includes("/timeline"), "Track is orphaned from the case screen");
  });
});
