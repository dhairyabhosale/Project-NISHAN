/* E3 — the diagnosis engine.
 *
 * §8.1 calls this the product; §15 says it may never be cut. The properties
 * asserted here are the ones a wrong answer would cost someone a day's wage
 * over. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { diagnose } from "../engine/diagnose";
import { renderEvidence, renderVerdict } from "../content/verdict";
import { compareNames } from "../engine/names";
import { RULESET_VERSION } from "../lib/types/diagnosis";
import { readSnapshot } from "../mocks";
import { CURRENT_CYCLE, PERSONAS } from "../mocks/fixtures";

const NOW = "2026-08-27T09:00:00.000Z";
const OPTS = { cycle: CURRENT_CYCLE, now: NOW };

async function diagnoseRef(ref: string, faults = {}) {
  return diagnose(await readSnapshot(ref, faults), OPTS);
}

describe("E3 — every persona returns its expected verdict", () => {
  for (const p of PERSONAS) {
    it(p.label + " → " + p.expects.blocker + " / " + p.expects.reason, async () => {
      const d = await diagnoseRef(p.ref);
      assert.equal(d.primaryBlocker, p.expects.blocker, p.label + " blocker");
      assert.equal(d.reason, p.expects.reason, p.label + " reason");
      assert.equal(d.confidence, "certain");
    });
  }
});

describe("E3 — precedence stops at the first blocking rule (§7.1)", () => {
  it("Selvi returns B1 alone, though four lower gates are also shut", async () => {
    const d = await diagnoseRef("P8");
    assert.equal(d.primaryBlocker, "B1");
    assert.equal(d.reason, "REGISTRATION_REJECTED");
    // The lower gates are recorded for an officer, never as the verdict.
    for (const b of ["B2", "B3", "B4", "B5"]) {
      assert.ok(d.secondaryObservations.includes(b as never), "observed " + b);
    }
    assert.equal(d.secondaryObservations.includes("B1" as never), false, "primary is not also an observation");
  });

  it("shows her the cause, where the portal shows a lower-precedence symptom", async () => {
    const d = await diagnoseRef("P8");
    // The official portal tells her to fix e-KYC. That would waste a trip.
    assert.equal(d.portalStatus, "eKYC Required");
    assert.notEqual(d.primaryBlocker, "B3");
  });

  it("Lakshmi gets the sub-cause, not a generic e-KYC verdict", async () => {
    const d = await diagnoseRef("P1");
    assert.equal(d.reason, "MOBILE_NOT_LINKED");
    assert.notEqual(d.reason, "EKYC_PENDING_ACTION");
    const notes = renderEvidence(d).map((e) => e.note).join(" ");
    assert.match(notes, /code cannot reach you/i);
  });
});

describe("E3 — the MTS / Class IV / Group D carve-out (§7.2 B2)", () => {
  it("Anbu is a government employee and is NOT excluded", async () => {
    const d = await diagnoseRef("P4");
    assert.equal(d.primaryBlocker, "B6a", "must not be B2");
    assert.equal(d.reason, "FTO_IN_QUEUE");
  });

  it("but a government employee outside the exempt grades IS excluded", async () => {
    const snap = await readSnapshot("P4");
    // Same person, exempt grade removed. Nothing else changes.
    if (snap.mPFMS.ok && snap.mPFMS.record) snap.mPFMS.record.is_mts_class_iv_group_d = false;
    const d = diagnose(snap, OPTS);
    assert.equal(d.primaryBlocker, "B2");
    assert.equal(d.reason, "GOVT_EMPLOYEE");
  });
});

describe("E3 — B5 tells a spelling apart from a different person (§8.4)", () => {
  it("does not flag benign variance", () => {
    for (const [a, b] of [
      ["Lakshmi Devi", "Lakshmi D."],
      ["Ramesh Pandian", "Ramesh P."],
      ["Fatima Begum", "Fathima Begum"],
      ["Govindan Subramani", "Govindan S."],
      ["Lakshmi Devi", "Laxmi Devi"]
    ]) {
      assert.equal(compareNames(a, b).match, true, a + " vs " + b);
    }
  });

  it("does flag a different person", () => {
    for (const [a, b] of [
      ["Sarala Murugesan", "Murugesan Kandasamy"],
      ["Selvi Ramanathan", "Ramanathan Perumal"]
    ]) {
      assert.equal(compareNames(a, b).match, false, a + " vs " + b);
    }
  });

  it("sharing a surname is not sharing an identity", () => {
    // The exact trap: her father's name appears in both records.
    const c = compareNames("Sarala Murugesan", "Murugesan Kandasamy");
    assert.equal(c.match, false);
    assert.match(c.note, /different person/i);
  });

  it("so Ramesh reaches B4 and Sarala stops at B5", async () => {
    assert.equal((await diagnoseRef("P2")).primaryBlocker, "B4");
    const sarala = await diagnoseRef("P3");
    assert.equal(sarala.primaryBlocker, "B5");
    assert.equal(sarala.reason, "LAND_NAME_MISMATCH");
  });
});

describe("E3 — INDETERMINATE never guesses past a gap (§16.8)", () => {
  it("returns B0 when the first gate cannot be judged", async () => {
    const d = await diagnoseRef("P1", { mSCHEME: { timeout: true } });
    assert.equal(d.primaryBlocker, "B0");
    assert.equal(d.reason, "SYSTEM_UNREACHABLE");
    assert.equal(d.confidence, "indeterminate");
    assert.deepEqual(d.unreachableSystems, ["mSCHEME"]);
  });

  it("does NOT fall through to a lower-precedence guess", async () => {
    // Ramesh is genuinely B4. Silence mUIDAI, which B3 needs: the engine must
    // refuse to answer rather than skip to the blocker it could still see.
    const d = await diagnoseRef("P2", { mUIDAI: { timeout: true } });
    assert.equal(d.primaryBlocker, "B0");
    assert.notEqual(d.primaryBlocker, "B4");
  });

  it("still answers when the silent system was only needed lower down", async () => {
    // Lakshmi is B3. mNPCI is needed by B4, which is never reached, so the
    // verdict stands and stays certain.
    const d = await diagnoseRef("P1", { mNPCI: { timeout: true } });
    assert.equal(d.primaryBlocker, "B3");
    assert.equal(d.confidence, "certain");
    assert.deepEqual(d.unreachableSystems, ["mNPCI"]);
  });

  it("reports what is already known rather than nothing", async () => {
    const d = await diagnoseRef("P2", { mNPCI: { timeout: true } });
    assert.equal(d.primaryBlocker, "B0");
    const cleared = d.evidence.find((e) => e.field === "CHECKS_PASSED");
    assert.ok(cleared, "names the gates already confirmed clear");
    assert.equal(cleared!.observed.kind, "data");
    assert.match(renderEvidence(d)[0].observed, /B1/);
  });
});

describe("E3 — contract and determinism (§8.5)", () => {
  it("is deterministic across repeated runs", async () => {
    for (const p of PERSONAS) {
      const a = await diagnoseRef(p.ref);
      const b = await diagnoseRef(p.ref);
      assert.deepEqual(a, b, p.label);
    }
  });

  it("takes its timestamp from the injected now, never the clock", async () => {
    const d = await diagnoseRef("P1");
    assert.equal(d.evaluatedAt, NOW);
  });

  it("stamps the ruleset version on every verdict", async () => {
    for (const p of PERSONAS) {
      assert.equal((await diagnoseRef(p.ref)).rulesetVersion, RULESET_VERSION);
    }
  });

  it("carries evidence naming system, field, observed and expected", async () => {
    for (const p of PERSONAS) {
      const d = await diagnoseRef(p.ref);
      assert.ok(d.evidence.length > 0, p.label + " has evidence");
      for (const e of d.evidence) {
        assert.ok(e.system && e.field && e.note, p.label + " evidence codes present");
        assert.ok(e.observed.kind === "data" ? e.observed.value : e.observed.code, p.label + " observed");
        assert.ok(e.expected.kind === "data" ? e.expected.value : e.expected.code, p.label + " expected");
      }
    }
  });

  it("fills the facts the content layer needs, with no empty slots", async () => {
    for (const p of PERSONAS) {
      const d = await diagnoseRef(p.ref);
      assert.ok(d.facts.cycle && d.facts.amount, p.label);
      for (const [k, v] of Object.entries(d.facts)) {
        assert.notEqual(v, "", p.label + " fact " + k + " is empty");
      }
    }
  });

  it("carries the raw portal string as secondary context", async () => {
    for (const p of PERSONAS) {
      const d = await diagnoseRef(p.ref);
      assert.equal(d.portalStatus, p.mSCHEME!.status_string, p.label);
    }
  });
});

describe("E3 — no system vocabulary reaches a farmer (§16.5)", () => {
  // Evidence renders on S5, so the ban applies to it.
  const BANNED = /\b(npci|fto|mapper|seeding|seeded|dbt|pfms|rft)\b/i;

  it("keeps banned words out of every RENDERED evidence row", async () => {
    for (const p of PERSONAS) {
      const d = await diagnoseRef(p.ref);
      for (const e of renderEvidence(d)) {
        for (const key of ["field", "observed", "expected", "note"] as const) {
          assert.equal(BANNED.test(e[key]), false, p.label + " evidence." + key + ": " + e[key]);
        }
      }
    }
  });

  it("keeps them out of the rendered verdict", async () => {
    for (const p of PERSONAS) {
      const v = renderVerdict(await diagnoseRef(p.ref));
      assert.equal(BANNED.test(v.sentence), false, p.label + " sentence: " + v.sentence);
      assert.equal(BANNED.test(v.why), false, p.label + " why: " + v.why);
    }
  });

  it("keeps them out of the INDETERMINATE path too", async () => {
    const d = await diagnoseRef("P1", { mNPCI: { timeout: true }, mUIDAI: { timeout: true } });
    for (const e of renderEvidence(d)) {
      assert.equal(BANNED.test(e.note), false, e.note);
      assert.equal(BANNED.test(e.field), false, e.field);
    }
    const v = renderVerdict(d);
    assert.equal(BANNED.test(v.sentence + " " + v.why), false);
  });
});
