/* The clock. CLAUDE.md §3.6, §8.6, §8.9.
 *
 * Every case here fixes both instants, so a thirty-day ladder is tested in
 * microseconds and no assertion depends on the day the suite happens to run.
 * That is the same reason the diagnosis engine takes `now` (§8.5), and it is
 * the property that makes a deadline a commitment rather than a guess. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clockFor, tierAt, escalationEvents, daysBetween, addDays,
  TIER_DUE_DAYS, CPGRAMS_OFFER_DAY, type Tier
} from "../lib/escalation";
import { materialiseGrievance, timelineFor, deleteCase, listEvents, appendEvent } from "../lib/store";
import {
  readFiledAtFrom, writeFiledAtTo, parseFiledAt, GRIEVANCE_KEY_PREFIX
} from "../lib/grievanceStore";
import { draftBody, factChips, cpgramsText } from "../content/grievance";
import { MISSING_SLOT } from "../content/resolve";

const FILED = "2026-07-01T09:00:00.000Z";
const at = (days: number) => addDays(FILED, days);

describe("clock - day arithmetic", () => {
  it("counts whole dates, not hours", () => {
    // Otherwise a deadline reads "1 day left" for 47 hours.
    assert.equal(daysBetween("2026-07-01T23:59:00.000Z", "2026-07-02T00:01:00.000Z"), 1);
    assert.equal(daysBetween("2026-07-01T00:01:00.000Z", "2026-07-01T23:59:00.000Z"), 0);
  });

  it("goes negative once the date has passed", () => {
    assert.equal(daysBetween("2026-07-10T00:00:00.000Z", "2026-07-01T00:00:00.000Z"), -9);
  });

  it("crosses a month boundary correctly", () => {
    assert.equal(daysBetween("2026-07-20T00:00:00.000Z", "2026-08-04T00:00:00.000Z"), 15);
  });
});

describe("clock - the §3.6 ladder", () => {
  it("uses the documented windows", () => {
    assert.deepEqual(TIER_DUE_DAYS, { 1: 15, 2: 30, 3: 60 });
    assert.equal(CPGRAMS_OFFER_DAY, 30);
  });

  it("starts at tier 1 and stays there for a fortnight", () => {
    for (const d of [0, 1, 7, 14]) assert.equal(tierAt(FILED, at(d)), 1, "day " + d);
  });

  it("escalates on the fifteenth day, not the sixteenth", () => {
    assert.equal(tierAt(FILED, at(14)), 1);
    assert.equal(tierAt(FILED, at(15)), 2, "the window closes ON day 15");
  });

  it("escalates again on day 30", () => {
    assert.equal(tierAt(FILED, at(29)), 2);
    assert.equal(tierAt(FILED, at(30)), 3);
  });

  it("has no fourth rung", () => {
    for (const d of [60, 90, 400]) assert.equal(tierAt(FILED, at(d)), 3, "day " + d);
  });
});

describe("clock - what the reader is shown", () => {
  it("counts down within a tier", () => {
    assert.equal(clockFor(FILED, at(0)).daysRemaining, 15);
    assert.equal(clockFor(FILED, at(4)).daysRemaining, 11);
    assert.equal(clockFor(FILED, at(14)).daysRemaining, 1);
  });

  it("resets the count when the case moves up a rung", () => {
    // Day 15 is not "0 days left" forever: the case has moved, and the new
    // window is what the reader now waits on.
    const day15 = clockFor(FILED, at(15));
    assert.equal(day15.tier, 2);
    assert.equal(day15.daysRemaining, 15);
    assert.equal(day15.overdue, false);
  });

  it("never reports overdue while a rung remains", () => {
    for (let d = 0; d <= 59; d++) {
      assert.equal(clockFor(FILED, at(d)).overdue, false, "day " + d + " should not be overdue");
    }
  });

  it("reports overdue only once the ladder has run out", () => {
    assert.equal(clockFor(FILED, at(60)).overdue, false, "day 60 is the boundary, not past it");
    assert.equal(clockFor(FILED, at(61)).overdue, true);
    assert.equal(clockFor(FILED, at(75)).daysRemaining, -15);
  });

  it("offers the appeal from day 30, while the case is still on the ladder", () => {
    assert.equal(clockFor(FILED, at(29)).cpgramsOffered, false);
    const day30 = clockFor(FILED, at(30));
    assert.equal(day30.cpgramsOffered, true);
    assert.equal(day30.state, "ESCALATED_T3", "the offer is not the same as the case state");
  });

  it("becomes CPGRAMS_SUGGESTED only when the last window lapses", () => {
    assert.equal(clockFor(FILED, at(59)).state, "ESCALATED_T3");
    assert.equal(clockFor(FILED, at(60)).state, "CPGRAMS_SUGGESTED");
  });

  it("maps every rung to its state", () => {
    assert.equal(clockFor(FILED, at(0)).state, "GRIEVANCE_FILED");
    assert.equal(clockFor(FILED, at(15)).state, "ESCALATED_T2");
    assert.equal(clockFor(FILED, at(30)).state, "ESCALATED_T3");
  });

  it("puts the due date on the boundary the tier promises", () => {
    for (const [day, tier] of [[0, 1], [20, 2], [40, 3]] as [number, Tier][]) {
      const c = clockFor(FILED, at(day));
      assert.equal(c.dueAt, addDays(FILED, TIER_DUE_DAYS[tier]), "day " + day);
    }
  });

  it("is deterministic: the same pair of instants always gives the same clock", () => {
    assert.deepEqual(clockFor(FILED, at(9)), clockFor(FILED, at(9)));
  });
});

describe("escalation events - append-only, never rewritten", () => {
  const REF = "NSH-ESCA";

  it("records the filing on day one and nothing more", () => {
    const e = escalationEvents(REF, FILED, at(0));
    assert.equal(e.length, 1);
    assert.equal(e[0].kind, "grievance");
    assert.equal(e[0].toState, "GRIEVANCE_FILED");
    assert.equal(e[0].actor, "citizen", "the citizen filed it, not the system");
  });

  it("adds a rung as each window closes, and KEEPS the earlier ones", () => {
    assert.equal(escalationEvents(REF, FILED, at(14)).length, 1);
    assert.equal(escalationEvents(REF, FILED, at(15)).length, 2);
    assert.equal(escalationEvents(REF, FILED, at(30)).length, 3);
    assert.equal(escalationEvents(REF, FILED, at(60)).length, 4);

    const full = escalationEvents(REF, FILED, at(60));
    assert.deepEqual(full.map((x) => x.toState),
      ["GRIEVANCE_FILED", "ESCALATED_T2", "ESCALATED_T3", "CPGRAMS_SUGGESTED"]);
  });

  it("attributes an escalation to the system, because nobody asked for it", () => {
    // That is the point of §3.6: it happens whether or not the reader chases it.
    const escalations = escalationEvents(REF, FILED, at(60)).filter((e) => e.kind === "escalation");
    assert.equal(escalations.length, 3);
    for (const e of escalations) assert.equal(e.actor, "system");
  });

  it("dates each event when it happened, not when it was computed", () => {
    const e = escalationEvents(REF, FILED, at(45));
    assert.equal(e[1].at, at(15), "the tier 2 row must be dated day 15");
    assert.equal(e[2].at, at(30), "the tier 3 row must be dated day 30");
  });

  it("chains fromState to the previous toState", () => {
    const e = escalationEvents(REF, FILED, at(60));
    for (let i = 1; i < e.length; i++) {
      assert.equal(e[i].fromState, e[i - 1].toState, "gap between event " + (i - 1) + " and " + i);
    }
  });

  it("gives every event a stable, unique idempotency key", () => {
    const keys = escalationEvents(REF, FILED, at(60)).map((e) => e.idempotencyKey);
    assert.equal(new Set(keys).size, keys.length, "duplicate keys: " + keys.join(","));
    assert.deepEqual(keys, escalationEvents(REF, FILED, at(60)).map((e) => e.idempotencyKey));
  });
});

describe("materialiseGrievance - converges instead of duplicating", () => {
  const REF = "NSH-MATL";

  it("§8.9 without a scheduler: repeated reads build one log, not many rows", () => {
    // Each read passes a DIFFERENT now, because in production every request
    // does. Calling this with one fixed instant would pass even if the
    // idempotency keys were derived from now, which is exactly the bug that
    // would fill the log with a row per page view.
    deleteCase(REF);
    materialiseGrievance(REF, FILED, "2026-08-10T01:00:00.000Z");
    materialiseGrievance(REF, FILED, "2026-08-10T02:30:00.000Z");
    const log = materialiseGrievance(REF, FILED, "2026-08-10T23:45:00.000Z");
    assert.equal(log.length, 3, "read three times, got " + log.length + " rows");
  });

  it("stays at one row per rung across many reads on many days", () => {
    deleteCase(REF);
    for (let d = 0; d <= 70; d++) materialiseGrievance(REF, FILED, at(d));
    const log = materialiseGrievance(REF, FILED, at(70));
    assert.equal(log.length, 4, "71 reads produced " + log.length + " rows instead of 4");
  });

  it("adds only the new rung as time passes", () => {
    deleteCase(REF);
    assert.equal(materialiseGrievance(REF, FILED, at(0)).length, 1);
    assert.equal(materialiseGrievance(REF, FILED, at(20)).length, 2);
    assert.equal(materialiseGrievance(REF, FILED, at(35)).length, 3);
  });

  it("never removes an event that was already recorded", () => {
    deleteCase(REF);
    materialiseGrievance(REF, FILED, at(60));
    const after = materialiseGrievance(REF, FILED, at(0));
    assert.equal(after.length, 4, "reading at an earlier date deleted history");
  });

  it("leaves an existing diagnosis event in place", () => {
    deleteCase(REF);
    appendEvent(REF, {
      at: FILED, actor: "system", fromState: null, toState: "DIAGNOSED",
      kind: "diagnosis", detail: {}, idempotencyKey: REF + ":diagnosis:1.0.0"
    });
    const log = materialiseGrievance(REF, FILED, at(20));
    assert.equal(log.length, 3);
    assert.equal(log.filter((e) => e.kind === "diagnosis").length, 1);
  });
});

describe("timelineFor - newest first", () => {
  const REF = "NSH-TIML";

  it("returns events in reverse chronological order", () => {
    deleteCase(REF);
    const rows = timelineFor(REF, FILED, at(60));
    assert.equal(rows.length, 4);
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i - 1].at >= rows[i].at, "row " + i + " is out of order");
    }
    assert.equal(rows[0].toState, "CPGRAMS_SUGGESTED", "the newest event should be first");
  });

  it("returns the plain log when nothing has been filed", () => {
    deleteCase(REF);
    assert.deepEqual(timelineFor(REF, null, at(10)), []);
    assert.equal(listEvents(REF).length, 0, "reading a timeline must not create events");
  });
});

/* ── The filing date on the device ────────────────────────────────────────── */

