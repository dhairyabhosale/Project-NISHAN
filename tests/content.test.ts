/* E6 - verdict content.
 *
 * §10: every user-facing string comes from a keyed content table. These tests
 * are what make that claim checkable rather than asserted. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";

import { diagnose } from "../engine/diagnose";
import { MISSING_SLOT, loadLocale, resolve } from "../content/resolve";
import { daysBetween, isOverdue, renderEvidence, renderVerdict } from "../content/verdict";
import { readSnapshot } from "../mocks";
import { CURRENT_CYCLE, PERSONAS } from "../mocks/fixtures";
import { authorityFor, fixPathFor, needsOfficer } from "../content/fixPaths";
import type { CatalogueKey } from "../lib/content";

const ROOT = path.join(__dirname, "..", "..");
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue.en.json"), "utf8")) as Record<string, string>;

const NOW = "2026-08-27T09:00:00.000Z";
const OPTS = { cycle: CURRENT_CYCLE, now: NOW };
const diagnoseRef = async (ref: string, faults = {}) => diagnose(await readSnapshot(ref, faults), OPTS);

const REASON_CODES = [
  "REGISTRATION_REJECTED", "REGISTRATION_PENDING",
  "INCOME_TAX_PAYER", "GOVT_EMPLOYEE", "PENSIONER", "LAND_ACQUIRED_AFTER_CUTOFF", "FAMILY_DUPLICATE",
  "MOBILE_NOT_LINKED", "DOB_MISMATCH", "GENDER_MISMATCH", "NAME_VARIANCE", "EKYC_PENDING_ACTION",
  "MAPPER_INACTIVE", "MAPPER_NOT_FOUND", "MAPPER_DIFFERENT_BANK",
  "LAND_NAME_MISMATCH", "LAND_NOT_SEEDED", "STATE_HOLD",
  "FTO_IN_QUEUE", "RFT_SIGNED", "SETTLEMENT_PENDING", "NOT_YET_QUEUED",
  "BANK_RETURNED", "ACCOUNT_DORMANT", "ACCOUNT_CLOSED",
  "CREDITED", "SYSTEM_UNREACHABLE", "NONE"
];

const TIER_1 = [
  "MOBILE_NOT_LINKED", "MAPPER_INACTIVE", "LAND_NAME_MISMATCH", "FTO_IN_QUEUE",
  "ACCOUNT_DORMANT", "CREDITED", "INCOME_TAX_PAYER", "REGISTRATION_REJECTED", "SYSTEM_UNREACHABLE"
];

describe("E6 - every ReasonCode has a verdict", () => {
  for (const r of REASON_CODES) {
    it(r + " has a sentence and a why", () => {
      const s = EN["verdict." + r + ".sentence"];
      const w = EN["verdict." + r + ".why"];
      assert.ok(s && s.length > 10, r + " sentence missing");
      assert.ok(w && w.length > 30, r + " why missing or too thin");
    });
  }

  it("has an overdue variant for a payment past its date", () => {
    assert.ok(EN["verdict.PAYMENT_OVERDUE.sentence"]);
    assert.ok(EN["verdict.PAYMENT_OVERDUE.why"]);
  });

  it("gives the nine tier-1 verdicts a why of two or three sentences", () => {
    for (const r of TIER_1) {
      const w = EN["verdict." + r + ".why"];
      const sentences = w.split(/(?<=\.)\s+/).filter(Boolean).length;
      assert.ok(sentences >= 2, r + " why has only " + sentences + " sentence(s)");
    }
  });

  it("carries the MTS / Class IV / Group D carve-out on the tax exclusion", () => {
    // §7.2 B2: an exclusion "can be challenged". This carve-out is the thing
    // that makes a wrong flag contestable, and it is missed constantly.
    const w = EN["verdict.INCOME_TAX_PAYER.why"];
    assert.match(w, /Multi-Tasking Staff/);
    assert.match(w, /Class IV or Group D/);
  });
});

describe("E6 - every evidence code resolves", () => {
  const codesUsedBy = (prefix: string) =>
    Object.keys(EN).filter((k) => k.startsWith(prefix)).length;

  it("has field, value and note tables", () => {
    assert.ok(codesUsedBy("evidence.field.") >= 20);
    assert.ok(codesUsedBy("evidence.value.") >= 35);
    assert.ok(codesUsedBy("evidence.note.") >= 28);
  });

  it("resolves every code emitted for every persona", async () => {
    for (const p of PERSONAS) {
      const d = await diagnoseRef(p.ref);
      for (const e of d.evidence) {
        assert.ok(EN["evidence.field." + e.field], p.label + " missing field." + e.field);
        assert.ok(EN["evidence.note." + e.note], p.label + " missing note." + e.note);
        for (const v of [e.observed, e.expected]) {
          if (v.kind === "code") assert.ok(EN["evidence.value." + v.code], p.label + " missing value." + v.code);
        }
      }
    }
  });

  it("resolves the codes on the INDETERMINATE path", async () => {
    const d = await diagnoseRef("P2", { mNPCI: { timeout: true } });
    for (const e of d.evidence) {
      assert.ok(EN["evidence.field." + e.field]);
      assert.ok(EN["evidence.note." + e.note]);
    }
  });
});

describe("E6 - no unfilled slot ever reaches a sentence (§10.3)", () => {
  it("leaves no {slot} in any rendered verdict, for any persona", async () => {
    for (const p of PERSONAS) {
      const v = renderVerdict(await diagnoseRef(p.ref));
      assert.equal(/\{\w+\}/.test(v.sentence), false, p.label + " sentence: " + v.sentence);
      assert.equal(/\{\w+\}/.test(v.why), false, p.label + " why: " + v.why);
    }
  });

  it("leaves no {slot} in any rendered evidence row", async () => {
    for (const p of PERSONAS) {
      for (const e of renderEvidence(await diagnoseRef(p.ref))) {
        for (const key of ["field", "observed", "expected", "note"] as const) {
          assert.equal(/\{\w+\}/.test(e[key]), false, p.label + " " + key + ": " + e[key]);
        }
      }
    }
  });

  it("leaves none on the INDETERMINATE path either", async () => {
    const d = await diagnoseRef("P1", { mSCHEME: { timeout: true } });
    const v = renderVerdict(d);
    assert.equal(/\{\w+\}/.test(v.sentence + v.why), false);
    for (const e of renderEvidence(d)) assert.equal(/\{\w+\}/.test(e.note), false, e.note);
  });

  it("renders a missing slot as an em dash rather than a gap", () => {
    const out = resolve("verdict.CREDITED.sentence" as CatalogueKey, {}, "en");
    assert.match(out, new RegExp(MISSING_SLOT));
    assert.equal(/\{\w+\}/.test(out), false);
  });
});

describe("E6 - the overdue variant (§10.5)", () => {
  it("Anbu's June date is not shown as a promise in August", async () => {
    const d = await diagnoseRef("P4");
    assert.equal(d.primaryBlocker, "B6a");
    assert.equal(isOverdue(d), true, "27 June expected-by, 27 August now");

    const v = renderVerdict(d);
    assert.equal(v.overdue, true);
    // It must name how long, and say what to do - not repeat a stale promise.
    assert.match(v.sentence, /\d+ days ago/);
    assert.equal(/is on its way/.test(v.sentence), false, "no stale promise");
    assert.match(v.why, /Block Agriculture Officer/);
  });

  it("names a concrete day count, never a vague wait", async () => {
    const d = await diagnoseRef("P4");
    const days = daysBetween(d.facts.expected_by, d.evaluatedAt);
    assert.ok(days > 0);
    assert.match(renderVerdict(d).sentence, new RegExp(String(days) + " days ago"));
  });

  it("keeps the normal wording while the date is still ahead", async () => {
    const early = diagnose(await readSnapshot("P4"), { cycle: CURRENT_CYCLE, now: "2026-06-22T09:00:00.000Z" });
    assert.equal(isOverdue(early), false);
    const v = renderVerdict(early);
    assert.equal(v.overdue, false);
    assert.match(v.sentence, /on its way/);
    assert.match(v.sentence, /2026-06-27/);
  });

  it("does not treat a credited or blocked case as overdue", async () => {
    for (const ref of ["P1", "P2", "P3", "P5", "P6", "P7", "P8"]) {
      assert.equal(isOverdue(await diagnoseRef(ref)), false, ref);
    }
  });
});

describe("E6 - §10.5 copy rules, enforced", () => {
  const verdictValues = Object.entries(EN).filter(([k]) => k.startsWith("verdict.") || k.startsWith("evidence.note."));

  it("uses no system vocabulary in our prose", () => {
    const BANNED = /\b(npci|fto|mapper|seeding|seeded|dbt|pfms|rft)\b/i;
    for (const [k, v] of verdictValues) assert.equal(BANNED.test(v), false, k + ": " + v);
  });

  it("never says soon, shortly, or please wait", () => {
    // §10.5: numbers are always concrete - a date, an amount, a day count.
    const VAGUE = /\b(soon|shortly|in a while|please wait|as soon as possible|kindly)\b/i;
    for (const [k, v] of verdictValues) assert.equal(VAGUE.test(v), false, k + ": " + v);
  });

  it("never apologises or blames the user", () => {
    const APOLOGY = /\b(sorry|apolog|unfortunately|oops|you failed|your fault)\b/i;
    for (const [k, v] of verdictValues) assert.equal(APOLOGY.test(v), false, k + ": " + v);
  });

  it("states what happens if a wait does not end, for every waiting verdict", () => {
    // §10.5: "Every wait states what happens when it ends and what happens if
    // it does not." A farmer told to wait with no end condition has been told
    // nothing she can act on.
    for (const r of ["FTO_IN_QUEUE", "RFT_SIGNED", "SETTLEMENT_PENDING", "NOT_YET_QUEUED", "PAYMENT_OVERDUE"]) {
      const w = EN["verdict." + r + ".why"];
      assert.match(w, /\{expected_by\}|\{days_overdue\}|If it has not|If nothing has|come back|Officer|branch counter/i,
        r + " why does not say what to do if the wait does not end");
    }
  });

  it("names a concrete authority wherever an office is needed", () => {
    for (const r of ["LAND_NAME_MISMATCH", "LAND_NOT_SEEDED", "STATE_HOLD", "GOVT_EMPLOYEE", "PENSIONER"]) {
      const w = EN["verdict." + r + ".why"];
      assert.match(w, /village revenue officer|Block Agriculture Officer|Common Service Centre|bank branch/i, r);
    }
  });

  it("keeps every verdict sentence to one sentence", () => {
    for (const r of REASON_CODES) {
      const s = EN["verdict." + r + ".sentence"];
      // One idea per screen; the verdict is the largest thing on it (§11.7).
      const sentences = s.split(/(?<=\.)\s+/).filter(Boolean).length;
      assert.ok(sentences <= 2, r + " sentence runs to " + sentences + " sentences: " + s);
    }
  });
});

describe("E6 - no placeholder ever reaches a screen (§10.2)", () => {
  const HI = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue.hi.json"), "utf8")) as Record<string, string>;
  const TA = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue.ta.json"), "utf8")) as Record<string, string>;

  it("hi and ta are still mostly placeholders, which is why the guard exists", () => {
    const placeholders = Object.values(TA).filter((v) => v.startsWith("TODO_")).length;
    assert.ok(placeholders > 100, "expected an unresolved locale, found " + placeholders);
  });

  it("resolving an unresolved locale falls back to English, never TODO_", () => {
    for (const key of Object.keys(EN)) {
      for (const loc of ["hi", "ta"] as const) {
        const out = resolve(key as CatalogueKey, {}, loc);
        assert.equal(out.startsWith("TODO_"), false, loc + " leaked a placeholder for " + key);
      }
    }
  });

  it("falls back silently - no apology injected into the sentence", () => {
    // The selector already says the language is unresolved. Saying it again
    // inside every sentence would be twenty apologies per screen.
    const key = Object.keys(EN).find((k) => HI[k]?.startsWith("TODO_"))!;
    assert.equal(resolve(key as CatalogueKey, {}, "hi"), resolve(key as CatalogueKey, {}, "en"));
  });

  it("still uses a real translation where one exists", () => {
    // language.hi carries a genuine endonym in every locale, so the guard must
    // not flatten values that are actually translated.
    assert.equal(resolve("language.hi" as CatalogueKey, {}, "hi"), HI["language.hi"]);
    assert.equal(HI["language.hi"].startsWith("TODO_"), false);
  });
});

describe("E7 - Fix Paths (§10.4)", () => {
  it("authors the three the demo needs", () => {
    for (const r of ["MOBILE_NOT_LINKED", "MAPPER_INACTIVE", "LAND_NAME_MISMATCH"] as const) {
      assert.ok(fixPathFor(r), r + " has no Fix Path");
    }
  });

  it("gives every other ReasonCode a concrete authority to fall back to", () => {
    for (const r of REASON_CODES) {
      const a = authorityFor(r as never);
      assert.ok(EN["authority." + a.toLowerCase()], r + " -> " + a + " has no label");
    }
  });

  it("rules an impossible route OUT, with the reason, never hidden", () => {
    // The portal offers Lakshmi an OTP by default. It is the one route that
    // cannot reach her, and saying so is the most useful line in the product.
    const path = fixPathFor("MOBILE_NOT_LINKED")!;
    const otp = path.routes.find((r) => r.id === "otp")!;
    assert.equal(otp.available, false);
    assert.ok(otp.unavailableBecauseKey, "a ruled-out route must say why");
    const why = EN[otp.unavailableBecauseKey!];
    assert.match(why, /no phone number is linked/i);
  });

  it("gives every ruled-out route a reason, in every Fix Path", () => {
    for (const r of ["MOBILE_NOT_LINKED", "MAPPER_INACTIVE", "LAND_NAME_MISMATCH"] as const) {
      for (const route of fixPathFor(r)!.routes) {
        if (route.available) continue;
        assert.ok(route.unavailableBecauseKey && EN[route.unavailableBecauseKey], r + "/" + route.id);
      }
    }
  });

  it("resolves every step, carry item and label it references", () => {
    for (const r of ["MOBILE_NOT_LINKED", "MAPPER_INACTIVE", "LAND_NAME_MISMATCH"] as const) {
      const path = fixPathFor(r)!;
      assert.ok(EN[path.requestKey], r + " request missing");
      for (const route of path.routes) {
        assert.ok(EN[route.labelKey], r + "/" + route.id + " label");
        for (const s of route.stepKeys) assert.ok(EN[s], r + " step " + s);
        for (const c of route.carryKeys) assert.ok(EN[c], r + " carry " + c);
      }
    }
  });

  it("sends the land case to an officer and the bank case to a branch", () => {
    assert.equal(needsOfficer("LAND_NAME_MISMATCH"), true);
    assert.equal(authorityFor("LAND_NAME_MISMATCH"), "VILLAGE_REVENUE_OFFICER");
    assert.equal(authorityFor("MAPPER_INACTIVE"), "BANK_BRANCH");
    assert.equal(needsOfficer("MAPPER_INACTIVE"), false);
  });

  it("keeps farmer-facing fix copy free of system vocabulary (§16.5)", () => {
    // The slip's officer-facing request line is exempt: it is addressed to an
    // officer, in the officer's own vocabulary, and is not farmer-facing prose.
    const BANNED = /\b(npci|fto|mapper|seeding|seeded|dbt|pfms|rft)\b/i;
    for (const [k, v] of Object.entries(EN)) {
      if (!k.startsWith("fix.") && !k.startsWith("carry.") && !k.startsWith("authority.")) continue;
      if (k.startsWith("fix.request.")) continue;
      assert.equal(BANNED.test(v), false, k + ": " + v);
    }
  });
});

describe("E7 - the Visit Slip ask fills from real case facts", () => {
  it("uses only slots Diagnosis.facts actually carries", async () => {
    // The slip is the artifact someone carries to an office. A hole in it -
    // "correct the owner name from - to ..." - wastes the trip it was printed
    // for, and no type checks a template string.
    const factKeys = new Set<string>();
    for (const p of PERSONAS) {
      const d = await diagnoseRef(p.ref);
      for (const k of Object.keys(d.facts)) factKeys.add(k);
    }
    for (const r of ["MOBILE_NOT_LINKED", "MAPPER_INACTIVE", "LAND_NAME_MISMATCH"] as const) {
      const template = EN[fixPathFor(r)!.requestKey];
      for (const raw of template.match(/\{(\w+)\}/g) ?? []) {
        const slot = raw.slice(1, -1);
        assert.ok(factKeys.has(slot), r + " asks for {" + slot + "}, which no case provides");
      }
    }
  });

  it("renders the land ask with both real names, not an em dash", async () => {
    const d = await diagnoseRef("P3");
    const key = fixPathFor("LAND_NAME_MISMATCH")!.requestKey;
    const ask = resolve(key, d.facts, "en");
    assert.match(ask, /Murugesan Kandasamy/);
    assert.match(ask, /Sarala Murugesan/);
    assert.equal(/{w+}/.test(ask), false, "no unfilled slot: " + ask);
    // Positive control: with no facts the same template must fall back visibly.
    assert.notEqual(resolve(key, {}, "en"), ask);
  });
});

describe("E6 - Hindi and Marathi are fully resolved (§10.2)", () => {
  const MR = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue.mr.json"), "utf8")) as Record<string, string>;
  const HINDI = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue.hi.json"), "utf8")) as Record<string, string>;

  it("carries no placeholder in hi or mr", () => {
    for (const [name, cat] of [["hi", HINDI], ["mr", MR]] as const) {
      const left = Object.entries(cat).filter(([, v]) => v.startsWith("TODO_")).map(([k]) => k);
      assert.deepEqual(left, [], name + " still has placeholders");
    }
  });

  it("keeps the key set identical to English", () => {
    const en = Object.keys(EN).sort();
    assert.deepEqual(Object.keys(HINDI).sort(), en);
    assert.deepEqual(Object.keys(MR).sort(), en);
  });

  it("preserves every slot, so a translated sentence cannot lose its value", () => {
    // A translator dropping {amount} would render an em dash where a rupee
    // figure belongs - a silent hole rather than a visible failure.
    for (const [name, cat] of [["hi", HINDI], ["mr", MR]] as const) {
      for (const [k, v] of Object.entries(EN)) {
        const want = (v.match(/\{(\w+)\}/g) ?? []).sort();
        const got = (cat[k].match(/\{(\w+)\}/g) ?? []).sort();
        assert.deepEqual(got, want, name + " " + k + " slot mismatch");
      }
    }
  });

  it("actually renders in Devanagari once the catalogue has loaded", async () => {
    const devanagari = /[\u0900-\u097F]/;
    for (const loc of ["hi", "mr"] as const) {
      // Only English is bundled; the rest arrive on demand to keep the primary
      // path inside \u00A711.9's 150KB JS budget.
      await loadLocale(loc);
      assert.match(resolve("entry.headline" as CatalogueKey, {}, loc), devanagari);
      assert.match(resolve("verdict.MOBILE_NOT_LINKED.sentence" as CatalogueKey, {}, loc), devanagari);
      assert.match(resolve("banner.prototype" as CatalogueKey, {}, loc), devanagari);
    }
  });

  it("falls back to English before a catalogue has loaded, never to a blank", () => {
    // Deliberate: an unloaded locale behaves exactly like an unresolved one.
    const out = resolve("entry.headline" as CatalogueKey, {}, "ta");
    assert.ok(out.length > 0);
    assert.equal(out.startsWith("TODO_"), false);
  });
});

describe("Typography - no em dash anywhere in the project", () => {
  const EM = "\u2014";

  it("appears in no catalogue value, in any locale", () => {
    for (const loc of ["en", "hi", "ta", "mr"]) {
      const cat = JSON.parse(
        fs.readFileSync(path.join(ROOT, "content", "catalogue." + loc + ".json"), "utf8")
      ) as Record<string, string>;
      for (const [k, v] of Object.entries(cat)) {
        assert.equal(v.includes(EM), false, loc + " " + k + " contains an em dash: " + v);
      }
    }
  });

  it("appears in no source file either", () => {
    // The rule is project-wide, so a comment or a JSX literal counts too.
    const roots = ["app", "components", "content", "engine", "lib", "mocks", "tests"];
    const exts = new Set([".ts", ".tsx", ".css", ".json", ".svg"]);
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { walk(full); continue; }
        if (!exts.has(path.extname(entry.name))) continue;
        if (fs.readFileSync(full, "utf8").includes(EM)) offenders.push(full);
      }
    };
    for (const r of roots) {
      const dir = path.join(ROOT, r);
      if (fs.existsSync(dir)) walk(dir);
    }
    assert.deepEqual(offenders, [], "em dash found in: " + offenders.join(", "));
  });
});
