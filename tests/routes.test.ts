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
  "/case/NSH-3DCE/timeline?advance=45", "/case/NSH-3D44/timeline",
  // P10: actions that finish in the browser, plus the one that is ruled out.
  "/case/NSH-D33F/act/ekyc_face", "/case/NSH-D33F/act/update_mobile",
  "/case/NSH-B676/act/reseed_aadhaar", "/case/NSH-3DCE/act/confirm_name"
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

describe("P10 - actions that finish in the browser", () => {
  it("offers Lakshmi both of hers on the Fix Path", () => {
    const fix = served["/case/NSH-D33F/fix"];
    assert.ok(fix.includes("/act/ekyc_face"), "the camera route is not offered");
    assert.ok(fix.includes("/act/update_mobile"), "the mobile route is not offered");
  });

  it("carries a §12.7 disclosure on every action screen, before the control", () => {
    for (const route of ["/case/NSH-D33F/act/ekyc_face", "/case/NSH-D33F/act/update_mobile",
                         "/case/NSH-B676/act/reseed_aadhaar"]) {
      assert.ok(/simulated/i.test(visible(served[route])), route + " has no disclosure");
    }
  });

  it("promises the camera frame never leaves the device, on the screen that uses it", () => {
    const text = visible(served["/case/NSH-D33F/act/ekyc_face"]);
    assert.ok(text.includes("never sent anywhere"), "the camera screen does not say where the image goes");
    assert.ok(text.includes("No real Aadhaar system is contacted"));
  });

  it("shows Sarala the name fix RULED OUT, with the reason", () => {
    // §10.4, and the single most useful sentence in the product.
    const text = visible(served["/case/NSH-3DCE/act/confirm_name"]);
    assert.ok(text.includes("two different people"), "the refusal does not say why");
    assert.equal(/<input|<textarea/.test(served["/case/NSH-3DCE/act/confirm_name"]), false,
      "a ruled-out action still offered a form");
  });

  it("offers Sarala no completable action at all, and explains instead", () => {
    /* Behaviour, not phrasing. The previous version of this asserted a phrase
       and went red when the copy improved - the same trap as "you can fix
       yourself". What must hold is that no action is offered, that the refusal
       carries its reason, and that the Visit Slip is still there. */
    const html = served["/case/NSH-3DCE/fix"];
    assert.equal(html.includes("/act/"), false, "an action was offered on a case nothing can finish");
    assert.ok(visible(html).includes("two different people"), "the refusal lost its reason");
    assert.ok(html.includes("/fix/slip"), "the Visit Slip was dropped where it is the only route");
  });

  it("states an expected-by window on every action", () => {
    for (const route of ["/case/NSH-D33F/act/ekyc_face", "/case/NSH-B676/act/reseed_aadhaar"]) {
      assert.ok(/take effect/.test(visible(served[route])), route + " gives no expected-by window");
    }
  });

  it("404s an unknown action instead of rendering an empty shell", async () => {
    assert.equal((await get("/case/NSH-D33F/act/not_an_action")).status, 404);
  });
});

describe("P10 - the action endpoint", () => {
  const post = (body: string) => fetch(BASE + "/api/action", {
    method: "POST", headers: { "content-type": "application/json", origin: BASE }, body
  });

  it("records a completion", async () => {
    const res = await post(JSON.stringify({
      reference: "NSH-D33F", action: "EKYC_FACE", at: "2026-09-03T10:00:00.000Z"
    }));
    assert.equal(res.status, 200);
    assert.ok((await res.json()).events >= 1);
  });

  it("§8.7: recording it twice does not add a second row", async () => {
    const body = JSON.stringify({ reference: "NSH-B676", action: "RESEED_AADHAAR", at: "2026-09-03T10:00:00.000Z" });
    const first = await (await post(body)).json();
    const second = await (await post(body)).json();
    assert.equal(first.events, second.events, "a replay added a row");
  });

  it("refuses an unknown action, a bad reference and a bad date", async () => {
    const bad = [
      { reference: "NSH-D33F", action: "NOPE", at: "2026-09-03T10:00:00.000Z" },
      { reference: "not-a-ref", action: "EKYC_FACE", at: "2026-09-03T10:00:00.000Z" },
      { reference: "NSH-D33F", action: "EKYC_FACE", at: "tomorrow" },
      { reference: "NSH-D33F", action: "EKYC_FACE" }
    ];
    for (const b of bad) {
      assert.equal((await post(JSON.stringify(b))).status, 400, JSON.stringify(b));
    }
  });

  it("does not store the reader's own data, only that it happened", async () => {
    // §12.1: data we do not need, we do not collect. A new mobile number is
    // the reader's, and this endpoint has no use for it.
    await post(JSON.stringify({
      reference: "NSH-D33F", action: "UPDATE_MOBILE", at: "2026-09-03T10:00:00.000Z",
      detail: { mobile: "+91 5551234567" }
    }));
    const timeline = visible((await get("/case/NSH-D33F/timeline")).body);
    assert.equal(timeline.includes("5551234567"), false, "the endpoint stored and rendered submitted data");
  });
});

