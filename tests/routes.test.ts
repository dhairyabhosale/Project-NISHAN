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
const BASE = "http://127.0.0.1:" + PORT;

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
  "/case/NSH-3D44", "/case/NSH-7CF2"
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
    const text = JSON.stringify(await res.json());
    for (const m of text.replace(/[\s-]/g, "").matchAll(/(?<!\d)\d{12}(?!\d)/g)) {
      assert.ok(m[0].startsWith("9999"), "non-synthetic 12-digit run served: " + m[0]);
    }
  });
});