describe("grievanceStore - one filing, never restarted", () => {
  const store = () => {
    const map = new Map<string, string>();
    return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); }, map };
  };

  it("round-trips a filing date", () => {
    const s = store();
    writeFiledAtTo(s, "NSH-3DCE", FILED);
    assert.equal(readFiledAtFrom(s, "NSH-3DCE"), FILED);
  });

  it("namespaces by reference, so two cases do not share a clock", () => {
    const s = store();
    writeFiledAtTo(s, "NSH-3DCE", FILED);
    assert.equal(readFiledAtFrom(s, "NSH-D33F"), null);
    assert.equal(s.map.get(GRIEVANCE_KEY_PREFIX + "NSH-3DCE"), FILED);
  });

  it("is case-insensitive on the reference, the way a pasted one arrives", () => {
    const s = store();
    writeFiledAtTo(s, "nsh-3dce", FILED);
    assert.equal(readFiledAtFrom(s, "NSH-3DCE"), FILED);
  });

  it("§8.7: a second press does NOT restart the clock", () => {
    // The whole subject of this feature is a deadline. Re-filing would quietly
    // give the office another 15 days, which is the reader's loss, not ours.
    const s = store();
    writeFiledAtTo(s, "NSH-3DCE", FILED);
    writeFiledAtTo(s, "NSH-3DCE", at(9));
    assert.equal(readFiledAtFrom(s, "NSH-3DCE"), FILED, "the filing date moved");
  });

  it("refuses anything that is not an instant", () => {
    for (const junk of ["", "yes", "2026-07-01", "1788400000000", "not a date", "{}"]) {
      assert.equal(parseFiledAt(junk), null, JSON.stringify(junk));
      const s = store();
      writeFiledAtTo(s, "NSH-3DCE", junk);
      assert.equal(readFiledAtFrom(s, "NSH-3DCE"), null, "stored junk: " + junk);
    }
  });

  it("ignores a stored value that has been tampered with", () => {
    const s = store();
    s.setItem(GRIEVANCE_KEY_PREFIX + "NSH-3DCE", "tomorrow");
    assert.equal(readFiledAtFrom(s, "NSH-3DCE"), null);
  });

  it("never throws when storage is hostile or absent", () => {
    const hostile = {
      getItem() { throw new Error("SecurityError"); },
      setItem() { throw new Error("SecurityError"); }
    };
    assert.equal(readFiledAtFrom(hostile, "NSH-3DCE"), null);
    assert.doesNotThrow(() => writeFiledAtTo(hostile, "NSH-3DCE", FILED));
    assert.equal(readFiledAtFrom(null, "NSH-3DCE"), null);
    assert.doesNotThrow(() => writeFiledAtTo(null, "NSH-3DCE", FILED));
  });
});

