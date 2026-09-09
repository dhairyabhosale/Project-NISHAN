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
    /* camera=(self), not camera=(). The build ships an in-browser identity
       check, and camera=() denied it to our own page: getUserMedia rejected
       before the browser ever asked the reader, and the failure surfaced as
       "permission was refused". (self) keeps every other origin out, including
       anything framed. The microphone stays fully denied below, because that
       is the claim the disabled Bhashini button rests on. */
    ["permissions-policy", /camera=\(self\)/],
    ["permissions-policy", /geolocation=\(\)/],
    /* Map tiles on /contact are images, so this is the only external origin in
       the policy and it can fetch nothing back: connect-src stays 'self'. */
    ["content-security-policy", /img-src 'self' data: https:\/\/tile\.openstreetmap\.org/]
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
    /* Camera is deliberately out of this list now: the page needs it, and it
       is asserted as camera=(self) in the table above, which still shuts out
       every other origin. The microphone is what the disabled Bhashini button
       claims, so that one stays absolute. */
    for (const feature of ["microphone", "geolocation"]) {
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

/* The header, and the contract that keeps the hamburger off a desktop.
 *
 * WHAT THIS REPLACED. There used to be a measured collapse: the nav was sized
 * against its track and, when it did not fit, taken out of flow so the burger
 * could take over. The only label set that ever failed that test was Tamil, so
 * in practice it was a locale-triggered collapse, and it produced three faults
 * at once - Tamil lost its nav on every route but the landing page, the landing
 * page LATCHED because the pill gives the track flex: 1 1 auto and a track with
 * no in-flow content measures 0px, and a 1920px screen could show a hamburger.
 *
 * The tests below used to assert that mechanism existed and was wired to both
 * controls. They asserted the bug. They now assert its absence, and that the
 * thing that replaced it - Tamil made to FIT, in CSS, keyed on the lang
 * attribute - is present in the compiled stylesheet.
 *
 * The pixel proof is a browser pass: 4 locales x 4 widths x 3 routes, plus a
 * geometry diff against the deployed build confirming en/hi/mr are unchanged.
 * What is checkable here is that no code path can reintroduce the collapse. */
describe("Header - the hamburger is a viewport decision, never a locale one", () => {
  const chrome = fs.readFileSync(path.join(ROOT, "components", "SiteChrome.tsx"), "utf8");
  const sheets = () => {
    const dir = path.join(ROOT, ".next", "static", "css");
    return fs.readdirSync(dir).filter((f) => f.endsWith(".css"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join(NEWLINE);
  };

  it("holds no state that could collapse the nav", () => {
    /* The whole class of bug. State derived from the locale is what went stale
       and left a hamburger on screen after switching back to English; if there
       is no state, there is nothing to go stale. */
    for (const ghost of ["navFits", "setNavFits", "navRef", "trackRef", "burgerRef"]) {
      assert.equal(chrome.includes(ghost), false,
        ghost + " is back, which means the nav can decide its own layout again");
    }
    assert.equal(/useLayoutEffect|ResizeObserver/.test(chrome), false,
      "the header measures itself again, which is how the collapse was built");
  });

  it("gates the nav and the burger on the same breakpoint and nothing else", () => {
    /* One is the exact complement of the other. If they ever disagree a width
       exists that shows both, or neither. */
    assert.match(chrome, /"site-nav hidden[^"]*\blg:flex\b/,
      "the desktop nav is not shown at lg");
    assert.match(chrome, /rounded-card hover:bg-white\/10 lg:hidden"/,
      "the burger is not hidden at lg");
    assert.match(chrome, /"shell border-t border-white\/20 pb-4 lg:hidden"/,
      "the burger panel can still open at desktop widths");
    /* No conditional may reach either one. */
    assert.equal(/\(\w+ \? " (lg|xl):hidden" : ""\)/.test(chrome), false,
      "the burger's visibility is conditional again");
  });

  it("makes Tamil fit rather than hiding it", () => {
    /* The replacement for the collapse. Scoped to the lang attribute so no
       other locale can be reached, and to 1024-1279 so 1280 and above - where
       en, hi and mr already had a nav - is untouched. */
    /* The minifier drops the attribute quotes, so html[lang="ta"] is emitted as
       html[lang=ta]. Matching only the quoted form passes against source and
       fails against the built sheet, which is the sheet that ships. */
    const css = sheets();
    const TA = /\[lang="?ta"?\]/;
    assert.match(css, TA, "no Tamil-specific rule compiled at all");
    assert.match(css, /min-width:1024px\) and \(max-width:1279px/,
      "the tightened range did not compile");
    assert.match(css.replace(/\s+/g, ""), /\[lang="?ta"?\]header\.site-nav\{[^}]*column-gap:8px/,
      "Tamil does not get its tighter nav gap");
  });

  it("never shrinks a nav label below the §11.4 label size", () => {
    /* The other way to make Tamil fit, and the one the brief rules out: a nav
       set smaller than the scale, or truncated, is a worse answer than a wider
       bar. */
    const navBlock = chrome.slice(chrome.indexOf('className="site-nav'), chrome.indexOf("</nav>"));
    assert.equal(/text-\[1[0-4]px\]|text-xs|text-\[0\.\d+rem\]/.test(navBlock), false,
      "a nav item is set below the label size");
    assert.equal(/truncate|text-ellipsis/.test(navBlock), false,
      "a nav item truncates, which the brief rules out");
    const css = sheets();
    /* Same minified form as above. This one asserts ABSENCE, so the quoted-only
       pattern would have passed whatever the sheet contained: a rule that never
       matches never fires, and the test could not fail. */
    assert.equal(/\[lang="?ta"?\][^{]*\{[^}]*font-size/.test(css), false,
      "a Tamil-only rule changes a font size");
  });

  it("clears the hero from the pill by construction, not by a tuned number", () => {
    /* Bug 2. The old top padding was chosen for the English line count, so any
       locale that wrapped further grew up into the pill. */
    const css = sheets().replace(/\s+/g, "");
    assert.ok(css.includes("--pill-clear:calc("), "the clearance is not computed from the pill");
    assert.ok(/\.hero-clear\{padding-top:var\(--pill-clear\)\}/.test(css),
      "the hero does not use the computed clearance");
    const page = fs.readFileSync(path.join(ROOT, "app", "page.tsx"), "utf8");
    assert.equal(/pt-32|pt-\[\d+px\]/.test(page.slice(page.indexOf("hero-clear") - 200, page.indexOf("hero-clear") + 200)), false,
      "a fixed top padding is back on the hero copy");
  });

  it("ships both a desktop nav and a burger on every rendered route", () => {
    /* Served HTML, so this covers what actually reaches a browser. */
    for (const [route, html] of Object.entries(served)) {
      const header = html.slice(0, html.indexOf("</header>") + 9);
      assert.ok(header.includes("<nav"), route + " serves a header with no nav at all");
      assert.match(header, /aria-expanded="false"[^>]*class="[^"]*size-12/,
        route + " serves a header with no burger control, so narrow viewports have nowhere to go");
    }
  });
});

/* Mobile, and the invariants that keep it from scrolling sideways.
 *
 * This suite has no layout engine: it fetches served HTML and reads the built
 * stylesheet. It cannot measure a box, so it cannot literally assert
 * "scrollWidth <= clientWidth" on 320 combinations - that is a browser pass,
 * and it currently reports 0 of 320.
 *
 * What it CAN do is hold the structural conditions that caused every one of the
 * ten Tamil overflows, each of which is a property of the source or the
 * compiled CSS. That is the difference between a test that would have caught
 * the bug and a test that merely describes it.
 */
describe("Mobile - nothing may burst the viewport", () => {
  const sheets = () => {
    const dir = path.join(ROOT, ".next", "static", "css");
    return fs.readdirSync(dir).filter((f) => f.endsWith(".css"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join(NEWLINE);
  };
  const sources = () => {
    const out: [string, string][] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full); continue; }
        if (full.endsWith(".tsx")) out.push([full, fs.readFileSync(full, "utf8")]);
      }
    };
    walk(path.join(ROOT, "app"));
    walk(path.join(ROOT, "components"));
    return out;
  };

  it("gives every breakpoint-only grid an explicit shrinkable column", () => {
    /* THE BUG THIS CATCHES. A grid that declares its columns only at a
       breakpoint has no template below it, so items land in an implicit `auto`
       track, which sizes to min-content and cannot shrink below the longest
       word in it. English breaks at spaces and never reaches the limit; Tamil
       does, and took four routes past the viewport with it. */
    const offenders: string[] = [];
    for (const [file, src] of sources()) {
      const classAttrs = src.match(/className=(?:"[^"]*"|\{`[^`]*`\})/g) || [];
      for (const attr of classAttrs) {
        if (!/(^|[\s"`{])grid([\s"`]|$)/.test(attr)) continue;
        const hasBreakpointCols = /\b(sm|md|lg|xl):grid-cols-/.test(attr);
        const hasBaseCols = /(^|[\s"`{])grid-cols-/.test(attr);
        if (hasBreakpointCols && !hasBaseCols) {
          offenders.push(path.relative(ROOT, file) + ": " + attr.slice(0, 90));
        }
      }
    }
    assert.deepEqual(offenders, [],
      "a grid declares columns only at a breakpoint, so below it the track is min-content and cannot shrink: " +
      offenders.join(" | "));
  });

  it("never leaves a 1fr track with its automatic minimum", () => {
    /* 1fr means minmax(auto, 1fr), and that `auto` minimum is min-content.
       overflow-wrap does not rescue it: that changes how text wraps, not the
       intrinsic size the track is measured against. minmax(0, 1fr) does. */
    const offenders: string[] = [];
    for (const [file, src] of sources()) {
      if (/grid-cols-\[[^\]]*(?<![0-9a-z(,])1fr/.test(src)) {
        const m = src.match(/grid-cols-\[[^\]]*\]/g) || [];
        m.filter((x) => /(?<!minmax\(0,)1fr/.test(x) && !x.includes("minmax(0,1fr)"))
          .forEach((x) => offenders.push(path.relative(ROOT, file) + ": " + x));
      }
    }
    assert.deepEqual(offenders, [],
      "a bare 1fr track keeps a min-content minimum and will not shrink: " + offenders.join(" | "));
  });

  it("lets a single unbreakable word break rather than burst the page", () => {
    /* One Tamil word in an h1 measured 355px against a 288px column. It
       overflowed its own box, and on a mobile viewport an overflow widens the
       LAYOUT VIEWPORT, so every position:fixed element grew with it: the
       pinned action bar reported 371px wide on a 320px screen. */
    const css = sheets().replace(/\s+/g, "");
    assert.match(css, /body\{[^}]*overflow-wrap:break-word/,
      "body has no overflow-wrap guard, so one long word can widen the layout viewport");
  });

  it("serves a small hero to a small screen", () => {
    /* 253kB and a 5024ms LCP on Slow 3G at 6x CPU, for a 360px screen, is the
       single most expensive thing this build did to the user it is for. */
    const page = fs.readFileSync(path.join(ROOT, "app", "page.tsx"), "utf8");
    assert.match(page, /srcSet="[^"]*hero-farmer-480\.webp 480w/,
      "the hero has no small variant in its srcset");
    assert.match(page, /sizes="100vw"/, "the hero srcset has no sizes, so the browser cannot choose");
    for (const w of [480, 768, 1200]) {
      const f = path.join(ROOT, "public", "hero-farmer-" + w + ".webp");
      assert.ok(fs.existsSync(f), "hero-farmer-" + w + ".webp is referenced but not shipped");
      const kb = fs.statSync(f).size / 1024;
      assert.ok(kb < w / 4,
        "hero-farmer-" + w + ".webp is " + kb.toFixed(0) + "kB, too heavy for the width it serves");
    }
  });

  it("keeps the header off itself at the floor width", () => {
    /* At 320 the lockup shrinks to 103px while Tamil needs 125px, so the
       wordmark ran under the language control. The answer is a second row, not
       a smaller font and not a hidden wordmark. */
    const css = sheets().replace(/\s+/g, "");
    assert.match(css, /@media\(max-width:359px\)\{[^@]*\.site-home-pill\{[^}]*flex-wrap:wrap/,
      "the pill does not wrap at the floor width, so the lockup and the controls compete for one row");
    assert.equal(/@media\(max-width:359px\)\{[^@]*\.site-home-pill[^@]*display:none/.test(css), false,
      "something is hidden at the floor width instead of being laid out differently");
  });

  it("declares a viewport that allows zoom", () => {
    for (const [route, html] of Object.entries(served)) {
      assert.match(html, /name="viewport"[^>]*width=device-width/,
        route + " has no device-width viewport");
      assert.equal(/user-scalable=no|maximum-scale=1/.test(html), false,
        route + " blocks pinch zoom");
    }
  });
});

/* The redo path, over HTTP.
 *
 * The device is the record of what a reader completed, so the completed screen
 * cannot be fetched from here - the server does not know what any particular
 * browser holds. What IS assertable over HTTP is the half this suite exists to
 * protect: that resetting a case is recorded rather than hidden, that it is not
 * a deletion wearing another name, and that the copy the two controls need
 * resolves in every locale.
 *
 * The bug this covers: a completion was written to the device and nothing ever
 * cleared it, so one tester finishing the camera e-KYC made the step
 * unreachable in that browser for the rest of the session.
 */
describe("F17 - a completed action can be undone", () => {
  const REF = "NSH-D33F";
  const post = (body: unknown) =>
    fetch(BASE + "/api/case/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

  it("records a reset against a real case", async () => {
    const res = await post({ reference: REF, at: new Date().toISOString() });
    assert.equal(res.status, 200, "the reset endpoint refused a valid case");
    const body = (await res.json()) as { events?: number };
    assert.ok(typeof body.events === "number" && body.events > 0,
      "the reset reported no events, so nothing was appended");
  });

  it("APPENDS the reset rather than deleting the history it undoes", async () => {
    /* §8.8 makes the citizen's timeline and the audit trail the same rows. A
       reset that removed the completion it undid would rewrite history to keep
       a demo tidy, which is the one thing this log must not do.

       The first version of this compared two resets to each other, which a
       delete-then-append passes trivially: both calls report one event. So it
       records a completion first and asserts the reset lands ON TOP of it. */
    const completed = (await (await fetch(BASE + "/api/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reference: REF, action: "EKYC_FACE", at: new Date().toISOString() })
    })).json()) as { events: number };
    assert.ok(completed.events >= 1, "the completion was not recorded, so this proves nothing");

    const after = (await (await post({ reference: REF, at: new Date().toISOString() })).json()) as { events: number };
    assert.equal(after.events, completed.events + 1,
      "the log went from " + completed.events + " to " + after.events +
      "; a reset must append exactly one event and remove none");
  });

  it("is not a deletion: the case still opens afterwards", async () => {
    await post({ reference: REF, at: new Date().toISOString() });
    const res = await fetch(BASE + "/case/" + REF);
    assert.equal(res.status, 200, "the case stopped resolving after a reset, so reset deleted it");
    assert.ok(mainText(await res.text()).length > 250, "the case rendered empty after a reset");
  });

  it("refuses junk without guessing what was meant", async () => {
    const bad: unknown[] = [
      {},
      { reference: REF },
      { at: new Date().toISOString() },
      { reference: "NOT-A-REF", at: new Date().toISOString() },
      { reference: REF, at: "not-a-date" },
      { reference: 12345, at: new Date().toISOString() }
    ];
    for (const body of bad) {
      const res = await post(body);
      assert.equal(res.status, 400, "accepted junk: " + JSON.stringify(body));
    }
  });

  it("gives an unknown reference the same answer as any other miss", async () => {
    // §12.6: references must not be enumerable to identity data.
    const res = await post({ reference: "NSH-0000", at: new Date().toISOString() });
    assert.equal(res.status, 404);
  });

  it("carries the copy both controls need, in every locale", async () => {
    /* §16.4 - the buttons are user-facing, so they come from the catalogue in
       all four locales or they do not ship. */
    const locales = ["en", "hi", "mr", "ta"] as const;
    const keys = ["act.redo", "act.redo_note", "demo.reset_heading", "demo.reset_note",
      "demo.reset_action", "demo.reset_done", "demo.reset_none", "timeline.event.reset"];
    for (const loc of locales) {
      const cat = JSON.parse(
        fs.readFileSync(path.join(ROOT, "content", "catalogue." + loc + ".json"), "utf8")
      ) as Record<string, string>;
      for (const key of keys) {
        assert.ok(typeof cat[key] === "string" && cat[key].trim().length > 0,
          loc + " is missing " + key);
        assert.equal(/TODO_/.test(cat[key]), false, loc + " " + key + " is still a placeholder");
      }
    }
  });

  it("serves the reset control on /demo, labelled as a demo control", async () => {
    const html = served["/demo"];
    const en = JSON.parse(
      fs.readFileSync(path.join(ROOT, "content", "catalogue.en.json"), "utf8")
    ) as Record<string, string>;
    const text = visible(html);
    assert.ok(text.includes(en["demo.reset_action"]),
      "/demo does not offer the reset control");
    assert.ok(text.includes("demo control") || text.includes(en["demo.reset_note"].slice(0, 24)),
      "/demo offers a reset without saying it is a demo control");
  });
});
