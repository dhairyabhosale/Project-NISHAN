/* AUDIT.md F17 - the case layer, which had no coverage at all.
 *
 * lib/store.ts holds reference derivation, the rail gate mapping, case opening
 * and the append-only event log. Nothing imported it, directly or transitively,
 * so 156 green tests said nothing about any of it.
 *
 * That matters more now than it did during the audit: Days 3-4 build the
 * grievance flow, the SLA clock and the timeline ON TOP of this layer. A clock
 * that reads a case whose reference derivation silently changed, or an
 * escalation that appends a duplicate event because idempotency broke, are
 * exactly the regressions these tests exist to catch. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  referenceFor, beneficiaryForReference, gatesFor, openCase, getCase,
  openCustomCase, appendEvent, listEvents, deleteCase, CURRENT_CYCLE,
  type CaseEvent
} from "../lib/store";
import { PERSONAS } from "../mocks/fixtures";
import { RAIL_GATES } from "../lib/types/diagnosis";
import type { BlockerCode } from "../lib/types/diagnosis";
import { personaForSpec } from "../lib/demoCase";

const NOW = "2026-09-03T10:00:00.000Z";

describe("F17 - referenceFor is derived, not allocated", () => {
  it("is deterministic: same person and cycle always give the same reference", () => {
    // The whole serverless design rests on this. If it drifts, every link a
    // helper has shared stops resolving.
    for (const p of PERSONAS) {
      const a = referenceFor(p.ref, CURRENT_CYCLE);
      assert.equal(referenceFor(p.ref, CURRENT_CYCLE), a, p.label);
      assert.equal(referenceFor(p.ref, CURRENT_CYCLE), a, p.label + " third call");
    }
  });

  it("gives a different reference for a different cycle", () => {
    assert.notEqual(referenceFor("P1", CURRENT_CYCLE), referenceFor("P1", "2026-24"));
  });

  it("is case-insensitive on the beneficiary reference", () => {
    assert.equal(referenceFor("p1", CURRENT_CYCLE), referenceFor("P1", CURRENT_CYCLE));
  });

  it("always produces the §12.3 NSH-XXXX shape", () => {
    for (const p of PERSONAS) assert.match(referenceFor(p.ref, CURRENT_CYCLE), /^NSH-[0-9A-F]{4}$/);
  });

  it("does not collide across the seeded personas", () => {
    // Four hex characters is a small space. A collision would hand two people
    // the same case, so it is asserted rather than assumed.
    const refs = PERSONAS.map((p) => referenceFor(p.ref, CURRENT_CYCLE));
    assert.equal(new Set(refs).size, PERSONAS.length, "collision: " + refs.join(", "));
  });
});

describe("F17 - beneficiaryForReference round-trips", () => {
  it("resolves every seeded persona's reference back to that persona", () => {
    for (const p of PERSONAS) {
      assert.equal(beneficiaryForReference(referenceFor(p.ref, CURRENT_CYCLE)), p.ref, p.label);
    }
  });

  it("tolerates whitespace and lower case, the way a pasted reference arrives", () => {
    const ref = referenceFor("P1", CURRENT_CYCLE);
    assert.equal(beneficiaryForReference("  " + ref.toLowerCase() + " "), "P1");
  });

  it("returns null for anything it does not know", () => {
    for (const bad of ["NSH-0000", "", "not-a-reference", "NSH-", "P1"]) {
      assert.equal(beneficiaryForReference(bad), null, bad);
    }
  });
});

describe("F17 - gatesFor maps a blocker to the rail", () => {
  const blockers: BlockerCode[] = ["B0", "B1", "B2", "B3", "B4", "B5", "B6a", "B6b", "B6c"];

  it("returns one state per gate for every blocker", () => {
    for (const b of blockers) assert.equal(gatesFor(b).length, RAIL_GATES.length, b);
  });

  it("marks exactly one gate BLOCKED for a determinate blocker", () => {
    for (const b of ["B1", "B2", "B3", "B4", "B5", "B6a", "B6b"] as BlockerCode[]) {
      const blocked = gatesFor(b).filter((g) => g === "BLOCKED").length;
      assert.equal(blocked, 1, b + " should shut exactly one gate, shut " + blocked);
    }
  });

  it("clears every gate when the money arrived", () => {
    assert.deepEqual(gatesFor("B6c"), RAIL_GATES.map(() => "PASSED"));
  });

  it("shuts no gate when the verdict is indeterminate", () => {
    // §16.8: we do not know where it stopped, so we must not draw a stop.
    const g = gatesFor("B0");
    assert.equal(g.filter((x) => x === "BLOCKED").length, 0);
  });

  it("never marks a gate PASSED after the blocked one", () => {
    for (const b of blockers) {
      const g = gatesFor(b);
      const stop = g.indexOf("BLOCKED");
      if (stop === -1) continue;
      for (let i = stop + 1; i < g.length; i++) {
        assert.notEqual(g[i], "PASSED", b + " gate " + i + " passed after the stop");
      }
    }
  });
});

describe("F17 - openCase and getCase", () => {
  it("opens a case for every persona, by any identifier it holds", async () => {
    for (const p of PERSONAS) {
      const byRef = await openCase(p.ref, NOW);
      assert.ok(byRef, p.label + " by internal ref");
      assert.equal(byRef.reference, referenceFor(p.ref, CURRENT_CYCLE));
      assert.equal(byRef.diagnosis.primaryBlocker, p.expects.blocker, p.label);

      const byAadhaar = await openCase(p.mUIDAI!.aadhaar_ref, NOW);
      assert.equal(byAadhaar?.reference, byRef.reference, p.label + " by Aadhaar");

      const byReg = await openCase(p.mSCHEME!.reg_no, NOW);
      assert.equal(byReg?.reference, byRef.reference, p.label + " by registration");
    }
  });

  it("is idempotent: opening twice yields the same reference and verdict", async () => {
    const a = await openCase("P1", NOW);
    const b = await openCase("P1", NOW);
    assert.equal(a!.reference, b!.reference);
    assert.equal(a!.diagnosis.primaryBlocker, b!.diagnosis.primaryBlocker);
    assert.deepEqual(a!.gates, b!.gates);
  });

  it("returns null for an unknown identifier rather than inventing a case", async () => {
    for (const bad of ["9999 0000 0000", "NSHDEMO-9999", "", "nobody"]) {
      assert.equal(await openCase(bad, NOW), null, bad);
    }
  });

  it("getCase reconstructs the same case from the reference alone", async () => {
    // This is what makes a cold serverless instance able to serve a shared link.
    for (const p of PERSONAS) {
      const ref = referenceFor(p.ref, CURRENT_CYCLE);
      const c = await getCase(ref, NOW);
      assert.ok(c, p.label);
      assert.equal(c.beneficiaryRef, p.ref);
      assert.equal(c.diagnosis.primaryBlocker, p.expects.blocker);
    }
  });

  it("getCase returns null for an unknown reference", async () => {
    assert.equal(await getCase("NSH-0000", NOW), null);
  });

  it("state follows the verdict", async () => {
    assert.equal((await getCase(referenceFor("P6", CURRENT_CYCLE), NOW))!.state, "RESOLVED_CREDITED");
    assert.equal((await getCase(referenceFor("P4", CURRENT_CYCLE), NOW))!.state, "WAITING");
    assert.equal((await getCase(referenceFor("P1", CURRENT_CYCLE), NOW))!.state, "DIAGNOSED");
  });

  it("returns INDETERMINATE, not a guess, when a needed system is silent", async () => {
    const c = await getCase(referenceFor("P2", CURRENT_CYCLE), NOW, CURRENT_CYCLE, { mUIDAI: { timeout: true } });
    assert.equal(c!.diagnosis.primaryBlocker, "B0");
    assert.equal(c!.diagnosis.confidence, "indeterminate");
  });
});

describe("F17 - the append-only event log", () => {
  const ref = "NSH-TEST";
  const ev = (key: string): CaseEvent => ({
    at: NOW, actor: "system", fromState: null, toState: "DIAGNOSED",
    kind: "diagnosis", detail: {}, idempotencyKey: key
  });

  it("appends and reads back", () => {
    deleteCase(ref);
    appendEvent(ref, ev("a"));
    appendEvent(ref, ev("b"));
    assert.equal(listEvents(ref).length, 2);
  });

  it("§8.7: a replayed key is a no-op, not a second row", () => {
    deleteCase(ref);
    appendEvent(ref, ev("same"));
    appendEvent(ref, ev("same"));
    appendEvent(ref, ev("same"));
    assert.equal(listEvents(ref).length, 1, "duplicate idempotency key created extra rows");
  });

  it("never mutates a returned log in place", () => {
    deleteCase(ref);
    const first = appendEvent(ref, ev("x"));
    appendEvent(ref, ev("y"));
    assert.equal(first.length, 1, "the earlier array was mutated");
  });

  it("returns an empty log for a case with no events", () => {
    deleteCase(ref);
    assert.deepEqual(listEvents(ref), []);
  });

  it("§12.5: deleteCase removes every event for that case", () => {
    deleteCase(ref);
    appendEvent(ref, ev("gone"));
    assert.equal(deleteCase(ref), true);
    assert.deepEqual(listEvents(ref), []);
    assert.equal(deleteCase(ref), false, "deleting twice should report nothing removed");
  });

  it("opening a case records exactly one diagnosis event, however often it is opened", async () => {
    const r = referenceFor("P3", CURRENT_CYCLE);
    deleteCase(r);
    await openCase("P3", NOW);
    await openCase("P3", NOW);
    await openCase("P3", NOW);
    const log = listEvents(r);
    assert.equal(log.length, 1, "reopening created " + log.length + " events");
    assert.equal(log[0].kind, "diagnosis");
  });
});

describe("F17 - openCustomCase runs the real rules", () => {
  it("diagnoses a user-built persona through the same engine", async () => {
    const persona = personaForSpec({ n: "Test Person", b: "B4" });
    assert.ok(persona);
    const c = await openCustomCase(persona, NOW);
    assert.equal(c.diagnosis.primaryBlocker, "B4");
    assert.equal(c.gates.filter((g) => g === "BLOCKED").length, 1);
  });

  it("honours fault injection exactly as a seeded persona does", async () => {
    const persona = personaForSpec({ n: "Test Person", b: "B4" });
    const c = await openCustomCase(persona!, NOW, CURRENT_CYCLE, { mUIDAI: { timeout: true } });
    assert.equal(c.diagnosis.primaryBlocker, "B0", "a custom case must not skip the INDETERMINATE rule");
  });

  it("can disagree with the blocker the user picked, because the rules decide", async () => {
    // §8.5: picking a blocker chooses the situation, not the answer.
    for (const b of ["B1", "B2", "B3", "B4", "B5"]) {
      const persona = personaForSpec({ n: "Someone", b });
      const c = await openCustomCase(persona!, NOW);
      assert.ok(c.diagnosis.primaryBlocker, b + " produced no verdict");
    }
  });
});