/* ── The draft ────────────────────────────────────────────────────────────── */

describe("grievance draft - §3.7, fact-complete without the reader knowing anything", () => {
  const saralaFacts = {
    cycle: "2026-23", amount: "2,000", reg_no: "NSHDEMO-1003", name: "Sarala Murugesan",
    village: "Vellakoil", state: "Tamil Nadu", released_on: "2026-06-20",
    aadhaar_name: "Sarala Murugesan", land_owner_name: "Murugesan Kandasamy", khata_id: "KH-40552"
  };
  const sarala = {
    primaryBlocker: "B5", reason: "LAND_NAME_MISMATCH", confidence: "certain",
    evidence: [], facts: saralaFacts, portalStatus: "Stopped by State",
    secondaryObservations: [], unreachableSystems: [], rulesetVersion: "1.0.0",
    evaluatedAt: FILED
  } as unknown as Parameters<typeof draftBody>[0];

  it("names every fact §3.7 says makes a complaint work", () => {
    const body = draftBody(sarala, 2, 3, "en");
    for (const needed of ["NSHDEMO-1003", "2026-23", "2,000", "2026-06-20", "Stopped by State", "KH-40552"]) {
      assert.ok(body.includes(needed), "the draft omits " + needed);
    }
  });

  it("is written in the first person, because the reader signs it", () => {
    const body = draftBody(sarala, 0, 3, "en");
    assert.ok(/\bMy name is\b/.test(body), "no first-person opening");
    assert.equal(/\byour (land record|Aadhaar|payment)\b/i.test(body), false,
      "the draft addresses the reader instead of the officer: " + body);
  });

  it("carries the exact ask the Visit Slip prints, not a paraphrase", () => {
    const body = draftBody(sarala, 0, 3, "en");
    assert.ok(body.includes("Please correct the owner name on khata KH-40552"), body);
  });

  it("leaves no unfilled slot in any locale", () => {
    for (const loc of ["en", "hi", "mr"] as const) {
      const body = draftBody(sarala, 2, 3, loc);
      assert.equal(/\{[a-z_]+\}/.test(body), false, loc + " left a slot unfilled: " + body);
      assert.equal(/TODO_[A-Z]{2}:/.test(body), false, loc + " rendered a placeholder");
    }
  });

  it("mentions the steps only when some are done", () => {
    assert.equal(/Before writing this/.test(draftBody(sarala, 0, 3, "en")), false);
    assert.ok(/Before writing this I completed 2 of the 3/.test(draftBody(sarala, 2, 3, "en")));
  });

  it("is deterministic", () => {
    assert.equal(draftBody(sarala, 1, 3, "en"), draftBody(sarala, 1, 3, "en"));
  });

  it("offers a chip for every fact present and none for a fact absent", () => {
    const chips = factChips(sarala, 2, 3, "en");
    const labels = chips.map((c) => c.labelKey);
    assert.ok(labels.includes("complaint.chip.reg_no"));
    assert.ok(labels.includes("complaint.chip.portal"));
    assert.ok(labels.includes("complaint.chip.record"));
    for (const c of chips) {
      assert.notEqual(c.value, MISSING_SLOT, c.labelKey + " claims a fact it does not have");
      assert.ok(c.value && c.value.length > 0, c.labelKey + " is empty");
    }
  });

  it("drops the land-record chip for a case that has no land record", () => {
    const withoutLand: Record<string, string> = { ...saralaFacts };
    delete withoutLand.khata_id;
    const noLand = { ...sarala, facts: withoutLand } as typeof sarala;
    const labels = factChips(noLand, 0, 0, "en").map((c) => c.labelKey);
    assert.equal(labels.includes("complaint.chip.record"), false);
  });

  it("says plainly that no step has been taken rather than showing a dash", () => {
    const steps = factChips(sarala, 0, 3, "en").find((c) => c.labelKey === "complaint.chip.steps");
    assert.equal(steps?.value, "None yet");
  });
});

describe("cpgrams text - facts only", () => {
  it("names the reference, the filing date and how long it has been open", () => {
    const d = {
      facts: { cycle: "2026-23", amount: "2,000", reg_no: "NSHDEMO-1003", released_on: "2026-06-20" }
    } as unknown as Parameters<typeof cpgramsText>[0];
    const text = cpgramsText(d, "NSH-3DCE", FILED, 31, "en");
    for (const needed of ["NSH-3DCE", "2026-07-01", "31", "NSHDEMO-1003", "2026-06-20"]) {
      assert.ok(text.includes(needed), "the appeal omits " + needed + ": " + text);
    }
    assert.equal(/\{[a-z_]+\}/.test(text), false, "unfilled slot: " + text);
  });
});