describe("/services - every row is a decision with a reason", () => {
  it("gives a reason for every service it lists", async () => {
    // The question this page has to survive: what is the use of a site that
    // sends me to the original one? A row without a reason cannot answer it.
    const enPath = path.join(ROOT, "content", "catalogue.en.json");
    const cat = JSON.parse(fs.readFileSync(enPath, "utf8")) as Record<string, string>;
    const rows = Object.keys(cat).filter((k) => /^svc\.\d+\.name$/.test(k)).map((k) => k.split(".")[1]);
    assert.ok(rows.length >= 20, "only " + rows.length + " services listed");
    for (const i of rows) {
      const reason = cat["svc." + i + ".reason"];
      assert.ok(reason && reason.length > 40, "svc." + i + " has no real reason");
    }
  });

  it("never says only to use the official site", () => {
    const text = visible(served["/services"]);
    // Every card carries a Why. The count must match the number of rows shown.
    const whys = (text.match(/\bWhy\b/g) || []).length;
    assert.ok(whys >= 20, "only " + whys + " reasons rendered");
  });

  it("names the four things that now finish here", () => {
    const text = visible(served["/services"]);
    for (const needle of ["Finish your e-KYC", "Link your Aadhaar to your bank account again",
                          "Correct a spelling of your name", "Update your mobile number"]) {
      assert.ok(text.includes(needle), "/services does not offer: " + needle);
    }
    assert.ok(text.includes("app download"), "the page does not say what the official route does instead");
  });

  it("gives a product reason for what is out of scope, not a shrug", () => {
    const text = visible(served["/services"]);
    assert.ok(text.includes("inverse problem"), "Online Refund is dismissed without a reason");
  });

  it("routes a completable service into the journey, not to the portal", () => {
    // The four completable rows must lead into NISHAN. If they linked out, the
    // page would be claiming something it does not do.
    assert.ok(served["/services"].includes("/who"), "no route into the journey");
  });
});

describe("Persistent case view", () => {
  it("shows where the case stands, without a login", () => {
    const text = mainText(served["/case/NSH-D33F"]);
    assert.ok(text.includes("Where your case stands"), "no persistent status panel");
    assert.ok(text.includes("Your next step"), "the panel does not say what to do next");
  });

  it("tells the reader the reference is the way back in", () => {
    // §12.4: the reference IS the credential. No account, no password.
    assert.ok(visible(served["/case/NSH-D33F"]).includes("opens this case on any phone"),
      "the return path is not explained");
  });

  it("has no login, no password field and no account anywhere", () => {
    for (const route of PAGES) {
      const html = served[route];
      assert.equal(/type="password"/.test(html), false, route + " has a password field");
      assert.equal(/\bsign in\b|\blog in\b|\blogin\b/i.test(visible(html)), false,
        route + " offers a login, which is the theatre we chose not to build");
    }
  });

  it("reaches the timeline and the clock from the case screen", () => {
    assert.ok(served["/case/NSH-D33F"].includes("/timeline"), "Track is not reachable from the case");
  });
});

describe("Design tokens - nothing paints transparent or an unexpected grey", () => {
  /* The rendered half of tests/tokens.test.ts.
   *
   * The alpha bug was invisible to tsc, to the build and to axe: an element
   * with a background simply had none, and a white border quietly became
   * Tailwind's default grey-200. Both are legal CSS. The only way to catch it
   * is to look at what actually painted. */

  /** Tailwind's default palette greys, which is what a token falls back to
   *  when its modifier cannot be built. None of these is in §11.3. */
  const FOREIGN_GREYS = [
    "rgb(229, 231, 235)", "rgb(209, 213, 219)", "rgb(156, 163, 175)",
    "rgb(107, 114, 128)", "rgb(243, 244, 246)", "rgb(249, 250, 251)"
  ];

  it("compiles a rule for every token opacity modifier a page actually ships", () => {
    /* This is the bug, stated as an assertion: a class was in the HTML, no rule
       existed for it, and the element painted nothing.
       Scoped to OUR tokens. bg-white/10 also appears in the header and is fine:
       it uses Tailwind's own white rather than the --white token, so its rule
       compiles. That is a consistency wrinkle, not a rendering failure, and a
       test that conflated the two would cry wolf. */
    const TOKENS = ["teal-deep", "green", "green-soft", "cyan-pale", "paper",
                    "ink", "ink-soft", "stop", "pending", "rule"];
    const dir = path.join(ROOT, ".next", "static", "css");
    const sheets = fs.readdirSync(dir).filter((f) => f.endsWith(".css"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");

    const used = new Set<string>();
    for (const body of Object.values(served)) {
      for (const m of body.matchAll(/\b(bg|border|text)-([a-z-]+)\/(\d+)/g)) {
        if (TOKENS.includes(m[2])) used.add(m[1] + "-" + m[2] + "/" + m[3]);
      }
    }
    assert.ok(used.size > 0, "no token opacity modifier is used anywhere, so this proves nothing");

    for (const cls of used) {
      const [prop, rest] = [cls.split("-")[0], cls.slice(cls.indexOf("-") + 1)];
      const [token, alpha] = rest.split("/");
      const needle = "rgb(var(--" + (token === "paper" ? "white" : token) + ")/." + alpha.replace(/0$/, "") + ")";
      assert.ok(sheets.replace(/\s/g, "").includes(needle.replace(/\s/g, "")),
        cls + " is in the HTML but no rule paints it - expected " + needle + " (" + prop + ")");
    }
  });

  it("emits a real rgb() with an alpha for every opacity modifier it ships", () => {
    // Read the compiled stylesheet: this is where the bug was visible, and
    // where a regression would show first.
    const dir = path.join(ROOT, ".next", "static", "css");
    const sheets = fs.readdirSync(dir).filter((f) => f.endsWith(".css"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    // Built with new RegExp so the pattern stays a plain string. The class name
    // in compiled CSS is literally `.bg-cyan-pale\/50`, backslash included, and
    // writing that as a literal here is a reliable way to end a regex early.
    const ALPHA_RULE = new RegExp("\\.[a-z-]+\\\\/\\d+\\{[^}]*\\}", "g");
    const alphaRules = sheets.match(ALPHA_RULE) ?? [];
    assert.ok(alphaRules.length > 0, "no opacity-modified utilities were compiled at all");
    for (const rule of alphaRules) {
      assert.equal(/:\s*(transparent|initial|inherit)\s*[;}]/.test(rule), false,
        "an opacity utility compiled to nothing: " + rule.slice(0, 90));
      assert.match(rule, /rgb\(|rgba\(|hsla?\(/,
        "an opacity utility produced no usable colour: " + rule.slice(0, 90));
    }
  });

  it("uses no colour from outside §11.3 in the compiled stylesheet", () => {
    const dir = path.join(ROOT, ".next", "static", "css");
    const sheets = fs.readdirSync(dir).filter((f) => f.endsWith(".css"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    for (const grey of FOREIGN_GREYS) {
      const compact = grey.replace(/\s/g, "");
      assert.equal(sheets.replace(/\s/g, "").includes(compact), false,
        "Tailwind's default palette leaked in as " + grey + ", which is what a broken token falls back to");
    }
  });
});

/* The header overlap, and the contract that stops it coming back.
 *
 * WHAT HAPPENED: the desktop nav is flex-none inside a min-w-0 flex-1 track
 * with justify-end. flex-none means it never shrinks, so once its intrinsic
 * width passed the track it did not clip, wrap or compress - it overflowed the
 * track's LEFT edge and sat on top of the logo mark, the wordmark and the
 * subtitle. Tamil reached it first at 983px of nav against a 811px track.
 *
 * WHY A BREAKPOINT WOULD NOT HAVE FIXED IT: .shell is capped at max-width
 * 1152px, so the track is ~811px at every viewport from 1248px upward. A nav
 * that does not fit at 1280 does not fit at 1920 either.
 *
 * These assertions are structural, and they say so. The pixel proof is a
 * browser pass - 32 header screenshots across four locales and four widths,
 * with en/hi/mr compared by hash - which needs a layout engine this suite does
 * not have. What is checkable here is that the mechanism exists, is wired to
 * both controls, and is not silently purged, which is the failure mode that
 * would put the overlap back with no visible error. */
describe("Header - the nav can never collide with the logo lockup", () => {
  const chrome = fs.readFileSync(path.join(ROOT, "components", "SiteChrome.tsx"), "utf8");
  const sheets = () => {
    const dir = path.join(ROOT, ".next", "static", "css");
    return fs.readdirSync(dir).filter((f) => f.endsWith(".css"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join(NEWLINE);
  };

  it("compiles the utilities the collapse is built from", () => {
    /* Tailwind scans source text, and the collapse classes live in a
       concatenated expression rather than a static string - exactly the shape
       that gets purged. A purged collapse is not a broken style, it is the
       overlap again, with nothing to see in the console. */
    const css = sheets();
    /* Tailwind escapes the variant colon, so the selector is literally
       `.xl\:absolute`. Built from a char code for the same reason NEWLINE is
       above: a backslash in a literal here is one editor round-trip away from
       becoming a no-op escape, and `"xl\:absolute"` reads as "xl:absolute",
       which is not in the stylesheet and never will be. That mistake makes
       this assertion fail loudly rather than silently, but only by luck. */
    const BACKSLASH = String.fromCharCode(92);
    for (const name of ["absolute", "right-full", "invisible", "hidden"]) {
      const selector = ".xl" + BACKSLASH + ":" + name;
      assert.ok(css.includes(selector),
        selector + " never compiled, so the nav cannot be taken out of flow and will overlap the lockup again");
    }
  });

  it("measures the nav against the space it actually has", () => {
    assert.match(chrome, /scrollWidth/, "nothing measures the nav's intrinsic width");
    assert.match(chrome, /clientWidth/, "nothing measures the track the nav has to fit into");
    /* Constructed AND observing. Matching the bare word ResizeObserver passed
       even with the observer stubbed out, because the name survives in the
       `typeof ResizeObserver === "undefined"` guard - an assertion that could
       not fail, caught by injecting the stub. */
    assert.match(chrome, /new ResizeObserver\(/, "no ResizeObserver is constructed");
    assert.match(chrome, /\.observe\(/, "a ResizeObserver is made but never told what to watch");
  });

  it("measures against space that does not depend on the answer", () => {
    /* The latch. Collapsing the nav reveals the burger, and the burger takes
       its own width plus the gap beside it out of the same track the nav is
       measured against. Measured naively, a collapsed nav shrinks its own
       track and can never come back: switching Tamil to English at 1440 left
       the nav collapsed, because English needs 640px and the burger had cut
       the track from 690px to 634px.

       So the burger's footprint has to be added back, making the figure
       invariant to the state it decides. Without this the header is stable in
       exactly one direction, which is the kind of bug that looks fine in a
       single screenshot. */
    const effect = chrome.slice(chrome.indexOf("const measure = ()"), chrome.indexOf("ro.observe("));
    assert.match(effect, /burgerRef/,
      "the fit is measured without accounting for the burger, so collapsing shrinks the track it measures against");
    assert.match(effect, /offsetWidth/, "the burger's width is never added back");
    assert.match(effect, /columnGap/, "the gap beside the burger is never added back");
  });

  it("binds both the nav and the burger to the same fit decision", () => {
    /* If the burger kept a static xl:hidden, collapsing the nav above 1280px
       would leave that locale with no navigation at all. */
    const burger = chrome.slice(chrome.indexOf("setMobileOpen((o) => !o)"));
    assert.match(burger.slice(0, 600), /navFits/,
      "the burger is not bound to the fit check, so a collapsed nav leaves no way to navigate");
    const desktopNav = chrome.slice(chrome.indexOf("ref={navRef}"), chrome.indexOf("ref={navRef}") + 600);
    assert.match(desktopNav, /navFits/, "the desktop nav is not bound to the fit check");
  });

  it("takes the nav out of flow rather than clipping or truncating it", () => {
    /* The brief's constraint, and §11.7's: a half-readable nav item is worse
       than a hidden one. Clipping would also cut off the dropdown panels, which
       are positioned inside the nav. */
    const track = chrome.slice(chrome.indexOf("ref={trackRef}"), chrome.indexOf("ref={navRef}"));
    assert.equal(/overflow-hidden|truncate|text-ellipsis/.test(track), false,
      "the header track clips its content instead of collapsing the nav");
    const navBlock = chrome.slice(chrome.indexOf("ref={navRef}"), chrome.indexOf("</nav>"));
    assert.equal(/truncate|text-ellipsis/.test(navBlock), false,
      "a nav item truncates, which the brief rules out");
  });

  it("ships both a desktop nav and a burger on every rendered route", () => {
    /* Served HTML, so this covers what actually reaches a browser. */
    for (const [route, html] of Object.entries(served)) {
      const header = html.slice(0, html.indexOf("</header>") + 9);
      assert.ok(header.includes("<nav"), route + " serves a header with no nav at all");
      assert.match(header, /aria-expanded="false"[^>]*class="[^"]*size-12/,
        route + " serves a header with no burger control, so a collapsed nav has nowhere to go");
    }
  });
});
